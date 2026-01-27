<template>
  <div :class="{ unread: notification.readStatus === 0 }" class="notification-item" @click="handleItemClick">
    <div class="notification-content">
      <div class="notification-header">
        <span class="notification-title">{{ notification.title }}</span>
        <span class="notification-time">{{ formattedTime }}</span>
      </div>
      <div class="notification-body">
        {{ notification.content }}
      </div>
    </div>

    <!-- 标记为已读按钮 -->
    <div v-if="notification.readStatus === 0" class="notification-actions">
      <n-button quaternary size="tiny" type="primary" @click.stop="handleMarkAsRead"> 标记已读 </n-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { NotificationItem as NotificationItemType } from '@/@types/components/notification'
import { formatRelativeTime } from '@/utils/time-format'

const props = defineProps<{
  notification: NotificationItemType
}>()

const emit = defineEmits<{
  markAsRead: [notificationId: string]
  itemClick: [notification: NotificationItemType]
}>()

const formattedTime = computed(() => formatRelativeTime(props.notification.createdTime))

const handleMarkAsRead = () => {
  emit('markAsRead', props.notification.notificationId)
}

const handleItemClick = () => {
  emit('itemClick', props.notification)
}
</script>

<style lang="scss" scoped>
.notification-item {
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid var(--n-border-color);
  display: flex;
  align-items: flex-start;
  gap: 8px;

  &:hover {
    background-color: var(--n-color-hover);
  }

  &.unread {
    background-color: var(--n-color-target);

    .notification-title {
      font-weight: 600;
    }
  }

  .notification-content {
    flex: 1;
    min-width: 0;
  }

  .notification-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 4px;
  }

  .notification-title {
    font-size: 14px;
    color: var(--n-text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  .notification-time {
    font-size: 12px;
    color: var(--n-text-color-3);
    white-space: nowrap;
  }

  .notification-body {
    font-size: 13px;
    color: var(--n-text-color-2);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .notification-actions {
    display: flex;
    align-items: center;
  }
}
</style>
