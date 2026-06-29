import { http } from '@/plugins/axios'
import type { RetResult } from './types'

const BASE = 'system/tool/document/ai'

/** 模型简要信息 */
export interface DocumentAiModelItem {
  key: string
  name: string
  modelName: string
  type: number
}

/** 分析任务提交响应 */
export interface DocumentAiSubmitResp {
  taskId: string
  totalPages: number
  totalBatches: number
  batchDescriptions: string[]
  /** 每批次的页面索引范围 [startInclusive, endInclusive]（0-based） */
  batchPageRanges: [number, number][]
}

/** 任务提交请求参数 */
export interface DocumentAiSubmitReq {
  prompt: string
  visionModelKey: string
  batchSize: number
  merge: boolean
  textModelKey?: string
}

// ============================================================
// SSE 事件数据类型
// ============================================================

export interface SseStageData {
  stage: 'CONVERTING' | 'ANALYZING' | 'MERGING'
  message: string
  totalPages?: number
  totalBatches?: number
  batches?: Array<{ index: number; pageRange: string }>
}

export interface SseBatchChunkData {
  batchIndex: number
  content: string
}

export interface SseBatchDoneData {
  batchIndex: number
}

export interface SseBatchErrorData {
  batchIndex: number
  message: string
}

export interface SseMergeChunkData {
  content: string
}

export interface SseDoneData {
  message: string
}

export interface SseErrorData {
  message: string
}

// ============================================================
// API
// ============================================================

export const documentAiAnalyzeApi = {
  /** 获取可用视觉模型列表 */
  listVisionModels: () =>
    http.get<RetResult<DocumentAiModelItem[]>>(`${BASE}/models/vision`, {
      meta: { operate: '加载视觉模型列表' }
    }),

  /** 获取可用文本模型列表 */
  listTextModels: () =>
    http.get<RetResult<DocumentAiModelItem[]>>(`${BASE}/models/text`, {
      meta: { operate: '加载文本模型列表' }
    }),

  /** 提交文档 AI 分析任务 */
  submitAnalyze: (file: File, req: DocumentAiSubmitReq) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('prompt', req.prompt)
    formData.append('visionModelKey', req.visionModelKey)
    formData.append('batchSize', String(req.batchSize))
    formData.append('merge', String(req.merge))
    if (req.merge && req.textModelKey) {
      formData.append('textModelKey', req.textModelKey)
    }
    return http.post<RetResult<DocumentAiSubmitResp>>(`${BASE}/analyze`, formData, {
      meta: { operate: '提交文档 AI 分析' }
    })
  },

  /** 获取 SSE 流地址 */
  getStreamUrl: (taskId: string) => `/api/${BASE}/analyze/stream/${taskId}`,

  /** 获取指定页面图片 URL */
  getPageImageUrl: (taskId: string, pageIndex: number) =>
    `/api/${BASE}/analyze/images/${taskId}/${pageIndex}`
}
