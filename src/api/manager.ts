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
  avatarConfig: string | null
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

/** 批量头像配置响应 */
export interface ManagerAvatarResp {
  /** 管理员 ID -> 头像配置 JSON 映射（无配置的为 null） */
  avatars: Record<string, string | null>
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

  batchRemove: (ids: string[]) =>
    http.post<RetResult>(`${BASE}/batch/remove`, { ids }, { meta: { operate: `批量删除${_n}`, notify: true } }),

  batchModify: (data: { ids: string[]; field: string; value: string }) =>
    http.post<RetResult>(`${BASE}/batch/modify`, data, { meta: { operate: `批量修改${_n}`, notify: true } }),

  batchCreate: (data: { items: Record<string, any>[]; duplicateStrategy: string }) =>
    http.post<RetResult>(`${BASE}/batch/create`, data, { meta: { operate: `批量导入${_n}`, notify: false } }),

  transfer: (params?: Record<string, any>) =>
    http.get<RetResult<TransferDataResp>>(`${BASE}/transfer`, {
      params,
      meta: { operate: `加载${_n}穿梭框` }
    }),

  avatars: (ids: string[]) =>
    http.post<RetResult<ManagerAvatarResp>>(
      `${BASE}/avatars`,
      { ids },
      {
        meta: {
          operate: `加载${_n}头像`,
          notify: false
        }
      }
    )
}
