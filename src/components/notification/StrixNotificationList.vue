<template>
  <div class="nebula-notif-list">
    <template v-if="notifications.length > 0">
      <StrixNotificationItem
        v-for="item in notifications"
        :key="item.notificationId"
        :notification="item"
        @mark-as-read="handleMarkAsRead"
        @item-click="handleItemClick"
      />

      <!-- 加载更多 / 底部指示 -->
      <div ref="loadMoreTrigger" class="nebula-notif-loading" v-if="loading">
        <span class="nebula-notif-loading__dot" />
        <span class="nebula-notif-loading__dot" />
        <span class="nebula-notif-loading__dot" />
      </div>
      <div v-else-if="!hasMore" class="nebula-notif-end">没有更多了</div>
      <div v-else ref="loadMoreTrigger" class="nebula-notif-end">加载更多...</div>
    </template>

    <!-- 空状态 -->
    <div v-else class="nebula-notif-empty">
      <StrixIcon icon="inbox" :size="36" />
      <span class="nebula-notif-empty__text">{{ emptyText }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { NotificationItem as NotificationItemType } from '@/@types/components/notification'
import StrixNotificationItem from './StrixNotificationItem.vue'
import StrixIcon from '@/components/icon/StrixIcon.vue'

const props = defineProps<{
  notifications: NotificationItemType[]
  loading: boolean
  hasMore: boolean
  emptyText: string
}>()

const emit = defineEmits<{
  loadMore: []
  markAsRead: [notificationId: string]
  itemClick: [notification: NotificationItemType]
}>()

const loadMoreTrigger = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const setupObserver = () => {
  if (observer) observer.disconnect()
  if (!loadMoreTrigger.value) return

  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry && entry.isIntersecting && props.hasMore && !props.loading) {
        emit('loadMore')
      }
    },
    { rootMargin: '100px', threshold: 0.1 }
  )
  observer.observe(loadMoreTrigger.value)
}

onMounted(() => {
  nextTick(setupObserver)
})

watch(
  () => props.notifications.length,
  () => nextTick(setupObserver)
)

onUnmounted(() => {
  if (observer) observer.disconnect()
})

const handleMarkAsRead = (notificationId: string) => {
  emit('markAsRead', notificationId)
}

const handleItemClick = (notification: NotificationItemType) => {
  emit('itemClick', notification)
}
</script>
