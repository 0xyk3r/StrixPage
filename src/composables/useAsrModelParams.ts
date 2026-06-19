/** 会话级 ASR run-task 参数（字段名对应后端 AsrSessionParams，均可空） */
export interface AsrModelParams {
  /** 语义断句：true 关闭 VAD 断句（Paraformer 情感需此项为 false） */
  semanticPunctuationEnabled?: boolean
  /** VAD 断句静音阈值(ms)，[200,6000] */
  maxSentenceSilence?: number
  /** 多阈值模式：防 VAD 断句过长 */
  multiThresholdModeEnabled?: boolean
  /** 顺滑：过滤语气词（仅 Paraformer） */
  disfluencyRemovalEnabled?: boolean
  /** 标点预测（仅 Paraformer） */
  punctuationPredictionEnabled?: boolean
  /** 逆文本正则化 ITN：中文数字转阿拉伯数字（仅 Paraformer） */
  inverseTextNormalizationEnabled?: boolean
  /** 噪音判定阈值 [-1,1]（仅 Fun-ASR） */
  speechNoiseThreshold?: number
  /** 语种提示 */
  languageHints?: string[]
  /** 热词列表 ID */
  vocabularyId?: string
}

const STORAGE_PREFIX = 'strix-asr-params:'

function load(configKey: string): AsrModelParams {
  if (!configKey) return {}
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + configKey)
    return raw ? (JSON.parse(raw) as AsrModelParams) : {}
  } catch {
    return {}
  }
}

/**
 * 会话级 ASR 参数单一数据源（按 configKey 维度持久化）。
 * 切换模型时重载该模型的会话参数；setDefaults 用模型配置默认值预填尚未设置的字段。
 */
export function useAsrModelParams() {
  const params = reactive<AsrModelParams>({})
  let currentKey = ''

  /** 切换到某模型：加载其已存会话参数（覆盖当前 reactive 内容） */
  function switchModel(configKey: string) {
    currentKey = configKey
    const loaded = load(configKey)
    // 清空后填充，确保不残留上个模型的字段
    Object.keys(params).forEach((k) => delete (params as Record<string, unknown>)[k])
    Object.assign(params, loaded)
  }

  /** 用模型配置默认值预填：仅填充用户尚未设置（undefined）的字段 */
  function setDefaults(defaults: AsrModelParams) {
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
