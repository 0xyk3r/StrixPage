import { AES } from 'crypto-es/lib/aes'
import { Pkcs7 } from 'crypto-es/lib/cipher-core'
import { Utf8 } from 'crypto-es/lib/core'
import { ECB } from 'crypto-es/lib/mode-ecb'
export function aesEncrypt(word: string, keyWord = 'XwKsGlMcdPMEhR1B') {
  const key = Utf8.parse(keyWord)
  const srcs = Utf8.parse(word)
  const encrypted = AES.encrypt(srcs, key, {
    mode: ECB,
    padding: Pkcs7
  })
  return encrypted.toString()
}
