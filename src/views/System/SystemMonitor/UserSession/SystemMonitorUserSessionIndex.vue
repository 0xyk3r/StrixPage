<template>
  <div>
    <!-- 统计卡片 -->
    <n-grid :x-gap="12" :y-gap="12" cols="2 s:2 m:3" responsive="screen" style="margin-bottom: 12px">
      <n-gi>
        <n-card size="small">
          <n-statistic label="在线用户">
            <n-number-animation :from="0" :to="sessionData?.onlineUserCount ?? 0" />
          </n-statistic>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small">
          <n-statistic label="活跃会话数">
            <n-number-animation :from="0" :to="sessionData?.totalSessionCount ?? 0" />
          </n-statistic>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small">
          <n-statistic label="平均会话数">
            <n-number-animation :from="0" :to="avgSessions" :precision="1" />
          </n-statistic>
        </n-card>
      </n-gi>
    </n-grid>

    <!-- 搜索与操作栏 -->
    <strix-block>
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input v-model:value="keyword" clearable placeholder="按昵称或手机号搜索" @keydown.enter="loadData" />
          </n-gi>
          <n-gi span="6 s:3 m:4" class="nebula-export__trigger-gi">
            <n-space align="center" :size="4">
              <n-button
                v-auth="'system:monitor:user-session'"
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
            </n-space>
          </n-gi>
        </n-grid>
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
import type { OnlineUserSessionItem, OnlineUserSessionResp } from '@/api/user-session'
import { userSessionApi } from '@/api/user-session'
import { handleOperate } from '@/utils/strix-table-tool'
import type { DataTableColumns, DataTableRowKey } from 'naive-ui'
import { useTableColumns } from '@/composables/useTableColumns.ts'

const dialog = useDialog()

const loading = ref(false)
const keyword = ref('')
const sessionData = ref<OnlineUserSessionResp | null>(null)
const checkedRowKeys = ref<DataTableRowKey[]>([])
const autoRefresh = ref(false)
const refreshInterval = ref(10000)

const intervalOptions = [
  { label: '5 秒', value: 5000 },
  { label: '10 秒', value: 10000 },
  { label: '30 秒', value: 30000 }
]

const avgSessions = computed(() => {
  if (!sessionData.value || sessionData.value.onlineUserCount === 0) return 0
  return +(sessionData.value.totalSessionCount / sessionData.value.onlineUserCount).toFixed(1)
})

const rowKey = (row: OnlineUserSessionItem) => `${row.userId}__${row.tokenMasked}`

const loadData = async () => {
  try {
    loading.value = true
    const { data: res } = await userSessionApi.list(keyword.value || undefined)
    sessionData.value = res.data
  } catch (e) {
    console.error('加载在线用户会话失败', e)
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
const handleKickAll = async (row: OnlineUserSessionItem) => {
  await userSessionApi.kick(row.userId)
  await loadData()
}

const handleBatchKick = () => {
  const userIds: string[] = [...new Set(checkedRowKeys.value.map((key) => String(key).split('__')[0]))].filter(
    (id): id is string => !!id
  )
  if (userIds.length === 0) return

  dialog.warning({
    title: '批量踢出确认',
    content: `确定踢出选中的 ${userIds.length} 个用户的所有会话吗？`,
    positiveText: '确定踢出',
    negativeText: '取消',
    onPositiveClick: async () => {
      await userSessionApi.batchKick(userIds)
      checkedRowKeys.value = []
      await loadData()
    }
  })
}

const formatTime = (time: string | null) => {
  if (!time) return '-'
  return time.replace('T', ' ').substring(0, 19)
}

const columns: DataTableColumns<OnlineUserSessionItem> = [
  { type: 'selection' },
  { title: '昵称', key: 'nickname', width: 180 },
  { title: '手机号', key: 'phoneNumber', width: 130 },
  { title: 'IP', key: 'ip', width: 100 },
  { title: '设备', key: 'device', width: 140 },
  {
    title: '登录时间',
    key: 'loginTime',
    width: 120,
    render: (row) => formatTime(row.loginTime)
  },
  {
    title: '最后活跃',
    key: 'lastActiveTime',
    width: 120,
    render: (row) => formatTime(row.lastActiveTime)
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
