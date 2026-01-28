<template>
  <n-popover
    v-model:show="showPopover"
    :show-arrow="false"
    :style="{ padding: 0, width: '400px', maxHeight: '600px' }"
    placement="bottom-end"
    trigger="manual"
    @clickoutside="handleClickOutside"
  >
    <template #trigger>
      <div class="notification-trigger" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
        <n-badge :max="99" :show="notificationStore.unreadCount > 0" :value="badgeValue">
          <n-icon-wrapper
            :border-radius="5"
            :color="themeVars.actionColor"
            :icon-color="themeVars.textColorBase"
            :size="32"
          >
            <n-icon :size="18">
              <StrixIcon icon="bell" />
            </n-icon>
          </n-icon-wrapper>
        </n-badge>
      </div>
    </template>

    <!-- 通知面板 -->
    <div class="notification-panel" @mouseenter="handlePanelMouseEnter" @mouseleave="handlePanelMouseLeave">
      <!-- 头部 -->
      <div class="panel-header">
        <span class="panel-title">通知中心</span>
        <n-button
          v-if="notificationStore.unreadCount > 0"
          size="small"
          text
          type="primary"
          @click="handleMarkAllAsRead"
        >
          全部已读
        </n-button>
      </div>

      <!-- 标签页 -->
      <n-tabs v-model:value="activeTab" type="line" @update:value="handleTabChange">
        <n-tab-pane name="unread" tab="未读">
          <StrixNotificationList
            :empty-text="'暂无未读通知'"
            :has-more="unreadHasMore"
            :loading="loading"
            :notifications="unreadNotifications"
            @load-more="loadMoreUnread"
            @mark-as-read="handleMarkAsRead"
            @item-click="handleItemClick"
          />
        </n-tab-pane>

        <n-tab-pane name="all" tab="历史">
          <StrixNotificationList
            :empty-text="'暂无通知'"
            :has-more="allHasMore"
            :loading="loading"
            :notifications="allNotifications"
            @load-more="loadMoreAll"
            @mark-as-read="handleMarkAsRead"
            @item-click="handleItemClick"
          />
        </n-tab-pane>

        <n-tab-pane name="invalid" tab="已失效">
          <StrixNotificationList
            :empty-text="'暂无已失效通知'"
            :has-more="invalidHasMore"
            :loading="loading"
            :notifications="invalidNotifications"
            @load-more="loadMoreInvalid"
            @mark-as-read="handleMarkAsRead"
            @item-click="handleItemClick"
          />
        </n-tab-pane>
      </n-tabs>
    </div>
  </n-popover>
</template>

<script lang="ts" setup>
import { useNotificationStore } from '@/stores/notification'
import type { NotificationItem } from '@/@types/components/notification'
import { useThemeVars } from 'naive-ui'
import { createStrixMessage } from '@/utils/strix-message'
import StrixNotificationList from '@/components/notification/StrixNotificationList.vue'

const router = useRouter()
const notificationStore = useNotificationStore()
const themeVars = useThemeVars()

// Popover 显示状态
const showPopover = ref(false)
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

// 鼠标进入触发区域
const handleMouseEnter = () => {
  if (leaveTimer) {
    clearTimeout(leaveTimer)
    leaveTimer = null
  }
  hoverTimer = setTimeout(() => {
    showPopover.value = true
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
    showPopover.value = false
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
    showPopover.value = false
  }, 200)
}

// 点击外部关闭
const handleClickOutside = () => {
  showPopover.value = false
}

// 切换标签页
const handleTabChange = () => {
  loadNotifications()
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
      validStatus: 2
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
    // 更新列表中的已读状态
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
    // 从未读列表中移除
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
    // 清空未读列表
    unreadNotifications.value = []
    unreadTotal.value = 0
    // 更新全部列表中的已读状态
    allNotifications.value.forEach((n) => {
      if (n.readStatus === 0) {
        n.readStatus = 1
        n.readAt = new Date().toISOString()
      }
    })
    // 更新失效列表中的已读状态
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
  // 如果未读，先标记为已读
  if (notification.readStatus === 0) {
    await handleMarkAsRead(notification.notificationId)
  }

  // 执行跳转
  if (notification.jumpType === 'PAGE') {
    // 路由跳转
    try {
      const jumpParams = notification.jumpParams ? JSON.parse(notification.jumpParams) : {}
      await router.push({
        name: notification.jumpTarget,
        state: jumpParams
      })
      showPopover.value = false
    } catch (error) {
      console.error('路由跳转失败:', error)
      createStrixMessage('error', '跳转失败', '路由跳转失败，请检查路由配置')
    }
  } else if (notification.jumpType === 'URL') {
    // URL 跳转
    window.open(notification.jumpTarget, '_blank')
    showPopover.value = false
  }
}

// 组件挂载时开始轮询
onMounted(() => {
  notificationStore.startPolling()
})

// 组件卸载时停止轮询
onUnmounted(() => {
  notificationStore.stopPolling()
  if (hoverTimer) clearTimeout(hoverTimer)
  if (leaveTimer) clearTimeout(leaveTimer)
})
</script>

<style lang="scss" scoped>
.notification-trigger {
  cursor: pointer;
}

.notification-panel {
  width: 100%;

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid var(--n-border-color);

    .panel-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--n-text-color);
    }
  }

  :deep(.n-tabs) {
    .n-tabs-nav {
      padding: 0 16px;
    }

    .n-tab-pane {
      padding: 0;
    }
  }
}
</style>
