<template>
  <div class="nebula-notif-anchor" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
    <!-- Trigger Button -->
    <button class="nebula-toolbar__btn nebula-notif-trigger" title="通知">
      <StrixIcon icon="bell" :size="15" />
      <span v-if="notificationStore.unreadCount > 0" class="nebula-notif-badge">
        {{ badgeValue }}
      </span>
    </button>

    <!-- Backdrop (click outside) -->
    <div v-if="showPanel" class="nebula-notif-backdrop" @click="showPanel = false" />

    <!-- Dropdown Panel -->
    <Transition name="nebula-notif">
      <div
        v-if="showPanel"
        class="nebula-notif-panel"
        @mouseenter="handlePanelMouseEnter"
        @mouseleave="handlePanelMouseLeave"
      >
        <!-- Header -->
        <div class="nebula-notif-header">
          <div class="nebula-notif-header__left">
            <span class="nebula-notif-header__id">PANEL::NOTIFICATIONS</span>
            <span class="nebula-notif-header__title">通知中心</span>
          </div>
          <button
            v-if="notificationStore.unreadCount > 0"
            class="nebula-notif-header__action"
            @click="handleMarkAllAsRead"
          >
            全部已读
          </button>
        </div>

        <!-- Tabs -->
        <div class="nebula-notif-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="['nebula-notif-tab', { 'is-active': activeTab === tab.key }]"
            @click="switchTab(tab.key)"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Tab Content -->
        <StrixNotificationList
          v-if="activeTab === 'unread'"
          empty-text="暂无未读通知"
          :has-more="unreadHasMore"
          :loading="loading"
          :notifications="unreadNotifications"
          @load-more="loadMoreUnread"
          @mark-as-read="handleMarkAsRead"
          @item-click="handleItemClick"
        />
        <StrixNotificationList
          v-else-if="activeTab === 'all'"
          empty-text="暂无通知记录"
          :has-more="allHasMore"
          :loading="loading"
          :notifications="allNotifications"
          @load-more="loadMoreAll"
          @mark-as-read="handleMarkAsRead"
          @item-click="handleItemClick"
        />
        <StrixNotificationList
          v-else
          empty-text="暂无已失效通知"
          :has-more="invalidHasMore"
          :loading="loading"
          :notifications="invalidNotifications"
          @load-more="loadMoreInvalid"
          @mark-as-read="handleMarkAsRead"
          @item-click="handleItemClick"
        />
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { useNotificationStore } from '@/stores/notification'
import type { NotificationItem } from '@/@types/components/notification'
import { createStrixMessage } from '@/utils/strix-message'
import StrixIcon from '@/components/icon/StrixIcon.vue'
import StrixNotificationList from '@/components/notification/StrixNotificationList.vue'

const router = useRouter()
const notificationStore = useNotificationStore()

const tabs = [
  { key: 'unread' as const, label: '未读' },
  { key: 'all' as const, label: '历史' },
  { key: 'invalid' as const, label: '已失效' }
]

// 面板显示状态
const showPanel = ref(false)
let hoverTimer: ReturnType<typeof setTimeout> | null = null
let leaveTimer: ReturnType<typeof setTimeout> | null = null

// 当前激活的标签页
const activeTab = ref<'unread' | 'all' | 'invalid'>('unread')

// 加载状态
const loading = ref(false)

// 未读通知列表
const unreadNotifications = ref<NotificationItem[]>([])
const unreadPageIndex = ref(1)
const unreadTotal = ref(0)
const unreadHasMore = computed(() => unreadNotifications.value.length < unreadTotal.value)

// 全部通知列表
const allNotifications = ref<NotificationItem[]>([])
const allPageIndex = ref(1)
const allTotal = ref(0)
const allHasMore = computed(() => allNotifications.value.length < allTotal.value)

// 已失效通知列表
const invalidNotifications = ref<NotificationItem[]>([])
const invalidPageIndex = ref(1)
const invalidTotal = ref(0)
const invalidHasMore = computed(() => invalidNotifications.value.length < invalidTotal.value)

// 角标值
const badgeValue = computed(() => {
  const count = notificationStore.unreadCount
  return count > 99 ? '99+' : count
})

// 切换标签页
const switchTab = (tab: 'unread' | 'all' | 'invalid') => {
  activeTab.value = tab
  loadNotifications()
}

// 鼠标进入触发区域
const handleMouseEnter = () => {
  if (leaveTimer) {
    clearTimeout(leaveTimer)
    leaveTimer = null
  }
  hoverTimer = setTimeout(() => {
    showPanel.value = true
    loadNotifications()
  }, 200)
}

// 鼠标离开触发区域
const handleMouseLeave = () => {
  if (hoverTimer) {
    clearTimeout(hoverTimer)
    hoverTimer = null
  }
  leaveTimer = setTimeout(() => {
    showPanel.value = false
  }, 200)
}

// 鼠标进入面板区域
const handlePanelMouseEnter = () => {
  if (leaveTimer) {
    clearTimeout(leaveTimer)
    leaveTimer = null
  }
}

// 鼠标离开面板区域
const handlePanelMouseLeave = () => {
  leaveTimer = setTimeout(() => {
    showPanel.value = false
  }, 200)
}

// 加载通知列表
const loadNotifications = async () => {
  if (activeTab.value === 'unread') {
    await loadUnreadNotifications(1)
  } else if (activeTab.value === 'all') {
    await loadAllNotifications(1)
  } else if (activeTab.value === 'invalid') {
    await loadInvalidNotifications(1)
  }
}

// 加载未读通知
const loadUnreadNotifications = async (pageIndex: number) => {
  loading.value = true
  try {
    const res = await notificationStore.fetchNotifications({
      pageSize: 20,
      pageIndex,
      readStatus: 0,
      validStatus: 1
    })
    if (res) {
      if (pageIndex === 1) {
        unreadNotifications.value = res.items
      } else {
        unreadNotifications.value.push(...res.items)
      }
      unreadTotal.value = res.total
      unreadPageIndex.value = pageIndex
    }
  } catch (error) {
    console.log(error)
    createStrixMessage('error', '加载失败', '获取未读通知列表失败')
  } finally {
    loading.value = false
  }
}

// 加载全部通知
const loadAllNotifications = async (pageIndex: number) => {
  loading.value = true
  try {
    const res = await notificationStore.fetchNotifications({
      pageSize: 20,
      pageIndex,
      readStatus: null,
      validStatus: 1
    })
    if (res) {
      if (pageIndex === 1) {
        allNotifications.value = res.items
      } else {
        allNotifications.value.push(...res.items)
      }
      allTotal.value = res.total
      allPageIndex.value = pageIndex
    }
  } catch (error) {
    console.log(error)
    createStrixMessage('error', '加载失败', '获取通知列表失败')
  } finally {
    loading.value = false
  }
}

// 加载更多未读通知
const loadMoreUnread = () => {
  if (!loading.value && unreadHasMore.value) {
    loadUnreadNotifications(unreadPageIndex.value + 1)
  }
}

// 加载更多全部通知
const loadMoreAll = () => {
  if (!loading.value && allHasMore.value) {
    loadAllNotifications(allPageIndex.value + 1)
  }
}

// 加载已失效通知
const loadInvalidNotifications = async (pageIndex: number) => {
  loading.value = true
  try {
    const res = await notificationStore.fetchNotifications({
      pageSize: 20,
      pageIndex,
      readStatus: null,
      validStatus: 0
    })
    if (res) {
      if (pageIndex === 1) {
        invalidNotifications.value = res.items
      } else {
        invalidNotifications.value.push(...res.items)
      }
      invalidTotal.value = res.total
      invalidPageIndex.value = pageIndex
    }
  } catch (error) {
    console.log(error)
    createStrixMessage('error', '加载失败', '获取已失效通知列表失败')
  } finally {
    loading.value = false
  }
}

// 加载更多已失效通知
const loadMoreInvalid = () => {
  if (!loading.value && invalidHasMore.value) {
    loadInvalidNotifications(invalidPageIndex.value + 1)
  }
}

// 标记单个通知为已读
const handleMarkAsRead = async (notificationId: string) => {
  try {
    await notificationStore.markAsRead(notificationId)
    const updateReadStatus = (list: NotificationItem[]) => {
      const item = list.find((n) => n.notificationId === notificationId)
      if (item) {
        item.readStatus = 1
        item.readAt = new Date().toISOString()
      }
    }
    updateReadStatus(unreadNotifications.value)
    updateReadStatus(allNotifications.value)
    updateReadStatus(invalidNotifications.value)
    unreadNotifications.value = unreadNotifications.value.filter((n) => n.notificationId !== notificationId)
    unreadTotal.value--
  } catch (error) {
    console.log(error)
    createStrixMessage('error', '操作失败', '标记通知为已读失败')
  }
}

// 标记全部为已读
const handleMarkAllAsRead = async () => {
  try {
    await notificationStore.markAllAsRead()
    unreadNotifications.value = []
    unreadTotal.value = 0
    allNotifications.value.forEach((n) => {
      if (n.readStatus === 0) {
        n.readStatus = 1
        n.readAt = new Date().toISOString()
      }
    })
    invalidNotifications.value.forEach((n) => {
      if (n.readStatus === 0) {
        n.readStatus = 1
        n.readAt = new Date().toISOString()
      }
    })
    createStrixMessage('success', '操作成功', '已全部标记为已读')
  } catch (error) {
    console.log(error)
    createStrixMessage('error', '操作失败', '标记全部为已读失败')
  }
}

// 点击通知项
const handleItemClick = async (notification: NotificationItem) => {
  if (notification.readStatus === 0) {
    await handleMarkAsRead(notification.notificationId)
  }

  if (notification.jumpType === 'PAGE') {
    try {
      const jumpParams = notification.jumpParams ? JSON.parse(notification.jumpParams) : {}
      await router.push({
        name: notification.jumpTarget,
        state: jumpParams
      })
      showPanel.value = false
    } catch (error) {
      console.error('路由跳转失败:', error)
      createStrixMessage('error', '跳转失败', '路由跳转失败，请检查路由配置')
    }
  } else if (notification.jumpType === 'URL') {
    window.open(notification.jumpTarget, '_blank')
    showPanel.value = false
  }
}

onMounted(() => {
  notificationStore.startPolling()
})

onUnmounted(() => {
  notificationStore.stopPolling()
  if (hoverTimer) clearTimeout(hoverTimer)
  if (leaveTimer) clearTimeout(leaveTimer)
})
</script>

<style lang="scss" scoped>
.nebula-notif-enter-active {
  animation: nebula-notif-enter 0.25s $ease-out-expo both;
}

.nebula-notif-leave-active {
  animation: nebula-notif-enter 0.15s $ease-out-expo reverse both;
}
</style>
