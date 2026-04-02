import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const _n = '系统权限'
const BASE = 'system/permission'

export interface PermissionListResp {
  systemPermissionList: any[]
  total: number
}

export const permissionApi = {
  urls: { list: BASE },

  list: (params: Record<string, any>) =>
    http.get<RetResult<PermissionListResp>>(BASE, { params, meta: { operate: `加载${_n}列表` } }),

  detail: (id: string) =>
    http.get<RetResult>(`${BASE}/${id}`, { meta: { operate: `加载${_n}信息` } }),

  create: (data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: `新增${_n}` } }),

  update: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, { meta: { operate: `编辑${_n}` } }),

  remove: (id: string) =>
    http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: `删除${_n}` } }),

  transfer: (params?: Record<string, any>) =>
    http.get<RetResult>(`${BASE}/transfer`, { params, meta: { operate: `加载${_n}穿梭框` } }),
}
