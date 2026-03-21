import { sm4 } from 'sm-crypto'

export function sm4Encrypt(word: string, hexKey: string) {
  return sm4.encrypt(word, hexKey, {
    mode: 'ecb',
    padding: 'pkcs#7'
  })
}
