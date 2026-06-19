<template>
  <div class="stt-result">
    <div v-if="!result || !result.sentences.length" class="stt-result__empty">
      <n-text depth="3">{{ result ? '未识别到内容' : '上传音频并开始识别后展示结果' }}</n-text>
    </div>
    <template v-else>
      <!-- 摘要条 -->
      <header class="stt-result__summary">
        <div class="stt-result__stats">
          <span>共 {{ result.text.length }} 字</span>
          <span v-if="result.durationMs">· 时长 {{ fmtTime(result.durationMs) }}</span>
          <span v-if="result.language">· {{ langLabel(result.language) }}</span>
          <span>· {{ result.sentences.length }} 句</span>
          <span v-if="speakerCount > 0">· {{ speakerCount }} 位说话人</span>
        </div>
        <n-space :size="8">
          <n-button size="small" ghost @click="copyAll">复制全文</n-button>
          <n-button size="small" ghost @click="exportTimed">导出带时间戳</n-button>
        </n-space>
      </header>

      <!-- 逐句卡片 -->
      <div class="stt-result__list">
        <div v-for="(s, i) in result.sentences" :key="i" class="stt-sentence">
          <div class="stt-sentence__head">
            <span
              v-if="s.speakerId !== undefined && s.speakerId !== null"
              class="stt-sentence__speaker"
              :style="{ background: speakerColor(s.speakerId) }"
            >
              说话人 {{ s.speakerId }}
            </span>
            <span v-if="emotionMeta(s)" class="stt-sentence__emotion">
              {{ emotionMeta(s)!.emoji }} {{ emotionMeta(s)!.label }}
            </span>
            <span v-if="s.beginTime !== undefined" class="stt-sentence__time">
              {{ fmtTime(s.beginTime) }}<template v-if="s.endTime !== undefined"> → {{ fmtTime(s.endTime) }}</template>
            </span>
            <span v-if="s.language" class="stt-sentence__lang">{{ langLabel(s.language) }}</span>
          </div>
          <p class="stt-sentence__text">
            <template v-if="s.words && s.words.length">
              <span
                v-for="(w, wi) in s.words"
                :key="wi"
                class="stt-sentence__word"
                :title="wordTitle(w)"
              >{{ w.text }}{{ w.punctuation }}</span
              >
            </template>
            <template v-else>{{ s.text }}</template>
          </p>
        </div>
      </div>
    </template>
  </div>
</template>
<!-- SCRIPT_PLACEHOLDER -->

<script lang="ts" setup>
import type { SttResult, SttSentence, SttWord } from '@/api/ai'

const props = defineProps<{ result: SttResult | null }>()
const message = useMessage()

interface EmotionMeta {
  emoji: string
  label: string
}

/** Qwen 7 类细粒度情绪（离线情感仅来自 Qwen） */
const EMOTIONS: Record<string, EmotionMeta> = {
  neutral: { emoji: '😐', label: '平静' },
  happy: { emoji: '😊', label: '愉快' },
  surprised: { emoji: '😮', label: '惊讶' },
  sad: { emoji: '😢', label: '悲伤' },
  angry: { emoji: '😠', label: '愤怒' },
  disgusted: { emoji: '🤢', label: '厌恶' },
  fearful: { emoji: '😨', label: '恐惧' }
}

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
  vi: '越南语'
}

const SPEAKER_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

const speakerCount = computed(() => {
  if (!props.result) return 0
  const ids = new Set<number>()
  for (const s of props.result.sentences) {
    if (s.speakerId !== undefined && s.speakerId !== null) ids.add(s.speakerId)
  }
  return ids.size
})

function emotionMeta(s: SttSentence): EmotionMeta | undefined {
  return s.emotion ? EMOTIONS[s.emotion] : undefined
}

function langLabel(lang: string): string {
  return LANG_LABELS[lang] ?? lang.toUpperCase()
}

function speakerColor(id: number): string {
  return SPEAKER_COLORS[id % SPEAKER_COLORS.length]!
}

/** 毫秒 → mm:ss.S */
function fmtTime(ms?: number): string {
  if (ms === undefined || ms === null) return ''
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const tenth = Math.floor((ms % 1000) / 100)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${tenth}`
}

function wordTitle(w: SttWord): string {
  return `${(w.beginTime / 1000).toFixed(2)}s – ${(w.endTime / 1000).toFixed(2)}s`
}

async function copyAll() {
  if (!props.result) return
  await navigator.clipboard.writeText(props.result.text)
  message.success('已复制全文')
}

/** 导出带时间戳/说话人的纯文本 */
function exportTimed() {
  if (!props.result) return
  const lines = props.result.sentences.map((s) => {
    const time = s.beginTime !== undefined ? `[${fmtTime(s.beginTime)}] ` : ''
    const spk = s.speakerId !== undefined && s.speakerId !== null ? `说话人${s.speakerId}: ` : ''
    return `${time}${spk}${s.text}`
  })
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'transcript.txt'
  a.click()
  URL.revokeObjectURL(url)
}
</script>
<!-- STYLE_PLACEHOLDER -->

<style lang="scss" scoped>
.stt-result {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  border-radius: 12px;
  background: var(--strix-bg-surface);
  border: 1px solid var(--strix-border-default);
  overflow: hidden;

  &__empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px;
    text-align: center;
  }

  &__summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    flex: none;
    padding: 12px 14px;
    border-bottom: 1px solid var(--strix-border-subtle);
  }

  &__stats {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    font-size: 12px;
    color: var(--strix-text-tertiary);
    font-variant-numeric: tabular-nums;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 12px 14px;
  }
}

.stt-sentence {
  border-radius: 10px;
  background: var(--strix-bg-surface);
  border: 1px solid var(--strix-border-subtle);
  padding: 10px 12px;

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 6px;
    font-size: 12px;
    color: var(--strix-text-tertiary);
  }

  &__speaker {
    color: #fff;
    border-radius: 4px;
    padding: 1px 8px;
    font-size: 11px;
  }

  &__time {
    font-variant-numeric: tabular-nums;
  }

  &__text {
    margin: 0;
    font-size: 15px;
    line-height: 1.7;
    color: var(--strix-text-primary);
    word-break: break-word;
  }

  &__word {
    border-radius: 3px;
    transition: background 0.15s;
    cursor: default;

    &:hover {
      background: var(--strix-accent-glow-subtle);
    }
  }
}
</style>
