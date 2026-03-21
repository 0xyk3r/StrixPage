import type { CancelableRequest } from '@/stores/http-canceler'
import { useHttpCancelerStore } from '@/stores/http-canceler'
import { type LoginInfoStore, useLoginInfoStore } from '@/stores/login-info'
import { createStrixMessage } from '@/utils/strix-message'
import type { AxiosResponse } from 'axios'
import axios from 'axios'
import { storeToRefs } from 'pinia'
import { parse as qsParse, stringify as qsStringify } from 'qs'
import { sm2, sm3, sm4 } from 'sm-crypto'
import { v4 as uuidv4 } from 'uuid'
import { type Ref } from 'vue'
import { useBaseURL } from '@/composables/useBaseUrl.ts'
import router from '@/router'

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

const serverSm2PublicKey = import.meta.env.VITE_APP_SERVER_SM2_PUBLIC_KEY
const clientSm2PrivateKey = import.meta.env.VITE_APP_CLIENT_SM2_PRIVATE_KEY

// 清除已有的拦截器
axios.interceptors.request.clear()
axios.interceptors.response.clear()

// 请求拦截器
axios.interceptors.request.use((config) => {
  initStore()
  config.headers['Content-Type'] = 'application/json'
  config.headers.token = token?.value
  config.headers.timestamp = new Date().getTime() + ''

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
    config.headers.sign = paramsSignGet(signUrl, urlParams, config.headers.timestamp)
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
    config.headers.sign = paramsSignPost(bodyString, signUrl, config.headers.timestamp)
    if (config.data) {
      config.data = JSON.stringify(enc(config.data))
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
    // 解密 & 处理响应
    if (response.data) {
      response.data = dec(response.data)
      console.log(
        '%c Strix HTTP %c 响应 %c%s',
        'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 4px 2px 4px 6px; border-radius: 6px 0 0 6px; font-weight: bold; font-size: 12px;',
        'background: #059669; color: white; padding: 4px 6px 4px 2px; border-radius: 0 6px 6px 0; font-weight: bold; font-size: 12px;',
        'background: #eee; color: #374151; padding: 4px 6px; border-radius: 6px; font-weight: 600; margin-left: 8px;',
        response.config.meta?.operate || '响应',
        response.data
      )

      if (response.data.code === 429) {
        const retryAfter = response.headers['retry-after'] || 60
        createStrixMessage('warning', '请求失败', `请求过于频繁, 请 ${retryAfter} 秒后再试`)
        throw new Error('请求过于频繁')
      }

      if (response.data.code !== 200 && !response.data.repCode && response.config.responseType !== 'blob') {
        handleError(response)
      } else if (showNotify) {
        createStrixMessage('success', (response.config.meta?.operate || '操作') + '成功', '操作成功')
      }
    }
    return response
  },
  (error) => {
    createStrixMessage('error', '网络请求失败', '服务正在维护中, 请稍后再试. (' + error.message + ')')
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
 * hex 字符串转字节数组
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

/**
 * 字节数组转 hex 字符串
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * 生成随机 hex 字符串
 * @param length hex 字符串长度（字节数 × 2）
 */
function generateRandomHex(length: number): string {
  const bytes = new Uint8Array(length / 2)
  crypto.getRandomValues(bytes)
  return bytesToHex(bytes)
}

/**
 * SM2+SM4 加密
 * @param data 待加密数据
 * @returns 加密后的数据 { sign, data, iv }
 */
function enc(data: any) {
  const plaintext = JSON.stringify(data)

  // 生成随机 SM4 密钥（16 字节 = 32 hex 字符）
  const sm4KeyHex = generateRandomHex(32)
  const sm4KeyBytes = hexToBytes(sm4KeyHex)
  const sm4KeyBase64 = btoa(String.fromCharCode(...sm4KeyBytes))

  // 生成随机 IV（16 字节）
  const ivHex = generateRandomHex(32)
  const ivBytes = hexToBytes(ivHex)
  const ivBase64 = btoa(String.fromCharCode(...ivBytes))

  // SM2 加密 SM4 密钥的 Base64 字符串（使用服务端公钥，C1C3C2 模式）
  const encryptedKeyHex = sm2.doEncrypt(sm4KeyBase64, serverSm2PublicKey, 1)
  // sm-crypto 输出不含 '04' 前缀，Java BouncyCastle 需要 '04' 前缀（非压缩点标识）
  const encryptedKeyBytes = hexToBytes('04' + encryptedKeyHex)
  const sign = btoa(String.fromCharCode(...encryptedKeyBytes))

  // SM4/CBC 加密数据
  const encryptedData = sm4.encrypt(plaintext, sm4KeyHex, {
    mode: 'cbc',
    iv: ivHex
  })

  return { sign, data: encryptedData, iv: ivBase64 }
}

/**
 * SM2+SM4 解密
 * @param response 待解密数据
 * @returns 解密后的数据
 */
function dec(response: any) {
  const data = response.data
  const sign = response.sign
  const ivField = response.iv

  // 处理报错信息
  if ((!data || !sign) && response.code !== 200) {
    return response
  }

  if (data && sign) {
    // Base64 解码 sign 得到 SM2 密文的 hex
    const encryptedKeyBytes = Uint8Array.from(atob(sign), (c) => c.charCodeAt(0))
    let encryptedKeyHex = bytesToHex(encryptedKeyBytes)
    // Java BouncyCastle 输出含 '04' 非压缩点前缀，sm-crypto 不需要
    if (encryptedKeyHex.startsWith('04')) {
      encryptedKeyHex = encryptedKeyHex.substring(2)
    }

    // SM2 解密得到 SM4 密钥的 Base64 字符串
    const sm4KeyBase64 = sm2.doDecrypt(encryptedKeyHex, clientSm2PrivateKey, 1)

    if (!sm4KeyBase64) {
      return {}
    }

    // Base64 解码 SM4 密钥
    const sm4KeyBytes = Uint8Array.from(atob(sm4KeyBase64), (c) => c.charCodeAt(0))
    const sm4KeyHex = bytesToHex(sm4KeyBytes)

    // Base64 解码 IV
    const ivBytes = Uint8Array.from(atob(ivField), (c) => c.charCodeAt(0))
    const ivHex = bytesToHex(ivBytes)

    // SM4/CBC 解密
    const plaintext = sm4.decrypt(data, sm4KeyHex, {
      mode: 'cbc',
      iv: ivHex
    })

    return JSON.parse(plaintext)
  }
  return {}
}

/**
 * 异常处理
 * @param response 响应
 */
function handleError(response: AxiosResponse) {
  const errTitle = (response.config.meta?.operate || '操作') + '失败'
  let errMsg = '未知错误'
  if (response.data) {
    errMsg = response.data.msg
    // 登录失效 清除登录信息并跳转到登录页
    if (response.data.code === 401) {
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
  }
  createStrixMessage('error', errTitle, errMsg)
  throw new Error(errTitle)
}

/**
 * POST 请求签名：对原始请求体字符串签名
 * sign = SM3(bodyString + "|" + url + "|" + timestamp)
 *
 * @param bodyString 原始请求体 JSON 字符串
 * @param url 请求 URL
 * @param timestamp 时间戳
 * @returns SM3 签名
 */
function paramsSignPost(bodyString: string, url: string, timestamp: any): string {
  const content = bodyString + '|' + url + '|' + timestamp
  return sm3(content)
}

/**
 * GET 请求签名：对排序后的查询参数签名
 * sign = SM3(sortedParamsJSON + "|" + url + "|" + timestamp)
 *
 * @param url 请求 URL
 * @param params 查询参数
 * @param timestamp 时间戳
 * @returns SM3 签名
 */
function paramsSignGet(url: string, params: any, timestamp: any): string {
  let paramsJson = '{}'
  if (params) {
    // 移除 null/undefined 值
    const filtered: Record<string, any> = {}
    for (const key of Object.keys(params).sort()) {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        filtered[key] = params[key]
      }
    }
    paramsJson = JSON.stringify(filtered)
  }
  const content = paramsJson + '|' + url + '|' + timestamp
  return sm3(content)
}

export const http = axios
