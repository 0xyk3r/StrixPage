import { NButton, NFlex, NPopconfirm, NPopover } from 'naive-ui'
import StrixIcon from '@/components/Icon/StrixIcon.vue'

/**
 * 阻止事件冒泡
 * @param {MouseEvent} e 鼠标事件
 */
const stopPropagation = (e: MouseEvent) => {
  e.stopPropagation()
}

const btnSizeToFlexSize: { [key: string]: 'small' | 'medium' | 'large' | number } = {
  tiny: 5,
  small: 'small',
  medium: 'medium',
  large: 'large'
}

export const handleOperate = (buttons: any[], size = 'medium') => {
  const operateBtns = buttons.map((button) => {
    const { type, label, icon, disabled, onClick, popconfirm, popconfirmMessage } = button

    const clickHandler = (e: MouseEvent) => {
      e.stopPropagation()
      onClick()
    }

    const buttonProps: any = {
      size,
      type,
      disabled,
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
            trigger: () => h(NButton, buttonProps, () => h(StrixIcon, { icon, size: 16 })),
            default: () => popconfirmMessage
          }
        )
      : h(NButton, buttonProps, () => h(StrixIcon, { icon, size: 16 }))

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

  return h(NFlex, { justify: 'center', size: btnSizeToFlexSize[size] }, () => operateBtns)
}
