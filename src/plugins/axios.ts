import type { CancelableRequest } from '@/stores/http-canceler'
import { useHttpCancelerStore } from '@/stores/http-canceler'
import { type LoginInfoStore, useLoginInfoStore } from '@/stores/login-info'
import { decrypt, encrypt, signGet, signPost } from '@/utils/crypto'
import { RateLimitError, StrixError } from '@/utils/strix-error'
import { createStrixMessage } from '@/utils/strix-message'
import type { AxiosResponse } from 'axios'
import axios from 'axios'
import { storeToRefs } from 'pinia'
import { parse as qsParse, stringify as qsStringify } from 'qs'
import { v4 as uuidv4 } from 'uuid'
import { type Ref } from 'vue'
import { useBaseURL } from '@/composables/useBaseUrl.ts'
import router from '@/router'

// 扩展 axios 类型定义
declare module 'axios' {
  export interface AxiosRequestConfig {
    meta?: {
      requestGroup?: string
      requestId?: string
      operate?: string
      notify?: boolean
      skipEncryption?: boolean
    }
  }
}

let loginInfoStore: ReturnType<typeof useLoginInfoStore> | null = null
let httpCancelerStore: ReturnType<typeof useHttpCancelerStore> | null = null
let token: Ref<any> | null = null

function initStore() {
  if (!loginInfoStore) {
    loginInfoStore = useLoginInfoStore()
    const { loginToken } = storeToRefs(loginInfoStore) as LoginInfoStore
    token = loginToken
  }
  if (!httpCancelerStore) {
    httpCancelerStore = useHttpCancelerStore()
  }
}

// HTTP请求根路径
axios.defaults.baseURL = useBaseURL()
// 请求超时时间
axios.defaults.timeout = 60000

// 清除已有的拦截器
axios.interceptors.request.clear()
axios.interceptors.response.clear()

// 离线错误防抖：5秒内同类错误只提示一次
let lastOfflineToastTime = 0
const OFFLINE_TOAST_DEBOUNCE = 5000

// 请求拦截器
axios.interceptors.request.use((config) => {
  initStore()

  // 离线时拦截所有请求
  if (!navigator.onLine) {
    const now = Date.now()
    if (now - lastOfflineToastTime > OFFLINE_TOAST_DEBOUNCE) {
      lastOfflineToastTime = now
      createStrixMessage('warning', '网络不可用', '当前处于离线状态，请恢复网络连接后重试')
    }
    return Promise.reject(new axios.Cancel('离线状态，请求已拦截'))
  }

  config.headers.timestamp = new Date().getTime() + ''
  if (token?.value) {
    config.headers.Authorization = `Bearer ${token.value}`
  }

  // 支持取消请求
  if (config.meta?.requestGroup) {
    config.meta.requestId = uuidv4()
    config.cancelToken = new axios.CancelToken((canceler) => {
      const strixRequestingApi: CancelableRequest = {
        requestId: config.meta?.requestId,
        requestGroup: config.meta?.requestGroup,
        requestCanceler: canceler
      }
      httpCancelerStore?.registerRequest(strixRequestingApi)
    })
  }

  // FormData 请求（文件上传）跳过加密/签名，让浏览器自动设置 multipart Content-Type
  if (config.data instanceof FormData) {
    console.log(
      '%c Strix HTTP %c POST %c%s',
      'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 4px 2px 4px 6px; border-radius: 6px 0 0 6px; font-weight: bold; font-size: 12px;',
      'background: #f59e0b; color: white; padding: 4px 4px 4px 2px; border-radius: 0 6px 6px 0; font-weight: bold; font-size: 12px;',
      'background: #eee; color: #374151; padding: 4px 6px; border-radius: 6px; font-weight: 600; margin-left: 8px;',
      config.meta?.operate || '请求 (multipart)',
      '[FormData — encryption skipped]'
    )
    // Do not set Content-Type — let axios set multipart/form-data with boundary automatically
    return config
  }

  // 标记为跳过加密的请求（如 TTS）
  if (config.meta?.skipEncryption) {
    console.log(
      '%c Strix HTTP %c POST %c%s',
      'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 4px 2px 4px 6px; border-radius: 6px 0 0 6px; font-weight: bold; font-size: 12px;',
      'background: #f59e0b; color: white; padding: 4px 4px 4px 2px; border-radius: 0 6px 6px 0; font-weight: bold; font-size: 12px;',
      'background: #eee; color: #374151; padding: 4px 6px; border-radius: 6px; font-weight: 600; margin-left: 8px;',
      config.meta?.operate || '请求',
      '[encryption skipped]',
      config.data
    )
    config.headers['Content-Type'] = 'application/json'
    return config
  }

  config.headers['Content-Type'] = 'application/json'

  // 请求预处理 & 加密 & 签名
  if (config.method === 'get') {
    const params = config.params
    const queryString = qsStringify(params)
    const urlParams = qsParse(queryString)
    console.log(
      '%c Strix HTTP %c GET %c%s',
      'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 4px 2px 4px 6px; border-radius: 6px 0 0 6px; font-weight: bold; font-size: 12px;',
      'background: #3b82f6; color: white; padding: 4px 6px 4px 2px; border-radius: 0 6px 6px 0; font-weight: bold; font-size: 12px;',
      'background: #eee; color: #374151; padding: 4px 6px; border-radius: 6px; font-weight: 600; margin-left: 8px;',
      config.meta?.operate || '请求',
      urlParams
    )

    const signUrl = buildSignUrl(config.url)
    config.headers.sign = signGet(signUrl, urlParams, config.headers.timestamp)
  } else {
    console.log(
      '%c Strix HTTP %c POST %c%s',
      'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 4px 2px 4px 6px; border-radius: 6px 0 0 6px; font-weight: bold; font-size: 12px;',
      'background: #f59e0b; color: white; padding: 4px 4px 4px 2px; border-radius: 0 6px 6px 0; font-weight: bold; font-size: 12px;',
      'background: #eee; color: #374151; padding: 4px 6px; border-radius: 6px; font-weight: 600; margin-left: 8px;',
      config.meta?.operate || '请求',
      config.data
    )

    const signUrl = buildSignUrl(config.url)
    // 对原始请求体字符串签名（加密前）
    const bodyString = config.data ? JSON.stringify(config.data) : ''
    config.headers.sign = signPost(bodyString, signUrl, config.headers.timestamp)
    if (config.data) {
      config.data = JSON.stringify(encrypt(config.data))
    }
  }
  return config
})

// 响应拦截器
axios.interceptors.response.use(
  (response) => {
    // GET 请求默认不显示成功通知，POST 请求默认显示成功通知
    const showNotify =
      response.config.method === 'get' ? response.config.meta?.notify === true : response.config.meta?.notify !== false

    // 已经请求成功 移除可取消请求
    if (response.config.meta?.requestGroup && response.config.meta?.requestId) {
      httpCancelerStore?.removeRequestById(response.config.meta.requestId)
    }

    // Blob 响应（如 TTS 音频、文件下载）跳过解密，直接返回
    if (response.config.responseType && response.config.responseType === 'blob') {
      console.log(
        '%c Strix HTTP %c 响应 %c%s',
        'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 4px 2px 4px 6px; border-radius: 6px 0 0 6px; font-weight: bold; font-size: 12px;',
        'background: #059669; color: white; padding: 4px 6px 4px 2px; border-radius: 0 6px 6px 0; font-weight: bold; font-size: 12px;',
        'background: #eee; color: #374151; padding: 4px 6px; border-radius: 6px; font-weight: 600; margin-left: 8px;',
        response.config.meta?.operate || '响应',
        `[Blob ${response.data?.size || 0} bytes — decryption skipped]`
      )
      if (showNotify) {
        createStrixMessage('success', (response.config.meta?.operate || '操作') + '成功', '操作成功')
      }
      return response
    }

    // 解密 & 处理响应
    if (response.data) {
      response.data = decrypt(response.data)
      console.log(
        '%c Strix HTTP %c 响应 %c%s',
        'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 4px 2px 4px 6px; border-radius: 6px 0 0 6px; font-weight: bold; font-size: 12px;',
        'background: #059669; color: white; padding: 4px 6px 4px 2px; border-radius: 0 6px 6px 0; font-weight: bold; font-size: 12px;',
        'background: #eee; color: #374151; padding: 4px 6px; border-radius: 6px; font-weight: 600; margin-left: 8px;',
        response.config.meta?.operate || '响应',
        response.data
      )

      if (response.data.code === 429) {
        const retryAfter = parseInt(response.headers['retry-after'] || '60', 10)
        createStrixMessage('warning', '请求失败', `请求过于频繁，请 ${retryAfter} 秒后再试`)
        throw new RateLimitError(retryAfter)
      }

      if (response.data.code !== 200) {
        handleError(response)
      } else if (showNotify) {
        createStrixMessage('success', (response.config.meta?.operate || '操作') + '成功', '操作成功')
      }
    }
    return response
  },
  (error) => {
    // 请求被主动取消（包括离线拦截）
    if (axios.isCancel(error)) return

    if (!navigator.onLine || error.code === 'ERR_NETWORK') {
      const now = Date.now()
      if (now - lastOfflineToastTime > OFFLINE_TOAST_DEBOUNCE) {
        lastOfflineToastTime = now
        createStrixMessage('error', '网络连接异常', '请检查您的网络连接后重试')
      }
    } else if (error.code === 'ECONNABORTED') {
      createStrixMessage('error', '请求超时', '服务器响应时间过长, 请稍后重试')
    } else if (error.response) {
      // 后端返回了带业务错误码的响应（如 400/401/403/404/500）
      if (error.response.data?.code) {
        // 解密响应体（如果需要）
        if (error.response.data?.sign) {
          error.response.data = decrypt(error.response.data)
        }
        handleError(error.response as AxiosResponse)
        return
      }
      const status = error.response.status
      if (status >= 500) {
        createStrixMessage('error', '服务器错误', `服务器内部异常 (${status}), 请稍后重试`)
      } else {
        createStrixMessage('error', '请求失败', error.message)
      }
    } else {
      createStrixMessage('error', '网络请求失败', '服务正在维护中, 请稍后再试. (' + error.message + ')')
    }
  }
)

/**
 * 构建签名用的完整URL
 * @param url 请求URL
 * @returns 完整的签名URL
 */
function buildSignUrl(url: string | undefined): string {
  if (!url) {
    return url || ''
  }

  // 确保 url 以斜杠开头
  return url.startsWith('/') ? url : '/' + url
}

/**
 * 异常处理
 * @param response 响应
 */
function handleError(response: AxiosResponse) {
  const errTitle = (response.config.meta?.operate || '操作') + '失败'
  const errCode = response.data?.code ?? 500
  const errMsg = response.data?.msg || '未知错误'

  // 登录失效 清除登录信息并跳转到登录页
  if (errCode === 401) {
    loginInfoStore?.clearLoginInfo()
    // noinspection JSIgnoredPromiseFromCall
    router.replace({
      path: '/login',
      query: {
        r: 'e',
        to: router.currentRoute.value.fullPath
      }
    })
  }

  createStrixMessage('error', errTitle, errMsg)
  throw new StrixError(errTitle, errCode, errMsg)
}

export const http = axios
