import type { RetResult } from './types'
import { http } from '@/plugins/axios'

// ==================== Type Definitions ====================

export type NodeType =
  | 'START' | 'END' | 'APPROVAL' | 'CC' | 'CONDITION' | 'CONDITION_GROUP'
  | 'PARALLEL' | 'DELAY' | 'TRIGGER' | 'JUMP' | 'SUB_PROCESS'

export type ApprovalMode = 'ANY' | 'ALL' | 'SEQUENTIAL'
export type AssigneeType = 'MANAGER' | 'ROLE' | 'INITIATOR' | 'INITIATOR_DEPT_LEADER'
export type InstanceStatus = 'RUNNING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED' | 'SUSPENDED'
export type TaskStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN' | 'DELEGATED' | 'SKIPPED'

// ---- Graph model ----

export interface WorkflowNode {
  id: string
  type: NodeType
  name: string
  config: Record<string, any>
  x?: number
  y?: number
}

export interface WorkflowEdge {
  id: string
  sourceNodeId: string
  targetNodeId: string
  conditionExpression?: string
  sortOrder?: number
}

export interface WorkflowGraph {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

// ---- Designer tree model (frontend only) ----

export interface DesignerBranch {
  id: string
  name: string
  conditionExpression?: string
  sortOrder: number
  children: DesignerTreeNode[]
}

export interface DesignerTreeNode {
  id: string
  type: NodeType
  name: string
  config: Record<string, any>
  branches?: DesignerBranch[]  // For CONDITION_GROUP / PARALLEL
  next?: DesignerTreeNode      // Sequential next node
}

// ---- Definition ----

export interface WfDefinition {
  id: string
  name: string
  key: string
  category?: string
  description?: string
  iconUrl?: string
  status: number
  latestVersionId?: string
  publishedVersionId?: string
  createdTime: string
  updatedTime: string
}

export interface WfDefinitionVersion {
  id: string
  definitionId: string
  versionNumber: number
  graphJson: string
  changeLog?: string
  status: number
  publishedTime?: string
  createdTime: string
}

// ---- Instance ----

export interface WfInstance {
  id: string
  definitionId: string
  versionId: string
  title: string
  initiatorId: string
  initiatorName?: string
  status: number
  bizType?: string
  bizId?: string
  startTime: string
  endTime?: string
  variables?: string
}

// ---- Task ----

export interface WfTask {
  id: string
  instanceId: string
  instanceTitle?: string
  definitionName?: string
  nodeId: string
  nodeName: string
  nodeType?: string
  taskType: number
  approvalMode: number
  createdTime: string
}

// ---- Task Assignee ----

export interface WfTaskAssignee {
  id: string
  taskId: string
  assigneeId: string
  assigneeName?: string
  status: number
  comment?: string
  operateTime?: string
}

// ---- Log ----

export interface WfLog {
  id: string
  instanceId: string
  nodeId: string
  nodeName: string
  action: string
  operatorId?: string
  operatorName?: string
  comment?: string
  detail?: string
  createdTime: string
}

// ---- Delegation ----

export interface WfDelegation {
  id: string
  delegatorId: string
  delegateId: string
  definitionId?: string
  startTime: string
  endTime: string
}

// ---- Trigger / Condition info ----

export interface TriggerItem {
  key: string
  name: string
  description: string
}

// ---- Stats ----

export interface WfStatsResp {
  totalDefinitions: number
  activeDefinitions: number
  runningInstances: number
  completedToday: number
  pendingTasks: number
  avgCompletionTime: number
}

// ---- List responses ----

export interface WfDefinitionListResp {
  items: WfDefinition[]
  total: number
}

export interface WfInstanceListResp {
  items: WfInstance[]
  total: number
}

export interface WfTaskListResp {
  items: WfTask[]
  total: number
}

export interface WfLogListResp {
  items: WfLog[]
  total: number
}

export interface WfVersionListResp {
  items: WfDefinitionVersion[]
  total: number
}

// ==================== API Methods ====================

const _n = '工作流'

export const workflowApi = {
  // ---- Definition CRUD ----
  urls: { definitionList: 'workflow/definitions' },

  definitionList: (params: Record<string, any>) =>
    http.get<RetResult<WfDefinitionListResp>>('workflow/definitions', {
      params,
      meta: { operate: `加载${_n}定义列表` }
    }),

  definitionDetail: (id: string) =>
    http.get<RetResult<WfDefinition>>(`workflow/definitions/${id}`, {
      meta: { operate: `加载${_n}定义` }
    }),

  definitionCreate: (data: { name: string; key: string; category?: string; description?: string }) =>
    http.post<RetResult<string>>('workflow/definitions', data, {
      meta: { operate: `创建${_n}定义` }
    }),

  definitionUpdate: (id: string, data: { name?: string; category?: string; description?: string; iconUrl?: string }) =>
    http.put<RetResult>(`workflow/definitions/${id}`, data, {
      meta: { operate: `更新${_n}定义` }
    }),

  definitionRemove: (id: string) =>
    http.delete<RetResult>(`workflow/definitions/${id}`, {
      meta: { operate: `删除${_n}定义` }
    }),

  definitionEnable: (id: string) =>
    http.post<RetResult>(`workflow/definitions/${id}/enable`, null, {
      meta: { operate: `启用${_n}` }
    }),

  definitionDisable: (id: string) =>
    http.post<RetResult>(`workflow/definitions/${id}/disable`, null, {
      meta: { operate: `停用${_n}` }
    }),

  // ---- Versions ----
  versionList: (definitionId: string, params?: Record<string, any>) =>
    http.get<RetResult<WfVersionListResp>>(`workflow/definitions/${definitionId}/versions`, {
      params,
      meta: { operate: `加载${_n}版本列表` }
    }),

  versionDetail: (definitionId: string, versionId: string) =>
    http.get<RetResult<WfDefinitionVersion>>(`workflow/definitions/${definitionId}/versions/${versionId}`, {
      meta: { operate: `加载${_n}版本详情` }
    }),

  versionSave: (definitionId: string, data: { graphJson: string; changeLog?: string }) =>
    http.post<RetResult<string>>(`workflow/definitions/${definitionId}/versions`, data, {
      meta: { operate: `保存${_n}版本` }
    }),

  versionPublish: (definitionId: string, versionId: string) =>
    http.post<RetResult>(`workflow/definitions/${definitionId}/versions/${versionId}/publish`, null, {
      meta: { operate: `发布${_n}版本` }
    }),

  // ---- Instances ----
  instanceList: (params: Record<string, any>) =>
    http.get<RetResult<WfInstanceListResp>>('workflow/instances', {
      params,
      meta: { operate: `加载${_n}流程实例列表` }
    }),

  instanceDetail: (id: string) =>
    http.get<RetResult<WfInstance>>(`workflow/instances/${id}`, {
      meta: { operate: `加载${_n}流程实例` }
    }),

  instanceStart: (data: { definitionId: string; title: string; bizType?: string; bizId?: string; variables?: Record<string, any> }) =>
    http.post<RetResult<string>>('workflow/instances', data, {
      meta: { operate: `发起${_n}流程` }
    }),

  instanceCancel: (id: string, data: { reason?: string }) =>
    http.post<RetResult>(`workflow/instances/${id}/cancel`, data, {
      meta: { operate: `撤销${_n}流程` }
    }),

  instanceSuspend: (id: string) =>
    http.post<RetResult>(`workflow/instances/${id}/suspend`, null, {
      meta: { operate: `挂起${_n}流程` }
    }),

  instanceResume: (id: string) =>
    http.post<RetResult>(`workflow/instances/${id}/resume`, null, {
      meta: { operate: `恢复${_n}流程` }
    }),

  instanceLogs: (id: string, params?: Record<string, any>) =>
    http.get<RetResult<WfLogListResp>>(`workflow/instances/${id}/logs`, {
      params,
      meta: { operate: `加载${_n}流程日志` }
    }),

  instanceGraph: (id: string) =>
    http.get<RetResult<{ graphJson: string; activeNodeIds: string[]; completedNodeIds: string[] }>>(`workflow/instances/${id}/graph`, {
      meta: { operate: `加载${_n}流程图` }
    }),

  // ---- Tasks ----
  tasksMine: (params?: Record<string, any>) =>
    http.get<RetResult<WfTaskListResp>>('workflow/tasks/mine', {
      params,
      meta: { operate: `加载我的待办` }
    }),

  tasksDone: (params?: Record<string, any>) =>
    http.get<RetResult<WfTaskListResp>>('workflow/tasks/done', {
      params,
      meta: { operate: `加载已处理` }
    }),

  tasksInitiated: (params?: Record<string, any>) =>
    http.get<RetResult<WfTaskListResp>>('workflow/tasks/initiated', {
      params,
      meta: { operate: `加载我发起的` }
    }),

  taskApprove: (id: string, data: { comment?: string }) =>
    http.post<RetResult>(`workflow/tasks/${id}/approve`, data, {
      meta: { operate: `通过审批` }
    }),

  taskReject: (id: string, data: { comment?: string; reason: string }) =>
    http.post<RetResult>(`workflow/tasks/${id}/reject`, data, {
      meta: { operate: `拒绝审批` }
    }),

  taskReturn: (id: string, data: { targetNodeId: string; comment?: string }) =>
    http.post<RetResult>(`workflow/tasks/${id}/return`, data, {
      meta: { operate: `回退` }
    }),

  taskDelegate: (id: string, data: { delegateId: string; comment?: string }) =>
    http.post<RetResult>(`workflow/tasks/${id}/delegate`, data, {
      meta: { operate: `转办` }
    }),

  taskCountersign: (id: string, data: { assigneeIds: string[]; comment?: string }) =>
    http.post<RetResult>(`workflow/tasks/${id}/countersign`, data, {
      meta: { operate: `加签` }
    }),

  taskRemoveSign: (id: string, data: { assigneeId: string; comment?: string }) =>
    http.post<RetResult>(`workflow/tasks/${id}/remove-sign`, data, {
      meta: { operate: `降签` }
    }),

  taskWithdraw: (id: string) =>
    http.post<RetResult>(`workflow/tasks/${id}/withdraw`, null, {
      meta: { operate: `撕回` }
    }),

  taskUrge: (id: string) =>
    http.post<RetResult>(`workflow/tasks/${id}/urge`, null, {
      meta: { operate: `催办` }
    }),

  // ---- Admin ----
  triggerList: () =>
    http.get<RetResult<{ items: TriggerItem[] }>>('workflow/triggers', {
      meta: { operate: `加载触发器列表` }
    }),

  conditionList: () =>
    http.get<RetResult<{ items: TriggerItem[] }>>('workflow/conditions', {
      meta: { operate: `加载条件列表` }
    }),

  delegationList: () =>
    http.get<RetResult<WfDelegation[]>>('workflow/delegations', {
      meta: { operate: `加载代理列表` }
    }),

  delegationCreate: (data: { delegateId: string; definitionId?: string; startTime: string; endTime: string }) =>
    http.post<RetResult<string>>('workflow/delegations', data, {
      meta: { operate: `设置代理` }
    }),

  delegationRemove: (id: string) =>
    http.delete<RetResult>(`workflow/delegations/${id}`, {
      meta: { operate: `撤销代理` }
    }),

  stats: () =>
    http.get<RetResult<WfStatsResp>>('workflow/stats', {
      meta: { operate: `加载统计数据` }
    })
}
