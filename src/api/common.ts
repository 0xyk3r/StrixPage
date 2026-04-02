import type { RetResult } from './types'
import { http } from '@/plugins/axios'

/** 验证码获取响应 */
export interface CaptchaGetResp {
  uuid: string
  originalImageBase64: string
  jigsawImageBase64: string
  secretKey: string
}

/** 验证码校验响应 */
export interface CaptchaCheckResp {
  result: boolean
  captchaVerification: string
}

/** 字典版本项 */
export interface DictVersionItem {
  key: string
  version: number
}

/** 字典版本响应 */
export interface DictVersionResp {
  items: DictVersionItem[]
}

/** 字典数据项 (通用接口用) */
export interface CommonDictDataItem {
  id: string
  key: string
  value: string
  label: string
  sort: number
  style: string
  status: number
  remark: string
}

/** 通用字典响应 */
export interface CommonDictResp {
  id: string
  key: string
  dataType: number
  version: number
  dictDataList: CommonDictDataItem[]
}

/** 名称查询响应 */
export interface NameFetcherResp {
  name: string
}

/** 文件上传响应 */
export interface FileIdResp {
  fileId: string
}

export const commonApi = {
  dictVersion: () =>
    http.get<RetResult<DictVersionResp>>('system/common/dict/_version', {
      meta: { operate: '加载字典版本', notify: false },
    }),

  dictData: (dictKey: string) =>
    http.get<RetResult<CommonDictResp>>(`system/common/dict/${dictKey}`, {
      meta: { operate: '加载字典数据', notify: false },
    }),

  fileDownload: (fileId: string) =>
    http.get(`system/common/file/${fileId}`, {
      responseType: 'blob',
      meta: { operate: '下载文件' },
    }),

  fileUpload: (groupId: string, data: FormData) =>
    http.post<RetResult<FileIdResp>>(`system/common/file/${groupId}/upload`, data, {
      meta: { operate: '上传文件' },
    }),

  nameFetcher: (params: Record<string, any>) =>
    http.get<RetResult<NameFetcherResp>>('system/common/namefetcher', {
      params,
      meta: { operate: '获取名称', notify: false },
    }),

  captchaGet: (data: Record<string, any>) =>
    http.post<RetResult<CaptchaGetResp>>('system/captcha/get', data, {
      meta: { operate: '验证码获取', notify: false },
    }),

  captchaCheck: (data: Record<string, any>) =>
    http.post<RetResult<CaptchaCheckResp>>('system/captcha/check', data, {
      meta: { operate: '验证码校验', notify: false },
    }),
}
