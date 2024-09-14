import {
  createDiscreteApi,
  darkTheme,
  lightTheme,
  NButton,
  useNotification,
  type ConfigProviderProps
} from 'naive-ui'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { computed, h, ref, watch, type Ref } from 'vue'

export const useSW = () => {
  const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      // 每小时检查一次更新
      r &&
        setInterval(
          async () => {
            if (r.installing || !navigator) return

            if ('connection' in navigator && !navigator.onLine) return

            const resp = await fetch(swUrl, {
              cache: 'no-store',
              headers: {
                cache: 'no-store',
                'cache-control': 'no-cache'
              }
            })

            if (resp?.status === 200) await r.update()
          },
          60 * 60 * 1000
        )
    }
  })

  const notification = useNotification()

  watch(offlineReady, (newVal) => {
    if (newVal) {
      console.log('offlineReady')
      const offlineNotify = notification.warning({
        title: 'Strix 提示',
        content: '网络异常, Strix 目前处于离线模式.',
        duration: 0,
        action: () => {
          h(
            NButton,
            {
              text: true,
              type: 'warning',
              onClick: () => {
                offlineNotify.destroy()
              }
            },
            { default: () => '确认' }
          )
        }
      })
    }
  })

  watch(needRefresh, (newVal) => {
    console.log('needRefresh')
    if (newVal) {
      const updateNotify = notification.warning({
        title: 'Strix 提示',
        content: 'Strix 已更新, 点击确认切换为最新版本.',
        meta: '请注意保存您的内容',
        duration: 0,
        action: () => {
          h(
            NButton,
            {
              text: true,
              type: 'warning',
              onClick: () => {
                updateServiceWorker()
                updateNotify.destroy()
              }
            },
            { default: () => '确认' }
          )
        }
      })
    }
  })
}
