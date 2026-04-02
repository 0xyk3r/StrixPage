import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const BASE = 'system/workflow'
const CONFIG_BASE = `${BASE}/config`

export interface WorkflowConfigListResp {
  items: any[]
  total: number
}

export interface WorkflowTaskListResp {
  items: any[]
  total: number
}

export const workflowApi = {
  urls: {
    configList: CONFIG_BASE,
    unfinishedList: `${BASE}/unfinished`,
    finishedList: `${BASE}/finished`,
    initiatedList: `${BASE}/initiated`,
    ccList: `${BASE}/cc`,
  },

  configList: (params: Record<string, any>) =>
    http.get<RetResult<WorkflowConfigListResp>>(CONFIG_BASE, {
      params,
      meta: { operate: '加载流程引擎列表' },
    }),

  configDetail: (id: string) =>
    http.get<RetResult>(`${CONFIG_BASE}/${id}`, { meta: { operate: '加载流程引擎信息' } }),

  configCreate: (data: Record<string, any>) =>
    http.post<RetResult>(`${CONFIG_BASE}/update`, data, { meta: { operate: '新增流程引擎' } }),

  configUpdate: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${CONFIG_BASE}/update/${id}`, data, { meta: { operate: '编辑流程引擎' } }),

  configUpdateContent: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${CONFIG_BASE}/update/${id}/config`, data, {
      meta: { operate: '保存流程绘制' },
    }),

  configRemove: (id: string) =>
    http.post<RetResult>(`${CONFIG_BASE}/remove/${id}`, null, { meta: { operate: '删除流程引擎' } }),

  configSelect: () =>
    http.get<RetResult>(`${CONFIG_BASE}/select`, { meta: { operate: '加载流程引擎下拉列表' } }),

  configGetConfig: (configId: string) =>
    http.get<RetResult>(`${CONFIG_BASE}/config/${configId}`, {
      meta: { operate: '加载流程绘制数据' },
    }),

  unfinishedList: (params: Record<string, any>) =>
    http.get<RetResult<WorkflowTaskListResp>>(`${BASE}/unfinished`, {
      params,
      meta: { operate: '加载待处理工作列表' },
    }),

  finishedList: (params: Record<string, any>) =>
    http.get<RetResult<WorkflowTaskListResp>>(`${BASE}/finished`, {
      params,
      meta: { operate: '加载已处理工作列表' },
    }),

  initiatedList: (params: Record<string, any>) =>
    http.get<RetResult>(`${BASE}/initiated`, {
      params,
      meta: { operate: '加载我发起的工作列表' },
    }),

  ccList: (params: Record<string, any>) =>
    http.get<RetResult>(`${BASE}/cc`, {
      params,
      meta: { operate: '加载抄送我的工作列表' },
    }),
}
