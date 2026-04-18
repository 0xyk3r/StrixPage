import type { RetResult } from './types'
import { http } from '@/plugins/axios'

// ======================== Types ========================

/** 浏览请求参数 */
export interface BrowseReq {
  groupKey: string
  prefix?: string
  sortBy?: string
  sortOrder?: string
  keyword?: string
}

/** 创建目录请求 */
export interface MkdirReq {
  groupKey: string
  parentPrefix?: string
  dirName: string
}

/** 重命名请求 */
export interface RenameReq {
  fileId: string
  newName: string
}

/** 移动请求 */
export interface MoveReq {
  fileIds: string[]
  targetGroupKey: string
  targetPrefix?: string
}

/** 复制请求 */
export interface CopyReq {
  fileIds: string[]
  targetGroupKey: string
  targetPrefix?: string
}

/** 批量删除请求 */
export interface BatchRemoveReq {
  fileIds: string[]
}

/** 目录项 */
export interface DirectoryItem {
  name: string
  path: string
  fileCount: number
}

/** 文件项 */
export interface BrowseFileItem {
  id: string
  originalName: string
  path: string
  size: number
  ext: string
  contentType: string
  createdTime: string
  createdBy: string
}

/** 浏览响应 */
export interface BrowseResp {
  groupKey: string
  prefix: string
  directories: DirectoryItem[]
  files: BrowseFileItem[]
  breadcrumb: string[]
}

/** 压缩包条目 */
export interface ArchiveEntry {
  path: string
  size: number
  compressed: number
  isDirectory: boolean
}

/** 压缩包内容响应 */
export interface ArchiveListResp {
  entries: ArchiveEntry[]
  totalFiles: number
  totalSize: number
}

// ======================== API ========================

const BASE = 'system/oss/file/browse'

export const ossBrowseApi = {
  browse: (params: BrowseReq) =>
    http.get<RetResult<BrowseResp>>(BASE, {
      params,
      meta: { operate: '浏览文件' }
    }),

  mkdir: (data: MkdirReq) =>
    http.post<RetResult<object>>(`${BASE}/mkdir`, data, {
      meta: { operate: '创建目录', notify: true }
    }),

  rename: (data: RenameReq) =>
    http.post<RetResult<object>>(`${BASE}/rename`, data, {
      meta: { operate: '重命名文件', notify: true }
    }),

  move: (data: MoveReq) =>
    http.post<RetResult<object>>(`${BASE}/move`, data, {
      meta: { operate: '移动文件', notify: true }
    }),

  copy: (data: CopyReq) =>
    http.post<RetResult<object>>(`${BASE}/copy`, data, {
      meta: { operate: '复制文件', notify: true }
    }),

  batchRemove: (data: BatchRemoveReq) =>
    http.post<RetResult<object>>(`${BASE}/batch/remove`, data, {
      meta: { operate: '批量删除文件', notify: true }
    }),

  batchMove: (data: MoveReq) =>
    http.post<RetResult<object>>(`${BASE}/batch/move`, data, {
      meta: { operate: '批量移动文件', notify: true }
    }),

  getPreviewUrl: (fileId: string) =>
    http.get<RetResult<string>>(`${BASE}/preview/${fileId}`, {
      meta: { operate: '获取预览地址' }
    }),

  listArchive: (fileId: string) =>
    http.get<RetResult<ArchiveListResp>>(`${BASE}/archive/${fileId}/list`, {
      meta: { operate: '查看压缩包内容' }
    })
}
