import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const _n = '系统菜单'
const BASE = 'system/menu'

export interface MenuListResp {
  systemMenuList: any[]
}

export const menuApi = {
  urls: { list: BASE },

  list: (params?: Record<string, any>) =>
    http.get<RetResult<MenuListResp>>(BASE, { params, meta: { operate: `加载${_n}列表` } }),

  detail: (id: string) =>
    http.get<RetResult>(`${BASE}/${id}`, { meta: { operate: `加载${_n}信息` } }),

  create: (data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: `新增${_n}` } }),

  update: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, { meta: { operate: `编辑${_n}` } }),

  remove: (id: string) =>
    http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: `删除${_n}` } }),

  modify: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/modify/${id}`, data, { meta: { operate: `修改${_n}字段` } }),

  tree: () =>
    http.get<RetResult>(`${BASE}/tree`, { meta: { operate: `加载${_n}树` } }),
}
