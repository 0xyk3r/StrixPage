<template>
  <div>
    <div class="nbp-header">
      <div class="nbp-header__left">
        <div class="nbp-header__brand">
          <span class="nbp-pulse-dot"></span>
          <span class="nbp-mono-label">SESSION_MATRIX</span>
        </div>
        <h2 class="nbp-page-title">管理员会话</h2>
      </div>
    </div>

    <!-- Stats -->
    <div class="nbp-stats sm-stats-3" style="margin-bottom: 12px">
      <div class="nbp-stat-card">
        <span class="nbp-hud-corner nbp-hud-corner--tl"></span>
        <span class="nbp-hud-corner nbp-hud-corner--br"></span>
        <div class="nbp-stat-card__label">在线管理员</div>
        <div class="nbp-stat-card__val sm-accent">{{ sessionData?.onlineManagerCount ?? 0 }}</div>
      </div>
      <div class="nbp-stat-card">
        <span class="nbp-hud-corner nbp-hud-corner--tl"></span>
        <span class="nbp-hud-corner nbp-hud-corner--br"></span>
        <div class="nbp-stat-card__label">活跃会话数</div>
        <div class="nbp-stat-card__val sm-info">{{ sessionData?.totalSessionCount ?? 0 }}</div>
      </div>
      <div class="nbp-stat-card">
        <span class="nbp-hud-corner nbp-hud-corner--tl"></span>
        <span class="nbp-hud-corner nbp-hud-corner--br"></span>
        <div class="nbp-stat-card__label">平均会话数</div>
        <div class="nbp-stat-card__val">{{ avgSessions }}</div>
      </div>
    </div>

    <!-- 搜索与操作栏 -->
    <strix-block>
      <template #search>
        <n-input v-model:value="keyword" clearable placeholder="按昵称或账号搜索" @keydown.enter="loadData" />
      </template>
      <template #actions>
        <n-button
          v-auth="'system:monitor:session'"
          :disabled="checkedRowKeys.length === 0"
          type="error"
          @click="handleBatchKick"
        >
          批量踢出 ({{ checkedRowKeys.length }})
        </n-button>
        <n-divider vertical />
        <n-select v-model:value="refreshInterval" :options="intervalOptions" size="small" style="width: 110px" />
        <n-button :type="autoRefresh ? 'primary' : 'default'" size="small" quaternary @click="toggleAutoRefresh">
          {{ autoRefresh ? '暂停刷新' : '自动刷新' }}
        </n-button>
        <n-button :loading="loading" quaternary type="primary" @click="loadData"> 刷新</n-button>
      </template>
    </strix-block>

    <!-- 会话表格 -->
    <n-data-table
      v-model:checked-row-keys="checkedRowKeys"
      :columns="columns"
      :data="sessionData?.items ?? []"
      :loading="loading"
      :bordered="false"
      :scroll-x="scrollX"
      :single-line="false"
      :row-key="rowKey"
      :pagination="false"
      size="small"
      remote
    />
  </div>
</template>

<script lang="ts" setup>
import type { OnlineSessionItem, OnlineSessionResp } from '@/api/session'
import { sessionApi } from '@/api/session'
import { handleOperate } from '@/utils/strix-table-tool'
import { formatISODateTime } from '@/utils/strix-date-util'
import StrixAvatar from '@/components/common/StrixAvatar.vue'
import type { DataTableColumns, DataTableRowKey } from 'naive-ui'
import { useTableColumns } from '@/composables/useTableColumns'

const dialog = useDialog()

const loading = ref(false)
const keyword = ref('')
const sessionData = ref<OnlineSessionResp | null>(null)
const checkedRowKeys = ref<DataTableRowKey[]>([])
const autoRefresh = ref(false)
const refreshInterval = ref(10000)

const intervalOptions = [
  { label: '5 秒', value: 5000 },
  { label: '10 秒', value: 10000 },
  { label: '30 秒', value: 30000 }
]

const avgSessions = computed(() => {
  if (!sessionData.value || sessionData.value.onlineManagerCount === 0) return 0
  return +(sessionData.value.totalSessionCount / sessionData.value.onlineManagerCount).toFixed(1)
})

const rowKey = (row: OnlineSessionItem) => `${row.managerId}__${row.tokenMasked}`

const loadData = async () => {
  try {
    loading.value = true
    const { data: res } = await sessionApi.list(keyword.value || undefined)
    sessionData.value = res.data
  } catch (e) {
    console.error('加载在线会话失败', e)
  } finally {
    loading.value = false
  }
}

// 自动刷新
let refreshTimer: ReturnType<typeof setInterval> | null = null

const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
    refreshTimer = setInterval(loadData, refreshInterval.value)
  } else if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

watch(refreshInterval, () => {
  if (autoRefresh.value && refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = setInterval(loadData, refreshInterval.value)
  }
})

onMounted(() => loadData())
onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})

// 踢出操作
const handleKickAll = async (row: OnlineSessionItem) => {
  await sessionApi.kick(row.managerId)
  await loadData()
}

const handleBatchKick = () => {
  const managerIds: string[] = [...new Set(checkedRowKeys.value.map((key) => String(key).split('__')[0]))].filter(
    (id): id is string => !!id
  )
  if (managerIds.length === 0) return

  dialog.warning({
    title: '批量踢出确认',
    content: `确定踢出选中的 ${managerIds.length} 个管理员的所有会话吗？`,
    positiveText: '确定踢出',
    negativeText: '取消',
    onPositiveClick: async () => {
      await sessionApi.batchKick(managerIds)
      checkedRowKeys.value = []
      await loadData()
    }
  })
}

const columns: DataTableColumns<OnlineSessionItem> = [
  { type: 'selection' },
  {
    title: '昵称',
    key: 'nickname',
    width: 180,
    render: (row) =>
      h('div', { style: 'display:flex;align-items:center;gap:8px' }, [
        h(StrixAvatar, { managerId: row.managerId, size: 24 }),
        h('span', row.nickname)
      ])
  },
  { title: '账号', key: 'loginName', width: 140 },
  { title: 'IP', key: 'ip', width: 100 },
  { title: '设备', key: 'device', width: 140 },
  {
    title: '登录时间',
    key: 'loginTime',
    width: 120,
    render: (row) => formatISODateTime(row.loginTime)
  },
  {
    title: '最后活跃',
    key: 'lastActiveTime',
    width: 120,
    render: (row) => formatISODateTime(row.lastActiveTime)
  },
  {
    title: '会话数',
    key: 'sessionCount',
    width: 80
  },
  { title: 'Token', key: 'tokenMasked', width: 140, ellipsis: { tooltip: true } },
  {
    title: '操作',
    key: 'actions',
    width: 70,
    align: 'center',
    fixed: 'right',
    render: (row) =>
      handleOperate([
        {
          type: 'error',
          label: '踢出所有会话',
          icon: 'log-out',
          popconfirm: true,
          popconfirmMessage: `确定踢出 ${row.nickname} 的所有会话吗？`,
          onClick: () => handleKickAll(row)
        }
      ])
  }
]

const { scrollX } = useTableColumns(columns as unknown as DataTableColumns)
</script>
