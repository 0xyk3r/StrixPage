import { useHttpCancelerStore } from '@/stores/http-canceler'
import axios from 'axios'
import CryptoJS from 'crypto-js'
import JSEncrypt from 'jsencrypt'
import _ from 'lodash'
import qs from 'qs'
import { v4 as uuidv4 } from 'uuid'

// HTTP请求根路径
axios.defaults.baseURL = '/api/'

const pk01 = 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCIXjpS5HSOeAauqi/'
const pk02 = '3j9R4X7lbLfClo+CSO0yDsGdTsWHgpjE8l96dqsNay7xSKNDKvJCDId9aLIRhUVUDuV+ad6g3jNKW0ywiFHXobMPusDS8Jab18QE0N/'
const pk03 = 'JDCzh+5MejQb+ccwWvWcOwXJevgemMqpXXq2rpAfwigl+sYxi8BwIDAQAB'

function enc(data) {
  const library = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let key = ''
  for (let i = 0; i < 24; i++) {
    const randomPoz = Math.floor(Math.random() * library.length)
    key += library.substring(randomPoz, randomPoz + 1)
  }
  const parsedData = JSON.stringify(data)
  const aes = CryptoJS.AES.encrypt(parsedData, CryptoJS.enc.Utf8.parse(key), {
    iv: CryptoJS.enc.Utf8.parse('fuckyou0babyFUCK'),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  })

  const jsEncrypt = new JSEncrypt()
  jsEncrypt.setPublicKey(pk01 + pk02 + pk03)
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
    jsEncrypt.setPublicKey(pk01 + pk02 + pk03)
    // 注意JSEncrypt原生不支持公钥解密，这里对JSEncrypt源码做了修改，后续版本若升级，则修改部分可能被覆盖
    const aesKey = jsEncrypt.decrypt(sign)

    const dec = CryptoJS.AES.decrypt(CryptoJS.format.Hex.parse(data), CryptoJS.enc.Utf8.parse(aesKey), {
      iv: CryptoJS.enc.Utf8.parse('fuckyou0babyFUCK'),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    })
    return JSON.parse(CryptoJS.enc.Utf8.stringify(dec))
  }
  return {}
}

axios.interceptors.request.use(async config => {
  config.headers['Content-Type'] = 'application/json'
  const token = window.localStorage.getItem('strix_login_token')
  if (token) {
    config.headers.token = token
  }
  config.headers.timestamp = new Date().getTime()

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
    const queryString = qs.stringify(config.params, { addQueryPrefix: true })
    const urlParams = {
      _requestUrl: '/' + config.url + (queryString || '')
    }
    const encryptJson = JSON.stringify(urlParams)

    const aes = CryptoJS.AES.encrypt(encryptJson, CryptoJS.enc.Utf8.parse('fUCkUon' + config.headers.timestamp + 'T1me'), {
      iv: CryptoJS.enc.Utf8.parse('fuckyouObabyFUCK'),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    })

    config.headers.sign = aes.ciphertext.toString()
  } else {
    config.headers.sign = paramsSign('/' + config.url, config.data, config.headers.timestamp)
    if (config.data) {
      config.data = JSON.stringify(enc(config.data))
    }
  }

  return config
})
axios.interceptors.response.use(async response => {
  if (response.config.strixRequestGroup) {
    const httpCancelerStore = useHttpCancelerStore()
    httpCancelerStore.delRequestingApiById(response.config.strixRequestId)
  }
  if (response.data) {
    response.data = dec(response.data)
    if (response.data.code === 401) {
      // 登录失效 清除登录信息并刷新
      window.localStorage.removeItem('strix_login_token')
      window.localStorage.removeItem('strix_login_token_expire')
      window.localStorage.removeItem('strix_login_info')
      location.href = '/login?to=' + location.pathname
    }
    // 填充默认错误信息
    if (response.data.code !== 200 && !response.data.msg) {
      response.data.msg = '未知错误'
    }
  }
  return response
})

function paramsSign(url, params, timestamp) {
  const urlParams = {
    _requestUrl: url
  }
  let encryptObj = urlParams
  if (params) {
    for (const key in params) {
      if (params[key] == null || params[key] === '') {
        params = _.omit(params, key)
      }
    }
    encryptObj = _.merge(urlParams, params)
  }

  const sortEncryptObj = sortAsc(encryptObj)
  const sortParamsJson = JSON.stringify(sortEncryptObj)

  const aes = CryptoJS.AES.encrypt(sortParamsJson, CryptoJS.enc.Utf8.parse('fUCkUon' + timestamp + 'T1me'), {
    iv: CryptoJS.enc.Utf8.parse('fuckyouObabyFUCK'),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  })

  return aes.ciphertext.toString()
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
