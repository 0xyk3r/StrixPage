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
      attachments: m.attachments ? JSON.parse(m.attachments) : [],
      status: m.status ?? 1,
      errorMsg: m.errorMsg,
      thinkingExpanded: false,
      thinkingDone: !!m.thinkingContent,
      inputTokens: m.promptTokens,
      outputTokens: m.completionTokens,
      metaExpanded: false,
      createdTime: m.createdTime
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
    abortController = new AbortController()
    const sendStartTime = Date.now()

    await streamAiMessage(
      activeSessionId.value,
      { content, attachments: attachments.length ? attachments : undefined },
      (event) => {
        const last = messages.value[messages.value.length - 1]
        if (!last) return
        if (event.type === 'thinking') {
          last.thinkingContent += event.content
        } else if (event.type === 'content') {
          if (!last.thinkingDone) last.thinkingDone = true
          last.content += event.content
        } else if (event.type === 'done') {
          last.status = 1
          if (event.messageId) last.id = event.messageId
          if (event.userMessageId) userMsg.id = event.userMessageId
          last.inputTokens = event.promptTokens
          last.outputTokens = event.completionTokens
          last.durationMs = Date.now() - sendStartTime
          streaming.value = false
          abortController = null
        } else if (event.type === 'error') {
          last.status = 2
          last.errorMsg = event.message
          streaming.value = false
          abortController = null
        }
      },
      abortController.signal
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
    abortController = new AbortController()
    const sendStartTime = Date.now()

    await streamAiRegenerate(
      activeSessionId.value,
      (event) => {
        const last = messages.value[messages.value.length - 1]
        if (!last) return
        if (event.type === 'thinking') {
          last.thinkingContent += event.content
        } else if (event.type === 'content') {
          if (!last.thinkingDone) last.thinkingDone = true
          last.content += event.content
        } else if (event.type === 'done') {
          last.status = 1
          if (event.messageId) last.id = event.messageId
          last.inputTokens = event.promptTokens
          last.outputTokens = event.completionTokens
          last.durationMs = Date.now() - sendStartTime
          streaming.value = false
          abortController = null
        } else if (event.type === 'error') {
          last.status = 2
          last.errorMsg = event.message
          streaming.value = false
          abortController = null
        }
      },
      abortController.signal
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
    selectSession,
    togglePin,
    sendMessage,
    clearMessages,
    truncateFrom,
    regenerate,
    abortStream
  }
}, { persist: { pick: ['pinnedIds'] } })
