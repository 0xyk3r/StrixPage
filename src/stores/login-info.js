import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLoginInfoStore = defineStore(
  'loginInfo',
  () => {
    const loginToken = ref('')
    const loginTokenExpire = ref('')
    const loginInfo = ref({})

    function updateLoginInfo(loginResult) {
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
