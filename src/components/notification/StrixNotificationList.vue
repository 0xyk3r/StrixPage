<template>
  <div class="notification-list">
    <n-scrollbar style="max-height: 480px">
      <div v-if="notifications.length > 0" class="list-content">
        <StrixNotificationItem
          v-for="item in notifications"
          :key="item.notificationId"
          :notification="item"
          @mark-as-read="handleMarkAsRead"
          @item-click="handleItemClick"
        />

        <!-- 加载更多指示器 -->
        <div ref="loadMoreTrigger" class="load-more-trigger">
          <n-spin v-if="loading" size="small" />
          <span v-else-if="hasMore" class="load-more-text">加载更多...</span>
          <span v-else class="no-more-text">没有更多了</span>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <StrixIcon :size="48" icon="inbox" />
        <p>{{ emptyText }}</p>
      </div>
    </n-scrollbar>
  </div>
</template>

<script lang="ts" setup>
import type { NotificationItem as NotificationItemType } from '@/@types/components/notification'
import StrixNotificationItem from './StrixNotificationItem.vue'

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

// 设置 IntersectionObserver
onMounted(() => {
  if (!loadMoreTrigger.value) return

  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry && entry.isIntersecting && props.hasMore && !props.loading) {
        emit('loadMore')
      }
    },
    {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    }
  )

  observer.observe(loadMoreTrigger.value)
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})

const handleMarkAsRead = (notificationId: string) => {
  emit('markAsRead', notificationId)
}

const handleItemClick = (notification: NotificationItemType) => {
  emit('itemClick', notification)
}
</script>

<style lang="scss" scoped>
.notification-list {
  width: 100%;

  .list-content {
    .load-more-trigger {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      min-height: 48px;

      .load-more-text,
      .no-more-text {
        font-size: 13px;
        color: var(--n-text-color-3);
      }
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: var(--n-text-color-3);

    .strix-icon {
      margin-bottom: 16px;
      opacity: 0.5;
    }

    p {
      margin: 0;
      font-size: 14px;
    }
  }
}
</style>
