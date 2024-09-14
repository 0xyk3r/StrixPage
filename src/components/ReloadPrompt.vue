<script setup lang="ts">
import { NButton, useNotification } from 'naive-ui'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { h, watch } from 'vue'

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
    const offlineNotify = notification.warning({
      title: 'Strix 提示',
      content: '网络异常, Strix 目前处于离线模式.',
      action: () =>
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
    })
  }
})

watch(needRefresh, (newVal) => {
  if (newVal) {
    const updateNotify = notification.warning({
      title: 'Strix 提示',
      content: 'Strix 已更新, 点击确认切换为最新版本.',
      meta: '请注意保存您的内容',
      action: () =>
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
    })
  }
})
</script>

<style>
.pwa-toast {
  position: fixed;
  right: 0;
  bottom: 0;
  margin: 16px;
  padding: 12px;
  border: 1px solid #8885;
  border-radius: 4px;
  z-index: 1;
  text-align: left;
  box-shadow: 3px 4px 5px 0 #8885;
  background-color: white;
}
.pwa-toast .message {
  margin-bottom: 8px;
}
.pwa-toast button {
  border: 1px solid #8885;
  outline: none;
  margin-right: 5px;
  border-radius: 2px;
  padding: 3px 10px;
}
</style>
