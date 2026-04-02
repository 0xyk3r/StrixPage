import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const _n = '热度配置'
const BASE = 'system/tool/popularity'

export interface PopularityListResp {
  items: any[]
}

export interface PopularityDataListResp {
  items: any[]
  total: number
}

export const popularityApi = {
  urls: { list: BASE },

  list: () =>
    http.get<RetResult<PopularityListResp>>(BASE, { meta: { operate: `加载${_n}列表` } }),

  detail: (id: string) =>
    http.get<RetResult>(`${BASE}/${id}`, { meta: { operate: `加载${_n}信息` } }),

  create: (data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: `保存${_n}` } }),

  update: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, { meta: { operate: `保存${_n}` } }),

  remove: (id: string) =>
    http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: `删除${_n}` } }),

  dataList: (id: string, params: Record<string, any>) =>
    http.get<RetResult<PopularityDataListResp>>(`${BASE}/${id}/data`, {
      params,
      meta: { operate: '加载热度数据列表' },
    }),

  dataUpdate: (id: string, dataId: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/${id}/data/update/${dataId}`, data, {
      meta: { operate: '修改热度数据数值' },
    }),

  dataRemove: (id: string, dataId: string) =>
    http.post<RetResult>(`${BASE}/${id}/data/remove/${dataId}`, null, {
      meta: { operate: '删除热度数据' },
    }),
}
