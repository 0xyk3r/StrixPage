import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const _n = '短信服务'
const BASE = 'system/sms'

export interface SmsListResp {
  configs: any[]
  total: number
}

export interface SmsTemplateListResp {
  templates: any[]
  total: number
}

export interface SmsSignListResp {
  signs: any[]
  total: number
}

export interface SmsLogListResp {
  logs: any[]
  total: number
}

export const smsApi = {
  urls: {
    list: BASE,
    templateList: `${BASE}/template`,
    signList: `${BASE}/sign`,
    logList: `${BASE}/log`,
  },

  list: (params: Record<string, any>) =>
    http.get<RetResult<SmsListResp>>(BASE, { params, meta: { operate: `加载${_n}列表` } }),

  detail: (id: string) =>
    http.get<RetResult>(`${BASE}/${id}`, { meta: { operate: `加载${_n}信息` } }),

  create: (data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: `新增${_n}` } }),

  update: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, { meta: { operate: `编辑${_n}` } }),

  remove: (id: string) =>
    http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: `删除${_n}` } }),

  templateList: (params: Record<string, any>) =>
    http.get<RetResult<SmsTemplateListResp>>(`${BASE}/template`, {
      params,
      meta: { operate: '加载短信模板列表' },
    }),

  signList: (params: Record<string, any>) =>
    http.get<RetResult<SmsSignListResp>>(`${BASE}/sign`, {
      params,
      meta: { operate: '加载短信签名列表' },
    }),

  logList: (params: Record<string, any>) =>
    http.get<RetResult<SmsLogListResp>>(`${BASE}/log`, {
      params,
      meta: { operate: '加载短信日志列表' },
    }),

  configSelect: () =>
    http.get<RetResult>(`${BASE}/config/select`, { meta: { operate: '加载短信配置下拉列表' } }),
}
