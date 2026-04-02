import type { LoginManagerInfo } from '@/api/auth'
import type { RetResult } from '@/api/types'
import { defineStore } from 'pinia'
import { type Ref } from 'vue'

export interface LoginInfoStore {
  loginToken: Ref<string>
  loginTokenExpire: Ref<string>
  loginInfo: Ref<LoginManagerInfo>
}

export const useLoginInfoStore = defineStore(
  'loginInfo',
  () => {
    const loginToken = ref('')
    const loginTokenExpire = ref('')
    const loginInfo = ref<LoginManagerInfo>({} as LoginManagerInfo)

    function updateLoginInfo(loginResult: RetResult<{ token: string; tokenExpire: string; info?: LoginManagerInfo }>) {
      loginToken.value = loginResult.data.token
      loginTokenExpire.value = loginResult.data.tokenExpire
      if (loginResult.data.info) {
        loginInfo.value = loginResult.data.info
      }
    }

    function clearLoginInfo() {
      loginToken.value = ''
      loginTokenExpire.value = ''
      loginInfo.value = {} as LoginManagerInfo
    }

    return {
      loginToken,
      loginTokenExpire,
      loginInfo,
      updateLoginInfo,
      clearLoginInfo
    }
  },
  {
    persist: {
      key: '$login-info',
      storage: localStorage
    }
  }
)
