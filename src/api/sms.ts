import type { RetResult, SelectDataResp } from './types'
import { http } from '@/plugins/axios'

const _n = '短信服务'
const BASE = 'system/sms'

/** 短信配置列表项 */
export interface SmsConfigItem {
  id: string
  key: string
  name: string
  platform: number
  regionId: string
  accessKey: string
  remark: string
  createdTime: string
}

/** 短信配置列表响应 */
export interface SmsListResp {
  configs: SmsConfigItem[]
  total: number
}

/** 短信签名项 */
export interface SmsSignItem {
  id: string
  configKey: string
  name: string
  status: number
  createdTime: string
}

/** 短信模板项 */
export interface SmsTemplateItem {
  id: string
  configKey: string
  code: string
  name: string
  type: number
  status: number
  content: string
  createdTime: string
}

/** 短信配置详情响应 */
export interface SmsConfigResp {
  id: string
  key: string
  name: string
  platform: number
  regionId: string
  accessKey: string
  remark: string
  createdTime: string
  signs: SmsSignItem[]
  templates: SmsTemplateItem[]
}

/** 短信模板列表响应 */
export interface SmsTemplateListResp {
  templates: SmsTemplateItem[]
  total: number
}

/** 短信签名列表响应 */
export interface SmsSignListResp {
  signs: SmsSignItem[]
  total: number
}

/** 短信日志项 */
export interface SmsLogItem {
  id: string
  configKey: string
  platform: number
  phoneNumber: string
  requesterIp: string
  signName: string
  templateCode: string
  templateParam: string
  status: number
  platformResponse: string
  createdTime: string
}

/** 短信日志列表响应 */
export interface SmsLogListResp {
  logs: SmsLogItem[]
  total: number
}

/** 短信配置更新请求 */
export interface SmsConfigUpdateReq {
  key: string
  name: string
  platform: number
  regionId: string
  accessKey: string
  accessSecret: string
  remark: string
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
    http.get<RetResult<SmsConfigResp>>(`${BASE}/${id}`, { meta: { operate: `加载${_n}信息` } }),

  create: (data: SmsConfigUpdateReq) =>
    http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: `新增${_n}` } }),

  update: (id: string, data: SmsConfigUpdateReq) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, { meta: { operate: `编辑${_n}` } }),

  remove: (id: string) =>
    http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: `删除${_n}` } }),

  templateList: (params: Record<string, any>) =>
    http.get<RetResult<SmsTemplateListResp>>(`${BASE}/template`, {
      params,
      meta: { operate: "加载短信模板列表" },
    }),

  signList: (params: Record<string, any>) =>
    http.get<RetResult<SmsSignListResp>>(`${BASE}/sign`, {
      params,
      meta: { operate: "加载短信签名列表" },
    }),

  logList: (params: Record<string, any>) =>
    http.get<RetResult<SmsLogListResp>>(`${BASE}/log`, {
      params,
      meta: { operate: "加载短信日志列表" },
    }),

  configSelect: () =>
    http.get<RetResult<SelectDataResp>>(`${BASE}/config/select`, {
      meta: { operate: "加载短信配置下拉列表" },
    }),
};
