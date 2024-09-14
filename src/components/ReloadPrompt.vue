<script setup lang="ts">
import { NButton, useNotification } from 'naive-ui'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { h, watch } from 'vue'

const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW()
const notification = useNotification()

watch(offlineReady, (newVal) => {
  if (newVal) {
    const offlineNotify = notification.warning({
      title: 'Strix 提示',
      content: '网络异常, Strix 目前处于离线模式.',
      duration: 0,
      action: () =>
        h(
          NButton,
          {
            text: true,
            type: 'primary',
            onClick: () => {
              offlineNotify.destroy()
            }
          },
          { default: () => '知道了' }
        )
    })
  }
})

watch(needRefresh, (newVal) => {
  if (newVal) {
    const updateNotify = notification.warning({
      title: 'Strix 提示',
      content: 'Strix 已更新, 点击确认切换为最新版本.',
      duration: 0,
      meta: '请注意保存您的内容',
      action: () =>
        h(
          NButton,
          {
            text: true,
            type: 'primary',
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
