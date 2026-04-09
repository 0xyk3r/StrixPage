import type { RetResult, TransferDataResp } from './types'
import { http } from '@/plugins/axios'

const _n = '系统人员'
const BASE = 'system/manager'

/** 人员列表项 */
export interface SystemManagerItem {
  id: string
  nickname: string
  loginName: string
  status: number
  type: number
  regionId: string
  builtin: number
  createdTime: string
}

/** 人员列表响应 */
export interface ManagerListResp {
  systemManagerList: SystemManagerItem[]
  total: number
}

/** 人员详情响应 */
export interface SystemManagerResp {
  id: string
  nickname: string
  loginName: string
  status: number
  type: number
  regionId: string
  createdTime: string
  roleIds: string
}

/** 人员更新请求 */
export interface SystemManagerUpdateReq {
  nickname: string
  loginName: string
  loginPassword: string
  status: number
  type: number
  regionId: string
}

export const managerApi = {
  urls: { list: BASE },

  list: (params: Record<string, any>) =>
    http.get<RetResult<ManagerListResp>>(BASE, { params, meta: { operate: `加载${_n}列表` } }),

  detail: (id: string) =>
    http.get<RetResult<SystemManagerResp>>(`${BASE}/${id}`, { meta: { operate: `加载${_n}信息` } }),

  create: (data: SystemManagerUpdateReq) =>
    http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: `新增${_n}` } }),

  update: (id: string, data: SystemManagerUpdateReq) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, { meta: { operate: `编辑${_n}` } }),

  remove: (id: string) => http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: `删除${_n}` } }),

  modify: (id: string, data: { field: string; value: string }) =>
    http.post<RetResult>(`${BASE}/modify/${id}`, data, { meta: { operate: `修改${_n}字段` } }),

  transfer: (params?: Record<string, any>) =>
    http.get<RetResult<TransferDataResp>>(`${BASE}/transfer`, {
      params,
      meta: { operate: `加载${_n}穿梭框` }
    })
}
