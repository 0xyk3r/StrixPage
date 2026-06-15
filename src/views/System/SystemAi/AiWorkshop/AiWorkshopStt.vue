<template>
  <div class="workshop-stt">
    <n-card title="语音识别 (STT)" class="workshop-card">
      <n-form label-placement="left" label-width="80px">
        <n-form-item label="选择模型">
          <n-select
            v-model:value="configKey"
            :options="modelOptions"
            placeholder="选择 STT 模型"
            filterable
            style="max-width: 360px"
          />
        </n-form-item>
        <n-form-item label="上传音频">
          <n-upload
            :max="1"
            accept="audio/*"
            :default-upload="false"
            @change="handleUploadChange"
          >
            <n-button>选择音频文件</n-button>
          </n-upload>
        </n-form-item>
      </n-form>

      <n-space style="margin-top: 12px">
        <n-button type="primary" :loading="transcribing" :disabled="!configKey || !audioFile" @click="transcribe">
          开始识别
        </n-button>
      </n-space>

      <!-- 结果 -->
      <div v-if="result" class="stt-result">
        <p class="stt-result__label">识别结果：</p>
        <n-input
          :value="result"
          type="textarea"
          :rows="6"
          readonly
          style="max-width: 640px"
        />
        <n-button size="small" ghost @click="copyResult">复制结果</n-button>
      </div>
    </n-card>
  </div>
</template>

<script lang="ts" setup>
import type { UploadFileInfo } from 'naive-ui'
import type { AiModelConfigResp } from '@/api/ai'
import { aiApi } from '@/api/ai'

interface Props {
  models: AiModelConfigResp[]
}

const props = defineProps<Props>()

const message = useMessage()
const configKey = ref('')
const audioFile = ref<File | null>(null)
const transcribing = ref(false)
const result = ref('')

const modelOptions = computed(() =>
  props.models
    .filter((m) => m.status === 1 && m.type === 4)
    .map((m) => ({ label: m.name, value: m.key }))
)

function handleUploadChange(options: { fileList: UploadFileInfo[] }) {
  const f = options.fileList[0]
  audioFile.value = f?.file ?? null
}

async function transcribe() {
  if (!configKey.value || !audioFile.value) return
  transcribing.value = true
  result.value = ''
  try {
    const res = await aiApi.sttTranscribe(configKey.value, audioFile.value)
    const text = res.data?.data ?? res.data?.msg ?? ''
    result.value = text
    message.success('识别完成')
  } catch (e: any) {
    message.error('识别失败：' + (e?.message ?? '未知错误'))
  } finally {
    transcribing.value = false
  }
}

async function copyResult() {
  await navigator.clipboard.writeText(result.value)
  message.success('已复制')
}
</script>

<style lang="scss" scoped>
.stt-result {
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
}
</style>
