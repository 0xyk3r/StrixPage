import { notificationApi } from '@/api/notification'
import type { ListNotificationReq } from '@/api/notification'
import type { NotificationListResp } from '@/@types/components/notification'
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

  async function fetchNotifications(params: ListNotificationReq) {
    try {
      const { data: res } = await notificationApi.list(params)
      return res.data as NotificationListResp
    } catch (error) {
      console.error('获取通知列表失败:', error)
      throw error
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      await notificationApi.markRead(notificationId)
    } catch (error) {
      console.error('标记通知为已读失败:', error)
      throw error
    }
  }

  async function markAllAsRead() {
    try {
      await notificationApi.markAllRead()
      unreadCount.value = 0
    } catch (error) {
      console.error('标记全部通知为已读失败:', error)
      throw error
    }
  }

  return {
    unreadCount,
    fetchUnreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  }
})
