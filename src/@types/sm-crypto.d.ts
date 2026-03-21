declare module 'sm-crypto' {
  export const sm2: {
    doEncrypt(data: string, publicKey: string, cipherMode?: 0 | 1): string
    doDecrypt(data: string, privateKey: string, cipherMode?: 0 | 1): string
    doSignature(msg: string, privateKey: string, options?: Record<string, any>): string
    doVerifySignature(msg: string, signHex: string, publicKey: string, options?: Record<string, any>): boolean
    generateKeyPairHex(): { privateKey: string; publicKey: string }
  }

  export function sm3(data: string): string

  export const sm4: {
    encrypt(
      data: string,
      key: string,
      options?: { mode?: 'cbc' | 'ecb'; iv?: string; padding?: 'pkcs#5' | 'pkcs#7' | 'none' }
    ): string
    decrypt(
      data: string,
      key: string,
      options?: { mode?: 'cbc' | 'ecb'; iv?: string; padding?: 'pkcs#5' | 'pkcs#7' | 'none' }
    ): string
  }
}
