import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const _n = '系统字典'
const BASE = 'system/dict'

export interface DictListResp {
  items: any[]
  total: number
}

export interface DictDataListResp {
  items: any[]
  total: number
}

export const dictApi = {
  urls: {
    list: BASE,
    dataList: (key: string) => `${BASE}/data/${key}`,
  },

  list: (params: Record<string, any>) =>
    http.get<RetResult<DictListResp>>(BASE, { params, meta: { operate: `加载${_n}列表` } }),

  detail: (id: string) =>
    http.get<RetResult>(`${BASE}/${id}`, { meta: { operate: `加载${_n}信息` } }),

  create: (data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: `新增${_n}` } }),

  update: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, { meta: { operate: `编辑${_n}` } }),

  remove: (id: string) =>
    http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: `删除${_n}` } }),

  dataList: (key: string, params: Record<string, any>) =>
    http.get<RetResult<DictDataListResp>>(`${BASE}/data/${key}`, {
      params,
      meta: { operate: '加载字典数据列表' },
    }),

  dataDetail: (key: string, id: string) =>
    http.get<RetResult>(`${BASE}/data/${key}/${id}`, { meta: { operate: '加载字典数据信息' } }),

  dataCreate: (key: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/data/${key}/update`, data, { meta: { operate: '新增字典数据' } }),

  dataUpdate: (key: string, id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/data/${key}/update/${id}`, data, { meta: { operate: '编辑字典数据' } }),

  dataRemove: (key: string, id: string) =>
    http.post<RetResult>(`${BASE}/data/${key}/remove/${id}`, null, { meta: { operate: '删除字典数据' } }),
}
