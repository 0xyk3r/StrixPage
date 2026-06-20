<template>
  <div class="tts-player" :class="{ 'tts-player--active': isActive }">
    <!-- 顶部：动作区（合成按钮，通过插槽传入）+ 状态 -->
    <div class="tts-player__head">
      <div class="tts-player__actions">
        <slot name="actions" />
      </div>
      <span class="tts-player__status" :class="{ 'tts-player__status--error': !!error }">
        {{ error || status }}
      </span>
    </div>

    <!-- 波形传输条：合成中律动，完成后可点击拖动定位 -->
    <div
      class="tts-player__wave"
      :class="{ 'tts-player__wave--seekable': hasClip && !live }"
      role="slider"
      tabindex="0"
      :aria-valuenow="Math.round(progress * 100)"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label="播放进度"
      @click="onSeek"
      @keydown="onKey"
    >
      <span
        v-for="(hpct, i) in barHeights"
        :key="i"
        class="tts-player__bar"
        :class="{ 'tts-player__bar--played': hasClip && !live && i / barHeights.length <= progress }"
        :style="barStyle(i, hpct)"
      />
    </div>

    <!-- 底部传输控件：播放/暂停 + 时间 + 下载 -->
    <div class="tts-player__transport">
      <button
        class="tts-player__play"
        type="button"
        :disabled="!hasClip"
        :aria-label="playing ? '暂停' : '播放'"
        @click="toggle"
      >
        <Pause v-if="playing" :size="16" />
        <Play v-else :size="16" />
      </button>
      <span class="tts-player__time">{{ fmt(current) }} / {{ fmt(duration) }}</span>
      <span class="tts-player__spacer" />
      <button
        class="tts-player__download"
        type="button"
        :disabled="!hasClip"
        aria-label="下载音频"
        @click="emit('download')"
      >
        <Download :size="14" />
        <span>下载</span>
      </button>
    </div>

    <!-- 隐藏的原生 audio：仅作为完整音频片段的播放驱动 -->
    <!-- eslint-disable-next-line vuejs-accessibility/media-has-caption -->
    <audio
      ref="audioRef"
      :src="src || undefined"
      class="tts-player__native"
      @play="playing = true"
      @playing="playing = true"
      @pause="playing = false"
      @ended="onEnded"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoaded"
    />
  </div>
</template>

<script lang="ts" setup>
import { Download, Pause, Play } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    /** 完整音频片段 URL（非流式 / 流式结束 / 预览） */
    src?: string
    /** 流式合成进行中：波形持续律动，不可拖动 */
    live?: boolean
    /** 流式 Web Audio 是否正在播放（驱动律动态） */
    streamPlaying?: boolean
    /** 状态提示文案 */
    status?: string
    /** 错误信息 */
    error?: string
  }>(),
  { src: '', live: false, streamPlaying: false, status: '', error: '' }
)
const emit = defineEmits<{ download: [] }>()

const audioRef = ref<HTMLAudioElement | null>(null)
const playing = ref(false)
const current = ref(0)
const duration = ref(0)

const hasClip = computed(() => !!props.src)
/** 律动态：流式实时播放中 或 原生片段播放中（不依赖 live，避免合成完成后律动中断） */
const isActive = computed(() => props.streamPlaying || playing.value)
const progress = computed(() => (duration.value > 0 ? current.value / duration.value : 0))

/** 48 根波形条，确定性高度（30%~100%），营造自然波形轮廓 */
const BAR_COUNT = 48
const barHeights = Array.from({ length: BAR_COUNT }, (_, i) => {
  const v = Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.55) + Math.sin(i * 0.3) * 0.4)
  return 28 + Math.min(1, v) * 72
})

function barStyle(i: number, hpct: number) {
  // 律动态由 CSS 动画驱动高度，仅设动画延迟形成波浪；静态用确定性高度
  if (isActive.value) {
    return { animationDelay: `${(i % 9) * 0.06}s` }
  }
  return { height: `${hpct}%` }
}

function toggle() {
  const a = audioRef.value
  if (!a) return
  if (a.paused) {
    a.play().catch(() => {
      /* 自动播放策略可能拦截 */
    })
  } else {
    a.pause()
  }
}

function onSeek(e: MouseEvent) {
  const a = audioRef.value
  if (!a || !hasClip.value || props.live || duration.value <= 0) return
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
  a.currentTime = ratio * duration.value
}

function onKey(e: KeyboardEvent) {
  const a = audioRef.value
  if (!a || !hasClip.value || props.live) return
  if (e.key === 'ArrowLeft') {
    a.currentTime = Math.max(0, a.currentTime - 2)
    e.preventDefault()
  } else if (e.key === 'ArrowRight') {
    a.currentTime = Math.min(duration.value, a.currentTime + 2)
    e.preventDefault()
  } else if (e.key === ' ' || e.key === 'Enter') {
    toggle()
    e.preventDefault()
  }
}

function onTimeUpdate() {
  current.value = audioRef.value?.currentTime ?? 0
}

function onLoaded() {
  duration.value = audioRef.value?.duration ?? 0
  current.value = 0
}

function onEnded() {
  playing.value = false
  current.value = duration.value
}

function fmt(s: number) {
  if (!isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// 切换音频源时重置进度（是否自动播放由父组件按场景显式调用 play()，避免流式已播放后重复播放）
watch(
  () => props.src,
  () => {
    current.value = 0
    duration.value = 0
    playing.value = false
  }
)

defineExpose({
  play: () =>
    audioRef.value?.play().catch(() => {
      /* ignore */
    })
})
</script>

<style lang="scss" scoped>
.tts-player {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border-radius: 14px;
  background: var(--strix-bg-surface);
  border: 1px solid var(--strix-border-subtle);
  transition: border-color 0.3s ease;

  &--active {
    border-color: var(--strix-border-accent-hover);
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  &__status {
    font-size: 12px;
    color: var(--strix-text-tertiary);

    &--error {
      color: var(--n-error-color, #e88080);
    }
  }

  // —— 波形传输条 ——
  &__wave {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    height: 88px;
    padding: 0 4px;
    border-radius: 10px;
    outline: none;

    &--seekable {
      cursor: pointer;
    }

    &:focus-visible {
      box-shadow: 0 0 0 2px var(--strix-color-accent);
    }
  }

  &__bar {
    flex: 1;
    min-width: 0;
    max-width: 7px;
    height: 30%;
    border-radius: 3px;
    background: var(--strix-text-tertiary);
    opacity: 0.45;
    transition: background 0.2s ease,
    opacity 0.2s ease;

    &--played {
      background: var(--strix-color-accent);
      opacity: 1;
    }
  }

  &--active &__bar {
    background: var(--strix-color-accent);
    opacity: 1;
    animation: tts-wave 0.85s ease-in-out infinite;
  }

  // —— 传输控件 ——
  &__transport {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__play {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    color: #fff;
    background: var(--strix-color-accent);
    transition: transform 0.15s ease,
    opacity 0.2s ease;

    &:hover:not(:disabled) {
      transform: scale(1.06);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    &:focus-visible {
      box-shadow: 0 0 0 3px var(--strix-accent-glow);
    }
  }

  &__time {
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    color: var(--strix-text-secondary);
  }

  &__spacer {
    flex: 1;
  }

  &__download {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12px;
    cursor: pointer;
    color: var(--strix-text-secondary);
    background: transparent;
    border: 1px solid var(--strix-border-default);
    transition: color 0.2s ease,
    border-color 0.2s ease;

    &:hover:not(:disabled) {
      color: var(--strix-text-accent);
      border-color: var(--strix-border-accent-hover);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    &:focus-visible {
      box-shadow: 0 0 0 2px var(--strix-color-accent);
    }
  }

  &__native {
    display: none;
  }
}

@keyframes tts-wave {
  0%,
  100% {
    height: 22%;
  }
  50% {
    height: 90%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tts-player__bar {
    animation: none !important;
  }
}
</style>
