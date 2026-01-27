import { http } from '@/plugins/axios'
import type { ListNotificationReq, NotificationListResp } from '@/@types/components/notification'
import { defineStore } from 'pinia'

export const useNotificationStore = defineStore('notification', () => {
  const unreadCount = ref(0)
  let pollingTimer: ReturnType<typeof setInterval> | null = null

  /**
   * 获取未读通知数量
   */
  async function fetchUnreadCount() {
    try {
      const { data: res } = await http.get('system/common/notification/unread-count', {
        meta: { notify: false, operate: '获取未读通知数量' }
      })
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
      const { data: res } = await http.post('system/common/notification', params, {
        meta: { notify: false, operate: '获取通知列表' }
      })
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
      await http.post(`system/common/notification/${notificationId}/read`, null, {
        meta: { notify: false, operate: '标记单个通知为已读' }
      })
      // 刷新未读数量
      await fetchUnreadCount()
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
      await http.post('system/common/notification/read-all', null, {
        meta: { notify: false, operate: '标记全部通知为已读' }
      })
      // 刷新未读数量
      unreadCount.value = 0
    } catch (error) {
      console.error('标记全部通知为已读失败:', error)
      throw error
    }
  }

  /**
   * 开始轮询未读数量（每30秒）
   */
  function startPolling() {
    if (pollingTimer) return
    // 立即执行一次
    fetchUnreadCount()
    // 定时轮询
    pollingTimer = setInterval(() => {
      fetchUnreadCount()
    }, 30000) // 30秒
  }

  /**
   * 停止轮询
   */
  function stopPolling() {
    if (pollingTimer) {
      clearInterval(pollingTimer)
      pollingTimer = null
    }
  }

  return {
    unreadCount,
    fetchUnreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    startPolling,
    stopPolling
  }
})
