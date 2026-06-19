<template>
  <div class="asr-params">
    <div v-for="field in visibleFields" :key="field.key" class="asr-params__row">
      <span class="asr-params__label">
        {{ field.label }}
        <n-tooltip trigger="hover">
          <template #trigger><span class="asr-params__hint">?</span></template>
          {{ field.tip }}
        </n-tooltip>
      </span>
      <!-- 开关型 -->
      <n-switch
        v-if="field.type === 'switch'"
        :value="(params[field.key] as boolean) ?? false"
        @update:value="(v: boolean) => set(field.key, v)"
      />
      <!-- 数值滑块型 -->
      <template v-else-if="field.type === 'slider'">
        <n-slider
          :value="(params[field.key] as number) ?? field.default!"
          :min="field.min"
          :max="field.max"
          :step="field.step"
          style="flex: 1"
          @update:value="(v: number) => set(field.key, v)"
        />
        <span class="asr-params__value">{{ (params[field.key] as number) ?? field.default }}</span>
      </template>
      <!-- 文本型（热词 ID） -->
      <n-input
        v-else
        :value="(params[field.key] as string) ?? ''"
        :placeholder="field.placeholder"
        style="flex: 1"
        @update:value="(v: string) => set(field.key, v || undefined)"
      />
    </div>
    <div class="asr-params__footer">
      <n-text depth="3" style="font-size: 12px">{{ hint }}</n-text>
      <n-button size="small" ghost @click="emit('reset')">清除会话参数</n-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { AsrModelParams } from '@/composables/useAsrModelParams'

const props = defineProps<{ params: AsrModelParams; modelName: string }>()
const emit = defineEmits<{ reset: [] }>()

type FieldType = 'switch' | 'slider' | 'text'

interface FieldDef {
  key: keyof AsrModelParams
  label: string
  tip: string
  type: FieldType
  min?: number
  max?: number
  step?: number
  default?: number
  placeholder?: string
  /** 适用模型族 */
  scope: 'fun' | 'paraformer' | 'common'
}

const FIELDS: FieldDef[] = [
  {
    key: 'semanticPunctuationEnabled',
    label: '语义断句',
    tip: '开启后用语义断句替代 VAD 断句，准确性更高但延迟略增；Paraformer-8k-v2 情感识别需关闭此项',
    type: 'switch',
    scope: 'common'
  },
  {
    key: 'maxSentenceSilence',
    label: '断句静音(ms)',
    tip: 'VAD 断句静音阈值；一段语音后静音超过此值判定句子结束。范围 200~6000，默认 1300',
    type: 'slider',
    min: 200,
    max: 6000,
    step: 100,
    default: 1300,
    scope: 'common'
  },
  {
    key: 'multiThresholdModeEnabled',
    label: '多阈值模式',
    tip: '启用后防止 VAD 断句切割过长',
    type: 'switch',
    scope: 'common'
  },
  {
    key: 'speechNoiseThreshold',
    label: '噪音阈值',
    tip: '语音与噪音判定阈值 [-1,1]；越接近 -1 越多噪音被当作语音，越接近 +1 越多语音被当作噪音过滤（仅 Fun-ASR）',
    type: 'slider',
    min: -1,
    max: 1,
    step: 0.1,
    default: 0,
    scope: 'fun'
  },
  // PLACEHOLDER_FIELDS2
  {
    key: 'disfluencyRemovalEnabled',
    label: '过滤语气词',
    tip: '顺滑：过滤“嗯/啊”等语气词（仅 Paraformer）',
    type: 'switch',
    scope: 'paraformer'
  },
  {
    key: 'punctuationPredictionEnabled',
    label: '标点预测',
    tip: '在识别结果中添加标点符号（仅 Paraformer，默认开启）',
    type: 'switch',
    scope: 'paraformer'
  },
  {
    key: 'inverseTextNormalizationEnabled',
    label: '数字正则化',
    tip: 'ITN：将中文数字转为阿拉伯数字（仅 Paraformer，默认开启）',
    type: 'switch',
    scope: 'paraformer'
  },
  {
    key: 'vocabularyId',
    label: '热词 ID',
    tip: '热词列表 ID，可提升品牌名/人名/术语识别率',
    type: 'text',
    placeholder: '可选，热词列表 ID',
    scope: 'common'
  }
]

const family = computed<'fun' | 'paraformer' | 'paraformer8k' | 'other'>(() => {
  const m = (props.modelName || '').toLowerCase()
  if (m.includes('fun-asr') || m.includes('funasr')) return 'fun'
  if (m.includes('paraformer-realtime-8k-v2')) return 'paraformer8k'
  if (m.includes('paraformer') || m.includes('gummy')) return 'paraformer'
  return 'other'
})

const visibleFields = computed(() =>
  FIELDS.filter((f) => {
    if (f.scope === 'common') return family.value !== 'other'
    if (f.scope === 'fun') return family.value === 'fun'
    if (f.scope === 'paraformer') return family.value === 'paraformer' || family.value === 'paraformer8k'
    return false
  })
)

const hint = computed(() =>
  family.value === 'paraformer8k'
    ? '提示：情感识别需关闭“语义断句”，且仅在句末返回'
    : '提示：留空字段将使用模型默认值'
)

function set(key: keyof AsrModelParams, value: unknown) {
  ;(props.params as Record<string, unknown>)[key] = value
}
</script>

<style lang="scss" scoped>
.asr-params {
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
    width: 96px;
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
    width: 56px;
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
