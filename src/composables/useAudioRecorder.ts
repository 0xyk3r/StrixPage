export interface AudioRecorderOptions {
  maxDuration?: number
  deviceId?: string
}

export function useAudioRecorder(options: AudioRecorderOptions = {}) {
  const { maxDuration = 120, deviceId } = options

  const isRecording = ref(false)
  const duration = ref(0)
  const audioBlob = ref<Blob | null>(null)
  const error = ref<string | null>(null)

  let mediaRecorder: MediaRecorder | null = null
  let stream: MediaStream | null = null
  let chunks: Blob[] = []
  let timer: ReturnType<typeof setInterval> | null = null
  let startTime = 0

  async function start() {
    error.value = null
    audioBlob.value = null
    duration.value = 0
    chunks = []

    try {
      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true
      }
      stream = await navigator.mediaDevices.getUserMedia(constraints)
    } catch (e: any) {
      if (e.name === 'OverconstrainedError' && deviceId) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      } else {
        error.value = e.message || '无法获取麦克风权限'
        return
      }
    }

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm'
    mediaRecorder = new MediaRecorder(stream!, { mimeType })

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    mediaRecorder.start(1000)
    isRecording.value = true
    startTime = Date.now()

    timer = setInterval(() => {
      duration.value = Math.floor((Date.now() - startTime) / 1000)
      if (duration.value >= maxDuration) stop()
    }, 200)
  }

  async function stop(): Promise<Blob | null> {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') return null
    return new Promise((resolve) => {
      mediaRecorder!.onstop = () => {
        const blob = new Blob(chunks, { type: mediaRecorder!.mimeType })
        audioBlob.value = blob
        cleanup()
        resolve(blob)
      }
      mediaRecorder!.stop()
      isRecording.value = false
    })
  }

  function cancel() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop()
    audioBlob.value = null
    chunks = []
    isRecording.value = false
    cleanup()
  }

  function cleanup() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      stream = null
    }
    mediaRecorder = null
  }

  onUnmounted(cleanup)

  return { isRecording, duration, audioBlob, error, start, stop, cancel }
}
