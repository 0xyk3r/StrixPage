import { notificationApi } from '@/api/notification'
import type { ListNotificationReq } from '@/api/notification'
import type { NotificationListResp } from '@/@types/components/notification'
import { useLoginInfoStore } from '@/stores/login-info'
import { defineStore } from 'pinia'

export const useNotificationStore = defineStore('notification', () => {
  const unreadCount = ref(0)
  const sseConnected = ref(false)
  let eventSource: EventSource | null = null

  /**
   * 获取未读通知数量 (HTTP fallback)
   */
  async function fetchUnreadCount() {
    try {
      const { data: res } = await notificationApi.unreadCount()
      if (res.data) {
        unreadCount.value = res.data.unreadCount
      }
    } catch (error) {
      console.error('获取未读通知数量失败:', error)
    }
  }

  /**
   * 获取通知列表
   */
  async function fetchNotifications(params: ListNotificationReq) {
    try {
      const { data: res } = await notificationApi.list(params)
      return res.data as NotificationListResp
    } catch (error) {
      console.error('获取通知列表失败:', error)
      throw error
    }
  }

  /**
   * 标记单个通知为已读
   */
  async function markAsRead(notificationId: string) {
    try {
      await notificationApi.markRead(notificationId)
      // SSE 会推送更新后的 unreadCount, 无需手动 fetchUnreadCount
    } catch (error) {
      console.error('标记通知为已读失败:', error)
      throw error
    }
  }

  /**
   * 标记全部通知为已读
   */
  async function markAllAsRead() {
    try {
      await notificationApi.markAllRead()
      // SSE 会推送 unreadCount=0, 但也本地置零作为即时反馈
      unreadCount.value = 0
    } catch (error) {
      console.error('标记全部通知为已读失败:', error)
      throw error
    }
  }

  /**
   * 建立 SSE 连接 (替代 30s 轮询)
   */
  function connectSSE() {
    if (eventSource) return

    const loginInfoStore = useLoginInfoStore()
    const token = loginInfoStore.loginToken
    if (!token) {
      console.warn('SSE: 无登录 token, 无法建立连接')
      return
    }

    const url = `/api/sse/notification?token=${token}`
    eventSource = new EventSource(url)

    eventSource.addEventListener('notification:new', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        unreadCount.value++
        console.log('SSE: 新通知', data.title)
      } catch (e) {
        console.error('SSE: 解析 notification:new 事件失败', e)
      }
    })

    eventSource.addEventListener('notification:count', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        unreadCount.value = data.unreadCount
      } catch (e) {
        console.error('SSE: 解析 notification:count 事件失败', e)
      }
    })

    eventSource.addEventListener('error', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        if (data.message === 'Unauthorized') {
          console.error('SSE: 认证失败, 断开连接')
          disconnectSSE()
          return
        }
      } catch {
        // 非 JSON error 事件, 忽略
      }
    })

    eventSource.onopen = () => {
      sseConnected.value = true
      console.log('SSE: 通知连接已建立')
    }

    eventSource.onerror = () => {
      sseConnected.value = false
      // EventSource 内置自动重连, 无需手动处理
    }
  }

  /**
   * 断开 SSE 连接
   */
  function disconnectSSE() {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
    sseConnected.value = false
  }

  return {
    unreadCount,
    sseConnected,
    fetchUnreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    connectSSE,
    disconnectSSE
  }
})
