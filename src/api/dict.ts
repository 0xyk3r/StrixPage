import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const _n = '系统字典'
const BASE = 'system/dict'

/** 字典列表项 */
export interface DictItem {
  id: string
  key: string
  name: string
  dataType: number
  status: number
  remark: string
  version: number
  provided: number
  createdTime: string
}

/** 字典列表响应 */
export interface DictListResp {
  items: DictItem[]
  total: number
}

/** 字典数据列表项 */
export interface DictDataItem {
  id: string
  key: string
  value: string
  label: string
  sort: number
  style: string
  status: number
  remark: string
}

/** 字典详情响应 */
export interface DictResp {
  id: string
  key: string
  name: string
  dataType: number
  status: number
  remark: string
  version: number
  provided: number
  dictDataList: DictDataItem[]
}

/** 字典数据列表响应 */
export interface DictDataListResp {
  items: DictDataItem[]
  total: number
}

/** 字典数据详情响应 */
export interface DictDataResp {
  id: string
  key: string
  value: string
  label: string
  sort: number
  style: string
  status: number
  remark: string
}

/** 字典更新请求 */
export interface DictUpdateReq {
  key: string
  name: string
  dataType: number
  status: number
  remark: string
}

/** 字典数据更新请求 */
export interface DictDataUpdateReq {
  key: string
  value: string
  label: string
  sort: number
  style: string
  status: number
  remark: string
}

export const dictApi = {
  urls: {
    list: BASE,
    dataList: (key: string) => `${BASE}/data/${key}`
  },

  list: (params: Record<string, any>) =>
    http.get<RetResult<DictListResp>>(BASE, { params, meta: { operate: `加载${_n}列表` } }),

  detail: (id: string) => http.get<RetResult<DictResp>>(`${BASE}/${id}`, { meta: { operate: `加载${_n}信息` } }),

  create: (data: DictUpdateReq) => http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: `新增${_n}` } }),

  update: (id: string, data: DictUpdateReq) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, { meta: { operate: `编辑${_n}` } }),

  remove: (id: string) => http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: `删除${_n}` } }),

  dataList: (key: string, params: Record<string, any>) =>
    http.get<RetResult<DictDataListResp>>(`${BASE}/data/${key}`, {
      params,
      meta: { operate: '加载字典数据列表' }
    }),

  dataDetail: (key: string, id: string) =>
    http.get<RetResult<DictDataResp>>(`${BASE}/data/${key}/${id}`, {
      meta: { operate: '加载字典数据信息' }
    }),

  dataCreate: (key: string, data: DictDataUpdateReq) =>
    http.post<RetResult>(`${BASE}/data/${key}/update`, data, { meta: { operate: '新增字典数据' } }),

  dataUpdate: (key: string, id: string, data: DictDataUpdateReq) =>
    http.post<RetResult>(`${BASE}/data/${key}/update/${id}`, data, {
      meta: { operate: '编辑字典数据' }
    }),

  dataRemove: (key: string, id: string) =>
    http.post<RetResult>(`${BASE}/data/${key}/remove/${id}`, null, {
      meta: { operate: '删除字典数据' }
    })
}
