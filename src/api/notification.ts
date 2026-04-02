import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const BASE = 'system/common/notification'

/** 通知列表项 */
export interface NotificationItem {
  id: string
  notificationId: string
  bizType: string
  bizId: string
  title: string
  content: string
  jumpType: string
  jumpTarget: string
  jumpParams: string
  senderId: string
  readStatus: number
  readAt: string
  validStatus: number
  createdTime: string
}

/** 通知列表响应 */
export interface NotificationListResp {
  items: NotificationItem[]
  total: number
}

/** 未读通知数量响应 */
export interface NotificationUnreadCountResp {
  unreadCount: number
}

/** 通知列表请求 */
export interface ListNotificationReq {
  pageSize: number
  pageIndex: number
  readStatus?: number | null
  validStatus?: number | null
}

export const notificationApi = {
  list: (data: ListNotificationReq) =>
    http.post<RetResult<NotificationListResp>>(BASE, data, { meta: { operate: '加载通知列表' } }),

  unreadCount: () =>
    http.get<RetResult<NotificationUnreadCountResp>>(`${BASE}/unread-count`, {
      meta: { operate: '加载未读通知数量', notify: false },
    }),

  markRead: (notificationId: string) =>
    http.post<RetResult>(`${BASE}/${notificationId}/read`, null, {
      meta: { operate: '标记通知已读' },
    }),

  markAllRead: () =>
    http.post<RetResult>(`${BASE}/read-all`, null, { meta: { operate: '全部标记已读' } }),
}
