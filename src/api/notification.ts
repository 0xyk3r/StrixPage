import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const BASE = 'system/common/notification'

export const notificationApi = {
  list: (data: Record<string, any>) =>
    http.post<RetResult>(BASE, data, { meta: { operate: '加载通知列表' } }),

  unreadCount: () =>
    http.get<RetResult>(`${BASE}/unread-count`, {
      meta: { operate: '加载未读通知数量', notify: false },
    }),

  markRead: (notificationId: string) =>
    http.post<RetResult>(`${BASE}/${notificationId}/read`, null, {
      meta: { operate: '标记通知已读' },
    }),

  markAllRead: () =>
    http.post<RetResult>(`${BASE}/read-all`, null, { meta: { operate: '全部标记已读' } }),
}
