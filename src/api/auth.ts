import type { RetResult } from './types'
import { http } from '@/plugins/axios'

export const authApi = {
  login: (data: Record<string, any>) =>
    http.post<RetResult>('system/login', data, {
      meta: { operate: '登录', notify: false },
    }),

  logout: () =>
    http.post<RetResult>('system/logout', null, {
      meta: { operate: '注销' },
    }),

  renewToken: () =>
    http.post<RetResult>('system/renewToken', null, {
      meta: { operate: '续签令牌', notify: false },
    }),

  menus: () =>
    http.get<RetResult>('system/menus', {
      meta: { operate: '加载系统菜单' },
    }),
}
