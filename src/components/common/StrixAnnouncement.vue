<template>
  <!-- Banner 公告 -->
  <div v-if="visibleBanners.length > 0" class="strix-announce-banners">
    <div
      v-for="announcement in visibleBanners"
      :key="announcement.id"
      :class="['strix-announce-banner', `strix-announce-banner--${announcement.level.toLowerCase()}`]"
    >
      <div class="strix-announce-banner__icon">
        <strix-icon :icon="levelIcon(announcement.level)" :size="16" />
      </div>
      <div class="strix-announce-banner__content">
        <span class="strix-announce-banner__title">{{ announcement.title }}</span>
        <span v-if="announcement.endTime" class="strix-announce-banner__countdown">
          {{ formatCountdown(announcement.endTime) }}
        </span>
      </div>
      <button
        v-if="announcement.level !== 'URGENT'"
        class="strix-announce-banner__close"
        @click="dismissBanner(announcement.id)"
      >
        <strix-icon icon="x" :size="14" />
      </button>
    </div>
  </div>

  <!-- Modal 公告 (URGENT + MODAL) -->
  <n-modal
    v-model:show="showUrgentModal"
    preset="card"
    :title="urgentModalData?.title ?? '紧急公告'"
    style="width: 520px"
    :closable="false"
    :mask-closable="false"
  >
    <div v-if="urgentModalData" class="strix-announce-modal">
      <n-tag type="error" size="small" :bordered="false" style="margin-bottom: 12px">
        {{ urgentModalData.level }}
      </n-tag>
      <div class="strix-announce-modal__content">{{ urgentModalData.content }}</div>
      <div v-if="urgentModalData.endTime" class="strix-announce-modal__time">
        失效时间: {{ formatTime(urgentModalData.endTime) }}
      </div>
    </div>
    <template #footer>
      <n-flex justify="end">
        <n-button type="primary" @click="acknowledgeModal">我已知悉</n-button>
      </n-flex>
    </template>
  </n-modal>
</template>

<script lang="ts" setup>
import type { SseAnnouncement } from '@/api/announcement'
import StrixIcon from '@/components/icon/StrixIcon.vue'
import { useSseStore } from '@/stores/sse'

const sseStore = useSseStore()

// 已关闭的 Banner ID 集合 (sessionStorage, 刷新后重新显示)
const dismissedIds = ref<Set<string>>(new Set())

// 从 sessionStorage 恢复
onMounted(() => {
  try {
    const stored = sessionStorage.getItem('strix-dismissed-announcements')
    if (stored) {
      dismissedIds.value = new Set(JSON.parse(stored))
    }
  } catch {
    // ignore
  }
})

// Banner 过滤：排除已关闭的 + 仅 BANNER 类型
const visibleBanners = computed(() => {
  return sseStore.activeAnnouncements.filter(
    (a) => a.displayType === 'BANNER' && !dismissedIds.value.has(a.id)
  )
})

// Modal 队列：MODAL 类型 + 未确认
const pendingModals = computed(() => {
  return sseStore.activeAnnouncements.filter(
    (a) => a.displayType === 'MODAL' && !dismissedIds.value.has(a.id)
  )
})

// 当前显示的 Modal
const showUrgentModal = ref(false)
const urgentModalData = ref<SseAnnouncement | null>(null)

// 监听待显示的 Modal 队列
watch(
  pendingModals,
  (modals) => {
    if (modals.length > 0 && !showUrgentModal.value) {
      urgentModalData.value = modals[0] ?? null
      showUrgentModal.value = true
    }
  },
  { immediate: true }
)

function dismissBanner(id: string) {
  dismissedIds.value.add(id)
  saveDismissed()
}

function acknowledgeModal() {
  if (urgentModalData.value) {
    dismissedIds.value.add(urgentModalData.value.id)
    saveDismissed()
  }
  showUrgentModal.value = false
  urgentModalData.value = null
  // 检查是否还有待显示的 Modal
  nextTick(() => {
    if (pendingModals.value.length > 0) {
      urgentModalData.value = pendingModals.value[0] ?? null
      showUrgentModal.value = true
    }
  })
}

function saveDismissed() {
  sessionStorage.setItem('strix-dismissed-announcements', JSON.stringify([...dismissedIds.value]))
}

function levelIcon(level: string): string {
  switch (level) {
    case 'WARNING':
      return 'alert-triangle'
    case 'URGENT':
      return 'alert-octagon'
    default:
      return 'info'
  }
}

function formatCountdown(endTime: string): string {
  if (!endTime) return ''
  const end = new Date(endTime).getTime()
  const now = Date.now()
  const diff = end - now
  if (diff <= 0) return '已结束'
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  if (hours > 0) return `剩余 ${hours}h${minutes}m`
  return `剩余 ${minutes}m`
}

function formatTime(time: string): string {
  if (!time) return '-'
  return time.replace('T', ' ').substring(0, 16)
}
</script>

<style lang="scss" scoped>
.strix-announce-banners {
  position: relative;
  z-index: 100;
  width: 100%;
}

.strix-announce-banner {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  font-size: 13px;
  line-height: 1.5;

  &--info {
    color: #1a6fb5;
    background: #e8f4fd;
  }

  &--warning {
    color: #b57a1a;
    background: #fef3e2;
  }

  &--urgent {
    color: #b51a1a;
    background: #fde8e8;

    .strix-announce-banner__title {
      font-weight: 600;
      animation: pulse-text 2s ease-in-out infinite;
    }
  }

  &__icon {
    flex-shrink: 0;
    margin-right: 8px;
    display: flex;
    align-items: center;
  }

  &__content {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__title {
    font-weight: 500;
  }

  &__countdown {
    font-size: 12px;
    opacity: 0.8;
  }

  &__close {
    flex-shrink: 0;
    margin-left: 8px;
    padding: 2px;
    border: none;
    background: transparent;
    cursor: pointer;
    opacity: 0.5;
    display: flex;
    align-items: center;
    color: inherit;
    border-radius: 4px;
    transition: opacity 0.2s;

    &:hover {
      opacity: 1;
    }
  }
}

.strix-announce-modal {
  &__content {
    white-space: pre-wrap;
    line-height: 1.6;
    margin-bottom: 12px;
  }

  &__time {
    font-size: 13px;
    opacity: 0.7;
  }
}

@keyframes pulse-text {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
