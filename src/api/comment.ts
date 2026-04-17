import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const BASE = 'system/comment'

/** 评论项 */
export interface CommentItem {
  id: string
  bizType: string
  bizId: string
  content: string
  mentionedIds: string[] | null
  attachmentIds: string[] | null
  pinned: number
  createdBy: string
  createdByType: number
  authorName: string
  createdTime: string
  updatedTime: string
  mine: boolean
  editable: boolean
  reactions: Record<string, ReactionUser[]>
}

/** 反应用户 */
export interface ReactionUser {
  operatorId: string
  operatorName: string
}

/** 评论列表响应 */
export interface CommentListResp {
  items: CommentItem[]
  total: number
}

/** 批量计数响应 */
export interface CommentBatchCountResp {
  counts: Record<string, number>
}

export const commentApi = {
  list: (params: { bizType: string; bizId: string; keyword?: string }) =>
    http.get<RetResult<CommentListResp>>(BASE, {
      params,
      meta: { operate: '查询评论列表' }
    }),

  add: (data: { bizType: string; bizId: string; content: string; mentionedIds?: string[]; attachmentIds?: string[] }) =>
    http.post<RetResult<string>>(BASE, data, {
      meta: { operate: '发表评论', notify: true }
    }),

  update: (id: string, data: { content: string; mentionedIds?: string[]; attachmentIds?: string[] }) =>
    http.post<RetResult<null>>(`${BASE}/update/${id}`, data, {
      meta: { operate: '编辑评论', notify: true }
    }),

  remove: (id: string) =>
    http.post<RetResult<null>>(`${BASE}/remove/${id}`, null, {
      meta: { operate: '删除评论', notify: true }
    }),

  togglePin: (id: string) =>
    http.post<RetResult<null>>(`${BASE}/${id}/pin`, null, {
      meta: { operate: '切换评论置顶' }
    }),

  batchCount: (data: { bizType: string; bizIds: string[] }) =>
    http.post<RetResult<CommentBatchCountResp>>(`${BASE}/count/batch`, data, {
      meta: { operate: '查询评论数' }
    }),

  toggleReaction: (commentId: string, data: { emoji: string }) =>
    http.post<RetResult<boolean>>(`${BASE}/${commentId}/reaction`, data, {
      meta: { operate: '切换评论反应' }
    })
}
