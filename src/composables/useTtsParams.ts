import type { TtsParams } from '@/api/ai'

const STORAGE_PREFIX = 'strix-tts-params:'

function load(configKey: string): TtsParams {
  if (!configKey) return {}
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + configKey)
    return raw ? (JSON.parse(raw) as TtsParams) : {}
  } catch {
    return {}
  }
}

/**
 * 会话级 TTS 合成参数单一数据源（按 configKey 维度持久化）。
 * 切换模型时重载该模型的会话参数；setDefaults 用模型配置默认值预填尚未设置的字段。
 * 注意：voice（音色）独立于本参数管理（由音色选择器控制），本对象不持久化 voice。
 */
export function useTtsParams() {
  const params = reactive<TtsParams>({})
  let currentKey = ''

  /** 切换到某模型：加载其已存会话参数（覆盖当前 reactive 内容） */
  function switchModel(configKey: string) {
    currentKey = configKey
    const loaded = load(configKey)
    Object.keys(params).forEach((k) => delete (params as Record<string, unknown>)[k])
    Object.assign(params, loaded)
  }

  /** 用模型配置默认值预填：仅填充用户尚未设置（undefined）的字段 */
  function setDefaults(defaults: TtsParams) {
    for (const [k, v] of Object.entries(defaults)) {
      if (v !== undefined && v !== null && (params as Record<string, unknown>)[k] === undefined) {
        ;(params as Record<string, unknown>)[k] = v
      }
    }
  }

  /** 还原为空（清除该模型的会话覆盖） */
  function reset() {
    Object.keys(params).forEach((k) => delete (params as Record<string, unknown>)[k])
  }

  /** 转为发送给后端的 payload（去除 undefined / 空字符串 / 空数组；voice 由调用方单独传 voiceId） */
  function toPayload(): Record<string, unknown> {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(params)) {
      if (k === 'voice') continue
      if (v === undefined || v === null) continue
      if (typeof v === 'string' && v.trim() === '') continue
      if (Array.isArray(v) && v.length === 0) continue
      out[k] = v
    }
    return out
  }

  watch(
    params,
    (val) => {
      if (!currentKey) return
      try {
        // 不持久化 voice（音色由选择器独立管理）
        const rest: Record<string, unknown> = { ...val }
        delete rest.voice
        localStorage.setItem(STORAGE_PREFIX + currentKey, JSON.stringify(rest))
      } catch {
        /* 隐私模式忽略 */
      }
    },
    { deep: true }
  )

  return { params, switchModel, setDefaults, reset, toPayload }
}
