<template>
  <div class="workshop-stt">
    <n-card title="语音识别" class="workshop-card">
      <n-tabs v-model:value="mode" type="line" animated @update:value="onModeChange">
        <!-- 实时识别（ASR，流式）：左控制面板 + 右识别结果 -->
        <n-tab-pane name="realtime" tab="实时识别">
          <div class="realtime-layout">
            <!-- 左：控制面板 -->
            <div class="realtime-layout__panel">
              <n-form label-placement="top">
                <n-form-item label="选择模型">
                  <n-select
                    v-model:value="asrConfigKey"
                    :options="asrModelOptions"
                    placeholder="选择实时语音识别 (ASR) 模型"
                    filterable
                  />
                </n-form-item>
                <n-form-item label="麦克风">
                  <n-select
                    v-model:value="settings.deviceId"
                    :options="deviceOptions"
                    :disabled="asrRecording || asrConnecting"
                    placeholder="选择麦克风输入设备"
                  />
                </n-form-item>
              </n-form>

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

              <!-- 识别参数（按所选模型动态显示，默认折叠） -->
              <n-collapse v-if="selectedModelName">
                <n-collapse-item title="识别参数" name="model-params">
                  <asr-model-params-settings
                    :params="asrModelParams"
                    :model-name="selectedModelName"
                    @reset="resetModelParams"
                  />
                </n-collapse-item>
              </n-collapse>

              <div class="realtime-layout__actions">
                <n-button
                  v-if="!asrRecording && !asrConnecting"
                  type="primary"
                  block
                  :disabled="!asrConfigKey"
                  @click="onStart"
                >
                  开始录音
                </n-button>
                <n-button v-else type="error" block :loading="asrConnecting" @click="stopAsr">停止</n-button>
                <n-text depth="3" style="font-size: 12px">
                  {{ asrConnecting ? '连接中…' : asrRecording ? '聆听中，请讲话…' : '点击开始，授权麦克风后实时识别' }}
                </n-text>
                <n-alert v-if="asrError" type="error" :show-icon="false" style="background: transparent">
                  {{ asrError }}
                </n-alert>
              </div>
            </div>

            <!-- 右：识别结果 -->
            <div class="realtime-layout__result">
              <asr-transcript-view :sentences="asrSentences" :recording="asrRecording" @clear="asrSentences = []" />
            </div>
          </div>
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

          <div v-if="result" class="stt-result-card">
            <div class="stt-result-card__head">
              <span class="stt-result-card__title">识别结果</span>
              <span class="stt-result-card__count">共 {{ result.length }} 字</span>
            </div>
            <p class="stt-result-card__body">{{ result }}</p>
            <div class="stt-result-card__foot">
              <n-button size="small" ghost @click="copyText(result)">复制结果</n-button>
            </div>
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
import { type AsrModelParams, useAsrModelParams } from '@/composables/useAsrModelParams'
import { useMediaDevices } from '@/composables/useMediaDevices'
import AsrAudioMeter from './AsrAudioMeter.vue'
import AsrVadSettings from './AsrVadSettings.vue'
import AsrModelParamsSettings from './AsrModelParamsSettings.vue'
import AsrTranscriptView from './AsrTranscriptView.vue'

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
  sentences: asrSentences,
  errorMsg: asrError,
  currentRms: asrCurrentRms,
  vadPhase: asrVadPhase,
  start: startAsr,
  stop: stopAsr
} = useAsrStream(settings)

const { params: asrModelParams, switchModel, setDefaults, reset: resetModelParams, toPayload } = useAsrModelParams()

// 当前所选 ASR 模型配置（用于参数面板按模型族显示 + 读取默认 asrParams）
const selectedAsrModel = computed(() => props.models.find((m) => m.key === asrConfigKey.value))
const selectedModelName = computed(() => selectedAsrModel.value?.modelName ?? '')

// 切换模型：加载该模型的会话参数，并用模型配置默认 asrParams 预填
watch(asrConfigKey, (key) => {
  switchModel(key)
  const raw = selectedAsrModel.value?.asrParams
  if (raw) {
    try {
      setDefaults(JSON.parse(raw) as AsrModelParams)
    } catch {
      /* 非法 JSON 忽略 */
    }
  }
})

async function onStart() {
  await startAsr(asrConfigKey.value, () => toPayload())
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
// —— 实时识别两列布局：左控制面板 + 右识别结果 ——
.realtime-layout {
  display: flex;
  gap: 16px;
  // 给定边界高度，右侧识别结果区据此滚动；随视口自适应，下限保证可用
  height: clamp(420px, calc(100vh - 320px), 760px);

  &__panel {
    flex: none;
    width: 340px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    overflow-y: auto;
    padding-right: 4px;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: auto;
  }

  &__result {
    flex: 1;
    min-width: 0;
  }
}

// 窄屏：上下堆叠，结果区给固定高度
@media (max-width: 900px) {
  .realtime-layout {
    flex-direction: column;
    height: auto;

    &__panel {
      width: 100%;
      overflow: visible;
    }

    &__result {
      height: 480px;
    }
  }
}

.stt-result-card {
  margin-top: 20px;
  max-width: 640px;
  border-radius: 12px;
  background: var(--strix-bg-surface);
  border: 1px solid var(--strix-border-default);
  overflow: hidden;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 14px;
    border-bottom: 1px solid var(--strix-border-subtle);
  }

  &__title {
    font-size: 13px;
    font-weight: 500;
    color: var(--strix-text-secondary);
  }

  &__count {
    font-size: 12px;
    color: var(--strix-text-tertiary);
    font-variant-numeric: tabular-nums;
  }

  &__body {
    margin: 0;
    padding: 14px;
    font-size: 15px;
    line-height: 1.7;
    color: var(--strix-text-primary);
    white-space: pre-wrap;
    word-break: break-word;
  }

  &__foot {
    padding: 0 14px 14px;
  }
}
</style>
