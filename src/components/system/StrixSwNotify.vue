<script lang="ts" setup>
import { NButton } from 'naive-ui'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({
  immediate: true,
  onRegisteredSW(swUrl, r) {
    if (!r) return
    // 每小时检查一次更新
    setInterval(
      async () => {
        if (r.installing || !navigator) return
        if ('connection' in navigator && !navigator.onLine) return

        try {
          const resp = await fetch(swUrl, {
            cache: 'no-store',
            headers: {
              cache: 'no-store',
              'cache-control': 'no-cache'
            }
          })
          if (resp?.status === 200) await r.update()
        } catch {
          // 忽略网络错误
        }
      },
      60 * 60 * 1000
    )
  },
  onRegisterError(error) {
    console.error('SW registration error:', error)
  }
})

const notification = useNotification()

// 监听离线就绪状态
watch(offlineReady, (isReady) => {
  if (isReady) {
    console.log('Strix App 已成功缓存，离线状态下也可以访问。')
    // notification.success({
    //   title: '系统提示',
    //   content: 'Strix App 已成功缓存，离线状态下也可以访问。',
    //   duration: 3000
    // })
  }
})

// 监听更新状态
watch(needRefresh, (needUpdate) => {
  if (needUpdate) {
    notification.warning({
      title: '版本更新提示',
      content: '检测到 Strix App 有新版本可用。为保证功能和数据正常，建议立即更新至最新版本。',
      meta: '更新过程中页面将重新加载，请提前保存正在编辑的内容，以防数据丢失',
      duration: 0, // 不自动关闭
      action: () =>
        h(
          NButton,
          {
            text: true,
            type: 'warning',
            onClick: async () => {
              await updateServiceWorker(true)
            }
          },
          { default: () => '立即更新' }
        )
    })
  }
})
</script>

<script lang="ts">
export default {
  render() {
    return null
  }
}
</script>
