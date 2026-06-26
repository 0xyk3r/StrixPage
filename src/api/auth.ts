import type { RetResult } from './types'
import { http } from '@/plugins/axios'

/** 登录管理员信息 */
export interface LoginManagerInfo {
  id: string
  nickname: string
  type: number
  regionId: string
  permissionKeys: string[]
  avatarConfig: string | null
}

/** 登录响应 */
export interface LoginResp {
  info: LoginManagerInfo
  token: string
  tokenExpire: string
}

/** 续签响应 */
export interface RenewTokenResp {
  token: string
  tokenExpire: string
}

/** 系统菜单项 */
export interface SystemMenuItem {
  id: string
  name: string
  url: string
  icon: string
  children: SystemMenuItem[]
}

/** 系统菜单响应 */
export interface MenuResp {
  menuList: SystemMenuItem[]
}

export const authApi = {
  currentInfo: () =>
    http.get<RetResult<LoginManagerInfo>>('system/current-info', {
      meta: { operate: '刷新当前管理员信息', notify: false }
    }),

  login: (data: Record<string, any>) =>
    http.post<RetResult<LoginResp>>('system/login', data, {
      meta: { operate: '登录', notify: false }
    }),

  logout: () =>
    http.post<RetResult>('system/logout', null, {
      meta: { operate: '注销' }
    }),

  renewToken: () =>
    http.post<RetResult<RenewTokenResp>>('system/renewToken', null, {
      meta: { operate: '续签令牌', notify: false }
    }),

  menus: () =>
    http.get<RetResult<MenuResp>>('system/menus', {
      meta: { operate: '加载系统菜单' }
    })
}
