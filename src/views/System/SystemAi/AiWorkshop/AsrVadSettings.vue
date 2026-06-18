<template>
  <div class="vad-settings">
    <div v-for="item in items" :key="item.key" class="vad-settings__row">
      <span class="vad-settings__label">
        {{ item.label }}
        <n-tooltip trigger="hover">
          <template #trigger><span class="vad-settings__hint">?</span></template>
          {{ item.tip }}
        </n-tooltip>
      </span>
      <n-slider
        :value="vad[item.key]"
        :min="item.min"
        :max="item.max"
        :step="item.step"
        :format-tooltip="item.format"
        style="flex: 1"
        @update:value="(val: number) => emit('update', item.key, val)"
      />
      <span class="vad-settings__value">{{ item.format(vad[item.key]) }}</span>
    </div>
    <div class="vad-settings__footer">
      <n-text depth="3" style="font-size: 12px">提示：停发阈值建议大于服务端断句窗口（400ms）</n-text>
      <n-button size="small" ghost @click="emit('reset')">恢复默认</n-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { AsrVadParams } from '@/composables/useAsrSettings'

defineProps<{ vad: AsrVadParams }>()
const emit = defineEmits<{ update: [key: keyof AsrVadParams, value: number]; reset: [] }>()

interface SliderItem {
  key: keyof AsrVadParams
  label: string
  tip: string
  min: number
  max: number
  step: number
  format: (v: number) => string
}

const items: SliderItem[] = [
  {
    key: 'rmsStart',
    label: '起说阈值',
    tip: '音量连续高于此值判定为开始说话；识别不到轻声调低，噪声误触发调高',
    min: 0.001,
    max: 0.1,
    step: 0.001,
    format: (v) => v.toFixed(3)
  },
  {
    key: 'rmsStop',
    label: '静音阈值',
    tip: '音量低于此值累计静音；应低于起说阈值（滞回，防抖动）',
    min: 0.001,
    max: 0.05,
    step: 0.001,
    format: (v) => v.toFixed(3)
  },
  {
    key: 'startFrames',
    label: '起说帧数',
    tip: '连续达到起说阈值的帧数，越大越防瞬时噪声误触发（每帧约 100ms）',
    min: 1,
    max: 10,
    step: 1,
    format: (v) => `${v} 帧`
  },
  {
    key: 'prerollFrames',
    label: '前冗余帧',
    tip: '进入说话态时补发最近帧数，防起始截断（每帧约 100ms）',
    min: 0,
    max: 10,
    step: 1,
    format: (v) => `${v} 帧`
  },
  {
    key: 'idleStopMs',
    label: '停发阈值',
    tip: '连续静音超过此值才停发省流；建议大于服务端断句窗口（400ms）',
    min: 500,
    max: 5000,
    step: 100,
    format: (v) => `${v} ms`
  }
]
</script>

<style lang="scss" scoped>
.vad-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 480px;

  &__row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__label {
    width: 80px;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__hint {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.12);
    font-size: 10px;
    cursor: help;
  }

  &__value {
    width: 56px;
    text-align: right;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    font-variant-numeric: tabular-nums;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
}
</style>
