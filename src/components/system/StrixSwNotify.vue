<template>
  <Transition name="sw-banner">
    <div v-if="needRefresh" class="sw-update-banner" :class="{ 'has-network-banner': hasNetworkBanner }">
      <div class="sw-update-content">
        <RefreshCw :size="16" :stroke-width="2.5" class="sw-update-icon" />
        <span>检测到新版本可用，建议立即更新以获得最新功能</span>
        <button class="sw-update-btn" :disabled="updating" @click="handleUpdate">
          {{ updating ? '更新中...' : '立即更新' }}
        </button>
      </div>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { useNetworkStore } from '@/stores/network'
import { RefreshCw } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const networkStore = useNetworkStore()
const { isOnline } = storeToRefs(networkStore)

// 当离线 banner 可见时，更新 banner 下移避免重叠
const hasNetworkBanner = computed(() => !isOnline.value)

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

const updating = ref(false)

watch(offlineReady, (isReady) => {
  if (isReady) {
    console.log('Strix App 已成功缓存，离线状态下也可以访问。')
  }
})

async function handleUpdate() {
  updating.value = true
  await updateServiceWorker(true)
}
</script>

<style lang="scss" scoped>
.sw-update-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9998;
  display: flex;
  justify-content: center;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  user-select: none;
  background: linear-gradient(135deg, #3b82f6, rgba(59, 130, 246, 0.9));
  color: #fff;
  transition: top 0.35s cubic-bezier(0.4, 0, 0.2, 1);

  // 离线 banner 可见时下移，避免重叠
  &.has-network-banner {
    top: 34px;
  }
}

.sw-update-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sw-update-icon {
  animation: spin-slow 3s linear infinite;
}

.sw-update-btn {
  margin-left: 8px;
  padding: 2px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #3b82f6;
  background: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.sw-banner-enter-active,
.sw-banner-leave-active {
  transition:
    transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.sw-banner-enter-from,
.sw-banner-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
