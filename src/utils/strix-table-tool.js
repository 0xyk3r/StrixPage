import { Icon } from "@iconify/vue"
import { NButton, NPopover, NPopconfirm } from "naive-ui"
import { h } from "vue"

export const handleOperate = (buttons) => {
    return buttons.map(button => {
        const { type, label, icon, onClick, popconfirm, popconfirmMessage } = button
        const buttonProps = {
            size: 'medium',
            type,
            style: 'margin-right: 10px',
            onClick: !popconfirm ? onClick : undefined
        }

        const content = popconfirm ? h(NPopconfirm, {
            onPositiveClick: onClick
        }, {
            trigger: () => h(NButton, buttonProps, () => h(Icon, { icon })),
            default: () => popconfirmMessage
        }) : h(NButton, buttonProps, () => h(Icon, { icon }))

        return label ? h(NPopover, { trigger: 'hover', duration: 0 }, {
            trigger: () => content,
            default: () => h('div', null, label)
        }) : content
    })
}
