import { http } from '@/plugins/axios'
import { useLoginInfoStore } from '@/stores/login-info'
import { storeToRefs } from 'pinia'

/**
 * Token 续期 Composable
 * 自动检测并续期即将过期的 Token
 */
export function useTokenRenewal() {
  const loginInfoStore = useLoginInfoStore()
  const { loginInfo, loginTokenExpire } = storeToRefs(loginInfoStore)

  /**
   * 检查并续期 Token
   * 如果 Token 过期时间小于 30 天，则自动续期
   */
  const renewToken = () => {
    if (!loginTokenExpire.value) return

    const expireTime = new Date(loginTokenExpire.value).getTime()
    const currentTime = new Date().getTime()
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000

    if (expireTime - currentTime < thirtyDaysInMs) {
      http
        .post('system/renewToken', null, {
          meta: { operate: '续期 Token', notify: false }
        })
        .then(({ data: res }) => {
          loginInfoStore.updateLoginInfo(res)
          loginInfo.value = res.data.info
        })
    }
  }

  // 组件挂载时自动检查续期
  onMounted(renewToken)

  return {
    renewToken
  }
}
