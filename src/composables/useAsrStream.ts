import workletUrl from '@/utils/audio/pcm-encoder-worklet.js?url'
import { useLoginInfoStore } from '@/stores/login-info'
import { useBaseURL } from '@/composables/useBaseUrl'
import type { AsrSettings } from '@/composables/useAsrSettings'

/**
 * 前端 RMS 语音活动检测（VAD）说明。
 * 仅在检测到说话时上行音频（含前/后冗余），减少空闲数据包并避免把背景噪声送去识别。
 * 服务端 server_vad 以 silence_duration_ms=400ms 做句子级断句；前端 idleStopMs 为"停发"阈值，
 * 须大于服务端断句窗口（400ms），以保证停发前服务端已对当前句完成提交，避免句尾被截断（"后冗余"）。
 * 阈值与音量/麦克风相关，可在页面实时微调：识别不到轻声→调低起说阈值，噪声误触发→调高。
 * 各参数默认值见 useAsrSettings.DEFAULT_VAD。
 */
const FRAME_MS = 100 // 每帧时长（worklet 缓冲 100ms）

/**
 * 实时语音识别（ASR）composable。
 * <p>
 * 麦克风 → AudioContext(16kHz) → AudioWorklet(PCM16) → WebSocket(/ws/ai/asr) → DashScope 实时识别。
 * 设备与 VAD 参数来自传入的响应式 settings（录音中调参即时生效）。
 * 增量结果以 { text, final } 推送：final=true 的句子追加到 finalText，未完成的句子作为 interimText 实时显示。
 * 同时暴露 currentRms / vadPhase 供音频可视化指示器使用。
 */
export function useAsrStream(settings: AsrSettings) {
  const connecting = ref(false)
  const recording = ref(false)
  const finalText = ref('')
  const interimText = ref('')
  const errorMsg = ref('')
  /** 最近一帧 RMS（驱动可视化，范围约 [0,1]，语音通常远小于 1） */
  const currentRms = ref(0)
  /** VAD 阶段：idle 待机 / starting 起说判定中 / active 说话中 / trailing 静音计时中 */
  const vadPhase = ref<'idle' | 'starting' | 'active' | 'trailing'>('idle')

  const displayText = computed(() => finalText.value + interimText.value)

  let ws: WebSocket | null = null
  let audioCtx: AudioContext | null = null
  let mediaStream: MediaStream | null = null
  let sourceNode: MediaStreamAudioSourceNode | null = null
  let workletNode: AudioWorkletNode | null = null
  let finishTimer: ReturnType<typeof setTimeout> | null = null
  // —— 前端 RMS VAD 状态 ——
  let preroll: ArrayBuffer[] = []
  let vadStartCount = 0
  let vadIdleMs = 0

  function cleanupAudio() {
    try {
      workletNode?.disconnect()
    } catch {
      /* ignore */
    }
    try {
      sourceNode?.disconnect()
    } catch {
      /* ignore */
    }
    try {
      audioCtx?.close()
    } catch {
      /* ignore */
    }
    mediaStream?.getTracks().forEach((t) => t.stop())
    workletNode = null
    sourceNode = null
    audioCtx = null
    mediaStream = null
    currentRms.value = 0
    vadPhase.value = 'idle'
  }

  /** 关闭 WebSocket 并清理结束计时器（幂等） */
  function closeWs() {
    if (finishTimer) {
      clearTimeout(finishTimer)
      finishTimer = null
    }
    if (ws) {
      try {
        ws.close()
      } catch {
        /* ignore */
      }
      ws = null
    }
  }

  /** 仅当连接打开时上行一帧音频 */
  function sendFrame(buf: ArrayBuffer) {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(buf)
  }

  /**
   * RMS VAD 帧处理（读 settings.vad 实时值，录音中调参即时生效）：
   * - idle/starting：仅滚动缓冲前冗余帧并检测起说；连续 startFrames 帧超过 rmsStart 进入 active，补发前冗余。
   * - active/trailing：持续上行；连续静音超过 idleStopMs 才停发回 idle（idleStopMs > 服务端断句窗口，保证句尾不截断）。
   */
  function handleFrame(rms: number, pcm: ArrayBuffer) {
    currentRms.value = rms
    const v = settings.vad
    if (vadPhase.value === 'idle' || vadPhase.value === 'starting') {
      preroll.push(pcm)
      while (preroll.length > v.prerollFrames) preroll.shift()
      if (rms >= v.rmsStart) {
        vadPhase.value = 'starting'
        if (++vadStartCount >= v.startFrames) {
          vadPhase.value = 'active'
          vadIdleMs = 0
          vadStartCount = 0
          for (const b of preroll) sendFrame(b) // 补发前冗余（含起始帧）
          preroll = []
        }
      } else {
        vadStartCount = 0
        vadPhase.value = 'idle'
      }
    } else {
      sendFrame(pcm)
      if (rms < v.rmsStop) {
        vadIdleMs += FRAME_MS
        vadPhase.value = 'trailing'
        if (vadIdleMs >= v.idleStopMs) {
          vadPhase.value = 'idle'
          vadIdleMs = 0
          preroll = []
        }
      } else {
        vadIdleMs = 0
        vadPhase.value = 'active'
      }
    }
  }

  /** 按 settings.deviceId 采集麦克风；指定设备不可用时回退系统默认 */
  async function acquireMic(): Promise<MediaStream> {
    const base: MediaTrackConstraints = {
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true
    }
    const deviceId = settings.deviceId
    try {
      const audio: MediaTrackConstraints = deviceId ? { ...base, deviceId: { exact: deviceId } } : base
      return await navigator.mediaDevices.getUserMedia({ audio })
    } catch (e: any) {
      if (deviceId && e?.name === 'OverconstrainedError') {
        errorMsg.value = '所选麦克风不可用，已切换为默认设备'
        return await navigator.mediaDevices.getUserMedia({ audio: base })
      }
      throw e
    }
  }

  async function start(configKey: string) {
    if (recording.value || connecting.value) return
    if (!configKey) {
      errorMsg.value = '请先选择 STT 模型'
      return
    }
    errorMsg.value = ''
    finalText.value = ''
    interimText.value = ''
    connecting.value = true
    // 重置 VAD 状态
    vadPhase.value = 'idle'
    preroll = []
    vadStartCount = 0
    vadIdleMs = 0

    try {
      // 1. 麦克风采集（单声道，按 settings.deviceId）
      mediaStream = await acquireMic()

      // 2. 16kHz AudioContext + PCM 编码 worklet
      audioCtx = new AudioContext({ sampleRate: 16000 })
      // 少数浏览器不支持指定采样率会回落（如 48kHz），而 PCM 仍按 16kHz 上行将致识别异常：此处显式告警
      if (Math.abs(audioCtx.sampleRate - 16000) > 1) {
        errorMsg.value = `当前浏览器不支持 16kHz 采样（实际 ${audioCtx.sampleRate}Hz），识别可能异常`
      }
      await audioCtx.audioWorklet.addModule(workletUrl)
      sourceNode = audioCtx.createMediaStreamSource(mediaStream)
      workletNode = new AudioWorkletNode(audioCtx, 'pcm-encoder')
      workletNode.port.onmessage = (e: MessageEvent) => {
        const { rms, pcm } = e.data as { rms: number; pcm: ArrayBuffer }
        handleFrame(rms, pcm)
      }
      // 经 0 增益节点接入 destination 以驱动音频图，同时避免麦克风回放
      const mute = audioCtx.createGain()
      mute.gain.value = 0
      sourceNode.connect(workletNode)
      workletNode.connect(mute)
      mute.connect(audioCtx.destination)

      // 3. WebSocket 连接（token + configKey 走 query；SSE/WS 无法自定义请求头）
      const token = useLoginInfoStore().loginToken
      const proto = location.protocol === 'https:' ? 'wss' : 'ws'
      const apiBase = useBaseURL() // 形如 '/api/'
      const url = `${proto}://${location.host}${apiBase}ws/ai/asr?token=${encodeURIComponent(token)}&configKey=${encodeURIComponent(configKey)}`
      ws = new WebSocket(url)
      ws.binaryType = 'arraybuffer'

      ws.onopen = () => {
        connecting.value = false
        recording.value = true
      }
      ws.onmessage = (ev: MessageEvent) => {
        try {
          const data = JSON.parse(ev.data as string)
          if (data.error) {
            errorMsg.value = data.error
            stop()
            return
          }
          if (data.done) {
            // 服务端会话结束（最终结果已下发），此时再关闭 WS
            closeWs()
            return
          }
          if (typeof data.text === 'string') {
            if (data.final) {
              finalText.value += data.text
              interimText.value = ''
            } else {
              interimText.value = data.text
            }
          }
        } catch {
          /* 忽略非 JSON 消息 */
        }
      }
      ws.onerror = () => {
        if (!errorMsg.value) errorMsg.value = '语音识别连接错误'
      }
      ws.onclose = () => {
        if (finishTimer) {
          clearTimeout(finishTimer)
          finishTimer = null
        }
        connecting.value = false
        recording.value = false
        cleanupAudio()
      }
    } catch (e: any) {
      connecting.value = false
      recording.value = false
      const name = e?.name
      if (name === 'NotAllowedError') errorMsg.value = '麦克风权限被拒绝，请在浏览器允许后重试'
      else if (name === 'NotFoundError') errorMsg.value = '未检测到麦克风设备'
      else if (!errorMsg.value) errorMsg.value = e?.message ?? '无法启动麦克风或建立连接'
      cleanupAudio()
      if (ws) {
        try {
          ws.close()
        } catch {
          /* ignore */
        }
        ws = null
      }
    }
  }

  function stop() {
    recording.value = false
    // 立即停止麦克风采集（不再上行音频）；保留 WS 以接收服务端冲刷的最终识别结果
    cleanupAudio()
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send('end')
      } catch {
        /* ignore */
      }
      // 等待服务端返回最终结果与 {done} 后由 onmessage 关闭；6s 兜底
      if (finishTimer) clearTimeout(finishTimer)
      finishTimer = setTimeout(closeWs, 6000)
    } else {
      closeWs()
    }
  }

  onUnmounted(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send('end')
      } catch {
        /* ignore */
      }
    }
    cleanupAudio()
    closeWs()
  })

  return {
    connecting,
    recording,
    finalText,
    interimText,
    displayText,
    errorMsg,
    currentRms,
    vadPhase,
    start,
    stop
  }
}
