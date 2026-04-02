import { authApi } from '@/api/auth'
import { EventBus } from '@/plugins/event-bus'
import { deepSearch } from '@/utils/strix-tools'
import { kebabCase } from 'lodash-es'

export interface MenuItem {
  id: string
  name: string
  url?: string
  icon?: string
  iconName?: string
  children?: MenuItem[] | null
}

// ─── 模块级共享状态（单例模式，多组件共享同一份数据） ───
const menuLoading = ref(false)
const menuList = ref<MenuItem[]>([])
const menuSelected = ref('')
const expandedKeys = ref<Set<string>>(new Set())

// 请求去重：并发调用只发一次请求
let activeLoadPromise: Promise<void> | null = null
let initialized = false

/**
 * 处理菜单图标字段
 */
const handleMenuIconField = (list: MenuItem[]): MenuItem[] => {
  for (const child of list) {
    if (child.icon) {
      child.iconName = child.iconName || kebabCase(child.icon as string)
    }
    if (child.children && child.children.length > 0) {
      handleMenuIconField(child.children)
    } else {
      child.children = null
    }
  }
  return list
}

/**
 * 获取所有叶子菜单项 (用于命令面板搜索)
 */
const getAllLeafItems = computed(() => {
  const result: MenuItem[] = []
  const walk = (items: MenuItem[]) => {
    for (const item of items) {
      if (item.children && item.children.length > 0) {
        walk(item.children)
      } else if (item.url) {
        result.push(item)
      }
    }
  }
  walk(menuList.value)
  return result
})

/**
 * 首页菜单逻辑 Composable（单例共享状态）
 * 多个组件调用只会发一次菜单请求，共享同一份菜单数据
 */
export function useHomeMenu() {
  const router = useRouter()
  const route = useRoute()

  /**
   * 同步当前路由对应的菜单选中状态
   */
  const syncCurrentSelectMenu = () => {
    if (menuList.value && menuList.value.length > 0) {
      const currentMenu = deepSearch(menuList.value, route.path, 'url')
      if (currentMenu) {
        menuSelected.value = currentMenu.id
        expandParentMenus(menuList.value, currentMenu.id)
      }
    }
  }

  /**
   * 递归查找并展开包含指定菜单项的所有父级
   */
  const expandParentMenus = (items: MenuItem[], targetId: string, parentIds: string[] = []): boolean => {
    for (const item of items) {
      if (item.id === targetId) {
        parentIds.forEach((id) => expandedKeys.value.add(id))
        return true
      }
      if (item.children && item.children.length > 0) {
        if (expandParentMenus(item.children, targetId, [...parentIds, item.id])) {
          return true
        }
      }
    }
    return false
  }

  /**
   * 切换子菜单展开/折叠
   */
  const toggleExpand = (id: string) => {
    if (expandedKeys.value.has(id)) {
      expandedKeys.value.delete(id)
    } else {
      expandedKeys.value.add(id)
    }
  }

  /**
   * 导航到指定菜单项
   */
  const navigateTo = (item: MenuItem) => {
    if (item.url) {
      router.push(item.url)
    }
  }

  /**
   * 加载系统主菜单（去重：并发调用复用同一个请求）
   */
  const loadMenuList = () => {
    if (activeLoadPromise) return activeLoadPromise
    menuLoading.value = true
    activeLoadPromise = authApi
      .menus()
      .then(({ data: res }) => {
        menuList.value = handleMenuIconField(res.data.menuList)
        syncCurrentSelectMenu()
      })
      .finally(() => {
        menuLoading.value = false
        activeLoadPromise = null
      })
    return activeLoadPromise
  }

  /**
   * 强制重新加载菜单（用于菜单管理页修改后刷新）
   */
  const forceReloadMenuList = () => {
    activeLoadPromise = null
    return loadMenuList()
  }

  // 首个调用者注册全局监听（HomePage 最先调用且永不卸载）
  if (!initialized) {
    initialized = true

    watch(() => route.path, syncCurrentSelectMenu, { immediate: true })

    onMounted(() => {
      loadMenuList()
      EventBus.on('refresh-menu', forceReloadMenuList)
    })

    onUnmounted(() => {
      EventBus.off('refresh-menu', forceReloadMenuList)
    })
  } else {
    // 后续调用者：确保数据已加载
    onMounted(() => {
      if (!menuList.value.length) {
        loadMenuList()
      }
    })
  }

  return {
    menuLoading,
    menuList,
    menuSelected,
    expandedKeys,
    toggleExpand,
    navigateTo,
    loadMenuList: forceReloadMenuList,
    getAllLeafItems
  }
}
