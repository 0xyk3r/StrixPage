import type { RetResult, TreeDataResp } from './types'
import { http } from '@/plugins/axios'

const _n = '系统菜单'
const BASE = 'system/menu'

/** 菜单管理列表项 */
export interface SystemMenuManageItem {
  type: string
  id: string
  key: string
  name: string
  url: string
  icon: string
  sortValue: number
  children: SystemMenuManageItem[]
  isLeaf: boolean
  leaf: boolean
}

/** 菜单列表响应 */
export interface MenuListResp {
  systemMenuList: SystemMenuManageItem[]
}

/** 菜单详情响应 */
export interface SystemMenuResp {
  id: string
  key: string
  name: string
  url: string
  icon: string
  parentId: string
  sortValue: number
}

/** 菜单更新请求 */
export interface SystemMenuUpdateReq {
  key: string
  name: string
  url: string
  icon: string
  parentId: string
  sortValue: number
}

export const menuApi = {
  urls: { list: BASE },

  list: (params?: Record<string, any>) =>
    http.get<RetResult<MenuListResp>>(BASE, { params, meta: { operate: `加载${_n}列表` } }),

  detail: (id: string) =>
    http.get<RetResult<SystemMenuResp>>(`${BASE}/${id}`, { meta: { operate: `加载${_n}信息` } }),

  create: (data: SystemMenuUpdateReq) =>
    http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: `新增${_n}` } }),

  update: (id: string, data: SystemMenuUpdateReq) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, { meta: { operate: `编辑${_n}` } }),

  remove: (id: string) =>
    http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: `删除${_n}` } }),

  modify: (id: string, data: { field: string; value: string }) =>
    http.post<RetResult>(`${BASE}/modify/${id}`, data, { meta: { operate: `修改${_n}字段` } }),

  tree: () =>
    http.get<RetResult<TreeDataResp>>(`${BASE}/tree`, { meta: { operate: `加载${_n}树` } }),
};
