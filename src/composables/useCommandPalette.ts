import { type MenuItem, useHomeMenu } from '@/composables/useHomeMenu'
import { EventBus } from '@/plugins/event-bus'

export interface CommandItem {
  id: string
  label: string
  icon?: string
  group: string
  action: () => void
}

/**
 * 命令面板状态管理 — 模块级共享状态
 */
const isOpen = ref(false)
const searchQuery = ref('')
const activeIndex = ref(0)

export function useCommandPalette() {
  const router = useRouter()
  const { getAllLeafItems } = useHomeMenu()

  const open = () => {
    isOpen.value = true
    searchQuery.value = ''
    activeIndex.value = 0
  }

  const close = () => {
    isOpen.value = false
    searchQuery.value = ''
  }

  const toggle = () => {
    if (isOpen.value) close()
    else open()
  }

  // 内置操作命令
  const actionCommands: CommandItem[] = [
    {
      id: 'cmd-theme',
      label: '切换主题',
      icon: 'contrast',
      group: '操作',
      action: () => {
        EventBus.emit('changeTheme')
        close()
      }
    },
    {
      id: 'cmd-reload',
      label: '刷新全部',
      icon: 'refresh-cw',
      group: '操作',
      action: () => {
        EventBus.emit('reload-all')
        close()
      }
    },
    {
      id: 'cmd-fullscreen',
      label: '切换全屏',
      icon: 'expand',
      group: '操作',
      action: () => {
        import('screenfull').then(({ default: screenfull }) => {
          if (screenfull.isEnabled) screenfull.toggle()
        })
        close()
      }
    }
  ]

  // 将菜单项转为命令项
  const menuCommands = computed<CommandItem[]>(() => {
    return getAllLeafItems.value.map((item: MenuItem) => ({
      id: `menu-${item.id}`,
      label: item.name,
      icon: item.iconName || 'file',
      group: '导航',
      action: () => {
        if (item.url) router.push(item.url)
        close()
      }
    }))
  })

  // 所有命令
  const allCommands = computed(() => [...menuCommands.value, ...actionCommands])

  // 搜索过滤结果
  const filteredCommands = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return allCommands.value
    return allCommands.value.filter((cmd) => cmd.label.toLowerCase().includes(q))
  })

  // 分组结果
  const groupedResults = computed(() => {
    const groups: Record<string, CommandItem[]> = {}
    for (const cmd of filteredCommands.value) {
      const g = groups[cmd.group] ?? (groups[cmd.group] = [])
      g.push(cmd)
    }
    return Object.entries(groups).map(([label, items]) => ({ label, items }))
  })

  // 键盘导航
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
      return
    }

    const total = filteredCommands.value.length
    if (!total) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      activeIndex.value = (activeIndex.value + 1) % total
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      activeIndex.value = (activeIndex.value - 1 + total) % total
    } else if (e.key === 'Enter') {
      e.preventDefault()
      filteredCommands.value[activeIndex.value]?.action()
    }
  }

  // 搜索变化时重置选中索引
  watch(searchQuery, () => {
    activeIndex.value = 0
  })

  // 监听全局事件
  onMounted(() => {
    EventBus.on('open-command-palette', open)
  })

  onUnmounted(() => {
    EventBus.off('open-command-palette', open)
  })

  return {
    isOpen,
    searchQuery,
    activeIndex,
    filteredCommands,
    groupedResults,
    open,
    close,
    toggle,
    handleKeydown
  }
}
