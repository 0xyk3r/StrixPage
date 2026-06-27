import type { ListNotificationReq, NotificationListResp } from '@/api/notification'
import { notificationApi } from '@/api/notification'
import { defineStore } from 'pinia'

/**
 * 通知数据 Store
 *
 * 负责通知 CRUD 和未读计数. SSE 连接由 useSseStore 管理.
 */
export const useNotificationStore = defineStore('notification', () => {
  const unreadCount = ref(0)

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

  async function fetchNotifications(params: ListNotificationReq): Promise<NotificationListResp> {
    const { data: res } = await notificationApi.list(params)
    return res.data
  }

  async function markAsRead(notificationId: string) {
    await notificationApi.markRead(notificationId)
  }

  async function markAllAsRead() {
    await notificationApi.markAllRead()
    unreadCount.value = 0
  }

  return {
    unreadCount,
    fetchUnreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  }
})
