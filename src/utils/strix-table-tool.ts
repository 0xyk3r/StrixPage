import { Icon } from '@iconify/vue'
import { NButton, NPopover, NPopconfirm } from 'naive-ui'
import { h } from 'vue'

/**
 * 阻止事件冒泡
 * @param {MouseEvent} e 鼠标事件
 */
const stopPropagation = (e: MouseEvent) => {
  e.stopPropagation()
}

export const handleOperate = (buttons: any[], size = 'medium') => {
  return buttons.map((button) => {
    const { type, label, icon, disabled, onClick, popconfirm, popconfirmMessage } = button

    const clickHandler = (e: MouseEvent) => {
      e.stopPropagation()
      onClick()
    }

    const buttonProps: any = {
      size,
      type,
      disabled,
      style: 'margin-right: 10px',
      onClick: !popconfirm ? clickHandler : stopPropagation
    }

    const content = popconfirm
      ? h(
          NPopconfirm,
          {
            onPositiveClick: clickHandler,
            positiveButtonProps: { type }
          },
          {
            trigger: () => h(NButton, buttonProps, () => h(Icon, { icon })),
            default: () => popconfirmMessage
          }
        )
      : h(NButton, buttonProps, () => h(Icon, { icon }))

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
}
