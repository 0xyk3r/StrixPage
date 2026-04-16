import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const BASE = 'system/monitor/dashboard'

/** 今日统计 */
export interface DashboardStats {
  todayCount: number
  todayErrorCount: number
  avgResponseTime: number
  activeUserCount: number
  errorRate: number
}

/** 日趋势数据项 */
export interface DashboardTrendItem {
  date: string
  totalCount: number
  errorCount: number
  activeUserCount: number
  avgResponseTime: number
}

/** 小时分布数据项 */
export interface DashboardHourlyItem {
  hour: number
  count: number
}

/** 排名数据项 */
export interface DashboardRankItem {
  name: string
  count: number
}

/** 最近活动数据项 */
export interface DashboardRecentItem {
  username: string
  operationName: string
  operationGroup: string
  operationTime: string
  responseCode: number
  operationSpend: number
}

/** 仪表板概览响应 */
export interface DashboardOverviewResp {
  stats: DashboardStats
  trends: DashboardTrendItem[]
  hourlyDistribution: DashboardHourlyItem[]
  userRanks: DashboardRankItem[]
  moduleRanks: DashboardRankItem[]
  recentActivities: DashboardRecentItem[]
}

/** 日趋势数据响应 */
export interface DashboardTrendsResp {
  items: DashboardTrendItem[]
}

/** 小时分布数据响应 */
export interface DashboardHourlyResp {
  items: DashboardHourlyItem[]
}

/** 排名数据响应 */
export interface DashboardRanksResp {
  items: DashboardRankItem[]
}

/** 最近操作数据响应 */
export interface DashboardRecentResp {
  items: DashboardRecentItem[]
}

export const dashboardApi = {
  overview: (days = 7, rankLimit = 8, recentLimit = 10) =>
    http.get<RetResult<DashboardOverviewResp>>(`${BASE}/overview`, {
      params: { days, rankLimit, recentLimit },
      meta: { operate: '加载仪表板概览' }
    }),

  stats: () =>
    http.get<RetResult<DashboardStats>>(`${BASE}/stats`, {
      meta: { operate: '加载今日统计' }
    }),

  trends: (days = 7) =>
    http.get<RetResult<DashboardTrendsResp>>(`${BASE}/trends`, {
      params: { days },
      meta: { operate: '加载趋势数据' }
    }),

  hourly: () =>
    http.get<RetResult<DashboardHourlyResp>>(`${BASE}/hourly`, {
      meta: { operate: '加载小时分布' }
    }),

  userRanks: (days = 7, limit = 8) =>
    http.get<RetResult<DashboardRanksResp>>(`${BASE}/user-ranks`, {
      params: { days, limit },
      meta: { operate: '加载用户排名' }
    }),

  moduleRanks: (days = 7, limit = 8) =>
    http.get<RetResult<DashboardRanksResp>>(`${BASE}/module-ranks`, {
      params: { days, limit },
      meta: { operate: '加载模块排名' }
    }),

  recent: (limit = 10) =>
    http.get<RetResult<DashboardRecentResp>>(`${BASE}/recent`, {
      params: { limit },
      meta: { operate: '加载最近活动' }
    })
}
