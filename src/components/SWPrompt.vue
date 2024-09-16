<template>
  <!-- Server Worker Prompt -->
  <div v-if="false"></div>
</template>

<script setup lang="ts">
import { NButton, useNotification } from 'naive-ui'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const { needRefresh, updateServiceWorker } = useRegisterSW({
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

// watch(offlineReady, (newVal) => {
//   if (newVal) {
//     const offlineNotify = notification.warning({
//       title: 'Strix 提示',
//       content: 'Strix 已缓存完成, 离线状态下也可以访问.',
//       action: () =>
//         h(
//           NButton,
//           {
//             text: true,
//             type: 'warning',
//             onClick: () => {
//               offlineNotify.destroy()
//             }
//           },
//           { default: () => '确认' }
//         )
//     })
//   }
// })

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

<style lang="scss" scoped></style>
