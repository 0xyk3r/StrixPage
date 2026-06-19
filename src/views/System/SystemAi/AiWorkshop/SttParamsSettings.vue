<template>
  <div class="stt-params">
    <!-- 语种（全族通用，存储因族而异） -->
    <div v-if="family !== 'other'" class="stt-params__row">
      <span class="stt-params__label">语种</span>
      <n-input
        v-model:value="languageText"
        :disabled="disabled"
        clearable
        placeholder="如 zh / en（可选，留空自动识别）"
        style="flex: 1"
      />
    </div>

    <!-- 说话人分离（Fun-ASR/Paraformer） -->
    <template v-if="family === 'fun' || family === 'paraformer'">
      <div class="stt-params__row">
        <span class="stt-params__label">说话人分离</span>
        <n-switch
          :value="params.diarizationEnabled ?? false"
          :disabled="disabled"
          @update:value="(v: boolean) => set('diarizationEnabled', v)"
        />
      </div>
      <div v-if="params.diarizationEnabled" class="stt-params__row">
        <span class="stt-params__label">说话人数</span>
        <n-input-number
          :value="params.speakerCount ?? null"
          :min="2"
          :max="100"
          :disabled="disabled"
          clearable
          placeholder="自动判断"
          style="width: 160px"
          @update:value="(v: number | null) => set('speakerCount', v ?? undefined)"
        />
      </div>
      <div class="stt-params__row">
        <span class="stt-params__label">热词 ID</span>
        <n-input
          :value="params.vocabularyId ?? ''"
          :disabled="disabled"
          clearable
          placeholder="可选，热词列表 ID"
          style="flex: 1"
          @update:value="(v: string) => set('vocabularyId', v || undefined)"
        />
      </div>
    </template>

    <!-- Paraformer 专属 -->
    <template v-if="family === 'paraformer'">
      <div class="stt-params__row">
        <span class="stt-params__label">过滤语气词</span>
        <n-switch
          :value="params.disfluencyRemovalEnabled ?? false"
          :disabled="disabled"
          @update:value="(v: boolean) => set('disfluencyRemovalEnabled', v)"
        />
      </div>
      <div class="stt-params__row">
        <span class="stt-params__label">时间戳校准</span>
        <n-switch
          :value="params.timestampAlignmentEnabled ?? false"
          :disabled="disabled"
          @update:value="(v: boolean) => set('timestampAlignmentEnabled', v)"
        />
      </div>
    </template>

    <!-- Qwen 专属 -->
    <template v-if="family === 'qwen-filetrans' || family === 'qwen-flash'">
      <div class="stt-params__row">
        <span class="stt-params__label">数字正则化</span>
        <n-switch
          :value="params.enableItn ?? false"
          :disabled="disabled"
          @update:value="(v: boolean) => set('enableItn', v)"
        />
      </div>
    </template>

    <!-- Qwen-Filetrans 专属 -->
    <template v-if="family === 'qwen-filetrans'">
      <div class="stt-params__row">
        <span class="stt-params__label">字级时间戳</span>
        <n-switch
          :value="params.enableWords ?? false"
          :disabled="disabled"
          @update:value="(v: boolean) => set('enableWords', v)"
        />
      </div>
    </template>

    <div class="stt-params__footer">
      <n-text depth="3" style="font-size: 12px">{{ hint }}</n-text>
      <n-button size="small" ghost :disabled="disabled" @click="emit('reset')">清除会话参数</n-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { SttParams } from '@/composables/useSttParams'

const props = defineProps<{ params: SttParams; modelName: string; disabled?: boolean }>()
const emit = defineEmits<{ reset: [] }>()

type Family = 'fun' | 'paraformer' | 'qwen-filetrans' | 'qwen-flash' | 'other'

const family = computed<Family>(() => {
  const m = (props.modelName || '').toLowerCase()
  if (m.includes('fun-asr') || m.includes('funasr')) return 'fun'
  if (m.includes('paraformer')) return 'paraformer'
  if (m.includes('qwen') && m.includes('asr') && m.includes('filetrans')) return 'qwen-filetrans'
  if (m.includes('qwen') && m.includes('asr') && m.includes('flash')) return 'qwen-flash'
  return 'other'
})

/** 语种代理：Fun-ASR/Paraformer 映射 languageHints[0]，Qwen 映射 language */
const languageText = computed<string>({
  get: () =>
    family.value === 'fun' || family.value === 'paraformer'
      ? (props.params.languageHints?.[0] ?? '')
      : (props.params.language ?? ''),
  set: (v: string) => {
    if (family.value === 'fun' || family.value === 'paraformer') {
      set('languageHints', v ? [v] : undefined)
    } else {
      set('language', v || undefined)
    }
  }
})

const hint = computed(() =>
  family.value === 'qwen-flash'
    ? '提示：Qwen-Flash 仅支持 5 分钟内音频，不返回时间戳与说话人'
    : '提示：留空字段使用模型默认值'
)

function set(key: keyof SttParams, value: unknown) {
  ;(props.params as Record<string, unknown>)[key] = value
}
</script>

<style lang="scss" scoped>
.stt-params {
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
    width: 88px;
    font-size: 13px;
    flex: none;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
}
</style>
