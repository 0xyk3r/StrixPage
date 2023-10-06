import { Icon } from '@iconify/vue'
import { NButton, NPopover, NPopconfirm } from 'naive-ui'
import { h } from 'vue'

export const handleOperate = (buttons, size = 'medium') => {
  // 阻止事件冒泡
  const stop = (e) => {
    e.stopPropagation()
  }

  return buttons.map((button) => {
    const { type, label, icon, disabled, onClick, popconfirm, popconfirmMessage } = button

    const clickStop = (e) => {
      e.stopPropagation()
      onClick()
    }

    const buttonProps = {
      size: size,
      type,
      disabled,
      style: 'margin-right: 10px',
      onClick: !popconfirm ? clickStop : stop
    }

    const content = popconfirm
      ? h(
          NPopconfirm,
          {
            onPositiveClick: clickStop
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
          { trigger: 'hover', duration: 0 },
          {
            trigger: () => content,
            default: () => h('div', null, label)
          }
        )
      : content
  })
}
