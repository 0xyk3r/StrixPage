import { sm2, sm4 } from 'sm-crypto'

const serverSm2PublicKey = import.meta.env.VITE_APP_SERVER_SM2_PUBLIC_KEY

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
 * SM2+SM4 加密（与 axios.ts 中 enc() 逻辑完全一致）
 * 用于需要手动构造加密请求的场景（如 fetch-based SSE）
 */
export function enc(data: any): { sign: string; data: string; iv: string } {
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
  // Java BouncyCastle 需要 '04' 非压缩点前缀
  const encryptedKeyBytes = hexToBytes('04' + encryptedKeyHex)
  const sign = btoa(String.fromCharCode(...encryptedKeyBytes))

  // SM4/CBC 加密数据
  const encryptedData = sm4.encrypt(plaintext, sm4KeyHex, { mode: 'cbc', iv: ivHex })

  return { sign, data: encryptedData, iv: ivBase64 }
}
