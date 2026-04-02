import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const _n = '定时任务'
const BASE = 'system/job'

export interface JobListResp {
  items: any[]
  total: number
}

export const jobApi = {
  urls: { list: BASE },

  list: (params: Record<string, any>) =>
    http.get<RetResult<JobListResp>>(BASE, { params, meta: { operate: `加载${_n}列表` } }),

  detail: (id: string) =>
    http.get<RetResult>(`${BASE}/${id}`, { meta: { operate: `加载${_n}信息` } }),

  create: (data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: `新增${_n}` } }),

  update: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, { meta: { operate: `编辑${_n}` } }),

  remove: (id: string) =>
    http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: `删除${_n}` } }),

  run: (id: string) =>
    http.post<RetResult>(`${BASE}/run/${id}`, null, { meta: { operate: `执行${_n}` } }),
}
