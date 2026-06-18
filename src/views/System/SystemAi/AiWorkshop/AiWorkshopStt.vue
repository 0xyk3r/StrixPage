<template>
  <div class="workshop-stt">
    <n-card title="语音识别" class="workshop-card">
      <n-tabs v-model:value="mode" type="line" animated @update:value="onModeChange">
        <!-- 实时识别（ASR，流式） -->
        <n-tab-pane name="realtime" tab="实时识别">
          <n-form label-placement="left" label-width="80px">
            <n-form-item label="选择模型">
              <n-select
                v-model:value="asrConfigKey"
                :options="asrModelOptions"
                placeholder="选择实时语音识别 (ASR) 模型"
                filterable
                style="max-width: 360px"
              />
            </n-form-item>
            <n-form-item label="麦克风">
              <n-select
                v-model:value="settings.deviceId"
                :options="deviceOptions"
                :disabled="asrRecording || asrConnecting"
                placeholder="选择麦克风输入设备"
                style="max-width: 360px"
              />
            </n-form-item>
          </n-form>

          <n-space vertical :size="16">
            <!-- 音频可视化指示器（常驻） -->
            <asr-audio-meter
              :rms="asrCurrentRms"
              :phase="asrVadPhase"
              :rms-start="settings.vad.rmsStart"
              :rms-stop="settings.vad.rmsStop"
            />

            <!-- 高级 VAD 设置（默认折叠） -->
            <n-collapse>
              <n-collapse-item title="高级 VAD 设置" name="vad">
                <asr-vad-settings :vad="settings.vad" @update="onVadUpdate" @reset="reset" />
              </n-collapse-item>
            </n-collapse>

            <n-space align="center">
              <n-button
                v-if="!asrRecording && !asrConnecting"
                type="primary"
                :disabled="!asrConfigKey"
                @click="onStart"
              >
                开始录音
              </n-button>
              <n-button v-else type="error" :loading="asrConnecting" @click="stopAsr">停止</n-button>
              <n-text depth="3" style="font-size: 12px">
                {{ asrConnecting ? '连接中…' : asrRecording ? '聆听中，请讲话…' : '点击开始，授权麦克风后实时识别' }}
              </n-text>
            </n-space>

            <n-alert v-if="asrError" type="error" :show-icon="false" style="background: transparent">
              {{ asrError }}
            </n-alert>

            <div v-if="asrText" class="stt-result">
              <p class="stt-result__label">识别结果：</p>
              <n-input :value="asrText" type="textarea" :rows="6" readonly style="max-width: 640px" />
              <n-button size="small" ghost @click="copyText(asrText)">复制结果</n-button>
            </div>
          </n-space>
        </n-tab-pane>

        <!-- 上传识别（离线 STT，批量异步轮询） -->
        <n-tab-pane name="upload" tab="上传识别">
          <n-form label-placement="left" label-width="80px">
            <n-form-item label="选择模型">
              <n-select
                v-model:value="sttConfigKey"
                :options="sttModelOptions"
                placeholder="选择离线语音识别 (STT) 模型"
                filterable
                style="max-width: 360px"
              />
            </n-form-item>
            <n-form-item label="上传音频">
              <n-upload :max="1" accept="audio/*" :default-upload="false" @change="handleUploadChange">
                <n-button>选择音频文件</n-button>
              </n-upload>
            </n-form-item>
          </n-form>

          <n-space style="margin-top: 12px" align="center">
            <n-button
              type="primary"
              :loading="transcribing"
              :disabled="!sttConfigKey || !audioFile"
              @click="transcribe"
            >
              开始识别
            </n-button>
            <n-text v-if="statusHint" depth="3" style="font-size: 12px">{{ statusHint }}</n-text>
          </n-space>

          <div v-if="result" class="stt-result">
            <p class="stt-result__label">识别结果：</p>
            <n-input :value="result" type="textarea" :rows="6" readonly style="max-width: 640px" />
            <n-button size="small" ghost @click="copyText(result)">复制结果</n-button>
          </div>
        </n-tab-pane>
      </n-tabs>
    </n-card>
  </div>
</template>

<script lang="ts" setup>
import type { UploadFileInfo } from 'naive-ui'
import type { AiModelConfigResp } from '@/api/ai'
import { aiApi } from '@/api/ai'
import { useAsrStream } from '@/composables/useAsrStream'
import { type AsrVadParams, useAsrSettings } from '@/composables/useAsrSettings'
import { useMediaDevices } from '@/composables/useMediaDevices'
import AsrAudioMeter from './AsrAudioMeter.vue'
import AsrVadSettings from './AsrVadSettings.vue'

interface Props {
  models: AiModelConfigResp[]
}

const props = defineProps<Props>()

const message = useMessage()
const mode = ref<'realtime' | 'upload'>('realtime')

// 实时识别使用 ASR(6) 模型，离线上传识别使用 STT(4) 模型（两者通常是不同的模型/配置）
const asrModelOptions = computed(() =>
  props.models.filter((m) => m.status === 1 && m.type === 6).map((m) => ({ label: m.name, value: m.key }))
)
const sttModelOptions = computed(() =>
  props.models.filter((m) => m.status === 1 && m.type === 4).map((m) => ({ label: m.name, value: m.key }))
)

// ——— 实时识别（ASR） ———
const asrConfigKey = ref('')
const { settings, reset } = useAsrSettings()
const { options: deviceOptions, refresh: refreshDevices } = useMediaDevices()
const {
  recording: asrRecording,
  connecting: asrConnecting,
  displayText: asrText,
  errorMsg: asrError,
  currentRms: asrCurrentRms,
  vadPhase: asrVadPhase,
  start: startAsr,
  stop: stopAsr
} = useAsrStream(settings)

async function onStart() {
  await startAsr(asrConfigKey.value)
  // 授权麦克风后设备 label 才可读，补全设备下拉
  refreshDevices()
}

// 选中设备被拔出/失效时回退系统默认
watch(deviceOptions, (opts) => {
  if (settings.deviceId && !opts.some((o) => o.value === settings.deviceId)) {
    settings.deviceId = ''
  }
})

// 子组件回传的 VAD 参数变更：写入共享 settings（自动持久化）
function onVadUpdate(key: keyof AsrVadParams, value: number) {
  settings.vad[key] = value
}

function onModeChange(next: string) {
  // 离开实时识别页时，若仍在录音则停止
  if (next !== 'realtime' && (asrRecording.value || asrConnecting.value)) {
    stopAsr()
  }
}

// ——— 上传识别（离线 STT，异步轮询） ———
const sttConfigKey = ref('')
const audioFile = ref<File | null>(null)
const transcribing = ref(false)
const result = ref('')
const statusHint = ref('')
let pollTimer: ReturnType<typeof setTimeout> | null = null

function handleUploadChange(options: { fileList: UploadFileInfo[] }) {
  const f = options.fileList[0]
  audioFile.value = f?.file ?? null
}

async function transcribe() {
  if (!sttConfigKey.value || !audioFile.value) return
  transcribing.value = true
  result.value = ''
  statusHint.value = '正在提交…'
  try {
    // 提交后返回 taskId，转录在后端异步执行，前端轮询任务状态
    const res = await aiApi.sttTranscribe(sttConfigKey.value, audioFile.value)
    const taskId = res.data?.data
    if (res.data?.code !== 200 || !taskId) {
      message.error(res.data?.msg ?? '提交失败')
      transcribing.value = false
      statusHint.value = ''
      return
    }
    statusHint.value = '识别中，请稍候…'
    pollTask(taskId)
  } catch (e: any) {
    message.error('识别失败：' + (e?.message ?? '未知错误'))
    transcribing.value = false
    statusHint.value = ''
  }
}

/** 轮询异步任务状态，直至 成功 / 失败 / 超时 */
function pollTask(taskId: string) {
  let attempts = 0
  const maxAttempts = 300 // 约 10 分钟（2s 间隔）
  const tick = async () => {
    attempts++
    try {
      const res = await aiApi.taskStatus(taskId)
      const st = res.data?.data
      if (st?.status === 'SUCCEEDED') {
        result.value = st.result ?? ''
        statusHint.value = ''
        transcribing.value = false
        message.success('识别完成')
        return
      }
      if (st?.status === 'FAILED') {
        statusHint.value = ''
        transcribing.value = false
        message.error('识别失败：' + (st.error ?? '未知错误'))
        return
      }
    } catch {
      // 单次轮询失败忽略，继续重试
    }
    if (attempts >= maxAttempts) {
      statusHint.value = ''
      transcribing.value = false
      message.error('识别超时，请稍后重试')
      return
    }
    pollTimer = setTimeout(tick, 2000)
  }
  pollTimer = setTimeout(tick, 1500)
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text)
  message.success('已复制')
}

onUnmounted(() => {
  if (pollTimer) clearTimeout(pollTimer)
})
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
