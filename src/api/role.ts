import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const _n = '系统角色'
const BASE = 'system/role'

export interface RoleListResp {
  systemRoleList: any[]
  total: number
}

export const roleApi = {
  urls: { list: BASE },

  list: (params: Record<string, any>) =>
    http.get<RetResult<RoleListResp>>(BASE, { params, meta: { operate: `加载${_n}列表` } }),

  detail: (id: string) =>
    http.get<RetResult>(`${BASE}/${id}`, { meta: { operate: `加载${_n}信息` } }),

  create: (data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: `新增${_n}` } }),

  update: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, { meta: { operate: `编辑${_n}` } }),

  remove: (id: string) =>
    http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: `删除${_n}` } }),

  updateMenu: (roleId: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update/${roleId}/menu`, data, {
      meta: { operate: '编辑角色菜单' },
    }),

  removePermission: (roleId: string, permissionId: string) =>
    http.post<RetResult>(`${BASE}/remove/${roleId}/permission/${permissionId}`, null, {
      meta: { operate: '移除角色权限' },
    }),

  removeMenu: (roleId: string, menuId: string) =>
    http.post<RetResult>(`${BASE}/remove/${roleId}/menu/${menuId}`, null, {
      meta: { operate: '移除角色菜单' },
    }),

  select: (params?: Record<string, any>) =>
    http.get<RetResult>(`${BASE}/select`, { params, meta: { operate: `加载${_n}下拉列表` } }),

  transfer: (params?: Record<string, any>) =>
    http.get<RetResult>(`${BASE}/transfer`, { params, meta: { operate: `加载${_n}穿梭框` } }),
}
