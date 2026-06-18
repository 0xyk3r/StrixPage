<template>
  <div class="asr-meter" :class="`asr-meter--${phase}`" role="status" :aria-label="`麦克风${phaseLabel}`">
    <!-- 脉冲律动（签名）：核心圆随音量缩放发光，说话/检测时向外扩散声波涟漪 -->
    <div class="asr-meter__pulse">
      <span class="asr-meter__ripple" />
      <span class="asr-meter__ripple asr-meter__ripple--delay" />
      <span class="asr-meter__core" :style="coreStyle" />
    </div>

    <!-- 电平条 + 阈值刻度线 -->
    <div class="asr-meter__bar">
      <div class="asr-meter__track" />
      <div class="asr-meter__fill" :style="{ width: fillPct + '%' }" />
      <span class="asr-meter__mark asr-meter__mark--start" :style="{ left: startPct + '%' }" title="起说阈值" />
      <span class="asr-meter__mark asr-meter__mark--stop" :style="{ left: stopPct + '%' }" title="静音阈值" />
    </div>

    <!-- 状态 + 实时电平数值 -->
    <div class="asr-meter__meta">
      <span class="asr-meter__phase">{{ phaseLabel }}</span>
      <span class="asr-meter__value">{{ display.toFixed(3) }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
interface Props {
  rms: number
  phase: 'idle' | 'starting' | 'active' | 'trailing'
  rmsStart: number
  rmsStop: number
  meterMax?: number
}

const props = withDefaults(defineProps<Props>(), { meterMax: 0.2 })

const PHASE_LABELS: Record<Props['phase'], string> = {
  idle: '待机',
  starting: '检测中',
  active: '说话中',
  trailing: '静音中'
}
const phaseLabel = computed(() => PHASE_LABELS[props.phase])

// rAF 指数平滑，消除 100ms 粒度台阶感
const display = ref(0)
let target = 0
let raf = 0
watch(
  () => props.rms,
  (v) => {
    target = v
  }
)

function loop() {
  display.value += (target - display.value) * 0.3
  raf = requestAnimationFrame(loop)
}

onMounted(() => {
  raf = requestAnimationFrame(loop)
})
onUnmounted(() => cancelAnimationFrame(raf))

const clampPct = (v: number) => Math.max(0, Math.min(1, v / props.meterMax)) * 100
const fillPct = computed(() => clampPct(display.value))
const startPct = computed(() => clampPct(props.rmsStart))
const stopPct = computed(() => clampPct(props.rmsStop))

const coreStyle = computed(() => {
  const level = Math.max(0, Math.min(1, display.value / props.meterMax))
  return {
    transform: `scale(${1 + level * 0.6})`,
    boxShadow: `0 0 ${6 + level * 22}px var(--meter-color)`
  }
})
</script>

<style lang="scss" scoped>
.asr-meter {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  --meter-color: rgba(255, 255, 255, 0.28);

  &--idle {
    --meter-color: rgba(255, 255, 255, 0.28);
  }

  &--starting {
    --meter-color: #e0a82e;
  }

  &--active {
    --meter-color: #36ad6a;
  }

  &--trailing {
    --meter-color: #f0883e;
  }

  &__pulse {
    position: relative;
    width: 40px;
    height: 40px;
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__ripple {
    position: absolute;
    inset: 0;
    margin: auto;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 1.5px solid var(--meter-color);
    opacity: 0;

    &--delay {
      animation-delay: 0.9s;
    }
  }

  &--active &__ripple,
  &--starting &__ripple {
    animation: asr-ripple 1.8s ease-out infinite;
  }

  &__core {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--meter-color);
    transition:
      background 0.25s,
      box-shadow 0.1s;
    will-change: transform, box-shadow;
  }

  &__bar {
    position: relative;
    flex: 1;
    max-width: 320px;
    height: 6px;
  }

  &__track {
    position: absolute;
    inset: 0;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.08);
  }

  &__fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    border-radius: 3px;
    background: var(--meter-color);
    box-shadow: 0 0 8px var(--meter-color);
    transition: background 0.2s;
  }

  &__mark {
    position: absolute;
    top: 50%;
    width: 2px;
    height: 12px;
    transform: translate(-1px, -50%);
    border-radius: 1px;

    &--start {
      background: #36ad6a;
    }

    &--stop {
      background: #f0883e;
    }
  }

  &__meta {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 48px;
    line-height: 1.3;
  }

  &__phase {
    font-size: 12px;
    font-weight: 500;
    color: var(--meter-color);
    transition: color 0.25s;
  }

  &__value {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.4);
    font-variant-numeric: tabular-nums;
  }
}

@keyframes asr-ripple {
  0% {
    opacity: 0.5;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(2.6);
  }
}

@media (prefers-reduced-motion: reduce) {
  .asr-meter__ripple {
    animation: none !important;
  }
  .asr-meter__core {
    transition: background 0.25s;
  }
}
</style>
