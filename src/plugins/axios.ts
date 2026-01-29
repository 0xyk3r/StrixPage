import type { CancelableRequest } from '@/stores/http-canceler'
import { useHttpCancelerStore } from '@/stores/http-canceler'
import { type LoginInfoStore, useLoginInfoStore } from '@/stores/login-info'
import { createStrixMessage } from '@/utils/strix-message'
import type { AxiosResponse } from 'axios'
import axios from 'axios'
import { AES, CBC, HexFormatter, MD5, Pkcs7, Utf8 } from 'crypto-es'
import JSEncrypt from 'jsencrypt'
import { merge } from 'lodash-es'
import { storeToRefs } from 'pinia'
import { parse as qsParse, stringify as qsStringify } from 'qs'
import { v4 as uuidv4 } from 'uuid'
import { type Ref } from 'vue'

let loginInfoStore: ReturnType<typeof useLoginInfoStore> | null = null
let httpCancelerStore: ReturnType<typeof useHttpCancelerStore> | null = null
let token: Ref | null = null

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
axios.defaults.baseURL = '/api/'

const iv = import.meta.env.VITE_APP_IV
const serverPubKey = import.meta.env.VITE_APP_SERVER_PUBLIC_KEY
const clientPriKey = import.meta.env.VITE_APP_CLIENT_PRIVATE_KEY
const encJsEncrypt = new JSEncrypt()
encJsEncrypt.setPublicKey(serverPubKey)
const decJsEncrypt = new JSEncrypt()
decJsEncrypt.setPrivateKey(clientPriKey)

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
    config.headers.sign = paramsSign(signUrl, urlParams, config.headers.timestamp)
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
    config.headers.sign = paramsSign(signUrl, config.data, config.headers.timestamp)
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
    return ''
  }

  // 确保 url 以斜杠开头
  return url.startsWith('/') ? url : '/' + url
}

/**
 * 加密
 * @param data 待加密数据
 * @returns 加密后的数据
 */
function enc(data: any) {
  const library = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let key = ''
  for (let i = 0; i < 24; i++) {
    const randomPoz = Math.floor(Math.random() * library.length)
    key += library.substring(randomPoz, randomPoz + 1)
  }
  const parsedData = JSON.stringify(data)
  const aes = AES.encrypt(parsedData, Utf8.parse(key), {
    iv: Utf8.parse(iv),
    mode: CBC,
    padding: Pkcs7
  })
  const rsa = encJsEncrypt.encrypt(key)
  return {
    data: aes.ciphertext?.toString(),
    sign: rsa
  }
}

/**
 * 解密
 * @param response 待解密数据
 * @returns 解密后的数据
 */
function dec(response: any) {
  const data = response.data
  const sign = response.sign

  // 处理报错信息
  if ((!data || !sign) && response.code !== 200) {
    return response
  }

  if (data && sign) {
    const aesKey = decJsEncrypt.decrypt(sign)

    if (!aesKey) {
      return {}
    }

    const dec = AES.decrypt(HexFormatter.parse(data), Utf8.parse(aesKey), {
      iv: Utf8.parse(iv),
      mode: CBC,
      padding: Pkcs7
    })
    return JSON.parse(Utf8.stringify(dec))
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
      location.href = '/login?r=e&to=' + location.pathname
    }
  }
  createStrixMessage('error', errTitle, errMsg)
  throw new Error(errTitle)
}

/**
 * 递归过滤空值参数
 * @param obj 待过滤的对象
 * @returns 过滤后的对象
 */
function filterEmptyParams(obj: any): any {
  if (obj == null) {
    return undefined
  }

  // 处理数组
  if (Array.isArray(obj)) {
    const filtered = obj.map((item) => filterEmptyParams(item)).filter((item) => item !== undefined)
    return filtered.length === 0 ? undefined : filtered
  }

  // 处理对象
  if (typeof obj === 'object') {
    const filtered: Record<string, any> = {}
    for (const key in obj) {
      const value = filterEmptyParams(obj[key])
      if (value !== undefined) {
        filtered[key] = value
      }
    }
    return Object.keys(filtered).length === 0 ? undefined : filtered
  }

  // 处理字符串
  if (typeof obj === 'string') {
    return obj === '' ? undefined : obj.replace(/&/g, '&amp;')
  }

  return obj
}

/**
 * 参数排序
 * @param jsonObj 待排序参数
 * @returns 排序后的参数
 */
function sortAsc(jsonObj: Record<string, any>) {
  const keys = Object.keys(jsonObj).sort()
  const sortObj: Record<string, any> = {}
  keys.forEach((key) => {
    if (jsonObj[key] != null) {
      const value = jsonObj[key]
      // 递归处理对象类型
      if (typeof value === 'object' && !Array.isArray(value)) {
        sortObj[key] = sortAsc(value)
      } else if (Array.isArray(value)) {
        // 处理数组，对数组中的对象元素进行排序
        sortObj[key] = value.map((item) => (typeof item === 'object' && !Array.isArray(item) ? sortAsc(item) : item))
      } else {
        sortObj[key] = value
      }
    }
  })
  return sortObj
}

/**
 * 参数签名
 * @param url URL
 * @param params 参数
 * @param timestamp 时间戳
 * @returns 签名
 */
function paramsSign(url: string, params: any, timestamp: any) {
  const baseParams = {
    _requestUrl: url,
    _timestamp: timestamp
  }

  let encryptObj = baseParams
  if (params) {
    const filteredParams = filterEmptyParams(params)
    if (filteredParams !== undefined) {
      encryptObj = merge(baseParams, filteredParams)
    }
  }

  const sortEncryptObj = sortAsc(encryptObj)
  // console.log('待签名参数', sortEncryptObj)
  const sortParamsJson = JSON.stringify(sortEncryptObj)
  // console.log('待签名数据', sortParamsJson)
  return MD5(sortParamsJson).toString()
}

export const http = axios
