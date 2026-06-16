import workletUrl from '@/utils/audio/pcm-encoder-worklet.js?url'
import { useLoginInfoStore } from '@/stores/login-info'
import { useBaseURL } from '@/composables/useBaseUrl'

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
        if (ws && ws.readyState === WebSocket.OPEN) ws.send(e.data as ArrayBuffer)
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
          if (data.done) return
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
    // 通知后端音频结束，稍后关闭以接收最后的识别结果
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send('end')
      } catch {
        /* ignore */
      }
      const w = ws
      ws = null
      setTimeout(() => {
        try {
          w.close()
        } catch {
          /* ignore */
        }
      }, 500)
    } else if (ws) {
      try {
        ws.close()
      } catch {
        /* ignore */
      }
      ws = null
    }
    cleanupAudio()
  }

  onUnmounted(() => {
    if (ws) {
      try {
        ws.send('end')
      } catch {
        /* ignore */
      }
      try {
        ws.close()
      } catch {
        /* ignore */
      }
      ws = null
    }
    cleanupAudio()
  })

  return { connecting, recording, finalText, interimText, displayText, errorMsg, start, stop }
}
