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
  /** 1=TEXT 2=VISION 3=TTS 4=STT(离线) 5=IMAGE_GEN 6=ASR(实时) */
  type: number
  baseUrl: string
  modelName: string
  temperature?: number
  topP?: number
  maxTokens?: number
  systemPrompt?: string
  /** 0=禁用 1=启用 */
  enableThinking?: number
  thinkingBudget?: number
  /** 是否启用代码解释器：0=禁用 1=启用 */
  enableCodeInterpreter?: number
  /** 是否启用联网搜索：0=禁用 1=启用 */
  enableSearch?: number
  /** 搜索策略：auto/standard/max/agent */
  searchStrategy?: string
  /** 是否附带搜索来源引用：0=禁用 1=启用 */
  enableSource?: number
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
  status: number
  remark?: string
  createdTime: string
  updatedTime: string
}

export interface AiModelConfigUpdateReq {
  key: string
  name: string
  /** 1=TEXT 2=VISION 3=TTS 4=STT(离线) 5=IMAGE_GEN 6=ASR(实时) */
  type: number
  baseUrl: string
  apiKey?: string
  modelName: string
  temperature?: number | null
  topP?: number | null
  maxTokens?: number | null
  systemPrompt?: string
  /** 0=禁用 1=启用 */
  enableThinking?: number
  thinkingBudget?: number | null
  /** 是否启用代码解释器：0=禁用 1=启用 */
  enableCodeInterpreter?: number
  /** 是否启用联网搜索：0=禁用 1=启用 */
  enableSearch?: number
  /** 搜索策略：auto/standard/max/agent */
  searchStrategy?: string | null
  /** 是否附带搜索来源引用：0=禁用 1=启用 */
  enableSource?: number
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

export interface AiMessageAttachment {
  type: string
  url: string
  name: string
}

export interface AiMessageResp {
  id: string
  sessionId: string
  /** user | assistant | system */
  role: string
  content: string
  thinkingContent?: string
  /** JSON string: AiMessageAttachment[] */
  attachments?: string
  promptTokens?: number
  completionTokens?: number
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
  attachments?: AiMessageAttachment[]
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

  ttsEnroll: (configKey: string) =>
    http.post<RetResult<string>>(`${BASE}/tts/enroll/${configKey}`, null, {
      meta: { operate: '注册 TTS 音色' }
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
