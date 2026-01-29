import StrixIcon from '@/components/icon/StrixIcon.vue'
import { http } from '@/plugins/axios'
import { EventBus } from '@/plugins/event-bus'
import { deepSearch } from '@/utils/strix-tools'
import { kebabCase } from 'lodash-es'
import type { MenuInst, MenuOption } from 'naive-ui'
import { RouterLink } from 'vue-router'

/**
 * 首页菜单逻辑 Composable
 * 包含菜单加载、图标处理、标签渲染、选中状态同步
 */
export function useHomeMenu() {
  const route = useRoute()

  const menuRef = ref<MenuInst | null>(null)
  const menuLoading = ref(false)
  const menuList = ref<any[]>([])
  const menuSelected = ref('')

  /**
   * 处理菜单图标字段
   * 将图标名称转换为图标组件渲染函数
   */
  const handleMenuIconField = (list: any[]): any[] => {
    for (const child of list) {
      if (child.icon) {
        if (!child.iconName) {
          child.iconName = child.icon
        }
        child.icon = () => h(StrixIcon, { icon: kebabCase(child.iconName) })
      } else {
        child.icon = null
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
        nextTick(() => menuRef.value?.showOption())
      }
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
   * 渲染菜单标签
   * 如果是叶子节点则渲染为 RouterLink
   */
  const renderMenuLabel = (option: MenuOption): any => {
    if (!option.children) {
      return h(RouterLink, { to: option.url as string }, { default: () => option.name })
    }
    return option.name
  }

  // 监听路由变化以同步菜单选中项
  watch(() => route.path, syncCurrentSelectMenu, { immediate: true })

  // 初始化：加载菜单和监听刷新事件
  onMounted(() => {
    loadMenuList()
    EventBus.on('refresh-menu', loadMenuList)
  })

  onUnmounted(() => {
    EventBus.off('refresh-menu', loadMenuList)
  })

  return {
    menuRef,
    menuLoading,
    menuList,
    menuSelected,
    renderMenuLabel,
    loadMenuList
  }
}
