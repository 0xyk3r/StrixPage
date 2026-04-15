import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const BASE = 'system/monitor/user-session'

/** 在线用户会话项 */
export interface OnlineUserSessionItem {
  userId: string
  nickname: string
  phoneNumber: string
  tokenMasked: string
  loginTime: string
  lastActiveTime: string
  ip: string
  device: string
  sessionCount: number
}

/** 在线用户会话列表响应 */
export interface OnlineUserSessionResp {
  items: OnlineUserSessionItem[]
  onlineUserCount: number
  totalSessionCount: number
}

export const userSessionApi = {
  list: (keyword?: string) =>
    http.get<RetResult<OnlineUserSessionResp>>(BASE, {
      params: keyword ? { keyword } : undefined,
      meta: { operate: '加载在线用户会话列表' }
    }),

  kick: (userId: string) =>
    http.post<RetResult<object>>(`${BASE}/kick`, { userId }, {
      meta: { operate: '踢出用户会话', notify: true }
    }),

  batchKick: (userIds: string[]) =>
    http.post<RetResult<object>>(`${BASE}/batch-kick`, { userIds }, {
      meta: { operate: '批量踢出用户会话', notify: true }
    })
}
