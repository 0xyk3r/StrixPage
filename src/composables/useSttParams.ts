/** 会话级离线 STT 参数（字段名对应后端 SttParams，均可空） */
export interface SttParams {
  /** 语种提示（Fun-ASR/Paraformer 多值） */
  languageHints?: string[]
  /** 单语种（Qwen） */
  language?: string
  /** ITN：中英文数字转阿拉伯数字（Qwen） */
  enableItn?: boolean
  /** 字级时间戳（Qwen-Filetrans） */
  enableWords?: boolean
  /** 说话人分离（Fun-ASR/Paraformer） */
  diarizationEnabled?: boolean
  /** 说话人数量参考 [2,100] */
  speakerCount?: number
  /** 顺滑：过滤语气词（Paraformer） */
  disfluencyRemovalEnabled?: boolean
  /** 时间戳校准（Paraformer） */
  timestampAlignmentEnabled?: boolean
  /** 热词列表 ID（Fun-ASR/Paraformer） */
  vocabularyId?: string
  /** 音轨索引（Qwen-Filetrans） */
  channelId?: number[]
}

const STORAGE_PREFIX = 'strix-stt-params:'

function load(configKey: string): SttParams {
  if (!configKey) return {}
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + configKey)
    return raw ? (JSON.parse(raw) as SttParams) : {}
  } catch {
    return {}
  }
}

/**
 * 会话级离线 STT 参数单一数据源（按 configKey 维度持久化）。
 * 切换模型时重载该模型的会话参数；setDefaults 用模型配置默认值预填尚未设置的字段。
 */
export function useSttParams() {
  const params = reactive<SttParams>({})
  let currentKey = ''

  /** 切换到某模型：加载其已存会话参数（覆盖当前 reactive 内容） */
  function switchModel(configKey: string) {
    currentKey = configKey
    const loaded = load(configKey)
    Object.keys(params).forEach((k) => delete (params as Record<string, unknown>)[k])
    Object.assign(params, loaded)
  }

  /** 用模型配置默认值预填：仅填充用户尚未设置（undefined）的字段 */
  function setDefaults(defaults: SttParams) {
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

  /** 转为发送给后端的 payload（去除 undefined / 空数组） */
  function toPayload(): Record<string, unknown> {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0)) out[k] = v
    }
    return out
  }

  watch(
    params,
    (val) => {
      if (!currentKey) return
      try {
        localStorage.setItem(STORAGE_PREFIX + currentKey, JSON.stringify(val))
      } catch {
        /* 隐私模式忽略 */
      }
    },
    { deep: true }
  )

  return { params, switchModel, setDefaults, reset, toPayload }
}
