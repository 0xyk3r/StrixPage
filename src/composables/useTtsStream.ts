import { useLoginInfoStore } from '@/stores/login-info'
import { useBaseURL } from '@/composables/useBaseUrl'

/**
 * TTS WebSocket 双向流式合成 composable。
 * <p>
 * 浏览器流式上行文本 → 后端代理 → DashScope（run/continue/finish-task）→ 音频二进制帧下行 →
 * Web Audio API（AudioContext + PCM 队列化调度）实时播放。
 * <p>
 * 为支持低延迟实时播放，流式模式强制使用 PCM 格式 + 固定采样率（由 sampleRate 指定）。
 * 收到的 PCM 块同时累积，结束后可拼装为 WAV 供下载。
 */
export function useTtsStream() {
  const connecting = ref(false)
  /** 会话进行中（已建立上游、可发送文本） */
  const active = ref(false)
  /** 正在播放音频 */
  const playing = ref(false)
  const errorMsg = ref('')

  let ws: WebSocket | null = null
  let audioCtx: AudioContext | null = null
  /** 下一个音频块的调度起始时间（AudioContext 时间轴） */
  let nextStartTime = 0
  let sampleRate = 24000
  /** 累积的全部 PCM 块（用于结束后拼装 WAV 下载） */
  let pcmChunks: Int16Array[] = []
  let scheduledSources: AudioBufferSourceNode[] = []
  /** 待播放的 PCM 队列（未完整成块的尾字节缓存） */
  let leftover = new Uint8Array(0)

  /** 完整合成音频的 WAV Blob（结束后可用） */
  const audioBlob = ref<Blob | null>(null)

  function ensureAudioCtx() {
    if (!audioCtx) {
      audioCtx = new AudioContext({ sampleRate })
      nextStartTime = audioCtx.currentTime
    }
    // 浏览器自动播放策略可能使其挂起，需在用户手势内 resume
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {
        /* ignore */
      })
    }
  }

  /** 将一段 PCM16（小端）字节调度播放，并累积用于下载 */
  function enqueuePcm(bytes: Uint8Array) {
    // 合并上次残留的不足 2 字节的尾部
    let data = bytes
    if (leftover.length > 0) {
      const merged = new Uint8Array(leftover.length + bytes.length)
      merged.set(leftover, 0)
      merged.set(bytes, leftover.length)
      data = merged
      leftover = new Uint8Array(0)
    }
    // PCM16 需偶数字节，保留奇数尾字节到下次
    const usableLen = data.length - (data.length % 2)
    if (usableLen < data.length) {
      leftover = data.slice(usableLen)
      data = data.slice(0, usableLen)
    }
    if (data.length === 0) return

    const sampleCount = data.length / 2
    const int16 = new Int16Array(sampleCount)
    const view = new DataView(data.buffer, data.byteOffset, data.length)
    for (let i = 0; i < sampleCount; i++) {
      int16[i] = view.getInt16(i * 2, true)
    }
    pcmChunks.push(int16)

    ensureAudioCtx()
    const ctx = audioCtx!
    const buffer = ctx.createBuffer(1, sampleCount, sampleRate)
    const channel = buffer.getChannelData(0)
    for (let i = 0; i < sampleCount; i++) {
      channel[i] = int16[i]! / 32768
    }
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    const startAt = Math.max(ctx.currentTime, nextStartTime)
    source.start(startAt)
    nextStartTime = startAt + buffer.duration
    playing.value = true
    scheduledSources.push(source)
    source.onended = () => {
      scheduledSources = scheduledSources.filter((s) => s !== source)
      if (scheduledSources.length === 0 && !active.value) {
        playing.value = false
      }
    }
  }

  /** 将累积的 PCM 拼装为 WAV Blob */
  function buildWav(): Blob | null {
    if (pcmChunks.length === 0) return null
    const total = pcmChunks.reduce((sum, c) => sum + c.length, 0)
    const pcm = new Int16Array(total)
    let offset = 0
    for (const c of pcmChunks) {
      pcm.set(c, offset)
      offset += c.length
    }
    const dataSize = pcm.length * 2
    const buffer = new ArrayBuffer(44 + dataSize)
    const view = new DataView(buffer)
    const writeStr = (off: number, s: string) => {
      for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i))
    }
    writeStr(0, 'RIFF')
    view.setUint32(4, 36 + dataSize, true)
    writeStr(8, 'WAVE')
    writeStr(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true) // PCM
    view.setUint16(22, 1, true) // mono
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeStr(36, 'data')
    view.setUint32(40, dataSize, true)
    new Int16Array(buffer, 44).set(pcm)
    return new Blob([buffer], { type: 'audio/wav' })
  }

  /**
   * 建立 WebSocket 会话。
   *
   * @param configKey TTS 模型配置 Key
   * @param voiceId   音色 ID
   * @param params    会话级参数（format 将被强制为 pcm）
   * @param rate      采样率（默认 24000）
   */
  function connect(
    configKey: string,
    voiceId: string,
    params: Record<string, unknown>,
    rate = 24000
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (active.value || connecting.value) {
        resolve()
        return
      }
      if (!configKey) {
        errorMsg.value = '请先选择 TTS 模型'
        reject(new Error(errorMsg.value))
        return
      }
      if (!voiceId) {
        errorMsg.value = '请先选择音色'
        reject(new Error(errorMsg.value))
        return
      }
      errorMsg.value = ''
      audioBlob.value = null
      pcmChunks = []
      leftover = new Uint8Array(0)
      sampleRate = rate
      connecting.value = true
      // 在用户手势（按钮点击）内预创建并 resume AudioContext。
      // 否则首个音频帧在异步 onmessage 中创建 AudioContext，会被浏览器自动播放策略挂起，
      // 无法即时播放（与服务端按句缓存无关：服务端在收到完整句子/句号后即返回音频，属正常协议行为）。
      ensureAudioCtx()

      const token = useLoginInfoStore().loginToken
      const proto = location.protocol === 'https:' ? 'wss' : 'ws'
      const apiBase = useBaseURL()
      const url = `${proto}://${location.host}${apiBase}ws/ai/tts?token=${encodeURIComponent(token)}&configKey=${encodeURIComponent(configKey)}`
      ws = new WebSocket(url)
      ws.binaryType = 'arraybuffer'

      ws.onopen = () => {
        // 强制 PCM 流式播放
        const streamParams = { ...params, format: 'pcm', sampleRate }
        ws?.send(JSON.stringify({ type: 'config', voiceId, params: streamParams }))
      }
      ws.onmessage = (ev: MessageEvent) => {
        if (typeof ev.data === 'string') {
          try {
            const msg = JSON.parse(ev.data)
            if (msg.error) {
              errorMsg.value = msg.error
              connecting.value = false
              close()
              reject(new Error(msg.error))
              return
            }
            if (msg.type === 'started') {
              connecting.value = false
              active.value = true
              resolve()
              return
            }
            if (msg.done) {
              active.value = false
              audioBlob.value = buildWav()
              if (scheduledSources.length === 0) playing.value = false
              closeWs()
            }
          } catch {
            /* 忽略非 JSON */
          }
        } else {
          enqueuePcm(new Uint8Array(ev.data as ArrayBuffer))
        }
      }
      ws.onerror = () => {
        if (!errorMsg.value) errorMsg.value = '语音合成连接错误'
        connecting.value = false
      }
      ws.onclose = () => {
        connecting.value = false
        active.value = false
      }
    })
  }

  /** 流式追加一段文本 */
  function sendText(text: string) {
    if (ws && ws.readyState === WebSocket.OPEN && text) {
      ws.send(JSON.stringify({ type: 'text', text }))
    }
  }

  /** 通知文本发送完毕，等待服务端冲刷剩余音频 */
  function finishInput() {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'finish' }))
    }
  }

  function closeWs() {
    if (ws) {
      try {
        ws.close()
      } catch {
        /* ignore */
      }
      ws = null
    }
  }

  /** 停止并清理（中止播放与连接） */
  function close() {
    active.value = false
    connecting.value = false
    scheduledSources.forEach((s) => {
      try {
        s.stop()
      } catch {
        /* ignore */
      }
    })
    scheduledSources = []
    if (audioCtx) {
      try {
        audioCtx.close()
      } catch {
        /* ignore */
      }
      audioCtx = null
    }
    playing.value = false
    closeWs()
  }

  onUnmounted(() => close())

  return {
    connecting,
    active,
    playing,
    errorMsg,
    audioBlob,
    connect,
    sendText,
    finishInput,
    close
  }
}

