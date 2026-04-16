import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const BASE = 'system/config'

/** 系统配置项 */
export interface SystemConfigItem {
  id: string
  key: string
  name: string
  type: number
  value: string
  remark: string
  createdTime: string
  updatedTime: string
}

/** 系统配置列表响应 */
export interface SystemConfigListResp {
  items: SystemConfigItem[]
}

export const systemConfigApi = {
  list: (params?: { keyword?: string }) =>
    http.get<RetResult<SystemConfigListResp>>(BASE, {
      params,
      meta: { operate: '查询配置列表' }
    }),

  detail: (id: string) =>
    http.get<RetResult<SystemConfigItem>>(`${BASE}/${id}`, {
      meta: { operate: '查询配置详情' }
    }),

  add: (data: Partial<SystemConfigItem>) =>
    http.post<RetResult<null>>(`${BASE}/add`, data, {
      meta: { operate: '新增配置', notify: true }
    }),

  update: (id: string, data: Partial<SystemConfigItem>) =>
    http.post<RetResult<null>>(`${BASE}/update/${id}`, data, {
      meta: { operate: '修改配置', notify: true }
    }),

  remove: (id: string) =>
    http.post<RetResult<null>>(`${BASE}/remove/${id}`, null, {
      meta: { operate: '删除配置', notify: true }
    })
}
