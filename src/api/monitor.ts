import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const BASE = 'system/monitor'

/** 系统日志项 */
export interface SystemLogItem {
  appId: string
  appVersion: string
  operationType: string
  operationGroup: string
  operationName: string
  operationSpend: number
  operationMethod: string
  operationUrl: string
  operationParam: string
  operationTime: string
  clientIp: string
  clientDevice: string
  clientUser: string
  clientUsername: string
  responseCode: number
  responseMsg: string
  responseData: string
}

/** 日志列表响应 */
export interface MonitorLogListResp {
  items: SystemLogItem[]
  total: number
}

export const monitorApi = {
  urls: { logList: `${BASE}/log` },

  logList: (params: Record<string, any>) =>
    http.get<RetResult<MonitorLogListResp>>(`${BASE}/log`, {
      params,
      meta: { operate: "加载系统日志列表" },
    }),

  cacheInfo: () => http.get<RetResult>(`${BASE}/cache`, { meta: { operate: "加载缓存信息" } }),

  serverInfo: () => http.get<RetResult>(`${BASE}/server`, { meta: { operate: "加载服务器信息" } }),
};
