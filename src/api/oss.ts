import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const _n = '存储服务'
const BASE = 'system/oss'

export interface OssListResp {
  configs: any[]
  total: number
}

export interface OssFileListResp {
  files: any[]
  total: number
}

export interface OssFileGroupListResp {
  fileGroups: any[]
  total: number
}

export interface OssBucketListResp {
  buckets: any[]
  total: number
}

export const ossApi = {
  urls: {
    list: BASE,
    fileList: `${BASE}/file`,
    fileGroupList: `${BASE}/fileGroup`,
    bucketList: `${BASE}/bucket`,
  },

  list: (params: Record<string, any>) =>
    http.get<RetResult<OssListResp>>(BASE, { params, meta: { operate: `加载${_n}列表` } }),

  detail: (id: string) =>
    http.get<RetResult>(`${BASE}/${id}`, { meta: { operate: `加载${_n}信息` } }),

  create: (data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: `新增${_n}` } }),

  update: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, { meta: { operate: `编辑${_n}` } }),

  remove: (id: string) =>
    http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: `删除${_n}` } }),

  configSelect: () =>
    http.get<RetResult>(`${BASE}/config/select`, { meta: { operate: '加载存储配置下拉列表' } }),

  fileList: (params: Record<string, any>) =>
    http.get<RetResult<OssFileListResp>>(`${BASE}/file`, {
      params,
      meta: { operate: '加载存储文件列表' },
    }),

  fileRemove: (id: string) =>
    http.post<RetResult>(`${BASE}/file/remove/${id}`, null, { meta: { operate: '删除存储文件' } }),

  fileGroupList: (params: Record<string, any>) =>
    http.get<RetResult<OssFileGroupListResp>>(`${BASE}/fileGroup`, {
      params,
      meta: { operate: '加载文件分组列表' },
    }),

  fileGroupDetail: (id: string) =>
    http.get<RetResult>(`${BASE}/fileGroup/${id}`, { meta: { operate: '加载文件分组信息' } }),

  fileGroupCreate: (data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/fileGroup/update`, data, { meta: { operate: '新增文件分组' } }),

  fileGroupUpdate: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/fileGroup/update/${id}`, data, { meta: { operate: '编辑文件分组' } }),

  fileGroupRemove: (id: string) =>
    http.post<RetResult>(`${BASE}/fileGroup/remove/${id}`, null, { meta: { operate: '删除文件分组' } }),

  fileGroupSelect: () =>
    http.get<RetResult>(`${BASE}/fileGroup/select`, { meta: { operate: '加载文件分组下拉列表' } }),

  fileGroupSelectByConfig: (configKey: string) =>
    http.get<RetResult>(`${BASE}/fileGroup/select/${configKey}`, {
      meta: { operate: '加载指定配置的文件分组' },
    }),

  bucketList: (params: Record<string, any>) =>
    http.get<RetResult<OssBucketListResp>>(`${BASE}/bucket`, {
      params,
      meta: { operate: '加载存储空间列表' },
    }),

  bucketCreate: (data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/bucket/update`, data, { meta: { operate: '新增存储空间' } }),

  bucketUpdate: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/bucket/update/${id}`, data, { meta: { operate: '编辑存储空间' } }),

  bucketRemove: (id: string) =>
    http.post<RetResult>(`${BASE}/bucket/remove/${id}`, null, { meta: { operate: '删除存储空间' } }),
}
