import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const BASE = 'system/common/notification'

/** 跳转类型 */
export type JumpType = 'PAGE' | 'URL' | 'NONE'

/** 通知列表项 */
export interface NotificationItem {
  /** 接收记录 ID */
  id: string
  /** 通知 ID */
  notificationId: string
  /** 业务类型 */
  bizType: string
  /** 业务 ID */
  bizId: string
  /** 通知标题 */
  title: string
  /** 通知内容 */
  content: string
  /** 跳转类型 */
  jumpType: JumpType
  /** 跳转目标（路由名称或 URL） */
  jumpTarget: string
  /** 跳转参数（JSON） */
  jumpParams: string
  /** 发送人 ID */
  senderId: string
  /** 已读状态（0未读 1已读） */
  readStatus: 0 | 1
  /** 已读时间 */
  readAt: string | null
  /** 有效状态（1有效 2失效） */
  validStatus: 1 | 2
  /** 创建时间 */
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
  /** 已读状态（0未读 1已读，null查询全部） */
  readStatus?: 0 | 1 | null
  /** 有效状态（0无效 1有效，null查询全部） */
  validStatus?: 0 | 1 | null
}

export const notificationApi = {
  list: (data: ListNotificationReq) =>
    http.post<RetResult<NotificationListResp>>(BASE, data, { meta: { operate: '加载通知列表', notify: false } }),

  unreadCount: () =>
    http.get<RetResult<NotificationUnreadCountResp>>(`${BASE}/unread-count`, {
      meta: { operate: '加载未读通知数量', notify: false }
    }),

  markRead: (notificationId: string) =>
    http.post<RetResult>(`${BASE}/${notificationId}/read`, null, {
      meta: { operate: '标记通知已读' }
    }),

  markAllRead: () => http.post<RetResult>(`${BASE}/read-all`, null, { meta: { operate: '全部标记已读' } })
}
