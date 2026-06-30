import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const BASE = 'system/ai'

// ============================================================
//  模型配置
// ============================================================

export interface AiModelConfigResp {
  id: string
  key: string
  name: string
  /** 1=TEXT 2=VISION 3=TTS 4=STT(离线) 5=IMAGE_GEN 6=ASR(实时) 7=实时语音翻译 */
  type: number
  /** 0=自动识别 1=DashScope 2=DeepSeek 3=OpenAI 9=其他 */
  providerType?: number
  baseUrl: string
  modelName: string
  temperature?: number
  topP?: number
  maxTokens?: number
  maxCompletionTokens?: number
  presencePenalty?: number
  frequencyPenalty?: number
  repetitionPenalty?: number
  topK?: number
  seed?: number
  n?: number
  stopSequences?: string
  logprobs?: number
  topLogprobs?: number
  systemPrompt?: string
  /** 多模态支持 JSON 数组: ["image","video","audio"] */
  supportedModalities?: string
  /** 0=禁用 1=启用 */
  enableThinking?: number
  thinkingBudget?: number
  preserveThinking?: number
  reasoningEffort?: string
  /** 是否启用代码解释器：0=禁用 1=启用 */
  enableCodeInterpreter?: number
  /** 是否启用联网搜索：0=禁用 1=启用 */
  enableSearch?: number
  /** 搜索策略：turbo/max/agent/agent_max */
  searchStrategy?: string
  /** 是否附带搜索来源引用：0=禁用 1=启用 */
  enableSource?: number
  forcedSearch?: number
  searchFreshness?: number
  enableSearchExtension?: number
  vlHighResolutionImages?: number
  minPixels?: number
  maxPixels?: number
  videoFps?: number
  enableTextImageMixed?: number
  voice?: string
  speed?: number
  responseFormat?: string
  language?: string
  promptAudioUrl?: string
  ossConfigKey?: string
  ossBucketName?: string
  /** ASR run-task 默认参数（JSON 文本，ASR 专用） */
  asrParams?: string
  /** STT 离线默认参数（JSON 文本，STT 专用） */
  sttParams?: string
  /** TTS 合成默认参数（JSON 文本，TTS 专用） */
  ttsParams?: string
  /** 实时语音翻译默认参数（JSON 文本，LiveTranslate 专用） */
  liveTranslateParams?: string
  status: number
  remark?: string
  createdTime: string
  updatedTime: string
}

export interface AiModelConfigUpdateReq {
  key: string
  name: string
  /** 1=TEXT 2=VISION 3=TTS 4=STT(离线) 5=IMAGE_GEN 6=ASR(实时) 7=实时语音翻译 */
  type: number
  /** 0=自动识别 1=DashScope 2=DeepSeek 3=OpenAI 9=其他 */
  providerType?: number
  baseUrl: string
  apiKey?: string
  modelName: string
  temperature?: number | null
  topP?: number | null
  maxTokens?: number | null
  maxCompletionTokens?: number | null
  presencePenalty?: number | null
  frequencyPenalty?: number | null
  repetitionPenalty?: number | null
  topK?: number | null
  seed?: number | null
  n?: number | null
  stopSequences?: string | null
  logprobs?: number | null
  topLogprobs?: number | null
  systemPrompt?: string
  supportedModalities?: string | null
  /** 0=禁用 1=启用 */
  enableThinking?: number
  thinkingBudget?: number | null
  preserveThinking?: number | null
  reasoningEffort?: string | null
  /** 是否启用代码解释器：0=禁用 1=启用 */
  enableCodeInterpreter?: number
  /** 是否启用联网搜索：0=禁用 1=启用 */
  enableSearch?: number
  /** 搜索策略：turbo/max/agent/agent_max */
  searchStrategy?: string | null
  /** 是否附带搜索来源引用：0=禁用 1=启用 */
  enableSource?: number
  forcedSearch?: number | null
  searchFreshness?: number | null
  enableSearchExtension?: number | null
  vlHighResolutionImages?: number | null
  minPixels?: number | null
  maxPixels?: number | null
  videoFps?: number | null
  enableTextImageMixed?: number | null
  voice?: string
  speed?: number | null
  responseFormat?: string | null
  language?: string
  promptAudioUrl?: string
  ossConfigKey?: string | null
  ossBucketName?: string | null
  /** ASR run-task 默认参数（JSON 文本，ASR 专用） */
  asrParams?: string | null
  /** STT 离线默认参数（JSON 文本，STT 专用） */
  sttParams?: string | null
  /** TTS 合成默认参数（JSON 文本，TTS 专用） */
  ttsParams?: string | null
  /** 实时语音翻译默认参数（JSON 文本，LiveTranslate 专用） */
  liveTranslateParams?: string | null
  status?: number
  remark?: string
}

export interface AiFetchModelsReq {
  baseUrl: string
  apiKey: string
  /** 编辑场景下传配置 ID：apiKey 为 __USE_EXISTING__ 占位符时，后端据此精确取已存储的 Key */
  configId?: string
}

export interface AiModelInfo {
  id: string
  name: string
  ownedBy: string
  created?: number
  type: number
}

// ============================================================
//  会话 & 消息
// ============================================================

export interface AiSessionResp {
  id: string
  modelConfigId: string
  modelConfigName: string
  title: string
  status: number
  createdTime: string
  updatedTime: string
}

export interface AiSessionCreateReq {
  modelConfigId: string
  title: string
}

/** 附件（发送时提交） */
export interface AiAttachment {
  fileId: string
  type: 'image' | 'video' | 'audio'
  mimeType: string
  name: string
}

/** 附件响应（含预览 URL） */
export interface AiAttachmentResp extends AiAttachment {
  previewUrl: string
}

export interface AiMessageResp {
  id: string
  sessionId: string
  /** user | assistant | system */
  role: string
  content: string
  thinkingContent?: string
  attachments?: AiAttachmentResp[]
  promptTokens?: number
  completionTokens?: number
  /** 缓存命中 Token 数（实际计费输入 = promptTokens - cacheHitTokens） */
  cacheHitTokens?: number
  /** 缓存写入 Token 数（DashScope 特有） */
  cacheWriteTokens?: number
  /** 思考链 Token 数（包含于 completionTokens 内） */
  reasoningTokens?: number
  /** 0=生成中 1=完成 2=错误 */
  status: number
  errorMsg?: string
  modelConfigId?: string
  modelConfigName?: string
  durationMs?: number
  createdTime: string
}

export interface AiChatMessageReq {
  content: string
  attachments?: AiAttachment[]
}

export interface AiSessionRenameTitleReq {
  title: string
}

// ============================================================
//  工坊
// ============================================================

export interface AiTtsSynthesizeReq {
  configKey: string
  text: string
  /** 音色 ID（声音复刻/设计的 voice_id，覆盖模型默认音色） */
  voiceId?: string
  /** 会话级覆盖参数（JSON 文本） */
  params?: string
}

/** TTS 会话级合成参数（字段名对应后端 TtsParams，均可空） */
export interface TtsParams {
  /** 音色 ID */
  voice?: string
  /** 音频格式：mp3/wav/pcm/opus */
  format?: string
  /** 采样率(Hz) */
  sampleRate?: number
  /** 音量 [0,100] */
  volume?: number
  /** 语速 [0.5,2.0] */
  rate?: number
  /** 音调 [0.5,2.0] */
  pitch?: number
  /** opus 码率(kbps) [6,510] */
  bitRate?: number
  /** 指令控制文本（≤100 字符，复刻/设计音色） */
  instruction?: string
  /** 是否启用 SSML */
  enableSsml?: boolean
  /** 随机种子 [0,65535] */
  seed?: number
  /** 目标语言提示 */
  languageHints?: string[]
}

/** TTS 自定义音色（声音复刻/设计） */
export interface AiTtsVoiceResp {
  id: string
  configKey: string
  voiceId: string
  name: string
  /** 1=声音复刻 2=声音设计 */
  voiceType: number
  targetModel: string
  promptAudioUrl?: string
  voicePrompt?: string
  previewText?: string
  /** DEPLOYING/OK/UNDEPLOYED */
  status: string
  remark?: string
  createdTime: string
}

/** 声音复刻请求（公网音频 URL） */
export interface AiTtsVoiceCloneReq {
  configKey: string
  name: string
  audioUrl: string
  remark?: string
}

/** 声音设计请求 */
export interface AiTtsVoiceDesignReq {
  configKey: string
  name: string
  voicePrompt: string
  previewText: string
  remark?: string
}

export interface AiImageGenerateReq {
  configKey: string
  imageUrls?: string[]
  prompt: string
  size?: string
}

/** AI 异步任务状态（TTS 音色注册 / STT 转写） */
export interface AiTaskStatus {
  taskId: string
  type: string
  /** PENDING | RUNNING | SUCCEEDED | FAILED */
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED'
  /** 成功时的结果（音色 ID 或识别文本） */
  result?: string
  /** 失败时的错误信息 */
  error?: string
}

/** 离线 STT 字级时间戳 */
export interface SttWord {
  beginTime: number
  endTime: number
  text: string
  punctuation: string
}

/** 离线 STT 句级结果 */
export interface SttSentence {
  text: string
  /** 句级开始时间(ms)（Qwen-Flash 无） */
  beginTime?: number
  endTime?: number
  /** 说话人索引（Fun-ASR/Paraformer 开启分离时） */
  speakerId?: number
  /** 情绪（Qwen 7 类） */
  emotion?: string
  /** 句级语种 */
  language?: string
  /** 字级时间戳 */
  words?: SttWord[]
}

/** 离线 STT 结构化识别结果（任务成功时 result 字段为本结构的 JSON 字符串） */
export interface SttResult {
  text: string
  durationMs?: number
  language?: string
  sentences: SttSentence[]
}

// ============================================================
//  FIM 续写
// ============================================================

/** FIM 续写请求 */
export interface AiFimReq {
  /** 模型配置 Key（必须为支持 FIM 的提供商，如 DeepSeek） */
  modelKey: string
  /**
   * FIM 模式：前缀文本；对话前缀续写模式：assistant 前缀内容（必填）
   */
  prompt: string
  /** FIM 专用：后缀文本（可选，提供时启用 FIM 填充模式） */
  suffix?: string
  /** 对话前缀续写专用：系统提示词（可选） */
  systemPrompt?: string
  /** 对话前缀续写专用：用户消息（可选，提供背景上下文） */
  userContent?: string
  /** true = 对话前缀续写（Chat Prefix），false/undefined = FIM 填充 */
  chatPrefix?: boolean
  /** 最大生成 Token 数（1-4096，不填使用模型配置默认值） */
  maxTokens?: number
  /** 温度覆盖（0-2，不填使用模型配置） */
  temperature?: number
}

/** FIM 续写响应 */
export interface AiFimResp {
  /** 生成的文本内容 */
  text: string
  /** 停止原因：stop=正常结束，length=达到 Token 限制 */
  finishReason?: string
  promptTokens?: number
  completionTokens?: number
}

// ============================================================
//  API 方法
// ============================================================

export const aiApi = {
  // 模型配置
  modelConfigList: () =>
    http.get<RetResult<AiModelConfigResp[]>>(`${BASE}/model-config`, {
      meta: { operate: '加载模型配置列表' }
    }),

  modelConfigDetail: (id: string) =>
    http.get<RetResult<AiModelConfigResp>>(`${BASE}/model-config/${id}`, {
      meta: { operate: '加载模型配置' }
    }),

  modelConfigCreate: (data: AiModelConfigUpdateReq) =>
    http.post<RetResult>(`${BASE}/model-config/update`, data, {
      meta: { operate: '新增模型配置' }
    }),

  modelConfigUpdate: (id: string, data: AiModelConfigUpdateReq) =>
    http.post<RetResult>(`${BASE}/model-config/update/${id}`, data, {
      meta: { operate: '更新模型配置' }
    }),

  modelConfigRemove: (id: string) =>
    http.post<RetResult>(`${BASE}/model-config/remove/${id}`, null, {
      meta: { operate: '删除模型配置' }
    }),

  modelConfigTest: (id: string) =>
    http.post<RetResult<string>>(`${BASE}/model-config/test/${id}`, null, {
      meta: { operate: '测试模型连通性' }
    }),

  fetchModels: (data: AiFetchModelsReq) =>
    http.post<RetResult<AiModelInfo[]>>(`${BASE}/model-config/fetch-models`, data, {
      meta: { operate: '获取模型列表', notify: false }
    }),

  // FIM 续写
  fim: (data: AiFimReq) =>
    http.post<RetResult<AiFimResp>>(`${BASE}/fim`, data, {
      meta: { operate: 'AI 文本续写' }
    }),

  // 会话
  sessionList: (params: { page: number; pageSize: number }) =>
    http.get<RetResult<AiSessionResp[]>>(`${BASE}/session`, {
      params,
      meta: { operate: '加载会话列表' }
    }),

  sessionCreate: (data: AiSessionCreateReq) =>
    http.post<RetResult<AiSessionResp>>(`${BASE}/session/create`, data, {
      meta: { operate: '创建会话' }
    }),

  sessionRemove: (id: string) =>
    http.post<RetResult>(`${BASE}/session/remove/${id}`, null, {
      meta: { operate: '删除会话' }
    }),

  sessionRename: (id: string, data: AiSessionRenameTitleReq) =>
    http.patch<RetResult>(`${BASE}/session/${id}/title`, data, {
      meta: { operate: '重命名会话' }
    }),

  sessionSwitchModel: (id: string, data: { modelConfigId: string }) =>
    http.patch<RetResult>(`${BASE}/session/${id}/model`, data, {
      meta: { operate: '切换模型', notify: true }
    }),

  // 消息
  messageList: (sessionId: string) =>
    http.get<RetResult<AiMessageResp[]>>(`${BASE}/session/${sessionId}/messages`, {
      meta: { operate: '加载历史消息' }
    }),

  messageClearAll: (sessionId: string) =>
    http.delete<RetResult>(`${BASE}/chat/${sessionId}/messages/all`, {
      meta: { operate: '清空消息' }
    }),

  messageDeleteFrom: (sessionId: string, messageId: string) =>
    http.delete<RetResult>(`${BASE}/chat/${sessionId}/messages/from/${messageId}`, {
      meta: { operate: '截断消息' }
    }),

  // TTS：返回 blob（音频字节流），不走解密拦截
  ttsSynthesize: (data: AiTtsSynthesizeReq) =>
    http.post<Blob>(`${BASE}/tts/synthesize`, data, {
      responseType: 'blob',
      meta: { operate: 'TTS 语音合成', notify: false, skipEncryption: true }
    }),

  // TTS 音色：声音复刻（公网 URL），返回 taskId，需轮询 taskStatus
  ttsVoiceClone: (data: AiTtsVoiceCloneReq) =>
    http.post<RetResult<string>>(`${BASE}/tts/voice/clone`, data, {
      meta: { operate: '声音复刻' }
    }),

  // TTS 音色：声音复刻（上传音频文件），FormData 跳过加密，返回 taskId
  ttsVoiceCloneUpload: (configKey: string, name: string, audioFile: File, remark?: string) => {
    const fd = new FormData()
    fd.append('audio', audioFile)
    fd.append('configKey', configKey)
    fd.append('name', name)
    if (remark) fd.append('remark', remark)
    return http.post<RetResult<string>>(`${BASE}/tts/voice/clone/upload`, fd, {
      meta: { operate: '声音复刻(上传)', notify: false, skipEncryption: true }
    })
  },

  // TTS 音色：声音设计，返回 taskId（成功 result 为 voiceId|预览Base64）
  ttsVoiceDesign: (data: AiTtsVoiceDesignReq) =>
    http.post<RetResult<string>>(`${BASE}/tts/voice/design`, data, {
      meta: { operate: '声音设计' }
    }),

  // TTS 音色列表
  ttsVoiceList: (configKey: string) =>
    http.get<RetResult<AiTtsVoiceResp[]>>(`${BASE}/tts/voice/list`, {
      params: { configKey },
      meta: { operate: '加载音色列表', notify: false }
    }),

  // TTS 音色：同步云端历史音色到本地，返回新增数量
  ttsVoiceSync: (configKey: string) =>
    http.post<RetResult<number>>(`${BASE}/tts/voice/sync`, null, {
      params: { configKey },
      meta: { operate: '同步云端音色', notify: false }
    }),

  // TTS 音色删除
  ttsVoiceRemove: (id: string) =>
    http.post<RetResult>(`${BASE}/tts/voice/remove/${id}`, null, {
      meta: { operate: '删除音色' }
    }),

  // STT：FormData 上传，跳过加密；返回 taskId，需轮询 taskStatus
  sttTranscribe: (configKey: string, audioFile: File, params?: Record<string, unknown>) => {
    const fd = new FormData()
    fd.append('audio', audioFile)
    fd.append('configKey', configKey)
    if (params && Object.keys(params).length > 0) {
      fd.append('params', JSON.stringify(params))
    }
    return http.post<RetResult<string>>(`${BASE}/stt/transcribe`, fd, {
      meta: { operate: 'STT 语音转写', notify: false, skipEncryption: true }
    })
  },

  // 查询异步任务状态（TTS 音色注册 / STT 转写）
  taskStatus: (taskId: string) =>
    http.get<RetResult<AiTaskStatus>>(`${BASE}/task/${taskId}`, {
      meta: { operate: '查询任务状态', notify: false }
    }),

  // 图片生成
  imageGenerate: (data: AiImageGenerateReq) =>
    http.post<RetResult<string>>(`${BASE}/image/generate`, data, {
      meta: { operate: '图片生成', notify: false }
    })
}
