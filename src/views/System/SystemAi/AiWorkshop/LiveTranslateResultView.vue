<template>
  <div class="lt-result">
    <!-- 工具条 -->
    <div class="lt-result__toolbar">
      <div class="lt-result__title-row">
        <span class="lt-result__title">翻译结果</span>
        <span class="lt-result__count">
          <span class="lt-result__count-num">{{ units.length }}</span> 段
        </span>
        <!-- 语言对指示 -->
        <span v-if="sourceLang || targetLang" class="lt-result__lang-pair">
          <span class="lt-result__lang-badge">{{ sourceLang || '自动' }}</span>
          <span class="lt-result__lang-arrow">→</span>
          <span class="lt-result__lang-badge lt-result__lang-badge--target">{{ targetLang }}</span>
        </span>
        <div class="lt-result__tools">
          <button class="lt-result__tool" :disabled="!units.length" title="复制全部翻译" @click="copyAll">
            <Copy :size="14" />
            复制
          </button>
          <button class="lt-result__tool" :disabled="!units.length" title="清空" @click="$emit('clear')">
            <Trash2 :size="14" />
            清空
          </button>
        </div>
      </div>
    </div>

    <!-- 翻译流 -->
    <StrixAutoScroll class="lt-result__stream" :threshold="40">
      <template v-if="units.length">
        <article
          v-for="unit in units"
          :key="unit.id"
          class="lt-card"
          :class="{
            'lt-card--live': !unit.translationFinal && !!unit.translationText,
            'lt-card--source-only': !unit.translationText
          }"
        >
          <!-- 左侧状态色脊 -->
          <span class="lt-card__spine" />

          <div class="lt-card__body">
            <!-- 翻译文本（主要） -->
            <div class="lt-card__translation">
              <p class="lt-card__text" :class="{ 'lt-card__text--empty': !unit.translationText }">
                <template v-if="unit.translationText">
                  {{ unit.translationText }}<span v-if="!unit.translationFinal" class="lt-card__cursor" />
                </template>
                <template v-else-if="unit.sourceText">
                  <!-- 仅有源文本时显示等待翻译提示 -->
                  <span class="lt-card__waiting">⋯</span>
                </template>
              </p>

              <!-- 右侧：状态 + 播放按钮 -->
              <div class="lt-card__aside">
                <span class="lt-card__status" :class="{ 'lt-card__status--done': unit.translationFinal }">
                  {{ unit.translationFinal ? '✓' : unit.translationText ? '●' : '…' }}
                </span>
                <button
                  v-if="unit.hasAudio && unit.audioDone"
                  class="lt-card__play"
                  title="重新播放"
                  @click="$emit('play', unit)"
                >
                  <Volume2 :size="14" />
                </button>
                <span
                  v-else-if="unit.hasAudio && !unit.audioDone && unit.audioChunks.length"
                  class="lt-card__audio-loading"
                >
                  <span class="lt-card__audio-dot" />
                  <span class="lt-card__audio-dot" />
                  <span class="lt-card__audio-dot" />
                </span>
              </div>
            </div>

            <!-- 源语言文本（次要） -->
            <div v-if="unit.sourceText" class="lt-card__source">
              <span class="lt-card__source-text">{{ unit.sourceText }}</span>
              <span v-if="unit.sourceLanguage" class="lt-card__source-lang">
                {{ langLabel(unit.sourceLanguage) }}
              </span>
            </div>
          </div>
        </article>
      </template>

      <!-- 空状态 -->
      <div v-else class="lt-result__empty">
        <div class="lt-result__empty-icon" :class="{ 'is-listening': recording }">
          <Languages :size="22" />
        </div>
        <p class="lt-result__empty-text">
          {{ recording ? '聆听中，开口说话即可看到实时翻译' : '点击「开始翻译」，授权麦克风后实时翻译' }}
        </p>
      </div>
    </StrixAutoScroll>
  </div>
</template>

<script lang="ts" setup>
import { Copy, Languages, Trash2, Volume2 } from '@lucide/vue'
import StrixAutoScroll from '@/components/common/StrixAutoScroll.vue'
import type { TranslationUnit } from '@/composables/useLiveTranslateStream'
import { langLabel } from '@/composables/useLiveTranslateSettings'

interface Props {
  units: TranslationUnit[]
  recording?: boolean
  sourceLang?: string
  targetLang?: string
}

const props = withDefaults(defineProps<Props>(), { recording: false, sourceLang: '', targetLang: '' })
defineEmits<{ clear: []; play: [unit: TranslationUnit] }>()

const message = useMessage()

async function copyAll() {
  const text = props.units
    .filter((u) => u.translationText)
    .map((u) => u.translationText)
    .join('\n')
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    message.success('已复制')
  } catch {
    message.error('复制失败，请手动选择文本')
  }
}
</script>

<style lang="scss" scoped>
.lt-result {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  border-radius: 12px;
  background: var(--strix-bg-surface);
  border: 1px solid var(--strix-border-default);
  overflow: hidden;
}

// ——— 工具条 ———
.lt-result__toolbar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--strix-border-subtle);
  flex: none;
}

.lt-result__title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.lt-result__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--strix-text-primary);
}

.lt-result__count {
  font-size: 12px;
  color: var(--strix-text-tertiary);

  &-num {
    font-size: 14px;
    font-weight: 600;
    color: var(--strix-text-accent);
    font-variant-numeric: tabular-nums;
  }
}

.lt-result__lang-pair {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
}

.lt-result__lang-badge {
  padding: 1px 7px;
  border-radius: 4px;
  background: var(--strix-bg-surface-hover);
  border: 1px solid var(--strix-border-default);
  color: var(--strix-text-secondary);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;

  &--target {
    color: var(--strix-text-accent);
    border-color: var(--strix-border-accent-hover);
    background: color-mix(in srgb, var(--strix-color-accent, #63e2b7) 8%, transparent);
  }
}

.lt-result__lang-arrow {
  color: var(--strix-text-muted);
  font-size: 12px;
}

.lt-result__tools {
  display: flex;
  gap: 6px;
  margin-left: auto;
}

.lt-result__tool {
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

// ——— 翻译流 ———
.lt-result__stream {
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

// ——— 翻译卡片 ———
.lt-card {
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
    margin: 4px 0 4px 10px;
    background: var(--strix-border-default);
    transition:
      background 0.25s,
      box-shadow 0.25s;
  }

  // 翻译中：色脊辉光 + 边框强调
  &--live {
    border-color: var(--strix-border-accent-hover);

    .lt-card__spine {
      background: var(--strix-text-accent);
      box-shadow: 0 0 10px var(--strix-text-accent);
      animation: spine-glow 1.4s ease-in-out infinite;
    }
  }

  // 仅源文本（等待翻译）
  &--source-only {
    opacity: 0.7;

    .lt-card__spine {
      background: var(--strix-text-muted);
    }
  }

  &__body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  // 翻译文本区（主要）
  &__translation {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  &__text {
    flex: 1;
    margin: 0;
    font-size: 15px;
    line-height: 1.7;
    color: var(--strix-text-primary);
    word-break: break-word;
    white-space: pre-wrap;

    &--empty {
      font-size: 14px;
      color: var(--strix-text-tertiary);
    }
  }

  &__waiting {
    letter-spacing: 3px;
    color: var(--strix-text-muted);
    animation: dots-pulse 1.5s ease-in-out infinite;
  }

  &__aside {
    flex: none;
    display: flex;
    align-items: center;
    gap: 6px;
    padding-top: 3px;
  }

  &__status {
    font-size: 11px;
    font-weight: 600;
    color: var(--strix-text-muted);
    font-variant-numeric: tabular-nums;
    min-width: 14px;
    text-align: center;

    &--done {
      color: var(--strix-text-accent);
    }
  }

  &__play {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 1px solid var(--strix-border-default);
    background: transparent;
    color: var(--strix-text-secondary);
    cursor: pointer;
    transition:
      color 0.18s,
      border-color 0.18s,
      background 0.18s;

    &:hover {
      color: var(--strix-text-accent);
      border-color: var(--strix-border-accent-hover);
      background: var(--strix-accent-glow-subtle);
    }
  }

  // 音频加载中的点点动画
  &__audio-loading {
    display: flex;
    align-items: center;
    gap: 2px;
    height: 26px;
    padding: 0 4px;
  }

  &__audio-dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--strix-text-accent);
    animation: audio-bounce 0.9s ease-in-out infinite;

    &:nth-child(2) {
      animation-delay: 0.15s;
    }

    &:nth-child(3) {
      animation-delay: 0.3s;
    }
  }

  // 源语言文本（次要）
  &__source {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-top: 2px;
    border-top: 1px solid var(--strix-border-subtle);
  }

  &__source-text {
    flex: 1;
    font-size: 12px;
    line-height: 1.6;
    color: var(--strix-text-tertiary);
    word-break: break-word;
    white-space: pre-wrap;
  }

  &__source-lang {
    flex: none;
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--strix-text-muted);
    border: 1px solid var(--strix-border-subtle);
    background: var(--strix-bg-surface);
  }

  // 识别中光标
  &__cursor {
    display: inline-block;
    width: 2px;
    height: 1em;
    margin-left: 2px;
    vertical-align: text-bottom;
    background: var(--strix-text-accent);
    animation: cursor-blink 1s steps(2, start) infinite;
  }
}

// ——— 空状态 ———
.lt-result__empty {
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
    text-align: center;
  }
}

// ——— Keyframes ———
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

@keyframes spine-glow {
  0%,
  100% {
    box-shadow: 0 0 6px var(--strix-text-accent);
  }
  50% {
    box-shadow: 0 0 16px var(--strix-text-accent);
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

@keyframes dots-pulse {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
}

@keyframes audio-bounce {
  0%,
  100% {
    transform: scaleY(0.6);
    opacity: 0.5;
  }
  50% {
    transform: scaleY(1.3);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .lt-card {
    animation: none;
  }
  .lt-card--live .lt-card__spine {
    animation: none;
  }
  .lt-card__cursor {
    animation: none;
    opacity: 0.7;
  }
  .lt-result__empty-icon.is-listening {
    animation: none;
  }
  .lt-card__audio-dot {
    animation: none;
  }
}
</style>
