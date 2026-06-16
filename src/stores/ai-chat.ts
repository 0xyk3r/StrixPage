import { defineStore } from 'pinia'
import type { AiMessageResp, AiSessionResp } from '@/api/ai'
import { aiApi } from '@/api/ai'
import { streamAiMessage, streamAiRegenerate } from '@/composables/useAiStream'

export interface UiMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  thinkingContent: string
  attachments: { type: string; url: string; name: string }[]
  status: number
  errorMsg?: string
  /** 是否展开思考内容 */
  thinkingExpanded: boolean
  /** 思考内容是否已完成 */
  thinkingDone: boolean
  /** 输入 token 数（来自 done 事件或历史记录） */
  inputTokens?: number
  /** 输出 token 数 */
  outputTokens?: number
  /** 本次请求耗时（仅新消息有，历史消息无） */
  durationMs?: number
  /** 是否展开 token/时间元数据行 */
  metaExpanded: boolean
  /** 消息创建时间（ISO string，用于截断操作） */
  createdTime?: string
  /** 使用的模型配置 ID */
  modelConfigId?: string
  /** 使用的模型配置名称 */
  modelConfigName?: string
}

export const useAiChatStore = defineStore('aiChat', () => {
  const sessions = ref<AiSessionResp[]>([])
  const activeSessionId = ref<string>('')
  const messages = ref<UiMessage[]>([])
  const streaming = ref(false)
  const sessionLoading = ref(false)
  const messageLoading = ref(false)
  const pinnedIds = ref<string[]>([])

  /** AbortController 用于中止 SSE 流 */
  let abortController: AbortController | null = null

  // ——————————————————————————————————
  //  会话
  // ——————————————————————————————————

  async function loadSessions() {
    sessionLoading.value = true
    try {
      const res = await aiApi.sessionList({ page: 1, pageSize: 100 })
      sessions.value = (res.data?.data ?? []) as AiSessionResp[]
    } finally {
      sessionLoading.value = false
    }
  }

  async function createSession(modelConfigId: string, title: string): Promise<AiSessionResp | null> {
    const res = await aiApi.sessionCreate({ modelConfigId, title })
    if (res.data?.code === 200) {
      await loadSessions()
      return res.data.data as AiSessionResp
    }
    return null
  }

  async function removeSession(id: string) {
    await aiApi.sessionRemove(id)
    if (activeSessionId.value === id) {
      activeSessionId.value = ''
      messages.value = []
    }
    sessions.value = sessions.value.filter((s) => s.id !== id)
    // 同时移除固定状态
    const pinIdx = pinnedIds.value.indexOf(id)
    if (pinIdx !== -1) pinnedIds.value.splice(pinIdx, 1)
  }

  async function renameSession(id: string, title: string) {
    await aiApi.sessionRename(id, { title })
    const session = sessions.value.find((s) => s.id === id)
    if (session) session.title = title
  }

  async function switchModel(id: string, modelConfigId: string) {
    await aiApi.sessionSwitchModel(id, { modelConfigId })
    const session = sessions.value.find((s) => s.id === id)
    if (session) {
      session.modelConfigId = modelConfigId
      // modelConfigName 需要从模型配置列表中查找或重新加载会话列表
      await loadSessions()
    }
  }

  async function selectSession(id: string) {
    if (streaming.value) abortStream()
    activeSessionId.value = id
    await loadMessages(id)
  }

  function togglePin(sessionId: string) {
    const idx = pinnedIds.value.indexOf(sessionId)
    if (idx === -1) {
      pinnedIds.value.push(sessionId)
    } else {
      pinnedIds.value.splice(idx, 1)
    }
  }

  // ——————————————————————————————————
  //  消息
  // ——————————————————————————————————

  async function loadMessages(sessionId: string) {
    messageLoading.value = true
    messages.value = []
    try {
      const res = await aiApi.messageList(sessionId)
      const raw: AiMessageResp[] = (res.data?.data ?? []) as AiMessageResp[]
      messages.value = raw.map(toUiMessage)
    } finally {
      messageLoading.value = false
    }
  }

  function toUiMessage(m: AiMessageResp): UiMessage {
    return {
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content ?? '',
      thinkingContent: m.thinkingContent ?? '',
      attachments: parseAttachments(m.attachments),
      status: m.status ?? 1,
      errorMsg: m.errorMsg,
      thinkingExpanded: false,
      thinkingDone: !!m.thinkingContent,
      inputTokens: m.promptTokens,
      outputTokens: m.completionTokens,
      durationMs: m.durationMs,
      metaExpanded: false,
      createdTime: m.createdTime,
      modelConfigId: m.modelConfigId,
      modelConfigName: m.modelConfigName
    }
  }

  /** 安全解析附件 JSON：单条数据损坏不应导致整段历史加载失败 */
  function parseAttachments(json?: string): UiMessage['attachments'] {
    if (!json) return []
    try {
      const parsed = JSON.parse(json)
      return Array.isArray(parsed) ? parsed : []
    } catch (e) {
      console.warn('[ai-chat] 解析附件 JSON 失败，已忽略该消息附件:', e)
      return []
    }
  }

  async function sendMessage(content: string, attachments: { type: string; url: string; name: string }[] = []) {
    if (!activeSessionId.value || streaming.value) return

    const userMsg: UiMessage = {
      id: `tmp-user-${Date.now()}`,
      role: 'user',
      content,
      thinkingContent: '',
      attachments,
      status: 1,
      thinkingExpanded: false,
      thinkingDone: false,
      metaExpanded: false
    }
    messages.value.push(userMsg)

    const assistantMsg: UiMessage = {
      id: `tmp-assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      thinkingContent: '',
      attachments: [],
      status: 0,
      thinkingExpanded: true,
      thinkingDone: false,
      metaExpanded: false
    }
    messages.value.push(assistantMsg)

    streaming.value = true
    const controller = new AbortController()
    abortController = controller
    const sendStartTime = Date.now()
    // 必须捕获响应式数组中的代理对象（而非原始局部对象 userMsg/assistantMsg）：
    // 直接修改 push 进数组的原始对象不会触发 Vue 响应式，流式内容将无法实时渲染。
    // 持有稳定代理引用也可避免流式中切换会话写错对象 / 旧流收尾误关新流。
    const targetUserMsg = messages.value[messages.value.length - 2]!
    const targetMsg = messages.value[messages.value.length - 1]!

    await streamAiMessage(
      activeSessionId.value,
      { content, attachments: attachments.length ? attachments : undefined },
      (event) => {
        if (event.type === 'thinking') {
          targetMsg.thinkingContent += event.content ?? ''
        } else if (event.type === 'content') {
          if (!targetMsg.thinkingDone) targetMsg.thinkingDone = true
          targetMsg.content += event.content ?? ''
        } else if (event.type === 'done') {
          targetMsg.status = 1
          if (event.messageId) targetMsg.id = event.messageId
          if (event.userMessageId) targetUserMsg.id = event.userMessageId
          if (event.modelConfigId) targetMsg.modelConfigId = event.modelConfigId
          if (event.modelConfigName) targetMsg.modelConfigName = event.modelConfigName
          targetMsg.inputTokens = event.promptTokens
          targetMsg.outputTokens = event.completionTokens
          targetMsg.durationMs = Date.now() - sendStartTime
          if (abortController === controller) {
            streaming.value = false
            abortController = null
          }
        } else if (event.type === 'error') {
          targetMsg.status = 2
          targetMsg.errorMsg = event.message
          if (abortController === controller) {
            streaming.value = false
            abortController = null
          }
        }
      },
      controller.signal
    )
  }

  async function clearMessages() {
    if (!activeSessionId.value) return
    await aiApi.messageClearAll(activeSessionId.value)
    messages.value = []
  }

  async function truncateFrom(messageId: string) {
    if (!activeSessionId.value) return
    await aiApi.messageDeleteFrom(activeSessionId.value, messageId)
    const idx = messages.value.findIndex((m) => m.id === messageId)
    if (idx !== -1) messages.value.splice(idx)
  }

  async function regenerate() {
    if (!activeSessionId.value || streaming.value) return

    // 移除最后一条 assistant 消息（UI 乐观更新，后端实际删除在 streamRegenerate 中处理）
    const lastAsstIdx = [...messages.value].reverse().findIndex((m) => m.role === 'assistant')
    if (lastAsstIdx !== -1) {
      messages.value.splice(messages.value.length - 1 - lastAsstIdx, 1)
    }

    // 追加新的 assistant 占位
    const assistantMsg: UiMessage = {
      id: `tmp-assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      thinkingContent: '',
      attachments: [],
      status: 0,
      thinkingExpanded: true,
      thinkingDone: false,
      metaExpanded: false
    }
    messages.value.push(assistantMsg)

    streaming.value = true
    const controller = new AbortController()
    abortController = controller
    const sendStartTime = Date.now()
    // 捕获响应式数组中的代理对象（而非原始局部对象），否则流式更新不会触发视图渲染
    const targetMsg = messages.value[messages.value.length - 1]!

    await streamAiRegenerate(
      activeSessionId.value,
      (event) => {
        if (event.type === 'thinking') {
          targetMsg.thinkingContent += event.content ?? ''
        } else if (event.type === 'content') {
          if (!targetMsg.thinkingDone) targetMsg.thinkingDone = true
          targetMsg.content += event.content ?? ''
        } else if (event.type === 'done') {
          targetMsg.status = 1
          if (event.messageId) targetMsg.id = event.messageId
          if (event.modelConfigId) targetMsg.modelConfigId = event.modelConfigId
          if (event.modelConfigName) targetMsg.modelConfigName = event.modelConfigName
          targetMsg.inputTokens = event.promptTokens
          targetMsg.outputTokens = event.completionTokens
          targetMsg.durationMs = Date.now() - sendStartTime
          if (abortController === controller) {
            streaming.value = false
            abortController = null
          }
        } else if (event.type === 'error') {
          targetMsg.status = 2
          targetMsg.errorMsg = event.message
          if (abortController === controller) {
            streaming.value = false
            abortController = null
          }
        }
      },
      controller.signal
    )
  }

  function abortStream() {
    abortController?.abort()
    abortController = null
    streaming.value = false
    const last = messages.value[messages.value.length - 1]
    if (last?.role === 'assistant' && last.status === 0) {
      last.status = 1
    }
  }

  return {
    sessions,
    activeSessionId,
    messages,
    streaming,
    sessionLoading,
    messageLoading,
    pinnedIds,
    loadSessions,
    createSession,
    removeSession,
    renameSession,
    switchModel,
    selectSession,
    togglePin,
    sendMessage,
    clearMessages,
    truncateFrom,
    regenerate,
    abortStream
  }
}, { persist: { pick: ['pinnedIds'] } })
