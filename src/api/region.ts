import type { RetResult, TreeDataResp, CascaderDataResp } from './types'
import { http } from '@/plugins/axios'

const _n = '系统地区'
const BASE = 'system/region'

/** 地区列表项 */
export interface SystemRegionListItem {
  id: string
  name: string
  level: number
  parentId: string
  fullPath: string
  fullName: string
  remarks: string
  hasChildren: boolean
}

/** 地区列表响应 */
export interface RegionListResp {
  systemRegionList: SystemRegionListItem[]
  total: number
}

/** 地区详情响应 */
export interface SystemRegionResp {
  id: string
  name: string
  level: number
  parentId: string
  fullPath: string
  fullName: string
  remarks: string
}

/** 地区子项 */
export interface SystemRegionChildItem {
  id: string
  name: string
  level: number
  parentId: string
  fullPath: string
  fullName: string
  remarks: string
  hasChildren: boolean
}

/** 子地区列表响应 */
export interface SystemRegionChildrenListResp {
  children: SystemRegionChildItem[]
}

/** 地区更新请求 */
export interface SystemRegionUpdateReq {
  name: string
  parentId: string
  remarks: string
}

export const regionApi = {
  urls: { list: BASE },

  list: (params: Record<string, any>) =>
    http.get<RetResult<RegionListResp>>(BASE, { params, meta: { operate: `加载${_n}列表` } }),

  detail: (id: string) =>
    http.get<RetResult<SystemRegionResp>>(`${BASE}/${id}`, { meta: { operate: `加载${_n}信息` } }),

  create: (data: SystemRegionUpdateReq) =>
    http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: `新增${_n}` } }),

  update: (id: string, data: SystemRegionUpdateReq) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, { meta: { operate: `编辑${_n}` } }),

  remove: (id: string) => http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: `删除${_n}` } }),

  children: (id: string) =>
    http.get<RetResult<SystemRegionChildrenListResp>>(`${BASE}/${id}/children`, {
      meta: { operate: '加载子地区' }
    }),

  tree: () => http.get<RetResult<TreeDataResp>>(`${BASE}/tree`, { meta: { operate: `加载${_n}树` } }),

  cascader: () =>
    http.get<RetResult<CascaderDataResp>>(`${BASE}/cascader`, {
      meta: { operate: `加载${_n}级联选择` }
    })
}
