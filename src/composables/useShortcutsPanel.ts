export interface ShortcutItem {
  keys: string[]
  description: string
}

export interface ShortcutGroup {
  label: string
  icon: string
  items: ShortcutItem[]
}

const isOpen = ref(false)

export const shortcutGroups: ShortcutGroup[] = [
  {
    label: '通用',
    icon: 'keyboard',
    items: [
      { keys: ['?'], description: '打开快捷键帮助' },
      { keys: ['Escape'], description: '关闭弹出面板' }
    ]
  },
  {
    label: '面板',
    icon: 'layout-panel-left',
    items: [
      { keys: ['Ctrl', '/'], description: '打开/关闭侧边菜单' },
      { keys: ['Ctrl', 'K'], description: '打开/关闭命令面板' }
    ]
  },
  {
    label: '命令面板内',
    icon: 'terminal',
    items: [
      { keys: ['↑', '↓'], description: '上下导航' },
      { keys: ['Enter'], description: '执行选中命令' },
      { keys: ['Escape'], description: '关闭面板' }
    ]
  },
  {
    label: '标签页',
    icon: 'panel-top',
    items: [{ keys: ['拖拽'], description: '拖拽标签页排序' }]
  }
]

export function useShortcutsPanel() {
  const open = () => {
    isOpen.value = true
  }

  const close = () => {
    isOpen.value = false
  }

  const toggle = () => {
    if (isOpen.value) close()
    else open()
  }

  return { isOpen, open, close, toggle }
}
