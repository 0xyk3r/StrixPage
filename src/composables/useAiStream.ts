import { sm3 } from 'sm-crypto'
import { enc } from '@/utils/sm-crypto'
import { useLoginInfoStore } from '@/stores/login-info'
import { useBaseURL } from '@/composables/useBaseUrl'

export interface AiStreamEvent {
  type: 'thinking' | 'content' | 'done' | 'error'
  content?: string
  messageId?: string
  userMessageId?: string
  promptTokens?: number
  completionTokens?: number
  message?: string
}

/**
 * 向 POST /system/ai/chat/{sessionId}/message 发送加密请求并解析 SSE 流。
 * SSE 响应本身为明文（流式无法逐块加密），请求体走 SM2+SM4 加密 + SM3 签名。
 */
export async function streamAiMessage(
  sessionId: string,
  body: { content: string; attachments?: any[] },
  onEvent: (event: AiStreamEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const loginStore = useLoginInfoStore()
  const token = loginStore.loginToken
  const timestamp = Date.now().toString()
  const signUrl = `/system/ai/chat/${sessionId}/message`
  const fetchUrl = `${useBaseURL()}system/ai/chat/${sessionId}/message`

  // SM3 签名（对原始明文 body 签名，与 axios.ts 中逻辑一致）
  const bodyString = JSON.stringify(body)
  const sign = sm3(bodyString + '|' + signUrl + '|' + timestamp)
  const encBody = enc(body)

  let response: Response
  try {
    response = await fetch(fetchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        timestamp,
        sign
      },
      body: JSON.stringify(encBody),
      signal
    })
  } catch (err: any) {
    if (err?.name === 'AbortError') return
    onEvent({ type: 'error', message: err?.message ?? '网络请求失败' })
    return
  }

  if (!response.ok) {
    onEvent({ type: 'error', message: `请求失败 (HTTP ${response.status})` })
    return
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let currentEvent = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // 逐行解析 SSE
      while (true) {
        const nlIndex = buffer.indexOf('\n')
        if (nlIndex === -1) break
        const line = buffer.slice(0, nlIndex).trimEnd()
        buffer = buffer.slice(nlIndex + 1)

        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim()
        } else if (line.startsWith('data:')) {
          const raw = line.slice(5).trim()
          if (!raw) continue
          try {
            const parsed = JSON.parse(raw)
            switch (currentEvent) {
              case 'thinking':
                onEvent({ type: 'thinking', content: parsed.content ?? '' })
                break
              case 'content':
                onEvent({ type: 'content', content: parsed.content ?? '' })
                break
              case 'done':
                onEvent({
                  type: 'done',
                  messageId: parsed.messageId,
                  userMessageId: parsed.userMessageId,
                  promptTokens: parsed.promptTokens,
                  completionTokens: parsed.completionTokens
                })
                break
              case 'error':
                onEvent({ type: 'error', message: parsed.message ?? '未知错误' })
                break
            }
          } catch {
            // 忽略格式错误的 chunk
          }
        }
      }
    }
  } catch (err: any) {
    if (err?.name !== 'AbortError') {
      onEvent({ type: 'error', message: err?.message ?? '流读取失败' })
    }
  }
}

/**
 * 向 POST /system/ai/chat/{sessionId}/regenerate 发送无请求体的 SSE 请求。
 * 签名使用空字符串 body，与后端 SignFilter 的无 body 处理一致。
 */
export async function streamAiRegenerate(
  sessionId: string,
  onEvent: (event: AiStreamEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const loginStore = useLoginInfoStore()
  const token = loginStore.loginToken
  const timestamp = Date.now().toString()
  const signUrl = `/system/ai/chat/${sessionId}/regenerate`
  const fetchUrl = `${useBaseURL()}system/ai/chat/${sessionId}/regenerate`

  // No body → sign with empty string (matches axios interceptor behavior for empty body)
  const sign = sm3('' + '|' + signUrl + '|' + timestamp)

  let response: Response
  try {
    response = await fetch(fetchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        timestamp,
        sign
      },
      signal
    })
  } catch (err: any) {
    if (err?.name === 'AbortError') return
    onEvent({ type: 'error', message: err?.message ?? '网络请求失败' })
    return
  }

  if (!response.ok) {
    onEvent({ type: 'error', message: `请求失败 (HTTP ${response.status})` })
    return
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let currentEvent = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      while (true) {
        const nlIndex = buffer.indexOf('\n')
        if (nlIndex === -1) break
        const line = buffer.slice(0, nlIndex).trimEnd()
        buffer = buffer.slice(nlIndex + 1)

        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim()
        } else if (line.startsWith('data:')) {
          const raw = line.slice(5).trim()
          if (!raw) continue
          try {
            const parsed = JSON.parse(raw)
            switch (currentEvent) {
              case 'thinking':
                onEvent({ type: 'thinking', content: parsed.content ?? '' })
                break
              case 'content':
                onEvent({ type: 'content', content: parsed.content ?? '' })
                break
              case 'done':
                onEvent({
                  type: 'done',
                  messageId: parsed.messageId,
                  promptTokens: parsed.promptTokens,
                  completionTokens: parsed.completionTokens
                })
                break
              case 'error':
                onEvent({ type: 'error', message: parsed.message ?? '未知错误' })
                break
            }
          } catch {
            // 忽略格式错误的 chunk
          }
        }
      }
    }
  } catch (err: any) {
    if (err?.name !== 'AbortError') {
      onEvent({ type: 'error', message: err?.message ?? '流读取失败' })
    }
  }
}
