import { sm3 } from 'sm-crypto'
import { encrypt } from '@/utils/crypto'
import { useLoginInfoStore } from '@/stores/login-info'
import { useBaseURL } from '@/composables/useBaseUrl'

/**
 * TTS HTTP 流式合成 composable（fetch + SSE）。
 * <p>
 * 发送完整文本，服务端以 SSE 逐段返回 Base64 音频块（event: audio），最后 event: done。
 * 请求体走 SM2+SM4 加密 + SM3 签名（与 AI 对话 SSE 一致），响应明文流。
 * 为支持流式播放，强制 PCM 格式 + 固定采样率，经 Web Audio API 队列化调度播放。
 */
export function useTtsHttpStream() {
  const synthesizing = ref(false)
  const playing = ref(false)
  const errorMsg = ref('')
  const audioBlob = ref<Blob | null>(null)

  let audioCtx: AudioContext | null = null
  let nextStartTime = 0
  let sampleRate = 24000
  let pcmChunks: Int16Array[] = []
  let scheduledSources: AudioBufferSourceNode[] = []
  let abortController: AbortController | null = null
  /** 待播放的 PCM 队列（未完整成块的尾字节缓存，跨段拼接避免丢字节） */
  let leftover = new Uint8Array(0)

  function ensureAudioCtx() {
    if (!audioCtx) {
      audioCtx = new AudioContext({ sampleRate })
      nextStartTime = audioCtx.currentTime
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {
        /* ignore */
      })
    }
  }

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
    const sampleCount = usableLen / 2
    const int16 = new Int16Array(sampleCount)
    const view = new DataView(data.buffer, data.byteOffset, usableLen)
    for (let i = 0; i < sampleCount; i++) int16[i] = view.getInt16(i * 2, true)
    pcmChunks.push(int16)

    ensureAudioCtx()
    const ctx = audioCtx!
    const buffer = ctx.createBuffer(1, sampleCount, sampleRate)
    const channel = buffer.getChannelData(0)
    for (let i = 0; i < sampleCount; i++) channel[i] = int16[i]! / 32768
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
      if (scheduledSources.length === 0 && !synthesizing.value) playing.value = false
    }
  }

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
    const buf = new ArrayBuffer(44 + dataSize)
    const view = new DataView(buf)
    const writeStr = (off: number, s: string) => {
      for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i))
    }
    writeStr(0, 'RIFF')
    view.setUint32(4, 36 + dataSize, true)
    writeStr(8, 'WAVE')
    writeStr(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeStr(36, 'data')
    view.setUint32(40, dataSize, true)
    new Int16Array(buf, 44).set(pcm)
    return new Blob([buf], { type: 'audio/wav' })
  }

  function base64ToBytes(b64: string): Uint8Array {
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return bytes
  }

  /**
   * 开始 HTTP 流式合成。
   *
   * @param configKey TTS 模型配置 Key
   * @param text      完整文本
   * @param voiceId   音色 ID
   * @param params    会话级参数（format 将被强制为 pcm）
   * @param rate      采样率（默认 24000）
   */
  async function synthesize(
    configKey: string,
    text: string,
    voiceId: string,
    params: Record<string, unknown>,
    rate = 24000
  ): Promise<void> {
    if (synthesizing.value) return
    if (!configKey) {
      errorMsg.value = '请先选择 TTS 模型'
      return
    }
    if (!voiceId) {
      errorMsg.value = '请先选择音色'
      return
    }
    errorMsg.value = ''
    audioBlob.value = null
    pcmChunks = []
    leftover = new Uint8Array(0)
    sampleRate = rate
    synthesizing.value = true
    // 在用户手势内预创建并 resume AudioContext，确保流式音频可即时播放
    ensureAudioCtx()

    const streamParams = { ...params, format: 'pcm', sampleRate }
    const body = {
      configKey,
      text,
      voiceId,
      params: JSON.stringify(streamParams)
    }

    const token = useLoginInfoStore().loginToken
    const timestamp = Date.now().toString()
    const signUrl = '/system/ai/tts/synthesize/stream'
    const fetchUrl = `${useBaseURL()}system/ai/tts/synthesize/stream`
    const bodyString = JSON.stringify(body)
    const sign = sm3(bodyString + '|' + signUrl + '|' + timestamp)
    const encBody = encrypt(body)

    abortController = new AbortController()
    try {
      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          timestamp,
          sign
        },
        body: JSON.stringify(encBody),
        signal: abortController.signal
      })
      const contentType = response.headers.get('content-type') ?? ''
      if (!response.ok || !contentType.includes('text/event-stream')) {
        try {
          const data = await response.json()
          errorMsg.value = data?.msg ?? `请求失败 (HTTP ${response.status})`
        } catch {
          errorMsg.value = `请求失败 (HTTP ${response.status})`
        }
        synthesizing.value = false
        return
      }
      await consumeStream(response)
    } catch (err: any) {
      if (err?.name !== 'AbortError') errorMsg.value = err?.message ?? '网络请求失败'
    } finally {
      synthesizing.value = false
      audioBlob.value = buildWav()
      if (scheduledSources.length === 0) playing.value = false
    }
  }

  async function consumeStream(response: Response): Promise<void> {
    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let currentEvent = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      while (true) {
        const nlIndex = buffer.indexOf('\n')
        if (nlIndex === -1) break
        const line = buffer.slice(0, nlIndex).trimEnd()
        buffer = buffer.slice(nlIndex + 1)
        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim()
        } else if (line.startsWith('data:')) {
          const raw = line.slice(5).trim()
          if (!raw) continue
          if (currentEvent === 'audio') {
            try {
              enqueuePcm(base64ToBytes(raw))
            } catch {
              /* ignore */
            }
          } else if (currentEvent === 'error') {
            errorMsg.value = raw || '合成失败'
          }
          // done 事件无需特殊处理，循环自然结束
        }
      }
    }
  }

  function stop() {
    abortController?.abort()
    abortController = null
    leftover = new Uint8Array(0)
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
    synthesizing.value = false
  }

  onUnmounted(() => stop())

  return { synthesizing, playing, errorMsg, audioBlob, synthesize, stop }
}
