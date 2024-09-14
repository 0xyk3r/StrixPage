import { defineStore } from 'pinia'
import { type Ref } from 'vue'

export interface LoginInfoStore {
  loginToken: Ref<string>
  loginTokenExpire: Ref<string>
  loginInfo: Ref<any>
}

export const useLoginInfoStore = defineStore(
  'loginInfo',
  () => {
    const loginToken = ref('')
    const loginTokenExpire = ref('')
    const loginInfo = ref({})

    function updateLoginInfo(loginResult: any) {
      loginToken.value = loginResult.data.token
      loginTokenExpire.value = loginResult.data.tokenExpire
      loginInfo.value = loginResult.data.info
    }

    function clearLoginInfo() {
      loginToken.value = ''
      loginTokenExpire.value = ''
      loginInfo.value = {}
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
