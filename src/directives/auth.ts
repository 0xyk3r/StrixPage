import { useLoginInfoStore } from '@/stores/login-info.ts'
import type { DirectiveBinding } from 'vue'
import { watchEffect } from 'vue'

const ALL_PERMISSIONS = '*:*:*'

/**
 * 权限检查模式
 */
type AuthMode = 'or' | 'and'

/**
 * 权限值类型
 */
type AuthValue = string | string[]

/**
 * 元素元数据
 */
interface ElementMeta {
  permissions: string[]
  mode: AuthMode
  placeholder: Comment | null
  anchor: Node | null
  parent: ParentNode | null
  stopEffect: (() => void) | null
}

/**
 * 使用 WeakMap 存储元素元数据
 */
const elementMetaMap = new WeakMap<HTMLElement, ElementMeta>()

/**
 * 规范化权限值为数组
 */
function normalizePermissions(value: AuthValue): string[] {
  if (typeof value === 'string') {
    return [value]
  }
  if (Array.isArray(value)) {
    return value
  }
  return []
}

/**
 * 检查用户是否具有权限
 * @param permissions 需要的权限列表
 * @param mode 检查模式：'or' 表示满足任一权限即可，'and' 表示需要满足所有权限
 */
function checkPermissions(permissions: string[], mode: AuthMode = 'or'): boolean {
  const loginInfoStore = useLoginInfoStore()
  // 检查权限数组是否有效
  if (!Array.isArray(permissions) || permissions.length === 0) {
    console.warn('[v-auth] 权限值不能为空数组，请提供有效的权限标识')
    return false
  }

  // 获取用户权限列表
  const userPermissions = loginInfoStore.loginInfo.permissionKeys

  // 用户权限未加载或为空
  if (!Array.isArray(userPermissions) || userPermissions.length === 0) {
    return false
  }

  // 检查是否有超级权限
  if (userPermissions.includes(ALL_PERMISSIONS)) {
    return true
  }

  // 根据模式检查权限
  if (mode === 'and') {
    // AND 模式：需要拥有所有权限
    return permissions.every((perm) => userPermissions.includes(perm))
  } else {
    // OR 模式：拥有任一权限即可
    return permissions.some((perm) => userPermissions.includes(perm))
  }
}

/**
 * 更新元素的显示状态
 */
function updateElementVisibility(el: HTMLElement, hasPermission: boolean) {
  const meta = elementMetaMap.get(el)
  if (!meta) return

  if (hasPermission) {
    // 有权限：显示真实元素
    if (meta.placeholder && meta.parent) {
      // 如果当前是占位符状态，替换回真实元素
      meta.parent.replaceChild(el, meta.placeholder)
      meta.placeholder = null
    }
  } else {
    // 无权限：用注释节点替换
    if (!meta.placeholder && el.parentNode) {
      // 创建注释占位符
      meta.placeholder = document.createComment('v-auth')
      meta.parent = el.parentNode
      meta.anchor = el.nextSibling

      // 用注释节点替换真实元素
      meta.parent.replaceChild(meta.placeholder, el)
    }
  }
}

/**
 * 绑定权限检查效果
 */
function bindAuthEffect(el: HTMLElement, permissions: string[], mode: AuthMode) {
  const loginInfoStore = useLoginInfoStore()
  const meta = elementMetaMap.get(el)
  if (!meta) return

  // 停止之前的监听
  if (meta.stopEffect) {
    meta.stopEffect()
  }

  // 使用 watchEffect 监听权限变化
  // noinspection UnnecessaryLocalVariableJS
  const stopEffect = watchEffect(() => {
    // 触发响应式依赖收集
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const userPermissions = loginInfoStore.loginInfo.permissionKeys

    // 检查权限
    const hasPermission = checkPermissions(permissions, mode)

    // 更新显示状态
    updateElementVisibility(el, hasPermission)
  })

  meta.stopEffect = stopEffect
}

/**
 * 解析指令绑定
 */
function parseBinding(binding: DirectiveBinding<AuthValue>): { permissions: string[]; mode: AuthMode } {
  const permissions = normalizePermissions(binding.value)

  // 从修饰符中获取模式
  let mode: AuthMode = 'or'
  if (binding.modifiers.and) {
    mode = 'and'
  } else if (binding.modifiers.or) {
    mode = 'or'
  }

  return { permissions, mode }
}

/**
 * v-auth 自定义指令
 *
 * 用法：
 * - v-auth="'permission:key'"          单个权限（字符串）
 * - v-auth="['perm1', 'perm2']"        多个权限（默认 OR 逻辑）
 * - v-auth.or="['perm1', 'perm2']"     多个权限（OR 逻辑，显式指定）
 * - v-auth.and="['perm1', 'perm2']"    多个权限（AND 逻辑，需要全部满足）
 *
 * 示例：
 * ```vue
 * <div v-auth="'system:user:update'">编辑用户</div>
 * <div v-auth="['system:user:add', 'system:user:update']">添加或编辑</div>
 * <div v-auth.and="['system:user:view', 'system:user:export']">查看且导出</div>
 * ```
 */
export default {
  mounted(el: HTMLElement, binding: DirectiveBinding<AuthValue>) {
    // 解析绑定参数
    const { permissions, mode } = parseBinding(binding)

    // 初始化元数据
    const meta: ElementMeta = {
      permissions,
      mode,
      placeholder: null,
      anchor: null,
      parent: null,
      stopEffect: null
    }
    elementMetaMap.set(el, meta)

    // 绑定权限检查效果
    bindAuthEffect(el, permissions, mode)
  },

  updated(el: HTMLElement, binding: DirectiveBinding<AuthValue>) {
    // 解析新的绑定参数
    const { permissions, mode } = parseBinding(binding)

    // 更新元数据
    const meta = elementMetaMap.get(el)
    if (meta) {
      meta.permissions = permissions
      meta.mode = mode
    }

    // 重新绑定权限检查效果
    bindAuthEffect(el, permissions, mode)
  },

  unmounted(el: HTMLElement) {
    const meta = elementMetaMap.get(el)
    if (!meta) return

    // 停止响应式监听
    if (meta.stopEffect) {
      meta.stopEffect()
    }

    // 如果元素当前是被注释替换的状态，需要恢复
    if (meta.placeholder && meta.parent) {
      try {
        // 尝试将真实元素恢复到 DOM 中（虽然即将卸载）
        meta.parent.replaceChild(el, meta.placeholder)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        // 忽略错误，元素即将被卸载
      }
    }

    // 清理元数据
    elementMetaMap.delete(el)
  }
}
