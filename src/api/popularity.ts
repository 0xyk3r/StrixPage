import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const _n = '热度配置'
const BASE = 'system/tool/popularity'

/** 热度配置列表项 */
export interface PopularityConfigItem {
  id: string
  name: string
}

/** 热度配置列表响应 */
export interface PopularityListResp {
  items: PopularityConfigItem[]
}

/** 热度配置详情响应 */
export interface PopularityConfigResp {
  id: string
  name: string
  configKey: string
  initialValue: number
  extraValue: number
  magValue: number
}

/** 热度数据项 */
export interface PopularityDataItem {
  id: string
  configKey: string
  dataId: string
  originalValue: number
}

/** 热度数据列表响应 */
export interface PopularityDataListResp {
  items: PopularityDataItem[]
  total: number
}

/** 热度配置更新请求 */
export interface PopularityConfigUpdateReq {
  name: string
  configKey: string
  initialValue: number
  extraValue: number
  magValue: number
}

/** 热度数据更新请求 */
export interface PopularityDataUpdateReq {
  originalValue: number
}

export const popularityApi = {
  urls: { list: BASE },

  list: () => http.get<RetResult<PopularityListResp>>(BASE, { meta: { operate: `加载${_n}列表` } }),

  detail: (id: string) =>
    http.get<RetResult<PopularityConfigResp>>(`${BASE}/${id}`, {
      meta: { operate: `加载${_n}信息` }
    }),

  create: (data: PopularityConfigUpdateReq) =>
    http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: `保存${_n}` } }),

  update: (id: string, data: PopularityConfigUpdateReq) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, { meta: { operate: `保存${_n}` } }),

  remove: (id: string) => http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: `删除${_n}` } }),

  dataList: (id: string, params: Record<string, any>) =>
    http.get<RetResult<PopularityDataListResp>>(`${BASE}/${id}/data`, {
      params,
      meta: { operate: '加载热度数据列表' }
    }),

  dataUpdate: (id: string, dataId: string, data: PopularityDataUpdateReq) =>
    http.post<RetResult>(`${BASE}/${id}/data/update/${dataId}`, data, {
      meta: { operate: '修改热度数据数值' }
    }),

  dataRemove: (id: string, dataId: string) =>
    http.post<RetResult>(`${BASE}/${id}/data/remove/${dataId}`, null, {
      meta: { operate: '删除热度数据' }
    })
}
