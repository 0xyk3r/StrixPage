import { useLoginInfoStore, type LoginInfoStore } from '@/stores/login-info'
import { storeToRefs } from 'pinia'
import { type DirectiveBinding, type Ref } from 'vue'

let loginInfoStore: ReturnType<typeof useLoginInfoStore> | null = null
let loginInfoRef: Ref<any> | null = null

function initStore() {
  if (!loginInfoStore) {
    loginInfoStore = useLoginInfoStore()
    const { loginInfo } = storeToRefs(loginInfoStore) as LoginInfoStore
    loginInfoRef = loginInfo
  }
}

function checkPermissions(permissions: string[]): boolean {
  const ALL_PERMISSIONS = '*:*:*'

  // 检查是否提供了权限数组
  if (!Array.isArray(permissions) || permissions.length === 0) {
    console.error(`需要指定权限! 例如 v-hasPerm="['*:*:*']"`)
    return false
  }

  // 检查用户是否具有所需的权限
  return (
    loginInfoRef?.value.permissionKeys?.some(
      (permission: string) => ALL_PERMISSIONS === permission || permissions.includes(permission)
    ) ?? false
  )
}

export default {
  mounted(el: HTMLElement, binding: DirectiveBinding<string[]>) {
    console.log('mounted', binding)
    initStore()
    if (!checkPermissions(binding.value)) {
      el.parentNode?.removeChild(el)
    }
  }
}
