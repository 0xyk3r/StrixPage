import type { RetResult } from './types'
import { http } from '@/plugins/axios'

export interface CaptchaGetResp {
  uuid: string
  originalImageBase64: string
  jigsawImageBase64: string
  secretKey: string
}

export interface CaptchaCheckResp {
  result: boolean
  captchaVerification: string
}

export const commonApi = {
  dictVersion: () =>
    http.get<RetResult>('system/common/dict/_version', {
      meta: { operate: '加载字典版本', notify: false },
    }),

  dictData: (dictKey: string) =>
    http.get<RetResult>(`system/common/dict/${dictKey}`, {
      meta: { operate: '加载字典数据', notify: false },
    }),

  fileDownload: (fileId: string) =>
    http.get(`system/common/file/${fileId}`, {
      responseType: 'blob',
      meta: { operate: '下载文件' },
    }),

  fileUpload: (groupId: string, data: FormData) =>
    http.post<RetResult>(`system/common/file/${groupId}/upload`, data, {
      meta: { operate: '上传文件' },
    }),

  nameFetcher: (params: Record<string, any>) =>
    http.get<RetResult>('system/common/namefetcher', {
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
