import type { RetResult, SelectDataResp } from './types'
import { http } from '@/plugins/axios'

const _n = '存储服务'
const BASE = 'system/oss'

/** 存储配置列表项 */
export interface OssConfigItem {
  id: string
  key: string
  name: string
  platform: number
  region: string
  publicEndpoint: string
  privateEndpoint: string
  accessKey: string
  remark: string
  createdTime: string
}

/** 存储配置列表响应 */
export interface OssListResp {
  configs: OssConfigItem[]
  total: number
}

/** 存储空间项 */
export interface OssBucketItem {
  id: string
  configKey: string
  name: string
  remark: string
  createdTime: string
}

/** 文件分组项 */
export interface OssFileGroupItem {
  id: string
  key: string
  configKey: string
  name: string
  bucketName: string
  bucketDomain: string
  baseDir: string
  allowExtension: string
  secretType: number
  secretLevel: number
  remark: string
  createdTime: string
}

/** 存储配置详情响应 */
export interface OssConfigResp {
  id: string
  key: string
  name: string
  platform: number
  region: string
  publicEndpoint: string
  privateEndpoint: string
  accessKey: string
  remark: string
  createdTime: string
  buckets: OssBucketItem[]
  fileGroups: OssFileGroupItem[]
}

/** 存储文件项 */
export interface OssFileItem {
  id: string
  configKey: string
  groupKey: string
  path: string
  size: number
  ext: string
  uploaderId: string
  createdTime: string
}

/** 存储文件列表响应 */
export interface OssFileListResp {
  files: OssFileItem[]
  total: number
}

/** 文件分组列表响应 */
export interface OssFileGroupListResp {
  fileGroups: OssFileGroupItem[]
  total: number
}

/** 文件分组详情响应 */
export interface OssFileGroupResp {
  id: string
  key: string
  configKey: string
  name: string
  bucketName: string
  bucketDomain: string
  baseDir: string
  allowExtension: string
  secretType: number
  secretLevel: number
  remark: string
  createdTime: string
}

/** 存储空间列表响应 */
export interface OssBucketListResp {
  buckets: OssBucketItem[]
  total: number
}

/** 存储配置更新请求 */
export interface OssConfigUpdateReq {
  key: string
  name: string
  platform: number
  region: string
  publicEndpoint: string
  privateEndpoint: string
  accessKey: string
  accessSecret: string
  remark: string
}

/** 文件分组更新请求 */
export interface OssFileGroupUpdateReq {
  key: string
  configKey: string
  name: string
  bucketName: string
  bucketDomain: string
  baseDir: string
  allowExtension: string
  secretType: number
  secretLevel: number
  remark: string
}

/** 存储空间更新请求 */
export interface OssBucketUpdateReq {
  configKey: string
  name: string
}

export const ossApi = {
  urls: {
    list: BASE,
    fileList: `${BASE}/file`,
    fileGroupList: `${BASE}/fileGroup`,
    bucketList: `${BASE}/bucket`
  },

  list: (params: Record<string, any>) =>
    http.get<RetResult<OssListResp>>(BASE, { params, meta: { operate: `加载${_n}列表` } }),

  detail: (id: string) => http.get<RetResult<OssConfigResp>>(`${BASE}/${id}`, { meta: { operate: `加载${_n}信息` } }),

  create: (data: OssConfigUpdateReq) =>
    http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: `新增${_n}` } }),

  update: (id: string, data: OssConfigUpdateReq) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, { meta: { operate: `编辑${_n}` } }),

  remove: (id: string) => http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: `删除${_n}` } }),

  configSelect: () =>
    http.get<RetResult<SelectDataResp>>(`${BASE}/config/select`, {
      meta: { operate: '加载存储配置下拉列表' }
    }),

  fileList: (params: Record<string, any>) =>
    http.get<RetResult<OssFileListResp>>(`${BASE}/file`, {
      params,
      meta: { operate: '加载存储文件列表' }
    }),

  fileRemove: (id: string) =>
    http.post<RetResult>(`${BASE}/file/remove/${id}`, null, { meta: { operate: '删除存储文件' } }),

  fileGroupList: (params: Record<string, any>) =>
    http.get<RetResult<OssFileGroupListResp>>(`${BASE}/fileGroup`, {
      params,
      meta: { operate: '加载文件分组列表' }
    }),

  fileGroupDetail: (id: string) =>
    http.get<RetResult<OssFileGroupResp>>(`${BASE}/fileGroup/${id}`, {
      meta: { operate: '加载文件分组信息' }
    }),

  fileGroupCreate: (data: OssFileGroupUpdateReq) =>
    http.post<RetResult>(`${BASE}/fileGroup/update`, data, { meta: { operate: '新增文件分组' } }),

  fileGroupUpdate: (id: string, data: OssFileGroupUpdateReq) =>
    http.post<RetResult>(`${BASE}/fileGroup/update/${id}`, data, {
      meta: { operate: '编辑文件分组' }
    }),

  fileGroupRemove: (id: string) =>
    http.post<RetResult>(`${BASE}/fileGroup/remove/${id}`, null, {
      meta: { operate: '删除文件分组' }
    }),

  fileGroupSelect: () =>
    http.get<RetResult<SelectDataResp>>(`${BASE}/fileGroup/select`, {
      meta: { operate: '加载文件分组下拉列表' }
    }),

  fileGroupSelectByConfig: (configKey: string) =>
    http.get<RetResult<SelectDataResp>>(`${BASE}/fileGroup/select/${configKey}`, {
      meta: { operate: '加载指定配置的文件分组' }
    }),

  bucketList: (params: Record<string, any>) =>
    http.get<RetResult<OssBucketListResp>>(`${BASE}/bucket`, {
      params,
      meta: { operate: '加载存储空间列表' }
    }),

  bucketCreate: (data: OssBucketUpdateReq) =>
    http.post<RetResult>(`${BASE}/bucket/update`, data, { meta: { operate: '新增存储空间' } }),

  bucketUpdate: (id: string, data: OssBucketUpdateReq) =>
    http.post<RetResult>(`${BASE}/bucket/update/${id}`, data, {
      meta: { operate: '编辑存储空间' }
    }),

  bucketRemove: (id: string) =>
    http.post<RetResult>(`${BASE}/bucket/remove/${id}`, null, {
      meta: { operate: '删除存储空间' }
    })
}
