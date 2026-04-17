<template>
  <Transition name="network-banner">
    <div v-if="showBanner" :class="['network-status-banner', bannerType]">
      <div class="network-status-content">
        <component :is="bannerIcon" :size="16" :stroke-width="2.5" />
        <span>{{ bannerText }}</span>
      </div>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { useNetworkStore } from '@/stores/network'
import { WifiOff, Wifi } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'

const networkStore = useNetworkStore()
const { isOnline, wasOffline } = storeToRefs(networkStore)

networkStore.init()

const showRecovery = ref(false)

const showBanner = computed(() => !isOnline.value || showRecovery.value)

const bannerType = computed(() => (isOnline.value ? 'recovery' : 'offline'))

const bannerText = computed(() => (isOnline.value ? '网络连接已恢复' : '网络连接已断开，请检查您的网络设置'))

const bannerIcon = computed(() => (isOnline.value ? Wifi : WifiOff))

watch(wasOffline, (val) => {
  if (val && isOnline.value) {
    showRecovery.value = true
    setTimeout(() => {
      showRecovery.value = false
      networkStore.clearWasOffline()
    }, 3000)
  }
})

onUnmounted(() => {
  networkStore.destroy()
})
</script>

<style lang="scss" scoped>
.network-status-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  display: flex;
  justify-content: center;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  user-select: none;
  pointer-events: none;

  &.offline {
    background: linear-gradient(135deg, var(--strix-color-error), rgba(239, 68, 68, 0.9));
    color: #fff;
  }

  &.recovery {
    background: linear-gradient(135deg, var(--strix-color-success), rgba(34, 197, 94, 0.9));
    color: #fff;
  }
}

.network-status-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.network-banner-enter-active,
.network-banner-leave-active {
  transition:
    transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.network-banner-enter-from,
.network-banner-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
