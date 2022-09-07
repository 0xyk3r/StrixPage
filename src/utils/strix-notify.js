import { useNotification } from 'naive-ui'

let notification = null

export const initStrixNotify = () => {
  if (notification == null) {
    notification = useNotification()
  }
}

// 该方法不能直接在()=>{}中调用，需要先初始化
export const createStrixNotify = (type, title, content, duration = 3000) => {
  if (notification == null) {
    notification = useNotification()
  }
  notification[type]({
    title: title || null,
    content: content || '发生错误',
    duration: duration
  })
}
