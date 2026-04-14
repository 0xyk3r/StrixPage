import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const _n = '定时任务'
const BASE = 'system/job'

/** 任务列表项 */
export interface JobItem {
  id: string
  name: string
  group: string
  invokeTarget: string
  cronExpression: string
  misfirePolicy: number
  concurrent: number
  status: number
}

/** 任务列表响应 */
export interface JobListResp {
  items: JobItem[]
  total: number
}

/** 任务详情响应 */
export interface JobResp {
  id: string
  name: string
  group: string
  invokeTarget: string
  cronExpression: string
  misfirePolicy: number
  concurrent: number
  status: number
}

/** 任务更新请求 */
export interface JobUpdateReq {
  name: string
  group: string
  invokeTarget: string
  cronExpression: string
  misfirePolicy: number
  concurrent: number
  status: number
}

export const jobApi = {
  urls: { list: BASE },

  list: (params: Record<string, any>) =>
    http.get<RetResult<JobListResp>>(BASE, { params, meta: { operate: `加载${_n}列表` } }),

  detail: (id: string) => http.get<RetResult<JobResp>>(`${BASE}/${id}`, { meta: { operate: `加载${_n}信息` } }),

  create: (data: JobUpdateReq) => http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: `新增${_n}` } }),

  update: (id: string, data: JobUpdateReq) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, { meta: { operate: `编辑${_n}` } }),

  remove: (id: string) => http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: `删除${_n}` } }),

  batchRemove: (ids: string[]) =>
    http.post<RetResult>(`${BASE}/batch/remove`, { ids }, { meta: { operate: `批量删除${_n}`, notify: true } }),

  batchModify: (data: { ids: string[]; field: string; value: string }) =>
    http.post<RetResult>(`${BASE}/batch/modify`, data, { meta: { operate: `批量修改${_n}`, notify: true } }),

  run: (id: string) => http.post<RetResult>(`${BASE}/run/${id}`, null, { meta: { operate: `执行${_n}` } })
}
