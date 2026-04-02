import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const BASE = 'system/monitor'

export interface MonitorLogListResp {
  items: any[]
  total: number
}

export const monitorApi = {
  urls: { logList: `${BASE}/log` },

  logList: (params: Record<string, any>) =>
    http.get<RetResult<MonitorLogListResp>>(`${BASE}/log`, {
      params,
      meta: { operate: '加载系统日志列表' },
    }),

  cacheInfo: () =>
    http.get<RetResult>(`${BASE}/cache`, { meta: { operate: '加载缓存信息' } }),

  serverInfo: () =>
    http.get<RetResult>(`${BASE}/server`, { meta: { operate: '加载服务器信息' } }),
}
