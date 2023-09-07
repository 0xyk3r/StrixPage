import { onMounted, ref } from 'vue'

export function useToken() {
  const token = ref('')

  onMounted(() => {
    token.value = localStorage.getItem('strix_login_token')
  })

  return { token }
}

export function setToken(res) {
  window.localStorage.setItem('strix_login_token', res.data.token)
  window.localStorage.setItem('strix_login_token_expire', res.data.tokenExpire)
  window.localStorage.setItem('strix_login_info', JSON.stringify(res.data.info))
}
