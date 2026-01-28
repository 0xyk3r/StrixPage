import { AES, ECB, Pkcs7, Utf8 } from 'crypto-es'

export function aesEncrypt(word: string, keyWord = 'XwKsGlMcdPMEhR1B') {
  const key = Utf8.parse(keyWord)
  const srcs = Utf8.parse(word)
  const encrypted = AES.encrypt(srcs, key, {
    mode: ECB,
    padding: Pkcs7
  })
  return encrypted.toString()
}
