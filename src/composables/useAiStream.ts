import { sm3 } from 'sm-crypto'
import { enc } from '@/utils/sm-crypto'
import { useLoginInfoStore } from '@/stores/login-info'
import { useBaseURL } from '@/composables/useBaseUrl'

export interface AiStreamEvent {
  type: 'thinking' | 'content' | 'done' | 'error'
  content?: string
  messageId?: string
  userMessageId?: string
  modelConfigId?: string
  modelConfigName?: string
  promptTokens?: number
  completionTokens?: number
  message?: string
}

/**
 * 处理流式请求的响应：区分真正的 SSE 流与拦截器直接返回的 JSON 错误（如限流 429、鉴权失败）。
 * SSE 接口走原生 fetch，不经 axios 拦截器，因此需在此识别非 SSE 的明文 JSON 错误体。
 */
async function handleStreamResponse(response: Response, onEvent: (event: AiStreamEvent) => void): Promise<void> {
  if (!response.ok) {
    onEvent({ type: 'error', message: `请求失败 (HTTP ${response.status})` })
    return
  }
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('text/event-stream')) {
    // 限流拦截器 / 鉴权失败等会直接返回 { code, msg, data } 明文 JSON（HTTP 200），并非 SSE 流
    try {
      const data = await response.json()
      // 统一 429 限流处理
      if (data?.code === 429) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '60', 10)
        onEvent({ type: 'error', message: `请求过于频繁，请 ${retryAfter} 秒后再试` })
      } else {
        onEvent({ type: 'error', message: data?.msg ?? `请求失败 (HTTP ${response.status})` })
      }
    } catch {
      onEvent({ type: 'error', message: '请求失败' })
    }
    return
  }
  await consumeSseStream(response, onEvent)
}

/**
 * 消费 SSE 响应流，逐行解析 event/data 并回调。streamAiMessage / streamAiRegenerate 共用。
 */
async function consumeSseStream(response: Response, onEvent: (event: AiStreamEvent) => void): Promise<void> {
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
                  modelConfigId: parsed.modelConfigId,
                  modelConfigName: parsed.modelConfigName,
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

  await handleStreamResponse(response, onEvent)
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

  await handleStreamResponse(response, onEvent)
}
