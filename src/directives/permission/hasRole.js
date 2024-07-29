export default {
  mounted(el, { value: requiredRoles }) {
    const SUPER_MANAGER = 'SuperManager'
    const userRoles = []

    // 检查是否提供了角色数组
    if (!Array.isArray(requiredRoles) || requiredRoles.length === 0) {
      console.error(`需要指定权限! 例如 v-hasRole="['*:*:*']"`)
      return
    }

    // 检查用户是否具有所需的权限
    const hasRole = userRoles.some((role) => SUPER_MANAGER === role || requiredRoles.includes(role))

    if (!hasRole) {
      el.parentNode?.removeChild(el)
    }
  }
}
