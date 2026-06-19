/**
 * SM2 + SM4 国密加密工具
 *
 * 统一的加密/解密/签名实现，供 axios 拦截器和 SSE 等场景共用。
 */
import { sm2, sm3, sm4 } from 'sm-crypto'

const serverSm2PublicKey = import.meta.env.VITE_APP_SERVER_SM2_PUBLIC_KEY
const clientSm2PrivateKey = import.meta.env.VITE_APP_CLIENT_SM2_PRIVATE_KEY

/**
 * hex 字符串转字节数组
 */
export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

/**
 * 字节数组转 hex 字符串
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * 生成随机 hex 字符串
 * @param length hex 字符串长度（字节数 × 2）
 */
export function generateRandomHex(length: number): string {
  const bytes = new Uint8Array(length / 2)
  crypto.getRandomValues(bytes)
  return bytesToHex(bytes)
}

/**
 * SM2+SM4 加密请求体
 * @param data 待加密数据
 * @returns 加密后的数据 { sign, data, iv }
 */
export function encrypt(data: unknown): { sign: string; data: string; iv: string } {
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
 * SM2+SM4 解密响应体
 * @param response 待解密数据
 * @returns 解密后的数据
 */
export function decrypt(response: unknown): unknown {
  const res = response as { data?: string; sign?: string; iv?: string; code?: number }
  const data = res.data
  const sign = res.sign
  const ivField = res.iv

  // 处理报错信息（无 sign 且非 200 成功响应）
  if ((!data || !sign) && res.code !== 200) {
    return response
  }

  // 无加密标记 (sign/iv)：端点使用 @IgnoreEncryption，响应为明文，直接返回
  if (!sign) {
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
    const ivBytes = Uint8Array.from(atob(ivField!), (c) => c.charCodeAt(0))
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
 * POST 请求签名：对原始请求体字符串签名
 * sign = SM3(bodyString + "|" + url + "|" + timestamp)
 *
 * @param bodyString 原始请求体 JSON 字符串
 * @param url 请求 URL
 * @param timestamp 时间戳
 * @returns SM3 签名
 */
export function signPost(bodyString: string, url: string, timestamp: string): string {
  const content = bodyString + '|' + url + '|' + timestamp
  return sm3(content)
}

/**
 * GET 请求签名：对排序后的查询参数签名
 * sign = SM3(sortedParamsJSON + "|" + url + "|" + timestamp)
 *
 * 过滤逻辑对齐后端 StringUtils.hasText：移除 null、undefined、空字符串、纯空白字符串。
 *
 * @param url 请求 URL
 * @param params 查询参数
 * @param timestamp 时间戳
 * @returns SM3 签名
 */
export function signGet(url: string, params: Record<string, unknown>, timestamp: string): string {
  let paramsJson = '{}'
  if (params) {
    const filtered: Record<string, unknown> = {}
    for (const key of Object.keys(params).sort()) {
      const val = params[key]
      if (val != null && !(typeof val === 'string' && val.trim() === '')) {
        filtered[key] = val
      }
    }
    paramsJson = JSON.stringify(filtered)
  }
  const content = paramsJson + '|' + url + '|' + timestamp
  return sm3(content)
}
