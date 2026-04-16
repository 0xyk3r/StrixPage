import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const BASE = 'system/dict-group'

/** 字典分组列表项 */
export interface DictGroupItem {
  id: string
  name: string
  icon: string | null
  sortValue: number
  dictCount: number
}

/** 字典分组列表响应 */
export interface DictGroupListResp {
  items: DictGroupItem[]
}

export const dictGroupApi = {
  list: () =>
    http.get<RetResult<DictGroupListResp>>(BASE, { meta: { operate: '加载字典分组列表' } }),

  add: (data: { name: string; icon?: string; sortValue?: number }) =>
    http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: '新增字典分组', notify: true } }),

  update: (id: string, data: { name: string; icon?: string; sortValue?: number }) =>
    http.post<RetResult>(`${BASE}/${id}`, data, { meta: { operate: '修改字典分组', notify: true } }),

  remove: (id: string) =>
    http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: '删除字典分组', notify: true } })
}
