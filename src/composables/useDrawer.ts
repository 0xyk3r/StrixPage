import { EventBus } from '@/plugins/event-bus'

/**
 * 抽屉菜单状态管理 Composable
 * 提供菜单抽屉的开关控制, 全局共享状态
 */

const drawerOpen = ref(false)

export function useDrawer() {
  const open = () => {
    drawerOpen.value = true
  }

  const close = () => {
    drawerOpen.value = false
  }

  const toggle = () => {
    drawerOpen.value = !drawerOpen.value
  }

  // 点击容器时自动关闭 (由 HomePage 的 click-container 事件触发)
  const setupAutoClose = () => {
    const handler = () => {
      if (drawerOpen.value) {
        close()
      }
    }

    onMounted(() => {
      EventBus.on('click-container', handler)
    })

    onUnmounted(() => {
      EventBus.off('click-container', handler)
    })
  }

  return {
    drawerOpen: readonly(drawerOpen),
    open,
    close,
    toggle,
    setupAutoClose
  }
}
