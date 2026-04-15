import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const BASE = 'system/monitor/notification'

/** 通知管理列表项 */
export interface NotificationManageItem {
  id: string
  title: string
  bizType: string
  status: number
  receiverCount: number
  readCount: number
  readRate: number
  senderId: string
  senderName: string
  jumpType: string
  createdTime: string
  endReason: string
}

/** 通知管理列表响应 */
export interface NotificationManageListResp {
  items: NotificationManageItem[]
  total: number
  totalCount: number
  activeCount: number
  terminatedCount: number
}

/** 接收人项 */
export interface ReceiverItem {
  receiverId: string
  nickname: string
  readStatus: number
  readAt: string
  validStatus: number
}

/** 通知详情响应 */
export interface NotificationDetailResp {
  id: string
  title: string
  content: string
  bizType: string
  status: number
  jumpType: string
  jumpTarget: string
  jumpParams: string
  senderName: string
  createdTime: string
  endReason: string
  endByName: string
  receivers: ReceiverItem[]
}

/** 发送通知请求 */
export interface SendNotificationReq {
  title: string
  content: string
  sendMode: 'BROADCAST' | 'TARGETED'
  receiverIds?: string[]
  jumpType?: string
  jumpTarget?: string
  jumpParams?: string
}

export const notificationManageApi = {
  list: (params: { pageSize?: number; pageIndex?: number; keyword?: string; status?: number | null }) =>
    http.get<RetResult<NotificationManageListResp>>(BASE, {
      params,
      meta: { operate: '加载通知管理列表' }
    }),

  detail: (id: string) =>
    http.get<RetResult<NotificationDetailResp>>(`${BASE}/${id}`, {
      meta: { operate: '加载通知详情' }
    }),

  send: (data: SendNotificationReq) =>
    http.post<RetResult<object>>(`${BASE}/send`, data, {
      meta: { operate: '发送通知', notify: true }
    }),

  terminate: (id: string, reason?: string) =>
    http.post<RetResult<object>>(`${BASE}/${id}/terminate`, { reason }, {
      meta: { operate: '终止通知', notify: true }
    }),

  batchTerminate: (ids: string[]) =>
    http.post<RetResult<object>>(`${BASE}/batch-terminate`, { ids }, {
      meta: { operate: '批量终止通知', notify: true }
    })
}
