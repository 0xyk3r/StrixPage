import type { DirectiveBinding } from 'vue'

export default {
  mounted(el: HTMLElement, binding: DirectiveBinding<string[]>) {
    const SUPER_MANAGER = 'SuperManager'
    const userRoles: string[] = []

    // 检查是否提供了角色数组
    if (!Array.isArray(binding) || binding.length === 0) {
      console.error(`需要指定权限! 例如 v-hasRole="['*:*:*']"`)
      return
    }

    // 检查用户是否具有所需的权限
    const hasRole = userRoles.some((role) => SUPER_MANAGER === role || binding.includes(role))

    if (!hasRole) {
      el.parentNode?.removeChild(el)
    }
  }
}
