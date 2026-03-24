import { http } from '@/plugins/axios'
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
  [key: string]: any
}

/**
 * 首页菜单逻辑 Composable
 * 包含菜单加载、图标处理、选中状态同步
 */
export function useHomeMenu() {
  const router = useRouter()
  const route = useRoute()

  const menuLoading = ref(false)
  const menuList = ref<MenuItem[]>([])
  const menuSelected = ref('')
  const expandedKeys = ref<Set<string>>(new Set())

  /**
   * 处理菜单图标字段
   * 将图标名称转换为 kebab-case 格式供 StrixIcon 使用
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
   * 同步当前路由对应的菜单选中状态
   */
  const syncCurrentSelectMenu = () => {
    if (menuList.value && menuList.value.length > 0) {
      const currentMenu = deepSearch(menuList.value, route.path, 'url')
      if (currentMenu) {
        menuSelected.value = currentMenu.id
        // 展开包含当前选中项的父菜单
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
   * 加载系统主菜单
   */
  const loadMenuList = () => {
    menuLoading.value = true
    http
      .get('system/menus', { meta: { operate: '加载系统主菜单' } })
      .then(({ data: res }) => {
        menuList.value = handleMenuIconField(res.data.menuList)
        syncCurrentSelectMenu()
      })
      .finally(() => {
        menuLoading.value = false
      })
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

  // 监听路由变化以同步菜单选中项
  watch(() => route.path, syncCurrentSelectMenu, { immediate: true })

  // 初始化
  onMounted(() => {
    loadMenuList()
    EventBus.on('refresh-menu', loadMenuList)
  })

  onUnmounted(() => {
    EventBus.off('refresh-menu', loadMenuList)
  })

  return {
    menuLoading,
    menuList,
    menuSelected,
    expandedKeys,
    toggleExpand,
    navigateTo,
    loadMenuList,
    getAllLeafItems
  }
}
