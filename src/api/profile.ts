import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const BASE = 'system/profile'

/** 个人信息响应 */
export interface ProfileInfo {
  id: string
  nickname: string
  loginName: string
  status: number
  type: number
  regionId: string
  avatarConfig: string | null
  createdTime: string
}

/** 登录记录项 */
export interface LoginLogItem {
  id: string
  operationTime: string
  clientIp: string
  clientDevice: string
  responseCode: number
  responseMsg: string
}

/** 登录记录响应 */
export interface LoginLogResp {
  loginLogList: LoginLogItem[]
  total: number
}

export const profileApi = {
  /** 获取个人信息 */
  getProfile: () =>
    http.get<RetResult<ProfileInfo>>(BASE, {
      meta: { operate: '获取个人信息' }
    }),

  /** 修改昵称 */
  updateNickname: (nickname: string) =>
    http.post<RetResult>(`${BASE}/nickname`, { nickname }, { meta: { operate: '修改昵称', notify: true } }),

  /** 修改密码 */
  updatePassword: (oldPassword: string, newPassword: string) =>
    http.post<RetResult>(
      `${BASE}/password`,
      { oldPassword, newPassword },
      { meta: { operate: '修改密码', notify: true } }
    ),

  /** 更新头像配置 */
  updateAvatar: (avatarConfig: string | null) =>
    http.post<RetResult>(`${BASE}/avatar`, { avatarConfig }, { meta: { operate: '更新头像', notify: true } }),

  /** 获取个人登录记录 */
  getLoginLogs: (params: { pageIndex: number; pageSize: number }) =>
    http.get<RetResult<LoginLogResp>>(`${BASE}/login-logs`, {
      params,
      meta: { operate: '加载登录记录' }
    })
}
