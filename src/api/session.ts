import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const BASE = 'system/monitor/session'

/** 在线会话项 */
export interface OnlineSessionItem {
  managerId: string
  nickname: string
  loginName: string
  tokenMasked: string
  loginTime: string
  lastActiveTime: string
  ip: string
  device: string
  sessionCount: number
}

/** 在线会话列表响应 */
export interface OnlineSessionResp {
  items: OnlineSessionItem[]
  onlineManagerCount: number
  totalSessionCount: number
}

export const sessionApi = {
  list: (keyword?: string) =>
    http.get<RetResult<OnlineSessionResp>>(BASE, {
      params: keyword ? { keyword } : undefined,
      meta: { operate: '加载在线会话列表' }
    }),

  kick: (managerId: string) =>
    http.post<RetResult<object>>(`${BASE}/kick`, { managerId }, {
      meta: { operate: '踢出会话', notify: true }
    }),

  batchKick: (managerIds: string[]) =>
    http.post<RetResult<object>>(`${BASE}/batch-kick`, { managerIds }, {
      meta: { operate: '批量踢出会话', notify: true }
    })
}
