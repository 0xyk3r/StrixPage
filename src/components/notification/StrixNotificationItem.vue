<template>
  <div :class="['nebula-notif-item', { 'is-unread': notification.readStatus === 0 }]" @click="handleItemClick">
    <div class="nebula-notif-item__body">
      <div class="nebula-notif-item__row">
        <span class="nebula-notif-item__title">{{ notification.title }}</span>
        <span class="nebula-notif-item__time">{{ formattedTime }}</span>
      </div>
      <div class="nebula-notif-item__content">{{ notification.content }}</div>
    </div>

    <div v-if="notification.readStatus === 0" class="nebula-notif-item__actions">
      <button class="nebula-notif-item__read-btn" @click.stop="handleMarkAsRead">已读</button>
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
