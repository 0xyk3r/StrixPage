import { type MessageApiInjection } from 'naive-ui/es/message/src/MessageProvider'
import { type MessageType, NAlert } from 'naive-ui'

let message: MessageApiInjection | null = null

export const initStrixMessage = () => {
  if (!message) {
    message = useMessage()
  }
}

export const createStrixMessage = (
  type: MessageType,
  title: string = '系统提示',
  content: string = '',
  duration: number = 3000
) => {
  initStrixMessage()
  ;(message as any)[type](content, {
    duration,
    render: (props: any) => {
      const { type, closable, onClose, content } = props
      return h(
        NAlert,
        {
          closable,
          onClose,
          type: type === 'loading' ? 'default' : type,
          title,
          style: {
            boxShadow: 'var(--n-box-shadow)',
            maxWidth: 'calc(100vw - 32px)',
            width: '480px'
          }
        },
        {
          default: () => {
            const lines = content.split('\n')
            return lines.map((line: string, index: number) => {
              return h('p', { key: index }, line)
            })
          }
        }
      )
    }
  })
}
