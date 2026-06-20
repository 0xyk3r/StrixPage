<template>
  <div class="workshop-tts">
    <n-card title="语音合成" class="workshop-card">
      <div class="tts-layout">
        <!-- 左：控制面板 -->
        <div class="tts-layout__panel">
          <n-form label-placement="top" size="small">
            <n-form-item label="选择模型">
              <n-select
                v-model:value="configKey"
                :options="modelOptions"
                placeholder="选择 TTS 模型"
                filterable
              />
            </n-form-item>

            <n-form-item label="合成模式">
              <n-radio-group v-model:value="mode" size="small" :disabled="busy">
                <n-radio-button value="once">非流式</n-radio-button>
                <n-radio-button value="http">HTTP 流式</n-radio-button>
                <n-radio-button value="ws">双向流式</n-radio-button>
              </n-radio-group>
            </n-form-item>

            <n-form-item label="音色">
              <n-select
                v-model:value="voiceId"
                :options="voiceOptions"
                placeholder="选择音色（复刻 / 设计）"
                filterable
                :render-label="renderVoiceLabel"
              >
                <template #action>
                  <n-text depth="3" style="font-size: 12px">无音色？在下方「音色管理」复刻或设计</n-text>
                </template>
              </n-select>
            </n-form-item>
          </n-form>

          <!-- 指令控制 -->
          <n-collapse>
            <n-collapse-item title="指令控制" name="instruction">
              <n-input
                v-model:value="instruction"
                type="textarea"
                :rows="2"
                placeholder="用自然语言控制语气/情感/方言，如：用激昂的语气，语速稍快（≤100 字符）"
                maxlength="100"
                show-count
              />
            </n-collapse-item>
          </n-collapse>

          <!-- 合成参数 -->
          <n-collapse>
            <n-collapse-item title="合成参数" name="params">
              <tts-params-settings :params="ttsParams" @reset="resetParams" />
            </n-collapse-item>
          </n-collapse>

          <!-- 音色管理 -->
          <n-collapse>
            <n-collapse-item title="音色管理" name="voices">
              <tts-voice-manager
                ref="voiceManagerRef"
                :config-key="configKey"
                @created="onVoiceCreated"
                @refresh="loadVoices"
                @removed="onVoiceRemoved"
                @preview="onDesignPreview"
              />
            </n-collapse-item>
          </n-collapse>
        </div>

        <!-- 右：输入与结果 -->
        <div class="tts-layout__result">
          <!-- 文本输入区 -->
          <div class="tts-input">
            <div class="tts-input__head">
              <n-text class="tts-input__title">合成文本</n-text>
              <n-checkbox v-model:checked="enableSsml" :disabled="busy">SSML 标记</n-checkbox>
            </div>
            <ssml-editor v-if="enableSsml" v-model="text" :rows="6"
                         placeholder="<speak>输入带 SSML 标记的文本</speak>" />
            <n-input
              v-else
              v-model:value="text"
              type="textarea"
              :rows="6"
              placeholder="请输入要合成的文本"
              :autosize="{ minRows: 6, maxRows: 14 }"
            />
          </div>

          <!-- 合成 + 播放：波形传输条统一承载动作、可视化、播放与下载 -->
          <tts-audio-player
            ref="playerRef"
            :src="resultUrl"
            :live="busy || wsActive"
            :stream-playing="streamPlaying"
            :status="stageHint"
            :error="errorText"
            @download="downloadAudio"
          >
            <template #actions>
              <!-- 非流式 / HTTP 流式：一键合成 -->
              <template v-if="mode !== 'ws'">
                <n-button type="primary" :loading="busy" :disabled="!canSynthesize" @click="onSynthesize">
                  {{ mode === 'http' ? '流式合成' : '合成语音' }}
                </n-button>
                <n-button v-if="busy && mode === 'http'" type="error" ghost @click="stopHttp">停止</n-button>
              </template>
              <!-- 双向流式：会话式发送 -->
              <template v-else>
                <n-button
                  v-if="!wsActive"
                  type="primary"
                  :loading="wsConnecting"
                  :disabled="!canStartWs"
                  @click="onWsStart"
                >
                  开始流式会话
                </n-button>
                <template v-else>
                  <n-button type="primary" :disabled="!text.trim()" @click="onWsSend">发送片段</n-button>
                  <n-button type="warning" ghost @click="onWsFinish">结束输入</n-button>
                  <n-button type="error" ghost @click="stopWs">中止</n-button>
                </template>
              </template>
            </template>
          </tts-audio-player>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script lang="ts" setup>
import { h, type Ref, type VNodeChild } from 'vue'
import type { SelectOption } from 'naive-ui'
import type { AiModelConfigResp, AiTtsVoiceResp, TtsParams } from '@/api/ai'
import { aiApi } from '@/api/ai'
import { useTtsParams } from '@/composables/useTtsParams'
import { useTtsStream } from '@/composables/useTtsStream'
import { useTtsHttpStream } from '@/composables/useTtsHttpStream'
import TtsParamsSettings from './TtsParamsSettings.vue'
import TtsVoiceManager from './TtsVoiceManager.vue'
import TtsAudioPlayer from './TtsAudioPlayer.vue'
import SsmlEditor from './SsmlEditor.vue'

interface Props {
  models: AiModelConfigResp[]
}
const props = defineProps<Props>()
const message = useMessage()

const configKey = ref<string | null>(null)
const voiceId = ref<string | null>(null)
const mode = ref<'once' | 'http' | 'ws'>('once')
const text = ref('')
const instruction = ref('')
const enableSsml = ref(false)

// 开启 SSML 时自动包裹 <speak>；关闭时移除外层 <speak>，保留内部内容
const SPEAK_RE = /^\s*<speak(\s[^>]*)?>([\s\S]*)<\/speak>\s*$/i
watch(enableSsml, (on) => {
  const t = text.value
  if (on) {
    if (!SPEAK_RE.test(t)) text.value = `<speak>${t}</speak>`
  } else {
    const m = t.match(SPEAK_RE)
    if (m) text.value = m[2]!
  }
})

const modelOptions = computed(() =>
  props.models.filter((m) => m.status === 1 && m.type === 3).map((m) => ({ label: m.name, value: m.key }))
)

const selectedModel = computed(() => props.models.find((m) => m.key === configKey.value))

// ——— 音色列表 ———
const voices = ref<AiTtsVoiceResp[]>([])
const voiceManagerRef = ref<InstanceType<typeof TtsVoiceManager> | null>(null)

const voiceOptions = computed<SelectOption[]>(() =>
  voices.value
    .filter((v) => v.status === 'OK')
    .map((v) => ({ label: v.name, value: v.voiceId, voiceType: v.voiceType }))
)

function renderVoiceLabel(option: SelectOption): VNodeChild {
  const typeLabel = option.voiceType === 1 ? '复刻' : '设计'
  return h('div', { style: 'display:flex;align-items:center;gap:8px' }, [
    h('span', {}, option.label as string),
    h(
      'span',
      { style: 'font-size:11px;color:var(--strix-text-tertiary);border:1px solid var(--strix-border-subtle);padding:0 5px;border-radius:4px' },
      typeLabel
    )
  ])
}

async function loadVoices() {
  if (!configKey.value) {
    voices.value = []
    return
  }
  const res = await aiApi.ttsVoiceList(configKey.value)
  voices.value = (res.data?.data ?? []) as AiTtsVoiceResp[]
}

function onVoiceCreated(newVoiceId: string) {
  loadVoices()
  voiceId.value = newVoiceId
}

/** 删除音色后：若被删的是当前所选，清空选择 */
function onVoiceRemoved(removedVoiceId: string) {
  loadVoices()
  if (voiceId.value === removedVoiceId) {
    voiceId.value = null
  }
}

// ——— 会话级参数 ———
const { params: ttsParams, switchModel, setDefaults, reset: resetParams, toPayload } = useTtsParams()

watch(configKey, (key) => {
  switchModel(key ?? '')
  voiceId.value = null
  loadVoices()
  const raw = selectedModel.value?.ttsParams
  if (raw) {
    try {
      setDefaults(JSON.parse(raw) as TtsParams)
    } catch {
      /* 非法 JSON 忽略 */
    }
  }
})

/** 组装请求参数 JSON（含指令；voice 由 voiceId 单独传） */
function buildParamsJson(): string {
  const payload = toPayload()
  if (instruction.value.trim()) payload.instruction = instruction.value.trim()
  if (enableSsml.value) payload.enableSsml = true
  return JSON.stringify(payload)
}

/** 当前采样率（流式播放用，默认 24000） */
function currentSampleRate(): number {
  return (ttsParams.sampleRate as number) || 24000
}

// ——— 非流式 + HTTP 流式 ———
const onceLoading = ref(false)
const resultUrl = ref('')
const playerRef = ref<InstanceType<typeof TtsAudioPlayer> | null>(null)
const httpStream = useTtsHttpStream()

/** 设置结果音频并在下一帧自动播放（非流式/预览用；流式已实时播放，不调用此函数） */
async function setResultAndPlay(blob: Blob) {
  resultUrl.value = URL.createObjectURL(blob)
  await nextTick()
  playerRef.value?.play()
}

/**
 * 流式（HTTP/WS）完成后挂载完整音频片段供进度展示/下载/重播。
 * 若实时播放仍在进行，则延迟到播放结束再挂载，避免设置 src 重置播放器正在进行的状态。
 */
function mountClipAfterPlayback(blob: Blob, playingRef: Ref<boolean>) {
  if (!playingRef.value) {
    resultUrl.value = URL.createObjectURL(blob)
    return
  }
  const stop = watch(playingRef, (p) => {
    if (!p) {
      resultUrl.value = URL.createObjectURL(blob)
      stop()
    }
  })
}

const canSynthesize = computed(() => !!configKey.value && !!voiceId.value && !!text.value.trim())

const busy = computed(() => onceLoading.value || httpStream.synthesizing.value)

/** 清除上一次的错误信息（流式/会话） */
function clearErrors() {
  httpStream.errorMsg.value = ''
  wsStream.errorMsg.value = ''
}

async function onSynthesize() {
  if (!canSynthesize.value) return
  clearErrors()
  clearResult()
  if (mode.value === 'http') {
    await httpStream.synthesize(configKey.value!, text.value, voiceId.value!, toPayloadWithExtras(), currentSampleRate())
    if (httpStream.audioBlob.value) mountClipAfterPlayback(httpStream.audioBlob.value, httpStream.playing)
    return
  }
  // 非流式
  onceLoading.value = true
  try {
    const res = await aiApi.ttsSynthesize({
      configKey: configKey.value!,
      text: text.value,
      voiceId: voiceId.value!,
      params: buildParamsJson()
    })
    const blob = res.data as unknown as Blob
    if (!(blob instanceof Blob)) {
      message.error('合成失败：响应格式异常')
      return
    }
    // 非流式：设置结果并自动播放
    await setResultAndPlay(blob)
    message.success('合成成功')
  } catch (e: any) {
    message.error('合成失败：' + (e?.message ?? '未知错误'))
  } finally {
    onceLoading.value = false
  }
}

/** HTTP/WS 流式用：参数对象（含指令/SSML） */
function toPayloadWithExtras(): Record<string, unknown> {
  const payload = toPayload()
  if (instruction.value.trim()) payload.instruction = instruction.value.trim()
  if (enableSsml.value) payload.enableSsml = true
  return payload
}

function stopHttp() {
  httpStream.stop()
}

// ——— 双向流式（WebSocket） ———
const wsStream = useTtsStream()
const wsConnecting = wsStream.connecting
const wsActive = wsStream.active

const canStartWs = computed(() => !!configKey.value && !!voiceId.value)

async function onWsStart() {
  clearErrors()
  clearResult()
  try {
    await wsStream.connect(configKey.value!, voiceId.value!, toPayloadWithExtras(), currentSampleRate())
    message.success('会话已建立，可发送文本片段')
  } catch {
    /* 错误已记录在 errorMsg */
  }
}

function onWsSend() {
  if (!text.value.trim()) return
  wsStream.sendText(text.value)
  text.value = ''
}

function onWsFinish() {
  wsStream.finishInput()
  // 结束后生成可下载音频
  watchWsBlob()
}

function stopWs() {
  wsStream.close()
}

/** 监听 WS 会话生成的完整音频 → 供下载与回放（延迟到实时播放结束再挂载） */
function watchWsBlob() {
  const stop = watch(wsStream.audioBlob, (blob) => {
    if (blob) {
      mountClipAfterPlayback(blob, wsStream.playing)
      stop()
    }
  })
}

// ——— 声音设计预览（复用合成结果展示区，自动播放） ———
function onDesignPreview(blob: Blob) {
  clearResult()
  setResultAndPlay(blob)
}

// ——— 播放状态聚合 ———
/** 流式 Web Audio 是否正在播放（驱动波形律动） */
const streamPlaying = computed(() => httpStream.playing.value || wsStream.playing.value)
const errorText = computed(() => httpStream.errorMsg.value || wsStream.errorMsg.value)

const stageHint = computed(() => {
  if (errorText.value) return ''
  if (streamPlaying.value) return '播放中…'
  if (wsConnecting.value) return '连接中…'
  if (wsActive.value) return '会话进行中：发送含句号等标点的完整句子即可即时听到合成音频'
  if (busy.value) return mode.value === 'http' ? '流式合成中…' : '合成中…'
  if (!voiceId.value) return '选择音色后开始合成'
  return resultUrl.value ? '合成完成' : '准备就绪'
})

// ——— 结果清理 ———
function clearResult() {
  if (resultUrl.value) {
    URL.revokeObjectURL(resultUrl.value)
    resultUrl.value = ''
  }
}

function downloadAudio() {
  if (!resultUrl.value) return
  const a = document.createElement('a')
  a.href = resultUrl.value
  a.download = `tts-${Date.now()}.wav`
  a.click()
}

// 切换模式时停止进行中的任务
watch(mode, () => {
  httpStream.stop()
  wsStream.close()
})

onUnmounted(() => clearResult())

</script>

<style lang="scss" scoped>
.tts-layout {
  display: flex;
  gap: 16px;
  align-items: flex-start;

  &__panel {
    flex: none;
    width: 340px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    // 仅在内容超出视口时滚动，不强制撑满，避免底部留白
    max-height: calc(100vh - 200px);
    overflow-y: auto;
    padding-right: 4px;
  }

  &__result {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
}

.tts-input {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    font-size: 14px;
    color: var(--strix-text-primary);
  }
}

@media (max-width: 900px) {
  .tts-layout {
    flex-direction: column;

    &__panel {
      width: 100%;
      overflow: visible;
    }
  }
}
</style>
