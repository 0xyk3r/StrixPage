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

/** 日志统计响应 */
export interface SystemLogStatsResp {
  todayCount: number
  todayErrorCount: number
  avgResponseTime: number
  activeUserCount: number
  errorRate: number
}

/** 操作分组列表响应 */
export interface LogOperationGroupsResp {
  items: string[]
}

/** 缓存信息响应 */
export interface CacheInfoResp {
  info: Record<string, string>
  dbSize: number
  commandStats: Array<{ name: string; value: string }>
}

export const monitorApi = {
  urls: { logList: `${BASE}/log` },

  logList: (params: Record<string, any>) =>
    http.get<RetResult<MonitorLogListResp>>(`${BASE}/log`, {
      params,
      meta: { operate: '加载系统日志列表' }
    }),

  logStats: () =>
    http.get<RetResult<SystemLogStatsResp>>(`${BASE}/log/stats`, {
      meta: { operate: '加载日志统计' }
    }),

  logOperationGroups: () =>
    http.get<RetResult<LogOperationGroupsResp>>(`${BASE}/log/groups`, {
      meta: { operate: '加载操作分组' }
    }),

  logCleanup: (startTime: string, endTime: string) =>
    http.delete<RetResult<number>>(`${BASE}/log/cleanup`, {
      params: { startTime, endTime },
      meta: { operate: '清理操作日志', notify: true }
    }),

  cacheInfo: () => http.get<RetResult<CacheInfoResp>>(`${BASE}/cache`, { meta: { operate: '加载缓存信息' } }),

  serverInfo: () => http.get<RetResult>(`${BASE}/server`, { meta: { operate: '加载服务器信息' } })
}
