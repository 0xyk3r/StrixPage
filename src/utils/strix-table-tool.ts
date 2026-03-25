import { NPopconfirm, NPopover } from 'naive-ui'
import StrixIcon from '@/components/icon/StrixIcon.vue'

const stopPropagation = (e: MouseEvent) => {
  e.stopPropagation()
}

// NaiveUI type → nebula-action-btn CSS modifier
const typeToClass: Record<string, string> = {
  error: 'is-danger',
  warning: 'is-warning',
  info: 'is-info',
  success: 'is-success'
}

export const handleOperate = (buttons: any[], _size = 'medium') => {
  const operateButtons = buttons.map((button) => {
    const { type, label, icon, disabled, onClick, popconfirm, popconfirmMessage } = button

    const clickHandler = (e: MouseEvent) => {
      e.stopPropagation()
      onClick()
    }

    const btnClass = ['nebula-action-btn', typeToClass[type] || ''].filter(Boolean)
    const iconVNode = h(StrixIcon, { icon, size: 16 })
    const btn = h(
      'button',
      {
        class: btnClass,
        disabled,
        onClick: !popconfirm ? clickHandler : stopPropagation
      },
      [iconVNode]
    )

    const content = popconfirm
      ? h(
          NPopconfirm,
          {
            onPositiveClick: clickHandler,
            positiveButtonProps: { type }
          },
          {
            trigger: () => btn,
            default: () => popconfirmMessage
          }
        )
      : btn

    return label
      ? h(
          NPopover,
          { trigger: 'hover', duration: 0, flip: false },
          {
            trigger: () => content,
            default: () => h('div', null, label)
          }
        )
      : content
  })

  return h('div', { class: 'nebula-action-group' }, operateButtons)
}
