import { type MenuItem, useHomeMenu } from '@/composables/useHomeMenu'
import { EventBus } from '@/plugins/event-bus'
import { useBookmarksStore } from '@/stores/bookmarks'

export interface CommandItem {
  id: string
  label: string
  icon?: string
  group: string
  action: () => void
  bookmarked?: boolean
  toggleBookmark?: () => void
}

/**
 * 命令面板状态管理 — 模块级共享状态
 */
const isOpen = ref(false)
const searchQuery = ref('')
const activeIndex = ref(0)

export function useCommandPalette() {
  const router = useRouter()
  const route = useRoute()
  const { getAllLeafItems } = useHomeMenu()
  const bookmarksStore = useBookmarksStore()

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
      bookmarked: item.url ? bookmarksStore.isPathBookmarked(item.url) : false,
      toggleBookmark: item.url
        ? () => {
            bookmarksStore.toggleByPath({
              path: item.url!,
              fullPath: item.url!,
              title: item.name,
              icon: item.iconName
            })
          }
        : undefined,
      action: () => {
        if (item.url) router.push(item.url)
        close()
      }
    }))
  })

  // 当前页收藏切换命令
  const bookmarkCommand = computed<CommandItem>(() => {
    const isCurrentBookmarked = bookmarksStore.isBookmarked(route.fullPath)
    return {
      id: 'cmd-bookmark-toggle',
      label: isCurrentBookmarked ? '取消收藏当前页' : '收藏当前页',
      icon: isCurrentBookmarked ? 'bookmark-minus' : 'bookmark-plus',
      group: '操作',
      action: () => {
        bookmarksStore.toggleBookmark({
          path: route.path,
          fullPath: route.fullPath,
          title: (route.meta.title as string) || route.name?.toString() || route.path,
          icon: route.meta.icon as string,
          query: { ...(route.query as Record<string, any>) }
        })
        close()
      }
    }
  })

  // 所有命令
  const allCommands = computed(() => [...menuCommands.value, bookmarkCommand.value, ...actionCommands])

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
