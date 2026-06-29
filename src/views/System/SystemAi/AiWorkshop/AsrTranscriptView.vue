<template>
  <div class="asr-transcript">
    <!-- 工具条：标题 + 句数 / 复制 / 清空 -->
    <div class="asr-transcript__toolbar">
      <div class="asr-transcript__title-row">
        <span class="asr-transcript__title">识别结果</span>
        <span class="asr-transcript__total">
          <span class="asr-transcript__total-num">{{ sentences.length }}</span> 句
        </span>
        <div class="asr-transcript__tools">
          <button class="asr-transcript__tool" :disabled="!sentences.length" title="复制全部识别文本" @click="copyAll">
            <Copy :size="14" />
            复制全部
          </button>
          <button
            class="asr-transcript__tool"
            :disabled="!sentences.length"
            title="清空识别结果"
            @click="$emit('clear')"
          >
            <Trash2 :size="14" />
            清空
          </button>
        </div>
      </div>

      <!-- 情绪统计 + 筛选：chip 既显示计数也是筛选器（仅在有情绪数据时出现） -->
      <div v-if="emotionStats.length" class="asr-transcript__filters">
        <button
          class="emotion-chip emotion-chip--all"
          :class="{ 'is-active': activeEmotion === null }"
          @click="activeEmotion = null"
        >
          全部 <span class="emotion-chip__count">{{ sentences.length }}</span>
        </button>
        <button
          v-for="stat in emotionStats"
          :key="stat.key"
          class="emotion-chip"
          :class="{ 'is-active': activeEmotion === stat.key }"
          :data-emotion="stat.key"
          @click="toggleFilter(stat.key)"
        >
          <span class="emotion-chip__emoji">{{ stat.emoji }}</span>
          {{ stat.label }}
          <span class="emotion-chip__count">{{ stat.count }}</span>
        </button>
      </div>
    </div>

    <!-- 识别流：逐句卡片 / 空状态 -->
    <StrixAutoScroll class="asr-transcript__stream" :threshold="40">
      <template v-if="visibleSentences.length">
        <article
          v-for="item in visibleSentences"
          :key="item.s.id"
          class="sentence-card"
          :class="{ 'sentence-card--live': !item.s.final }"
          :data-emotion="item.s.emotion || 'none'"
        >
          <span class="sentence-card__spine" />
          <div class="sentence-card__body">
            <header class="sentence-card__head">
              <span v-if="emotionMeta(item.s)" class="sentence-card__emotion">
                <span class="sentence-card__emoji">{{ emotionMeta(item.s)!.emoji }}</span>
                {{ emotionMeta(item.s)!.label }}
                <span v-if="item.s.emotionConfidence !== undefined" class="sentence-card__emo-conf">
                  {{ confidencePct(item.s.emotionConfidence) }}
                </span>
              </span>
              <span class="sentence-card__index">#{{ item.index + 1 }}</span>
              <span class="sentence-card__meta">
                <span v-if="item.s.beginTime !== undefined" class="sentence-card__time">
                  {{ fmtTime(item.s.beginTime)
                  }}<template v-if="item.s.endTime !== undefined"> → {{ fmtTime(item.s.endTime) }}</template>
                </span>
                <span v-if="item.s.language" class="sentence-card__lang">{{ langLabel(item.s.language) }}</span>
                <span class="sentence-card__status" :class="{ 'is-final': item.s.final }">
                  {{ item.s.final ? '已确认' : '识别中' }}
                </span>
              </span>
            </header>
            <p class="sentence-card__text">
              <template v-if="item.s.words && item.s.words.length">
                <span v-for="(w, wi) in item.s.words" :key="wi" class="sentence-card__word" :title="wordTitle(w)"
                >{{ w.text }}{{ w.punctuation }}</span
                >
              </template>
              <template v-else>{{ item.s.text }}</template>
              <span v-if="!item.s.final" class="sentence-card__cursor" />
            </p>
          </div>
        </article>
      </template>

      <!-- 筛选后无结果 -->
      <div v-else-if="sentences.length" class="asr-transcript__empty">
        <p class="asr-transcript__empty-text">该情绪暂无句子，点击「全部」查看所有结果</p>
      </div>

      <!-- 空状态 -->
      <div v-else class="asr-transcript__empty">
        <div class="asr-transcript__empty-icon" :class="{ 'is-listening': recording }">
          <Mic :size="22" />
        </div>
        <p class="asr-transcript__empty-text">
          {{ recording ? '聆听中，开口说话即可看到逐句识别' : '点击「开始录音」，授权麦克风后实时识别' }}
        </p>
      </div>
    </StrixAutoScroll>
  </div>
</template>

<script lang="ts" setup>
import { Copy, Mic, Trash2 } from '@lucide/vue'
import StrixAutoScroll from '@/components/common/StrixAutoScroll.vue'
import type { AsrSentence } from '@/composables/useAsrStream'

interface Props {
  sentences: AsrSentence[]
  recording?: boolean
}

const props = withDefaults(defineProps<Props>(), { recording: false })
defineEmits<{ clear: [] }>()

const message = useMessage()

/** 情绪元数据：emoji + 中文（情绪色由 CSS 按 data-emotion + 主题决定） */
interface EmotionMeta {
  emoji: string
  label: string
}

/** Qwen 7 类细粒度情绪 */
const EMOTIONS_QWEN: Record<string, EmotionMeta> = {
  neutral: { emoji: '😐', label: '平静' },
  happy: { emoji: '😊', label: '愉快' },
  surprised: { emoji: '😮', label: '惊讶' },
  sad: { emoji: '😢', label: '悲伤' },
  angry: { emoji: '😠', label: '愤怒' },
  disgusted: { emoji: '🤢', label: '厌恶' },
  fearful: { emoji: '😨', label: '恐惧' }
}

/** Paraformer 3 类极性情绪 */
const EMOTIONS_POLARITY: Record<string, EmotionMeta> = {
  positive: { emoji: '🙂', label: '正面' },
  negative: { emoji: '🙁', label: '负面' },
  neutral: { emoji: '😐', label: '中性' }
}

/** 按方案取映射表（默认 qwen7，兼容历史无 scheme 的数据） */
function emotionTable(scheme?: string): Record<string, EmotionMeta> {
  return scheme === 'polarity3' ? EMOTIONS_POLARITY : EMOTIONS_QWEN
}

/** 语种代码 → 中文标签（仅常见，未知回退大写代码） */
const LANG_LABELS: Record<string, string> = {
  zh: '中文',
  yue: '粤语',
  en: '英语',
  ja: '日语',
  de: '德语',
  ko: '韩语',
  ru: '俄语',
  fr: '法语',
  pt: '葡语',
  ar: '阿语',
  it: '意语',
  es: '西语',
  hi: '印地语',
  id: '印尼语',
  th: '泰语',
  tr: '土耳其语',
  uk: '乌克兰语',
  vi: '越南语'
}

function emotionMeta(s: AsrSentence): EmotionMeta | undefined {
  return s.emotion ? emotionTable(s.emotionScheme)[s.emotion] : undefined
}

function langLabel(lang: string): string {
  return LANG_LABELS[lang] ?? lang.toUpperCase()
}

/** 毫秒 → mm:ss.S（句级时间展示） */
function fmtTime(ms?: number): string {
  if (ms === undefined || ms === null) return ''
  const totalSec = ms / 1000
  const m = Math.floor(totalSec / 60)
  const s = Math.floor(totalSec % 60)
  const tenth = Math.floor((ms % 1000) / 100)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${tenth}`
}

/** 字级时间区间提示（用于 span title） */
function wordTitle(w: { beginTime: number; endTime: number }): string {
  return `${(w.beginTime / 1000).toFixed(2)}s – ${(w.endTime / 1000).toFixed(2)}s`
}

/** 置信度百分比（polarity3 展示） */
function confidencePct(v?: number): string {
  return v === undefined || v === null ? '' : `${Math.round(v * 100)}%`
}

// —— 情绪统计 + 筛选 ——
const activeEmotion = ref<string | null>(null)

/** 统计各情绪句数（按各句自身 scheme 的映射表判断有效性，保持稳定顺序） */
const emotionStats = computed(() => {
  const counts = new Map<string, number>()
  for (const s of props.sentences) {
    if (s.emotion && emotionTable(s.emotionScheme)[s.emotion]) {
      counts.set(s.emotion, (counts.get(s.emotion) ?? 0) + 1)
    }
  }
  // 展示顺序：合并两表的键（neutral 共享），仅保留出现过的
  const order = [...Object.keys(EMOTIONS_QWEN), 'positive', 'negative']
  return order
    .filter((key) => counts.has(key))
    .map((key) => {
      const meta = EMOTIONS_QWEN[key] ?? EMOTIONS_POLARITY[key]!
      return { key, count: counts.get(key)!, emoji: meta.emoji, label: meta.label }
    })
})

/** 当前展示的句子（按情绪筛选，保留原始序号供 #N 展示） */
const visibleSentences = computed(() =>
  props.sentences
    .map((s, index) => ({ s, index }))
    .filter((item) => activeEmotion.value === null || item.s.emotion === activeEmotion.value)
)

function toggleFilter(key: string) {
  activeEmotion.value = activeEmotion.value === key ? null : key
}

// 筛选项对应的句子消失时（如清空）自动回到「全部」
watch(emotionStats, (stats) => {
  if (activeEmotion.value !== null && !stats.some((s) => s.key === activeEmotion.value)) {
    activeEmotion.value = null
  }
})

async function copyAll() {
  const text = props.sentences.map((s) => s.text).join('')
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    message.success('已复制')
  } catch {
    message.error('复制失败，请手动选择文本')
  }
}

// 自动滚动到底（新句追加时贴底跟随、用户上滑暂停）由 StrixAutoScroll 内部处理
</script>

<style lang="scss" scoped>
// 7 类情绪色（暗 / 亮主题）。neutral 最克制，情绪越强烈色彩越饱和。
$emotion-dark: (
  neutral: #8b9bb4,
  happy: #63e2b7,
  surprised: #f0c020,
  sad: #6ba3f5,
  angry: #f07070,
  disgusted: #a8c060,
  fearful: #b08bf0,
  positive: #63e2b7,
  negative: #f07070
);
$emotion-light: (
  neutral: #6b7a90,
  happy: #2db48c,
  surprised: #d49000,
  sad: #2563eb,
  angry: #dc2626,
  disgusted: #6b8e23,
  fearful: #7c3aed,
  positive: #2db48c,
  negative: #dc2626
);

.asr-transcript {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  border-radius: 12px;
  background: var(--strix-bg-surface);
  border: 1px solid var(--strix-border-default);
  overflow: hidden;

  // 默认（无情绪 / 未知）取中性边框色
  --emotion-color: var(--strix-border-default);

  // 暗主题情绪色（默认值）；卡片色脊与情绪 chip 共用同一变量
  @each $name, $color in $emotion-dark {
    .sentence-card[data-emotion='#{$name}'],
    .emotion-chip[data-emotion='#{$name}'] {
      --emotion-color: #{$color};
    }
  }
}

// 亮主题情绪色覆盖
@each $name, $color in $emotion-light {
  [data-theme='light'] .asr-transcript .sentence-card[data-emotion='#{$name}'],
  [data-theme='light'] .asr-transcript .emotion-chip[data-emotion='#{$name}'] {
    --emotion-color: #{$color};
  }
}

.asr-transcript__toolbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--strix-border-subtle);
  flex: none;
}

.asr-transcript__title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.asr-transcript__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--strix-text-primary);
}

.asr-transcript__total {
  font-size: 12px;
  color: var(--strix-text-tertiary);

  &-num {
    font-size: 14px;
    font-weight: 600;
    color: var(--strix-text-accent);
    font-variant-numeric: tabular-nums;
  }
}

.asr-transcript__tools {
  display: flex;
  gap: 6px;
  margin-left: auto;
}

// —— 情绪统计 + 筛选 chip ——
.asr-transcript__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.emotion-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--emotion-color);
  background: transparent;
  border: 1px solid color-mix(in srgb, var(--emotion-color) 30%, transparent);
  border-radius: 20px;
  cursor: pointer;
  transition:
    background 0.16s,
    border-color 0.16s,
    opacity 0.16s;

  --emotion-color: var(--strix-text-tertiary);

  &__emoji {
    font-size: 13px;
    line-height: 1;
  }

  &__count {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    opacity: 0.85;
  }

  &:hover {
    background: color-mix(in srgb, var(--emotion-color) 10%, transparent);
  }

  // 选中：情绪色实底强调
  &.is-active {
    background: color-mix(in srgb, var(--emotion-color) 16%, transparent);
    border-color: var(--emotion-color);
  }

  // 「全部」chip 走中性强调色
  &--all {
    --emotion-color: var(--strix-text-secondary);

    &.is-active {
      color: var(--strix-text-accent);
      --emotion-color: var(--strix-color-accent);
    }
  }
}

.asr-transcript__tool {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 12px;
  color: var(--strix-text-secondary);
  background: transparent;
  border: 1px solid var(--strix-border-default);
  border-radius: 7px;
  cursor: pointer;
  transition:
    color 0.18s,
    border-color 0.18s,
    background 0.18s;

  &:hover:not(:disabled) {
    color: var(--strix-text-accent);
    border-color: var(--strix-border-accent-hover);
    background: var(--strix-accent-glow-subtle);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.asr-transcript__stream {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--strix-border-default);
    border-radius: 3px;
  }
}

// —— 单句卡片：左侧情绪色脊 + 内容 ——
.sentence-card {
  position: relative;
  flex: none;
  display: flex;
  gap: 12px;
  padding: 12px 14px 12px 0;
  border-radius: 10px;
  background: var(--strix-bg-surface);
  border: 1px solid var(--strix-border-subtle);
  overflow: hidden;
  animation: card-enter 0.18s ease-out;

  &__spine {
    flex: none;
    width: 3px;
    border-radius: 3px;
    margin: 2px 0 2px 10px;
    background: var(--emotion-color);
    transition: background 0.25s;
  }

  // 识别中：色脊辉光 + 卡片描边强调
  &--live {
    border-color: var(--emotion-color);

    .sentence-card__spine {
      box-shadow: 0 0 8px var(--emotion-color);
      animation: spine-glow 1.4s ease-in-out infinite;
    }
  }

  &__body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__emotion {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 1px 8px 1px 6px;
    font-size: 12px;
    font-weight: 500;
    line-height: 1.6;
    color: var(--emotion-color);
    border: 1px solid color-mix(in srgb, var(--emotion-color) 35%, transparent);
    background: color-mix(in srgb, var(--emotion-color) 12%, transparent);
    border-radius: 20px;
    animation: badge-pop 0.14s ease-out;
  }

  &__emoji {
    font-size: 13px;
    line-height: 1;
  }

  &__emo-conf {
    margin-left: 2px;
    font-size: 11px;
    opacity: 0.75;
    font-variant-numeric: tabular-nums;
  }

  &__time {
    color: var(--strix-text-muted);
    font-variant-numeric: tabular-nums;
  }

  &__word {
    border-radius: 3px;
    transition: background 0.15s;
    cursor: default;

    &:hover {
      background: color-mix(in srgb, var(--emotion-color) 22%, transparent);
    }
  }

  &__index {
    font-size: 11px;
    color: var(--strix-text-muted);
    font-variant-numeric: tabular-nums;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
    font-size: 11px;
  }

  &__lang {
    color: var(--strix-text-tertiary);
  }

  &__status {
    color: var(--strix-text-muted);

    &.is-final {
      color: var(--strix-text-tertiary);
    }
  }

  &__text {
    margin: 0;
    font-size: 15px;
    line-height: 1.7;
    color: var(--strix-text-primary);
    word-break: break-word;
    white-space: pre-wrap;
  }

  // 识别中文末脉冲光标
  &__cursor {
    display: inline-block;
    width: 2px;
    height: 1em;
    margin-left: 2px;
    vertical-align: text-bottom;
    background: var(--emotion-color);
    animation: cursor-blink 1s steps(2, start) infinite;
  }
}

// —— 空状态 ——
.asr-transcript__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px;
  color: var(--strix-text-tertiary);

  &-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    color: var(--strix-text-muted);
    border: 1px solid var(--strix-border-default);
    background: var(--strix-bg-surface);

    &.is-listening {
      color: var(--strix-text-accent);
      border-color: var(--strix-border-accent-hover);
      animation: listening-pulse 1.6s ease-in-out infinite;
    }
  }

  &-text {
    margin: 0;
    font-size: 13px;
  }
}

@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes badge-pop {
  from {
    transform: scale(0.9);
  }
  to {
    transform: scale(1);
  }
}

@keyframes spine-glow {
  0%,
  100% {
    box-shadow: 0 0 6px var(--emotion-color);
  }
  50% {
    box-shadow: 0 0 14px var(--emotion-color);
  }
}

@keyframes cursor-blink {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes listening-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 var(--strix-accent-glow);
  }
  50% {
    box-shadow: 0 0 0 8px transparent;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sentence-card,
  .sentence-card__emotion {
    animation: none;
  }
  .sentence-card--live .sentence-card__spine,
  .asr-transcript__empty-icon.is-listening {
    animation: none;
  }
  .sentence-card__cursor {
    animation: none;
    opacity: 0.7;
  }
}
</style>
