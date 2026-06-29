/** 前端 RMS VAD 可调参数 */
export interface AsrVadParams {
  /** 起说阈值：音量连续高于此值判定开始说话 */
  rmsStart: number
  /** 静音阈值：音量低于此值累计静音（滞回，应 < rmsStart） */
  rmsStop: number
  /** 起说帧数：连续达到起说阈值的帧数（防瞬时噪声误触发） */
  startFrames: number
  /** 前冗余帧数：进入说话态时补发最近帧数（防起始截断），每帧约 100ms */
  prerollFrames: number
  /** 停发阈值（ms）：连续静音超过此值才停发；建议 > 服务端断句窗口（400ms） */
  idleStopMs: number
}

/** ASR 页面设置（设备 + VAD） */
export interface AsrSettings {
  /** 选中的麦克风 deviceId，'' 表示系统默认 */
  deviceId: string
  /**
   * 诊断开关：持续上行全部音频，绕过 RMS VAD 发送门控（VAD 仍驱动可视化）。
   * 用于区分「前端 VAD 漏发导致丢字/丢句」与「上游模型丢字」：开启后若仍丢字，则为上游模型行为。
   */
  alwaysSend: boolean
  vad: AsrVadParams
}

/** VAD 参数默认值（与后端 server_vad silence=400ms 协同） */
export const DEFAULT_VAD: AsrVadParams = {
  rmsStart: 0.015,
  rmsStop: 0.004,
  startFrames: 2,
  prerollFrames: 3,
  idleStopMs: 2000
}

const STORAGE_KEY = 'strix-asr-settings'

function loadSettings(): AsrSettings {
  const fallback: AsrSettings = { deviceId: '', alwaysSend: false, vad: { ...DEFAULT_VAD } }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<AsrSettings>
    return {
      deviceId: typeof parsed.deviceId === 'string' ? parsed.deviceId : '',
      alwaysSend: parsed.alwaysSend === true,
      vad: { ...DEFAULT_VAD, ...parsed.vad }
    }
  } catch {
    return fallback
  }
}

/**
 * ASR 设置（设备选择 + VAD 参数）单一数据源。
 * 返回的 reactive 对象在页面、useAsrStream、各子组件间共享引用，
 * 改动即生效并自动持久化到 localStorage。
 */
export function useAsrSettings() {
  const settings = reactive<AsrSettings>(loadSettings())

  watch(
    settings,
    (val) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
      } catch {
        /* 隐私模式/配额不可用时退化为仅内存态 */
      }
    },
    { deep: true }
  )

  /** 仅还原 VAD 参数为默认值，保留已选设备 */
  function reset() {
    Object.assign(settings.vad, DEFAULT_VAD)
  }

  return { settings, reset }
}
