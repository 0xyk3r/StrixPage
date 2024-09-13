import CryptoES from 'crypto-es'
export function aesEncrypt(word: string, keyWord = 'XwKsGlMcdPMEhR1B') {
  const key = CryptoES.enc.Utf8.parse(keyWord)
  const srcs = CryptoES.enc.Utf8.parse(word)
  const encrypted = CryptoES.AES.encrypt(srcs, key, {
    mode: CryptoES.mode.ECB,
    padding: CryptoES.pad.Pkcs7
  })
  return encrypted.toString()
}
