import type { CancelableRequest } from '@/stores/http-canceler'
import { useHttpCancelerStore } from '@/stores/http-canceler'
import { useLoginInfoStore, type LoginInfoStore } from '@/stores/login-info'
import { createStrixMessage } from '@/utils/strix-message'
import type { AxiosResponse } from 'axios'
import axios from 'axios'
import CryptoES from 'crypto-es'
import JSEncrypt from 'jsencrypt'
import { merge, omit } from 'lodash'
import { storeToRefs } from 'pinia'
import qs from 'qs'
import { v4 as uuidv4 } from 'uuid'
import { type Ref } from 'vue'

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
axios.defaults.baseURL = '/api/'

const iv = 'fuCkUCrAck32fUcK'
const serverPubKey =
  'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCIXjpS5HSOeAauqi/3j9R4X7lbLfClo+CSO0yDsGdTsWHgpjE8l96dqsNay7xSKNDKvJCDId9aLIRhUVUDuV+ad6g3jNKW0ywiFHXobMPusDS8Jab18QE0N/JDCzh+5MejQb+ccwWvWcOwXJevgemMqpXXq2rpAfwigl+sYxi8BwIDAQAB'
const clientPriKey =
  'MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGBANBprui2mHZG6WvJxuWatDrMIhUecappAMF0h3IofTfisMQg11H1hsfDOm75qKlTPgwIa6BiL1VXndO4hg/q7ICrxjOOIw4cRWfTsCxepeA+RYlh1ZMIYJCWvmOEU+PY/F/SDbTyMrJ8OTsuEJ08eLIwnWXwbi3mUEXkAmFao3X7AgMBAAECgYAx34h2sfNsIm4LWD7bhRjqFR121lE3CWef48Xh4KSOchYA6Sb9uvak6SgblGzzEDOB56XxvG09S/k9yCN0vbAYb+370Yhz0HhajKbjifVPZuAjvCO9cdWxJWeWlAtGMdgMyG1PxTlhamPfI/YvvjQxpf9845lGwXsBaTrGwbSLOQJBAOx3tJCnMPvajzcODwud67YKnuCwISK4XSNj7K+TPH66j53JycTjD+e7eVaa4j2TdP85t8zYO4q3oEut30nyXt0CQQDhoLzMaUg1nmUoAv2o0CO8hYEIzWc6gP4STHmtZjOqqYWhjInMk3slfMTllzLBEDy/womSuqb68wPXscvrtt63AkEAyjj81BAHFfstKtn9B+Q/peijQmedjsG39QIJcYUq4P3OwBPHV3cPLQ/ojqXaAOrPzUyg4K+zC8hJby78m5KIiQJASF7DUBmQ9MnajmvvKt+gJs73pXgk3UoUtI/dE3ZNqjb3yuqGJJ1Fia+shCvsNqrboXJnqC3Ac4vRNrUrwG6GnwJAAlZK9BZg2ORZ9vSGg0+Ah0Ji7BSaozJUFEXtZ+A2cU3S+LN8/4aOaAhFECvXjTjJYddffMhXnqJ6/z5DvxncnQ=='

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
    const queryString = qs.stringify(params)
    const urlParams = qs.parse(queryString)
    console.log(
      '%cStrix%cGET%c ' + config.meta?.operate,
      'background: #ff6347; color: white; padding: 2px 4px; border-radius: 2px;',
      'background: #333333; color: #ffffff; padding: 2px 4px; border-radius: 2px;',
      '',
      urlParams
    )
    config.headers.sign = paramsSign('/' + config.url, urlParams, config.headers.timestamp)
  } else {
    console.log(
      '%cStrix%cPOST%c ' + config.meta?.operate,
      'background: #ff6347; color: white; padding: 2px 4px; border-radius: 2px;',
      'background: #333333; color: #ffffff; padding: 2px 4px; border-radius: 2px;',
      '',
      config.data
    )
    config.headers.sign = paramsSign('/' + config.url, config.data, config.headers.timestamp)
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
      response.config.method === 'get'
        ? response.config.meta?.notify === true
        : response.config.meta?.notify !== false

    // 已经请求成功 移除可取消请求
    if (response.config.meta?.requestGroup && response.config.meta?.requestId) {
      httpCancelerStore?.removeRequestById(response.config.meta.requestId)
    }
    // 解密 & 处理响应
    if (response.data) {
      response.data = dec(response.data)
      console.log(
        '%cStrix%c响应%c ' + response.config.meta?.operate,
        'background: #ff6347; color: white; padding: 2px 4px; border-radius: 2px;',
        'background: #333333; color: #4CAF50; padding: 2px 4px; border-radius: 2px;',
        '',
        response.data
      )
      if (
        response.data.code !== 200 &&
        !response.data.repCode &&
        response.config.responseType !== 'blob'
      ) {
        handleError(response)
      } else if (showNotify) {
        createStrixMessage(
          'success',
          (response.config.meta?.operate || '操作') + '成功',
          '操作成功'
        )
      }
    }
    return response
  },
  (error) => {
    createStrixMessage('error', '网络请求失败', error.message)
  }
)

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
  const aes = CryptoES.AES.encrypt(parsedData, CryptoES.enc.Utf8.parse(key), {
    iv: CryptoES.enc.Utf8.parse(iv),
    mode: CryptoES.mode.CBC,
    padding: CryptoES.pad.Pkcs7
  })

  const jsEncrypt = new JSEncrypt()
  jsEncrypt.setPublicKey(serverPubKey)
  const rsa = jsEncrypt.encrypt(key)

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
    const jsEncrypt = new JSEncrypt()
    jsEncrypt.setPrivateKey(clientPriKey)
    const aesKey = jsEncrypt.decrypt(sign)

    if (!aesKey) {
      return {}
    }

    const dec = CryptoES.AES.decrypt(
      CryptoES.format.Hex.parse(data),
      CryptoES.enc.Utf8.parse(aesKey),
      {
        iv: CryptoES.enc.Utf8.parse(iv),
        mode: CryptoES.mode.CBC,
        padding: CryptoES.pad.Pkcs7
      }
    )
    return JSON.parse(CryptoES.enc.Utf8.stringify(dec))
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
      location.href = '/login?to=' + location.pathname
    }
  }
  createStrixMessage('error', errTitle, errMsg)
  throw new Error(errTitle)
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
    for (const key in params) {
      if (params[key] == null || params[key] === '') {
        params = omit(params, key)
      }
    }
    encryptObj = merge(baseParams, params)
  }
  const sortEncryptObj = sortAsc(encryptObj)
  const sortParamsJson = JSON.stringify(sortEncryptObj)
  // console.log("待签名数据", sortParamsJson);
  return CryptoES.MD5(sortParamsJson).toString()
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
      sortObj[key] = jsonObj[key]
    }
  })
  return sortObj
}

export const http = axios
