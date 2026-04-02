import type { RetResult, SelectDataResp } from './types'
import { http } from '@/plugins/axios'

const BASE = 'system/workflow'
const CONFIG_BASE = `${BASE}/config`

/** 流程版本配置 */
export interface WorkflowConfigItem {
  id: string
  workflowId: string
  version: number
  content: string
  createdTime: string
}

/** 流程引擎列表项 */
export interface WorkflowItem {
  id: string
  name: string
  configs: WorkflowConfigItem[]
  createdTime: string
}

/** 流程引擎列表响应 */
export interface WorkflowConfigListResp {
  items: WorkflowItem[]
  total: number
}

/** 流程引擎详情响应 */
export interface WorkflowResp {
  id: string
  name: string
}

/** 流程绘制数据响应 */
export interface WorkflowConfigResp {
  id: string
  workflowId: string
  version: number
  content: string
  createdTime: string
}

/** 待处理任务项 */
export interface UnfinishedTaskItem {
  id: string
  workflowId: string
  instanceId: string
  workflowConfigId: string
  nodeId: string
  nodeType: string
  operatorId: string
  operationType: number
  instanceName: string
  instanceCreatedByType: number
  instanceCreatedBy: string
  instanceCreatedTime: string
  taskAssignStartTime: string
}

/** 已处理任务项 */
export interface FinishedTaskItem {
  id: string
  workflowId: string
  instanceId: string
  workflowConfigId: string
  nodeId: string
  nodeType: string
  operatorId: string
  operationType: number
  instanceName: string
  instanceCreatedByType: number
  instanceCreatedBy: string
  instanceCreatedTime: string
  taskAssignStartTime: string
  taskAssignEndTime: string
  startTime: string
  endTime: string
}

/** 待处理任务列表响应 */
export interface WorkflowTaskUnfinishedListResp {
  items: UnfinishedTaskItem[]
  total: number
}

/** 已处理任务列表响应 */
export interface WorkflowTaskFinishedListResp {
  items: FinishedTaskItem[]
  total: number
}

/** 流程引擎更新请求 */
export interface WorkflowUpdateReq {
  name: string
}

/** 流程绘制更新请求 */
export interface WorkflowConfigUpdateReq {
  content: string
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
    http.get<RetResult<WorkflowResp>>(`${CONFIG_BASE}/${id}`, { meta: { operate: '加载流程引擎信息' } }),

  configCreate: (data: WorkflowUpdateReq) =>
    http.post<RetResult>(`${CONFIG_BASE}/update`, data, { meta: { operate: '新增流程引擎' } }),

  configUpdate: (id: string, data: WorkflowUpdateReq) =>
    http.post<RetResult>(`${CONFIG_BASE}/update/${id}`, data, { meta: { operate: '编辑流程引擎' } }),

  configUpdateContent: (id: string, data: WorkflowConfigUpdateReq) =>
    http.post<RetResult>(`${CONFIG_BASE}/update/${id}/config`, data, {
      meta: { operate: '保存流程绘制' },
    }),

  configRemove: (id: string) =>
    http.post<RetResult>(`${CONFIG_BASE}/remove/${id}`, null, { meta: { operate: '删除流程引擎' } }),

  configSelect: () =>
    http.get<RetResult<SelectDataResp>>(`${CONFIG_BASE}/select`, { meta: { operate: '加载流程引擎下拉列表' } }),

  configGetConfig: (configId: string) =>
    http.get<RetResult<WorkflowConfigResp>>(`${CONFIG_BASE}/config/${configId}`, {
      meta: { operate: '加载流程绘制数据' },
    }),

  unfinishedList: (params: Record<string, any>) =>
    http.get<RetResult<WorkflowTaskUnfinishedListResp>>(`${BASE}/unfinished`, {
      params,
      meta: { operate: '加载待处理工作列表' },
    }),

  finishedList: (params: Record<string, any>) =>
    http.get<RetResult<WorkflowTaskFinishedListResp>>(`${BASE}/finished`, {
      params,
      meta: { operate: '加载已处理工作列表' },
    }),

  initiatedList: (params: Record<string, any>) =>
    http.get<RetResult<WorkflowTaskUnfinishedListResp>>(`${BASE}/initiated`, {
      params,
      meta: { operate: '加载我发起的工作列表' },
    }),

  ccList: (params: Record<string, any>) =>
    http.get<RetResult<WorkflowTaskUnfinishedListResp>>(`${BASE}/cc`, {
      params,
      meta: { operate: '加载抄送我的工作列表' },
    }),

  configDataList: (configId: string, params: Record<string, any>) =>
    http.get<RetResult>(`${CONFIG_BASE}/${configId}/data`, {
      params,
      meta: { operate: '加载引擎版本数据列表' },
    }),

  configDataRemove: (configId: string, dataId: string) =>
    http.post<RetResult>(`${CONFIG_BASE}/${configId}/data/remove/${dataId}`, null, {
      meta: { operate: '删除引擎版本数据' },
    }),
}
