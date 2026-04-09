import type { RetResult, SelectDataResp, TransferDataResp } from './types'
import { http } from '@/plugins/axios'

const _n = '系统角色'
const BASE = 'system/role'

/** 角色列表项 */
export interface SystemRoleItem {
  id: string
  name: string
  regionPermissionType: number
  builtin: number
}

/** 角色列表响应 */
export interface RoleListResp {
  systemRoleList: SystemRoleItem[]
}

/** 菜单管理项 (角色详情中使用) */
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

/** 权限项 (角色详情中使用) */
export interface SystemPermissionItem {
  id: string
  name: string
  key: string
  menuId: string
  description: string
}

/** 角色详情响应 */
export interface SystemRoleResp {
  id: string
  name: string
  regionPermissionType: number
  menus: SystemMenuManageItem[]
  permissions: SystemPermissionItem[]
}

/** 角色更新请求 */
export interface SystemRoleUpdateReq {
  name: string
  regionPermissionType: number
}

/** 角色菜单更新请求 */
export interface SystemRoleUpdateMenuReq {
  menuIds: string
  permissionIds: string
}

export const roleApi = {
  urls: { list: BASE },

  list: (params?: Record<string, any>) =>
    http.get<RetResult<RoleListResp>>(BASE, { params, meta: { operate: `加载${_n}列表` } }),

  detail: (id: string) =>
    http.get<RetResult<SystemRoleResp>>(`${BASE}/${id}`, { meta: { operate: `加载${_n}信息` } }),

  create: (data: SystemRoleUpdateReq) =>
    http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: `新增${_n}` } }),

  update: (id: string, data: SystemRoleUpdateReq) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, { meta: { operate: `编辑${_n}` } }),

  remove: (id: string) =>
    http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: `删除${_n}` } }),

  updateMenu: (roleId: string, data: SystemRoleUpdateMenuReq) =>
    http.post<RetResult>(`${BASE}/update/${roleId}/menu`, data, {
      meta: { operate: "编辑角色菜单" },
    }),

  removePermission: (roleId: string, permissionId: string) =>
    http.post<RetResult>(`${BASE}/remove/${roleId}/permission/${permissionId}`, null, {
      meta: { operate: "移除角色权限" },
    }),

  removeMenu: (roleId: string, menuId: string) =>
    http.post<RetResult>(`${BASE}/remove/${roleId}/menu/${menuId}`, null, {
      meta: { operate: "移除角色菜单" },
    }),

  select: (params?: Record<string, any>) =>
    http.get<RetResult<SelectDataResp>>(`${BASE}/select`, {
      params,
      meta: { operate: `加载${_n}下拉列表` },
    }),

  transfer: (params?: Record<string, any>) =>
    http.get<RetResult<TransferDataResp>>(`${BASE}/transfer`, {
      params,
      meta: { operate: `加载${_n}穿梭框` },
    }),
};
