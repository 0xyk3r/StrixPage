import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const _n = '系统地区'
const BASE = 'system/region'

export interface RegionListResp {
  systemRegionList: any[]
  total: number
}

export const regionApi = {
  urls: { list: BASE },

  list: (params: Record<string, any>) =>
    http.get<RetResult<RegionListResp>>(BASE, { params, meta: { operate: `加载${_n}列表` } }),

  detail: (id: string) =>
    http.get<RetResult>(`${BASE}/${id}`, { meta: { operate: `加载${_n}信息` } }),

  create: (data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: `新增${_n}` } }),

  update: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, { meta: { operate: `编辑${_n}` } }),

  remove: (id: string) =>
    http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: `删除${_n}` } }),

  children: (id: string) =>
    http.get<RetResult>(`${BASE}/${id}/children`, { meta: { operate: '加载子地区' } }),

  tree: () =>
    http.get<RetResult>(`${BASE}/tree`, { meta: { operate: `加载${_n}树` } }),

  cascader: () =>
    http.get<RetResult>(`${BASE}/cascader`, { meta: { operate: `加载${_n}级联选择` } }),
}
