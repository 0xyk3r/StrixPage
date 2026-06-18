import workletUrl from '@/utils/audio/pcm-encoder-worklet.js?url'
import { useLoginInfoStore } from '@/stores/login-info'
import { useBaseURL } from '@/composables/useBaseUrl'

/**
 * 前端 RMS 语音活动检测（VAD）参数。
 * 仅在检测到说话时上行音频（含前/后冗余），减少空闲数据包并避免把背景噪声送去识别。
 * 服务端仍开启 server_vad（silence=1500ms）做句子级断句，故 IDLE_STOP_MS 必须大于该窗口，
 * 以保证停发前服务端已对当前句完成提交，避免句尾被截断（即"后冗余"）。
 * 阈值与音量/麦克风相关，可按需微调：识别不到轻声→调低，噪声误触发→调高。
 */
const FRAME_MS = 100 // 每帧时长（worklet 缓冲 100ms）
const RMS_START = 0.015 // 起说阈值：连续达到若干帧判定开始说话
const RMS_STOP = 0.004 // 静音阈值：低于此累计静音计时（滞回，低于起说阈值）
const START_FRAMES = 2 // 连续达到起说阈值的帧数（防瞬时噪声误触发）
const PREROLL_FRAMES = 3 // 前冗余：进入说话态时补发最近的帧数（~300ms），防起始截断
const IDLE_STOP_MS = 2000 // 后冗余/停发阈值：连续静音超过此值才停发（须 > 服务端 silence）

/**
 * 实时语音识别（ASR）composable。
 * <p>
 * 麦克风 → AudioContext(16kHz) → AudioWorklet(PCM16) → WebSocket(/ws/ai/asr) → DashScope 实时识别。
 * 增量结果以 { text, sentenceId, final } 推送：final=true 的句子追加到 finalText，
 * 未完成的句子作为 interimText 实时显示。
 */
export function useAsrStream() {
  const connecting = ref(false)
  const recording = ref(false)
  const finalText = ref('')
  const interimText = ref('')
  const errorMsg = ref('')

  const displayText = computed(() => finalText.value + interimText.value)

  let ws: WebSocket | null = null
  let audioCtx: AudioContext | null = null
  let mediaStream: MediaStream | null = null
  let sourceNode: MediaStreamAudioSourceNode | null = null
  let workletNode: AudioWorkletNode | null = null
  let finishTimer: ReturnType<typeof setTimeout> | null = null
  // —— 前端 RMS VAD 状态 ——
  let vadState: 'idle' | 'active' = 'idle'
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
   * RMS VAD 帧处理：
   * - idle 态：仅滚动缓冲前冗余帧并检测起说；连续 START_FRAMES 帧超过 RMS_START 即进入说话态，补发前冗余。
   * - active 态：持续上行（句间短停顿一并发送，交由服务端 VAD 按 1500ms 断句）；
   *   连续静音超过 IDLE_STOP_MS 才停发省流并回到 idle（IDLE_STOP_MS > 服务端断句窗口，保证句尾不被截断）。
   */
  function handleFrame(rms: number, pcm: ArrayBuffer) {
    if (vadState === 'idle') {
      preroll.push(pcm)
      if (preroll.length > PREROLL_FRAMES) preroll.shift()
      if (rms >= RMS_START) {
        if (++vadStartCount >= START_FRAMES) {
          vadState = 'active'
          vadIdleMs = 0
          vadStartCount = 0
          for (const b of preroll) sendFrame(b) // 补发前冗余（含起始帧）
          preroll = []
        }
      } else {
        vadStartCount = 0
      }
    } else {
      sendFrame(pcm)
      if (rms < RMS_STOP) {
        vadIdleMs += FRAME_MS
        if (vadIdleMs >= IDLE_STOP_MS) {
          vadState = 'idle'
          vadIdleMs = 0
          preroll = []
        }
      } else {
        vadIdleMs = 0
      }
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
    vadState = 'idle'
    preroll = []
    vadStartCount = 0
    vadIdleMs = 0

    try {
      // 1. 麦克风采集（单声道）
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }
      })

      // 2. 16kHz AudioContext + PCM 编码 worklet
      audioCtx = new AudioContext({ sampleRate: 16000 })
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
      // 经 Nginx 统一 /api 前缀反向代理到后端（与 HTTP 请求同源同前缀）
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
      errorMsg.value = e?.message ?? '无法启动麦克风或建立连接'
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
      // 等待服务端返回最终结果与 {done} 后由 onmessage 关闭；6s 兜底（长语音最终转写可能耗时）
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

  return { connecting, recording, finalText, interimText, displayText, errorMsg, start, stop }
}
