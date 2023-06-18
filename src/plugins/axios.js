import { useHttpCancelerStore } from '@/stores/http-canceler'
import { createStrixMessage } from '@/utils/strix-message'
import axios from 'axios'
import CryptoJS from 'crypto-js'
import JSEncrypt from 'jsencrypt'
import _ from 'lodash'
import qs from 'qs'
import { v4 as uuidv4 } from 'uuid'

// HTTP请求根路径
axios.defaults.baseURL = '/api/'

const iv = 'fuCkUCrAck32fUcK'
const serverPubKey = 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCIXjpS5HSOeAauqi/3j9R4X7lbLfClo+CSO0yDsGdTsWHgpjE8l96dqsNay7xSKNDKvJCDId9aLIRhUVUDuV+ad6g3jNKW0ywiFHXobMPusDS8Jab18QE0N/JDCzh+5MejQb+ccwWvWcOwXJevgemMqpXXq2rpAfwigl+sYxi8BwIDAQAB'
const clientPriKey = 'MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGBANBprui2mHZG6WvJxuWatDrMIhUecappAMF0h3IofTfisMQg11H1hsfDOm75qKlTPgwIa6BiL1VXndO4hg/q7ICrxjOOIw4cRWfTsCxepeA+RYlh1ZMIYJCWvmOEU+PY/F/SDbTyMrJ8OTsuEJ08eLIwnWXwbi3mUEXkAmFao3X7AgMBAAECgYAx34h2sfNsIm4LWD7bhRjqFR121lE3CWef48Xh4KSOchYA6Sb9uvak6SgblGzzEDOB56XxvG09S/k9yCN0vbAYb+370Yhz0HhajKbjifVPZuAjvCO9cdWxJWeWlAtGMdgMyG1PxTlhamPfI/YvvjQxpf9845lGwXsBaTrGwbSLOQJBAOx3tJCnMPvajzcODwud67YKnuCwISK4XSNj7K+TPH66j53JycTjD+e7eVaa4j2TdP85t8zYO4q3oEut30nyXt0CQQDhoLzMaUg1nmUoAv2o0CO8hYEIzWc6gP4STHmtZjOqqYWhjInMk3slfMTllzLBEDy/womSuqb68wPXscvrtt63AkEAyjj81BAHFfstKtn9B+Q/peijQmedjsG39QIJcYUq4P3OwBPHV3cPLQ/ojqXaAOrPzUyg4K+zC8hJby78m5KIiQJASF7DUBmQ9MnajmvvKt+gJs73pXgk3UoUtI/dE3ZNqjb3yuqGJJ1Fia+shCvsNqrboXJnqC3Ac4vRNrUrwG6GnwJAAlZK9BZg2ORZ9vSGg0+Ah0Ji7BSaozJUFEXtZ+A2cU3S+LN8/4aOaAhFECvXjTjJYddffMhXnqJ6/z5DvxncnQ=='

function enc(data) {
  const library = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let key = ''
  for (let i = 0; i < 24; i++) {
    const randomPoz = Math.floor(Math.random() * library.length)
    key += library.substring(randomPoz, randomPoz + 1)
  }
  const parsedData = JSON.stringify(data)
  const aes = CryptoJS.AES.encrypt(parsedData, CryptoJS.enc.Utf8.parse(key), {
    iv: CryptoJS.enc.Utf8.parse(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  })

  const jsEncrypt = new JSEncrypt()
  jsEncrypt.setPublicKey(serverPubKey)
  const rsa = jsEncrypt.encrypt(key)

  return {
    data: aes.ciphertext.toString(),
    sign: rsa
  }
}

function dec(response) {
  const data = response.data
  const sign = response.sign

  if ((!data || !sign) && response.code !== 200) {
    return response
  }

  if (data && sign) {
    const jsEncrypt = new JSEncrypt()
    jsEncrypt.setPrivateKey(clientPriKey)
    const aesKey = jsEncrypt.decrypt(sign)

    const dec = CryptoJS.AES.decrypt(CryptoJS.format.Hex.parse(data), CryptoJS.enc.Utf8.parse(aesKey), {
      iv: CryptoJS.enc.Utf8.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    })
    return JSON.parse(CryptoJS.enc.Utf8.stringify(dec))
  }
  return {}
}

axios.interceptors.request.use(config => {
  config.headers['Content-Type'] = 'application/json'
  const token = window.localStorage.getItem('strix_login_token')
  if (token) {
    config.headers.token = token
  }
  config.headers.timestamp = new Date().getTime() + ""

  if (config.strixRequestGroup) {
    config.strixRequestId = uuidv4()
    let strixRequestCanceler
    config.cancelToken = new axios.CancelToken((canceler) => {
      strixRequestCanceler = canceler
    })
    const strixRequestingApi = {
      strixRequestId: config.strixRequestId,
      strixRequestGroup: config.strixRequestGroup,
      strixRequestCanceler: strixRequestCanceler
    }
    const httpCancelerStore = useHttpCancelerStore()
    httpCancelerStore.addRequestingApi(strixRequestingApi)
  }

  if (config.method === 'get') {
    // 去除get请求中的null参数
    let params = config.params
    if (params) {
      for (const key in params) {
        if (params[key] == null) {
          params = _.omit(params, key)
        }
      }
    }
    // const queryString = qs.stringify(params, { addQueryPrefix: true })
    // 转换get请求参数为对象
    const queryString = qs.stringify(params)
    const urlParams = qs.parse(queryString)
    // urlParams['_requestUrl'] = '/' + config.url + (queryString || '')
    // const encryptJson = JSON.stringify(urlParams)
    config.headers.sign = paramsSign('/' + config.url, urlParams, config.headers.timestamp)
    // const aes = CryptoJS.AES.encrypt(encryptJson, CryptoJS.enc.Utf8.parse('fUCkUon' + config.headers.timestamp + 'T1me'), {
    //   iv: CryptoJS.enc.Utf8.parse(iv),
    //   mode: CryptoJS.mode.CBC,
    //   padding: CryptoJS.pad.Pkcs7
    // })

    // config.headers.sign = aes.ciphertext.toString()
  } else {
    config.headers.sign = paramsSign('/' + config.url, config.data, config.headers.timestamp)
    if (config.data) {
      config.data = JSON.stringify(enc(config.data))
    }
  }

  return config
})
axios.interceptors.response.use(response => {
  // 成功通知 get请求默认不显示 post请求默认显示
  const notify = response.config.method === 'get' ? response.config.notify === true : response.config.notify !== false

  if (response.config.strixRequestGroup) {
    const httpCancelerStore = useHttpCancelerStore()
    httpCancelerStore.delRequestingApiById(response.config.strixRequestId)
  }
  if (response.data) {
    response.data = dec(response.data)
    console.log(response.config.operate, response.data)
    if (response.data.code !== 200 && !response.data.repCode && response.config.responseType !== 'blob') {
      handleError(response)
    } else if (notify) {
      createStrixMessage('success', (response.config.operate || '操作') + '成功', '操作成功')
    }
  }
  return response
}, error => {
  createStrixMessage('error', '网络请求失败', error.message)
})

function handleError(response) {
  const operate = (response.config.operate || '操作') + '失败'
  let errMsg = '未知错误'
  if (response.data) {
    errMsg = response.data.msg
    // 登录失效 清除登录信息并跳转到登录页
    if (response.data.code === 401) {
      window.localStorage.removeItem('strix_login_token')
      window.localStorage.removeItem('strix_login_token_expire')
      window.localStorage.removeItem('strix_login_info')
      location.href = '/login?to=' + location.pathname
    }
    // 错误信息为空时 填充默认错误信息
    response.data.msg = response.data.msg || '未知错误'
  }
  createStrixMessage('error', operate, errMsg)
  throw new Error(operate)
}

function paramsSign(url, params, timestamp) {
  const baseParams = {
    _requestUrl: url,
    _timestamp: timestamp
  }
  let encryptObj = baseParams
  if (params) {
    for (const key in params) {
      if (params[key] == null || params[key] === '') {
        params = _.omit(params, key)
      }
    }
    encryptObj = _.merge(baseParams, params)
  }

  const sortEncryptObj = sortAsc(encryptObj)
  const sortParamsJson = JSON.stringify(sortEncryptObj)

  // 将sortParamsJson进行md5加密
  const sign = CryptoJS.MD5(sortParamsJson).toString()
  return sign

  // const aes = CryptoJS.AES.encrypt(sortParamsJson, CryptoJS.enc.Utf8.parse('fUCkUon' + timestamp + 'T1me'), {
  //   iv: CryptoJS.enc.Utf8.parse(iv),
  //   mode: CryptoJS.mode.CBC,
  //   padding: CryptoJS.pad.Pkcs7
  // })

  // return aes.ciphertext.toString()
}

function sortAsc(jsonObj) {
  const arr = []
  let num = 0
  for (const i in jsonObj) {
    arr[num] = i
    num++
  }
  const sortArr = arr.sort()
  const sortObj = {}
  for (const i in sortArr) {
    if (jsonObj[sortArr[i]] != null) {
      sortObj[sortArr[i]] = jsonObj[sortArr[i]]
    }
  }
  return sortObj
}

export default (app) => {
  app.config.globalProperties.$http = axios
}
