import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const BASE = 'system/monitor/announcement'

/** 公告列表项 */
export interface AnnouncementItem {
  id: string
  title: string
  level: string
  displayType: string
  status: number
  startTime: string | null
  endTime: string | null
  createdTime: string
  endReason: string | null
}

/** 公告列表响应 */
export interface AnnouncementListResp {
  items: AnnouncementItem[]
  total: number
  totalCount: number
  activeCount: number
  terminatedCount: number
}

/** 公告详情 */
export interface AnnouncementDetail {
  id: string
  title: string
  content: string
  level: string
  displayType: string
  status: number
  startTime: string | null
  endTime: string | null
  createdTime: string
  endBy: string | null
  endReason: string | null
}

/** 发布公告请求 */
export interface PublishAnnouncementReq {
  title: string
  content: string
  level: string
  displayType: string
  startTime?: string | null
  endTime?: string | null
}

/** SSE 推送的公告数据 */
export interface SseAnnouncement {
  id: string
  title: string
  content: string
  level: string
  displayType: string
  startTime: string | null
  endTime: string | null
}

export const announcementApi = {
  list: (params: { pageSize?: number; pageIndex?: number; keyword?: string; status?: number | null; level?: string | null }) =>
    http.get<RetResult<AnnouncementListResp>>(BASE, {
      params,
      meta: { operate: '加载公告列表' }
    }),

  detail: (id: string) =>
    http.get<RetResult<AnnouncementDetail>>(`${BASE}/${id}`, {
      meta: { operate: '加载公告详情' }
    }),

  publish: (data: PublishAnnouncementReq) =>
    http.post<RetResult<object>>(`${BASE}/publish`, data, {
      meta: { operate: '发布公告', notify: true }
    }),

  terminate: (id: string, reason?: string) =>
    http.post<RetResult<object>>(`${BASE}/${id}/terminate`, { reason }, {
      meta: { operate: '终止公告', notify: true }
    }),

  batchTerminate: (ids: string[]) =>
    http.post<RetResult<object>>(`${BASE}/batch-terminate`, { ids }, {
      meta: { operate: '批量终止公告', notify: true }
    })
}
