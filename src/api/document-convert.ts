import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const BASE = 'system/tool/document'

/** 转换类型信息 */
export interface DocumentConvertTypeItem {
  code: string
  displayName: string
  sourceExtensions: string
  targetExtension: string
}

/** 转换任务提交响应 */
export interface DocumentConvertSubmitResp {
  taskId: string
}

export const documentConvertApi = {
  /** 获取支持的转换类型列表 */
  getTypes: () =>
    http.get<RetResult<DocumentConvertTypeItem[]>>(`${BASE}/convert/types`, {
      meta: { operate: '加载转换类型列表', notify: false }
    }),

  /** 提交文档转换任务（multipart 上传） */
  submit: (file: File, type: string) => {
    const formData = new FormData()
    formData.append('file', file)
    return http.post<RetResult<DocumentConvertSubmitResp>>(`${BASE}/convert`, formData, {
      params: { type },
      meta: { operate: '提交文档转换任务', skipEncryption: true }
    })
  },

  /** 下载转换结果文件（返回 Blob） */
  downloadResult: (taskId: string) =>
    http.get(`${BASE}/convert/download/${taskId}`, {
      responseType: 'blob',
      meta: { operate: '下载转换结果', skipEncryption: true, notify: false }
    })
}
