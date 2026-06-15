<template>
  <div class="workshop-tts">
    <n-card title="文本转语音 (TTS)" class="workshop-card">
      <n-form label-placement="left" label-width="80px">
        <n-form-item label="选择模型">
          <n-select
            v-model:value="configKey"
            :options="modelOptions"
            placeholder="选择 TTS 模型"
            filterable
            style="max-width: 360px"
          />
        </n-form-item>
        <n-form-item label="输入文本">
          <n-input
            v-model:value="text"
            type="textarea"
            :rows="5"
            clearable
            placeholder="请输入要合成的文本"
            style="max-width: 640px"
          />
        </n-form-item>
      </n-form>

      <n-space style="margin-top: 12px">
        <n-button type="primary" :loading="synthesizing" :disabled="!configKey || !text.trim()" @click="synthesize">
          合成语音
        </n-button>
      </n-space>

      <!-- 结果 -->
      <div v-if="audioUrl" class="tts-result">
        <p class="tts-result__label">合成结果：</p>
        <!-- eslint-disable-next-line vuejs-accessibility/media-has-caption -->
        <audio :src="audioUrl" controls class="tts-result__player" />
        <n-button size="small" type="primary" ghost @click="downloadAudio">下载音频</n-button>
      </div>
    </n-card>
  </div>
</template>

<script lang="ts" setup>
import type { AiModelConfigResp } from '@/api/ai'
import { aiApi } from '@/api/ai'

interface Props {
  models: AiModelConfigResp[]
}

const props = defineProps<Props>()

const message = useMessage()
const configKey = ref('')
const text = ref('')
const synthesizing = ref(false)
const audioUrl = ref('')

const modelOptions = computed(() =>
  props.models
    .filter((m) => m.status === 1 && m.type === 3)
    .map((m) => ({ label: m.name, value: m.key }))
)

async function synthesize() {
  if (!configKey.value || !text.value.trim()) return
  synthesizing.value = true
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
  audioUrl.value = ''
  try {
    const res = await aiApi.ttsSynthesize({ configKey: configKey.value, text: text.value })
    const blob = res.data as unknown as Blob
    if (!(blob instanceof Blob)) {
      message.error('合成失败：响应格式异常')
      return
    }
    audioUrl.value = URL.createObjectURL(blob)
    message.success('合成成功')
  } catch (e: any) {
    message.error('合成失败：' + (e?.message ?? '未知错误'))
  } finally {
    synthesizing.value = false
  }
}

function downloadAudio() {
  const a = document.createElement('a')
  a.href = audioUrl.value
  a.download = `tts-${Date.now()}.mp3`
  a.click()
}

onUnmounted(() => {
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
})
</script>

<style lang="scss" scoped>
.tts-result {
  margin-top: 20px;
  padding: 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__label {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
    margin: 0;
  }

  &__player {
    width: 100%;
    max-width: 500px;
  }
}
</style>
