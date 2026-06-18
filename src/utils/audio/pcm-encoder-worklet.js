// AudioWorklet 处理器：将麦克风 Float32 采样转换为 16-bit PCM（小端），
// 缓冲约 100ms（1600 采样 @ 16kHz）后通过 port 回传主线程，由主线程经 WebSocket 上行。
// 同时计算该帧的 RMS（基于 Float32，范围 [0,1]），供主线程做 RMS VAD（说话判断）。
// 回传消息格式：{ rms: number, pcm: ArrayBuffer }（pcm 走 transfer 转移所有权，避免拷贝）。
// 该文件以 `?url` 资源方式加载（addModule），不可包含 ESM import。
class PcmEncoder extends AudioWorkletProcessor {
  constructor() {
    super()
    this._chunks = []
    this._count = 0
    this._target = 1600 // 100ms @ 16kHz
  }

  process(inputs) {
    const input = inputs[0]
    const channel = input && input[0]
    if (channel && channel.length) {
      this._chunks.push(channel.slice(0))
      this._count += channel.length
      if (this._count >= this._target) {
        const pcm = new Int16Array(this._count)
        let offset = 0
        let sumSq = 0
        for (const c of this._chunks) {
          for (let i = 0; i < c.length; i++) {
            let s = c[i]
            s = s < -1 ? -1 : s > 1 ? 1 : s
            sumSq += s * s
            pcm[offset++] = s < 0 ? s * 0x8000 : s * 0x7fff
          }
        }
        const rms = Math.sqrt(sumSq / this._count)
        // 转移 ArrayBuffer 所有权，避免拷贝
        this.port.postMessage({ rms, pcm: pcm.buffer }, [pcm.buffer])
        this._chunks = []
        this._count = 0
      }
    }
    return true
  }
}

registerProcessor('pcm-encoder', PcmEncoder)
