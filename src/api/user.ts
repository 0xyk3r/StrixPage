import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const _n = '系统用户'
const BASE = 'system/user'

/** 用户列表项 */
export interface SystemUserItem {
  id: string
  nickname: string
  status: number
  phoneNumber: string
}

/** 用户列表响应 */
export interface UserListResp {
  systemUserList: SystemUserItem[]
  total: number
}

/** 用户详情响应 */
export interface SystemUserResp {
  id: string
  nickname: string
  status: number
  phoneNumber: string
}

/** 用户更新请求 */
export interface SystemUserUpdateReq {
  nickname: string
  status: number
  phoneNumber: string
}

export const userApi = {
  urls: { list: BASE },

  list: (params: Record<string, any>) =>
    http.get<RetResult<UserListResp>>(BASE, { params, meta: { operate: `加载${_n}列表` } }),

  detail: (id: string) => http.get<RetResult<SystemUserResp>>(`${BASE}/${id}`, { meta: { operate: `加载${_n}信息` } }),

  create: (data: SystemUserUpdateReq) =>
    http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: `新增${_n}` } }),

  update: (id: string, data: SystemUserUpdateReq) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, { meta: { operate: `编辑${_n}` } }),

  remove: (id: string) => http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: `删除${_n}` } }),

  modify: (id: string, data: { field: string; value: string }) =>
    http.post<RetResult>(`${BASE}/modify/${id}`, data, { meta: { operate: `修改${_n}字段` } }),

  batchRemove: (ids: string[]) =>
    http.post<RetResult>(`${BASE}/batch/remove`, { ids }, { meta: { operate: `批量删除${_n}`, notify: true } }),

  batchModify: (data: { ids: string[]; field: string; value: string }) =>
    http.post<RetResult>(`${BASE}/batch/modify`, data, { meta: { operate: `批量修改${_n}`, notify: true } })
}
