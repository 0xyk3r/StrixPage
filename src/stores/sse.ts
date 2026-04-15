import { authApi } from '@/api/auth'
import { EventBus } from '@/plugins/event-bus'
import { useLoginInfoStore } from '@/stores/login-info'
import { useDictStore } from '@/stores/dict'
import { useNotificationStore } from '@/stores/notification'
import { defineStore } from 'pinia'

/**
 * SSE 连接管理 Store
 *
 * 拥有 EventSource 生命周期, 分发所有 SSE 事件:
 * - notification:new → 通知 store 递增未读数
 * - notification:count → 通知 store 设置未读数
 * - auth:refresh → 刷新 loginInfo 权限 + 触发菜单重载
 */
export const useSseStore = defineStore('sse', () => {
  const connected = ref(false)
  let eventSource: EventSource | null = null

  function connect() {
    if (eventSource) return

    const loginInfoStore = useLoginInfoStore()
    const token = loginInfoStore.loginToken
    if (!token) {
      console.warn('SSE: 无登录 token, 无法建立连接')
      return
    }

    const url = `/api/sse/stream?token=${token}`
    eventSource = new EventSource(url)

    // 通知事件 → 委托给 notificationStore
    eventSource.addEventListener('notification:new', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        const notificationStore = useNotificationStore()
        notificationStore.unreadCount++
        console.log('SSE: 新通知', data.title)
      } catch (e) {
        console.error('SSE: 解析 notification:new 事件失败', e)
      }
    })

    eventSource.addEventListener('notification:count', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        const notificationStore = useNotificationStore()
        notificationStore.unreadCount = data.unreadCount
      } catch (e) {
        console.error('SSE: 解析 notification:count 事件失败', e)
      }
    })

    // 权限刷新事件
    eventSource.addEventListener('auth:refresh', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        console.log('SSE: 收到权限刷新事件, reason=', data.reason)
        refreshAuth()
      } catch (e) {
        console.error('SSE: 解析 auth:refresh 事件失败', e)
      }
    })

    // 强制踢出事件
    eventSource.addEventListener('session:kicked', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        console.log('SSE: 收到强制下线事件', data.reason)
        handleKicked(data.message)
      } catch (e) {
        console.error('SSE: 解析 session:kicked 事件失败', e)
      }
    })

    // 字典刷新事件
    eventSource.addEventListener('dict:refresh', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        console.log('SSE: 收到字典刷新事件, dictKey=', data.dictKey)
        const dictStore = useDictStore()
        dictStore.refreshDictByKey(data.dictKey)
      } catch (e) {
        console.error('SSE: 解析 dict:refresh 事件失败', e)
      }
    })

    // 服务器端错误事件 (如 Unauthorized)
    eventSource.addEventListener('error', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        if (data.message === 'Unauthorized') {
          console.error('SSE: 认证失败, 断开连接')
          disconnect()
          return
        }
      } catch {
        // 非 JSON error 事件 (如连接断开), 忽略
      }
    })

    eventSource.onopen = () => {
      connected.value = true
      console.log('SSE: 连接已建立')
    }

    eventSource.onerror = () => {
      connected.value = false
      // EventSource 内置自动重连 (服务器 retry: 3000ms)
    }
  }

  function disconnect() {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
    connected.value = false
  }

  /**
   * 处理被踢出事件：断开 SSE → 清除登录信息 → 跳转登录页(带 kicked 标记)
   * 使用 window.location 而非 useRouter()，因为 SSE 事件回调不在 Vue 组件 setup 上下文中
   */
  function handleKicked(message: string) {
    disconnect()
    const loginInfoStore = useLoginInfoStore()
    loginInfoStore.clearLoginInfo()
    window.location.href = `/login?r=kicked&msg=${encodeURIComponent(message)}`
  }

  /**
   * 从服务器获取最新 loginInfo 并更新本地状态
   */
  async function refreshAuth() {
    try {
      const { data: res } = await authApi.currentInfo()
      if (res.data) {
        const loginInfoStore = useLoginInfoStore()
        loginInfoStore.loginInfo = res.data
        // 通知菜单组件重新加载
        EventBus.emit('refresh-menu')
        console.log('SSE: 权限已刷新, permissionKeys 数量=', res.data.permissionKeys?.length)
      }
    } catch (e) {
      console.error('SSE: 刷新权限失败', e)
    }
  }

  return {
    connected,
    connect,
    disconnect
  }
})
