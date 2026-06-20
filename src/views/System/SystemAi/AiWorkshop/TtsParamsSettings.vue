<template>
  <div class="tts-params">
    <div v-for="field in FIELDS" :key="field.key" class="tts-params__row">
      <span class="tts-params__label">
        {{ field.label }}
        <n-tooltip trigger="hover">
          <template #trigger><span class="tts-params__hint">?</span></template>
          {{ field.tip }}
        </n-tooltip>
      </span>
      <!-- 下拉型（格式 / 采样率） -->
      <n-select
        v-if="field.type === 'select'"
        :value="(params[field.key] as string | number) ?? null"
        :options="field.options"
        :placeholder="field.placeholder"
        clearable
        style="flex: 1"
        @update:value="(v: string | number | null) => set(field.key, v ?? undefined)"
      />
      <!-- 数值滑块型（语速 / 音调 / 音量） -->
      <template v-else-if="field.type === 'slider'">
        <n-slider
          :value="(params[field.key] as number) ?? field.default!"
          :min="field.min"
          :max="field.max"
          :step="field.step"
          style="flex: 1"
          @update:value="(v: number) => set(field.key, v)"
        />
        <span class="tts-params__value">{{ (params[field.key] as number) ?? field.default }}</span>
      </template>
      <!-- 数字输入（种子） -->
      <n-input-number
        v-else
        :value="(params[field.key] as number) ?? null"
        :min="field.min"
        :max="field.max"
        :placeholder="field.placeholder"
        clearable
        style="flex: 1"
        @update:value="(v: number | null) => set(field.key, v ?? undefined)"
      />
    </div>
    <div class="tts-params__footer">
      <n-text depth="3" style="font-size: 12px">留空字段将使用模型默认值</n-text>
      <n-button size="small" ghost @click="emit('reset')">清除会话参数</n-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { TtsParams } from '@/api/ai'

const props = defineProps<{ params: TtsParams }>()
const emit = defineEmits<{ reset: [] }>()

type FieldType = 'select' | 'slider' | 'number'

interface FieldDef {
  key: keyof TtsParams
  label: string
  tip: string
  type: FieldType
  min?: number
  max?: number
  step?: number
  default?: number
  placeholder?: string
  options?: { label: string; value: string | number }[]
}

const FIELDS: FieldDef[] = [
  {
    key: 'format',
    label: '音频格式',
    tip: '非流式合成输出格式；流式播放将自动使用 PCM',
    type: 'select',
    placeholder: '默认 mp3',
    options: [
      { label: 'MP3', value: 'mp3' },
      { label: 'WAV', value: 'wav' },
      { label: 'PCM', value: 'pcm' },
      { label: 'Opus', value: 'opus' }
    ]
  },
  {
    key: 'sampleRate',
    label: '采样率',
    tip: '音频采样率(Hz)，越高音质越好、体积越大',
    type: 'select',
    placeholder: '默认 22050',
    options: [
      { label: '16000 Hz', value: 16000 },
      { label: '22050 Hz', value: 22050 },
      { label: '24000 Hz', value: 24000 },
      { label: '44100 Hz', value: 44100 },
      { label: '48000 Hz', value: 48000 }
    ]
  },
  {
    key: 'rate',
    label: '语速',
    tip: '0.5~2.0，大于 1 加快，小于 1 减慢',
    type: 'slider',
    min: 0.5,
    max: 2,
    step: 0.1,
    default: 1
  },
  {
    key: 'pitch',
    label: '音调',
    tip: '0.5~2.0，大于 1 升高，小于 1 降低',
    type: 'slider',
    min: 0.5,
    max: 2,
    step: 0.1,
    default: 1
  },
  {
    key: 'volume',
    label: '音量',
    tip: '0~100，默认 50',
    type: 'slider',
    min: 0,
    max: 100,
    step: 1,
    default: 50
  },
  {
    key: 'seed',
    label: '随机种子',
    tip: '0~65535，相同种子+参数可复现相同合成结果',
    type: 'number',
    min: 0,
    max: 65535,
    placeholder: '可选'
  }
]

function set(key: keyof TtsParams, value: unknown) {
  ;(props.params as Record<string, unknown>)[key] = value
}
</script>

<style lang="scss" scoped>
.tts-params {
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
    width: 76px;
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
    background: var(--strix-accent-glow-subtle);
    font-size: 10px;
    cursor: help;
  }

  &__value {
    width: 40px;
    text-align: right;
    font-size: 12px;
    color: var(--strix-text-tertiary);
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
