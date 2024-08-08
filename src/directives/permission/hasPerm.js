import { useLoginInfoStore } from '@/stores/login-info'
import { storeToRefs } from 'pinia'

let loginInfoStore = null
let loginInfoRef = null
function initStore() {
  if (!loginInfoStore) {
    loginInfoStore = useLoginInfoStore()
    const { loginInfo } = storeToRefs(loginInfoStore)
    loginInfoRef = loginInfo
  }
}

export default {
  mounted(el, { value: requiredPermissions }) {
    initStore()
    const ALL_PERMISSIONS = '*:*:*'

    // 检查是否提供了权限数组
    if (!Array.isArray(requiredPermissions) || requiredPermissions.length === 0) {
      console.error(`需要指定权限! 例如 v-hasPerm="['*:*:*']"`)
      return
    }

    // 检查用户是否具有所需的权限
    const hasPermission = loginInfoRef.value?.permissionKeys?.some(
      (permission) => ALL_PERMISSIONS === permission || requiredPermissions.includes(permission)
    )

    if (!hasPermission) {
      el.parentNode?.removeChild(el)
    }
  }
}
