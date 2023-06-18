import { NAlert, useMessage } from 'naive-ui'
import { h } from 'vue'

let message = null

export const initStrixMessage = () => {
  if (message == null) {
    message = useMessage()
  }
}

export const createStrixMessage = (type, title, content, duration = 3000) => {
  if (message == null) {
    message = useMessage()
  }
  message[type](content || '', {
    render: (props) => {
      const { type } = props;
      return h(
        NAlert,
        {
          closable: props.closable,
          onClose: props.onClose,
          type: type === "loading" ? "default" : type,
          title: title || '系统提示',
          style: {
            boxShadow: "var(--n-box-shadow)",
            maxWidth: "calc(100vw - 32px)",
            width: "480px"
          }
        },
        {
          default: () => props.content
        }
      )
    }
  })
}
