import type { RetResult, TransferDataResp } from './types'
import { http } from '@/plugins/axios'

const _n = '系统权限'
const BASE = 'system/permission'

/** 权限列表项 */
export interface SystemPermissionItem {
  id: string
  name: string
  key: string
  menuId: string
  description: string
}

/** 权限列表响应 */
export interface PermissionListResp {
  systemPermissionList: SystemPermissionItem[]
}

/** 权限详情响应 */
export interface SystemPermissionResp {
  id: string
  name: string
  key: string
  menuId: string
  description: string
}

/** 权限更新请求 */
export interface SystemPermissionUpdateReq {
  name: string
  key: string
  menuId: string
  description: string
}

export const permissionApi = {
  urls: { list: BASE },

  list: (params?: Record<string, any>) =>
    http.get<RetResult<PermissionListResp>>(BASE, { params, meta: { operate: `加载${_n}列表` } }),

  detail: (id: string) =>
    http.get<RetResult<SystemPermissionResp>>(`${BASE}/${id}`, {
      meta: { operate: `加载${_n}信息` }
    }),

  create: (data: SystemPermissionUpdateReq) =>
    http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: `新增${_n}` } }),

  update: (id: string, data: SystemPermissionUpdateReq) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, { meta: { operate: `编辑${_n}` } }),

  remove: (id: string) => http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: `删除${_n}` } }),

  transfer: (params?: Record<string, any>) =>
    http.get<RetResult<TransferDataResp>>(`${BASE}/transfer`, {
      params,
      meta: { operate: `加载${_n}穿梭框` }
    })
}
