import workletUrl from '@/utils/audio/pcm-encoder-worklet.js?url'
import { useLoginInfoStore } from '@/stores/login-info'
import { useBaseURL } from '@/composables/useBaseUrl'
import type { LiveTranslateSettings } from './useLiveTranslateSettings'

const FRAME_MS = 100
/** 翻译输出音频采样率（DashScope 输出 pcm24 = 24kHz） */
const OUTPUT_SAMPLE_RATE = 24000

/**
 * 单次翻译单元：一段语音的源语言转写 + 目标语言翻译 + 可选音频。
 * 以 responseId（翻译响应 ID）为主键，itemId（源语言转写 ID）为辅键进行聚合。
 */
export interface TranslationUnit {
  /** 主键（responseId 或 itemId 当翻译尚未到达时） */
  id: string
  itemId?: string
  responseId?: string
  /** 源语言文本（最终结果或流式文本，含 stash） */
  sourceText: string
  sourceFinal: boolean
  sourceLanguage?: string
  /** 翻译文本（最终结果或流式文本，含 stash） */
  translationText: string
  translationFinal: boolean
  /** 翻译翻译 stash（未确认尾部，用于显示光标） */
  translationStash: string
  /** 是否有翻译音频 */
  hasAudio: boolean
  /** Base64 PCM 音频块 */
  audioChunks: string[]
  audioDone: boolean
}

function makeUnit(overrides: Partial<TranslationUnit> & { id: string }): TranslationUnit {
  return {
    itemId: undefined,
    responseId: undefined,
    sourceText: '',
    sourceFinal: false,
    sourceLanguage: undefined,
    translationText: '',
    translationFinal: false,
    translationStash: '',
    hasAudio: false,
    audioChunks: [],
    audioDone: false,
    ...overrides
  }
}

/**
 * 实时语音翻译（LiveTranslate）composable。
 * <p>
 * 麦克风 → AudioContext(16kHz) → AudioWorklet(PCM16) → WebSocket(/ws/ai/live-translate)
 * → DashScope 实时翻译 → 翻译文本 + 音频回调。
 * 设备与 VAD 参数来自传入的响应式 settings（录音中调参即时生效）。
 */
export function useLiveTranslateStream(settings: LiveTranslateSettings) {
  const connecting = ref(false)
  const recording = ref(false)
  const units = ref<TranslationUnit[]>([])
  const errorMsg = ref('')
  const currentRms = ref(0)
  const vadPhase = ref<'idle' | 'starting' | 'active' | 'trailing'>('idle')

  const translationCount = computed(() => units.value.filter((u) => !!u.translationText).length)

  // ——— 翻译单元状态管理 ———

  function findByItemId(itemId: string): TranslationUnit | undefined {
    return units.value.find((u) => u.itemId === itemId)
  }

  function findByResponseId(responseId: string): TranslationUnit | undefined {
    return units.value.find((u) => u.responseId === responseId)
  }

  function upsertSource(itemId: string, text: string, isFinal: boolean, language?: string) {
    let unit = findByItemId(itemId)
    if (!unit) {
      // 兜底：翻译可能先于源文本到达（DashScope 翻译事件的 item_id 是输出项 ID，与源语言转写的输入项 ID 不同），
      // 按到达顺序找最早一个有 responseId 且尚无源语言文本的待匹配翻译单元（FIFO）
      unit = units.value.find((u) => u.responseId && u.sourceText === '' && !u.sourceFinal) ?? undefined
      if (unit) {
        unit.itemId = itemId
        unit.sourceText = text
        if (language) unit.sourceLanguage = language
        if (isFinal) unit.sourceFinal = true
      } else {
        unit = makeUnit({ id: itemId, itemId, sourceText: text, sourceFinal: isFinal, sourceLanguage: language })
        units.value.push(unit)
      }
    } else {
      unit.sourceText = text
      if (language) unit.sourceLanguage = language
      if (isFinal) unit.sourceFinal = true
    }
  }

  /** 模型撤回源语言识别（空 transcript）：有翻译的单元只清空源文本；纯源文本单元整体移除 */
  function revokeSource(itemId: string) {
    const idx = units.value.findIndex((u) => u.itemId === itemId)
    if (idx === -1) return
    const unit = units.value[idx]
    if (!unit) return
    if (unit.translationText) {
      // 已有翻译内容 → 仅清空源语言部分
      unit.sourceText = ''
      unit.sourceFinal = true
    } else {
      // 纯源语言单元 → 整体移除
      units.value.splice(idx, 1)
    }
  }

  function upsertTranslation(
    responseId: string,
    itemId: string | undefined,
    text: string,
    stash: string,
    isFinal: boolean
  ) {
    // 优先用 responseId 找，没有则用 itemId 尝试直接关联源语言单元
    let unit = findByResponseId(responseId)
    if (!unit && itemId) {
      unit = findByItemId(itemId)
    }
    // 兜底：DashScope 翻译事件的 item_id 是输出项 ID（与源语言转写的输入项 ID 不同，无法直接关联），
    // 按到达顺序找最早一个尚无 responseId 的待匹配源语言单元（FIFO）
    if (!unit) {
      unit = units.value.find((u) => !u.responseId) ?? undefined
    }
    if (!unit) {
      unit = makeUnit({
        id: responseId,
        itemId,
        responseId,
        translationText: text,
        translationStash: stash,
        translationFinal: isFinal,
        hasAudio: settings.modalities.includes('audio')
      })
      units.value.push(unit)
    } else {
      if (!unit.responseId) unit.responseId = responseId
      if (itemId && !unit.itemId) unit.itemId = itemId
      unit.translationText = text
      unit.translationStash = stash
      unit.hasAudio = settings.modalities.includes('audio')
      if (isFinal) {
        unit.translationFinal = true
        unit.translationStash = ''
      }
    }
  }

  function appendAudio(responseId: string, delta: string) {
    const unit = findByResponseId(responseId)
    if (unit) {
      unit.hasAudio = true
      unit.audioChunks.push(delta)
      // 同声传译模式：音频块实时流式播放，不等待整段完成
      if (settings.liveInterpretation && settings.modalities.includes('audio') && outputAudioCtx) {
        scheduleAudioChunk(delta)
      }
    }
  }

  function markAudioDone(responseId: string) {
    const unit = findByResponseId(responseId)
    if (unit) {
      unit.audioDone = true
      // 非同声传译模式：等待整段音频收集完毕后统一播放
      if (!settings.liveInterpretation && settings.modalities.includes('audio')) {
        nextTick(() => playUnitAudio(unit!))
      }
    }
  }

  // ——— 翻译音频播放 ———

  let outputAudioCtx: AudioContext | null = null
  let nextPlayTime = 0

  function decodePcm16ToAudioBuffer(chunks: string[]): AudioBuffer | null {
    if (!chunks.length || !outputAudioCtx) return null
    try {
      // 解码所有 base64 块 → Int16Array
      let totalSamples = 0
      const views: DataView[] = []
      for (const b64 of chunks) {
        const binary = atob(b64)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
        views.push(new DataView(bytes.buffer))
        totalSamples += Math.floor(binary.length / 2)
      }
      const audioBuffer = outputAudioCtx.createBuffer(1, totalSamples, OUTPUT_SAMPLE_RATE)
      const channel = audioBuffer.getChannelData(0)
      let offset = 0
      for (const view of views) {
        for (let i = 0; i + 1 < view.byteLength; i += 2) {
          channel[offset++] = view.getInt16(i, true) / 32768
        }
      }
      return audioBuffer
    } catch (e) {
      console.warn('[LiveTranslate] PCM16 解码失败', e)
      return null
    }
  }

  function playUnitAudio(unit: TranslationUnit) {
    if (!unit.audioChunks.length || !outputAudioCtx) return
    const audioBuffer = decodePcm16ToAudioBuffer(unit.audioChunks)
    if (!audioBuffer) return
    if (outputAudioCtx.state === 'suspended') outputAudioCtx.resume()
    const now = outputAudioCtx.currentTime
    if (nextPlayTime < now) nextPlayTime = now
    const source = outputAudioCtx.createBufferSource()
    source.buffer = audioBuffer
    source.connect(outputAudioCtx.destination)
    source.start(nextPlayTime)
    nextPlayTime += audioBuffer.duration
  }

  /** 同声传译模式：立即将单个 base64 PCM 块解码并排队播放 */
  function scheduleAudioChunk(delta: string) {
    if (!outputAudioCtx) return
    const audioBuffer = decodePcm16ToAudioBuffer([delta])
    if (!audioBuffer || audioBuffer.length === 0) return
    if (outputAudioCtx.state === 'suspended') outputAudioCtx.resume()
    const now = outputAudioCtx.currentTime
    if (nextPlayTime < now) nextPlayTime = now
    const source = outputAudioCtx.createBufferSource()
    source.buffer = audioBuffer
    source.connect(outputAudioCtx.destination)
    source.start(nextPlayTime)
    nextPlayTime += audioBuffer.duration
  }

  // ——— 音频输入管线 (同 useAsrStream) ———

  let ws: WebSocket | null = null
  let audioCtx: AudioContext | null = null
  let mediaStream: MediaStream | null = null
  let sourceNode: MediaStreamAudioSourceNode | null = null
  let workletNode: AudioWorkletNode | null = null
  let finishTimer: ReturnType<typeof setTimeout> | null = null
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

  function sendFrame(buf: ArrayBuffer) {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(buf)
  }

  function handleFrame(rms: number, pcm: ArrayBuffer) {
    currentRms.value = rms
    const v = settings.vad
    if (settings.alwaysSend) sendFrame(pcm)
    if (vadPhase.value === 'idle' || vadPhase.value === 'starting') {
      preroll.push(pcm)
      while (preroll.length > v.prerollFrames) preroll.shift()
      if (rms >= v.rmsStart) {
        vadPhase.value = 'starting'
        if (++vadStartCount >= v.startFrames) {
          vadPhase.value = 'active'
          vadIdleMs = 0
          vadStartCount = 0
          if (!settings.alwaysSend) for (const b of preroll) sendFrame(b)
          preroll = []
        }
      } else {
        vadStartCount = 0
        vadPhase.value = 'idle'
      }
    } else {
      if (!settings.alwaysSend) sendFrame(pcm)
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

  async function acquireMic(): Promise<MediaStream> {
    const base: MediaTrackConstraints = { channelCount: 1, echoCancellation: true, noiseSuppression: true }
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
      errorMsg.value = '请先选择翻译模型'
      return
    }
    errorMsg.value = ''
    units.value = []
    connecting.value = true
    vadPhase.value = 'idle'
    preroll = []
    vadStartCount = 0
    vadIdleMs = 0
    // 在用户手势上下文中创建输出 AudioContext（避免自动播放策略拦截）
    try {
      outputAudioCtx?.close()
    } catch {
      /* ignore */
    }
    outputAudioCtx = new AudioContext()
    nextPlayTime = 0

    try {
      mediaStream = await acquireMic()
      audioCtx = new AudioContext({ sampleRate: 16000 })
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
      const mute = audioCtx.createGain()
      mute.gain.value = 0
      sourceNode.connect(workletNode)
      workletNode.connect(mute)
      mute.connect(audioCtx.destination)

      const token = useLoginInfoStore().loginToken
      const proto = location.protocol === 'https:' ? 'wss' : 'ws'
      const apiBase = useBaseURL()
      const url = `${proto}://${location.host}${apiBase}ws/ai/live-translate?token=${encodeURIComponent(token)}&configKey=${encodeURIComponent(configKey)}`
      ws = new WebSocket(url)
      ws.binaryType = 'arraybuffer'

      ws.onopen = () => {
        connecting.value = false
        recording.value = true
        try {
          const params: Record<string, unknown> = {
            targetLanguage: settings.targetLanguage || 'en',
            voice: settings.voice || 'Tina',
            modalities: settings.modalities.length ? settings.modalities : ['text', 'audio'],
            enableSourceTranscription: settings.enableSourceTranscription,
            enableVoiceClone: settings.enableVoiceClone
          }
          if (settings.sourceLanguage) params.sourceLanguage = settings.sourceLanguage
          if (settings.enableVoiceClone && settings.voiceCloneFrequency) {
            params.voiceCloneFrequency = settings.voiceCloneFrequency
          }
          ws?.send(JSON.stringify({ type: 'config', params }))
        } catch {
          /* ignore */
        }
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
            closeWs()
            return
          }
          const type = data.type as string | undefined
          if (type === 'source') {
            // 处理模型撤回（empty text + removed=true + final=true）
            if (data.removed && data.itemId) {
              revokeSource(data.itemId)
            } else {
              upsertSource(data.itemId, data.text ?? '', !!data.final, data.language)
            }
          } else if (type === 'translation') {
            upsertTranslation(data.responseId, data.itemId, data.text ?? '', data.stash ?? '', !!data.final)
          } else if (type === 'audio') {
            appendAudio(data.responseId, data.delta)
          } else if (type === 'audioDone') {
            markAudioDone(data.responseId)
          }
        } catch {
          /* 忽略非 JSON */
        }
      }

      ws.onerror = () => {
        if (!errorMsg.value) errorMsg.value = '语音翻译连接错误'
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
      closeWs()
      try {
        outputAudioCtx?.close()
      } catch {
        /* ignore */
      }
      outputAudioCtx = null
    }
  }

  function stop() {
    recording.value = false
    cleanupAudio()
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send('end')
      } catch {
        /* ignore */
      }
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
    try {
      outputAudioCtx?.close()
    } catch {
      /* ignore */
    }
  })

  return {
    connecting,
    recording,
    units,
    translationCount,
    errorMsg,
    currentRms,
    vadPhase,
    start,
    stop,
    playUnitAudio
  }
}