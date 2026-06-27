<template>
  <div :class="{ 'nebula-column-panel-push': showColumnPanel }">
    <!-- 统计卡片 -->
    <n-grid :x-gap="12" :y-gap="12" cols="2 s:2 m:4" responsive="screen" style="margin-bottom: 12px">
      <n-gi>
        <n-card size="small">
          <n-spin :show="statsLoading">
            <n-statistic label="今日操作">
              <n-number-animation :from="0" :to="stats.todayCount" />
            </n-statistic>
          </n-spin>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small">
          <n-spin :show="statsLoading">
            <n-statistic label="错误率">
              <template #suffix>%</template>
              <n-number-animation :from="0" :to="stats.errorRate" :precision="2" />
            </n-statistic>
          </n-spin>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small">
          <n-spin :show="statsLoading">
            <n-statistic label="平均响应">
              <template #suffix>ms</template>
              <n-number-animation :from="0" :to="stats.avgResponseTime" />
            </n-statistic>
          </n-spin>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card size="small">
          <n-spin :show="statsLoading">
            <n-statistic label="活跃用户">
              <n-number-animation :from="0" :to="stats.activeUserCount" />
            </n-statistic>
          </n-spin>
        </n-card>
      </n-gi>
    </n-grid>

    <strix-block
      cleanable
      :active-filters="activeFilters"
      :active-filter-count="activeFilterCount"
      @clear="clearSearch"
      @clear-filter="clearFilter"
    >
      <template #search>
        <n-input
          v-model:value="listParams.keyword"
          clearable
          placeholder="按操作名称搜索"
          @keydown.enter="handleKeywordEnter"
        />
      </template>
      <template #actions>
        <n-select
          v-model:value="refreshInterval"
          :disabled="!autoRefresh"
          :options="intervalOptions"
          size="small"
          style="width: 110px"
        />
        <n-button :type="autoRefresh ? 'primary' : 'default'" size="small" quaternary @click="toggleAutoRefresh">
          <template #icon>
            <strix-icon :icon="autoRefresh ? 'pause' : 'play'" :size="16" />
          </template>
          {{ autoRefresh ? '暂停' : '自动刷新' }}
        </n-button>
        <n-button quaternary type="primary" @click="showColumnPanel = !showColumnPanel">
          <template #icon>
            <strix-icon icon="columns-3" :size="16" />
          </template>
          列配置
        </n-button>
        <n-button quaternary type="primary" @click="showExportDialog = true">
          <template #icon>
            <strix-icon icon="download" :size="16" />
          </template>
          导出
        </n-button>
        <n-button v-auth="'system:monitor:log:delete'" quaternary type="error" @click="showCleanupModal = true">
          <template #icon>
            <strix-icon icon="trash-2" :size="16" />
          </template>
          清理
        </n-button>
      </template>
      <n-form :model="listParams" :show-feedback="false" label-placement="left" label-width="auto">
        <n-form-item label="操作类型" path="operationType">
          <n-select
            v-model:value="listParams.operationType"
            :options="systemLogOperTypeRef"
            clearable
            placeholder="请选择操作类型"
            @update:value="getDataList"
          />
        </n-form-item>
        <n-form-item label="操作分组" path="operationGroup">
          <n-select
            v-model:value="listParams.operationGroup"
            :options="operationGroupOptions"
            clearable
            placeholder="请选择操作分组"
            @update:value="getDataList"
          />
        </n-form-item>
        <n-form-item label="响应状态" path="responseCode">
          <n-select
            v-model:value="listParams.responseCode"
            :options="responseCodeOptions"
            clearable
            placeholder="请选择响应状态"
            @update:value="getDataList"
          />
        </n-form-item>
        <n-form-item label="操作用户" path="clientUsername">
          <n-input
            v-model:value="listParams.clientUsername"
            clearable
            placeholder="按用户名搜索"
            @clear="getDataList"
            @keyup.enter="getDataList"
          />
        </n-form-item>
        <n-form-item label="客户端IP" path="clientIp">
          <n-input
            v-model:value="listParams.clientIp"
            clearable
            placeholder="按IP搜索"
            @clear="getDataList"
            @keyup.enter="getDataList"
          />
        </n-form-item>
        <n-form-item label="时间范围" path="dateRange">
          <n-date-picker
            v-model:value="dateRange"
            type="datetimerange"
            clearable
            style="width: 100%"
            @update:value="handleDateRangeChange"
          />
        </n-form-item>
      </n-form>
    </strix-block>

    <n-data-table
      :columns="visibleColumns"
      :scroll-x="scrollX"
      :data="dataRef"
      :loading="dataLoading"
      :pagination="pagination"
      :remote="true"
      :row-key="rowKey"
      :row-props="rowProps"
      table-layout="fixed"
    />

    <strix-export-dialog
      v-model:show="showExportDialog"
      :columns="dataColumns as unknown as DataTableColumns"
      :data="dataRef || []"
      :fetch-all-data="fetchAllData"
      :title="_baseName"
    />

    <strix-column-panel v-model:show="showColumnPanel" />

    <!-- 日志详情抽屉 -->
    <system-monitor-log-detail v-model:show="showDetail" :log-data="selectedLog" />

    <!-- 清理确认对话框 -->
    <n-modal v-model:show="showCleanupModal" preset="card" title="清理操作日志" style="width: 480px">
      <n-space vertical :size="16">
        <n-alert type="warning"> 清理操作不可恢复，请确认要删除的日志时间范围。 </n-alert>
        <n-date-picker
          v-model:value="cleanupRange"
          type="datetimerange"
          style="width: 100%"
          :default-time="['00:00:00', '23:59:59']"
        />
      </n-space>
      <template #action>
        <n-space justify="end">
          <n-button @click="showCleanupModal = false">取消</n-button>
          <n-button type="error" :loading="cleanupLoading" :disabled="!cleanupRange" @click="handleCleanup">
            确认清理
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import type { NTagType } from '@/@types/naive-ui'
import type { SystemLogItem } from '@/api/monitor'
import { monitorApi } from '@/api/monitor'
import NebulaTag from '@/components/common/NebulaTag.vue'
import StrixBlock from '@/components/common/StrixBlock.vue'
import { useDict } from '@/composables/useDict.ts'
import { useCrud } from '@/composables/useCrud'
import { type DataTableColumns } from 'naive-ui'
import StrixColumnPanel from '@/components/common/StrixColumnPanel.vue'
import StrixExportDialog from '@/components/common/StrixExportDialog.vue'
import { createPaginatedFetcher } from '@/composables/useTableExport'
import { useTableColumns } from '@/composables/useTableColumns'
import StrixIcon from '@/components/icon/StrixIcon.vue'
import SystemMonitorLogDetail from './SystemMonitorLogDetail.vue'

const formatDateTime = (d: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const _baseName = '系统日志'
const showExportDialog = ref(false)
const fetchAllData = createPaginatedFetcher(monitorApi.urls.logList, 'items', () => listParams.value)

// 字典数据
const systemLogOperTypeRef = useDict('SystemLogOperType')

// 响应状态码选项
const responseCodeOptions = [
  { label: '成功 (200)', value: 200 },
  { label: '请求错误 (400)', value: 400 },
  { label: '未登录 (401)', value: 401 },
  { label: '无权限 (403)', value: 403 },
  { label: '请求过快 (429)', value: 429 },
  { label: '服务器错误 (500)', value: 500 }
]

// 操作分组选项
const operationGroupOptions = ref<{ label: string; value: string }[]>([])
const loadOperationGroups = () => {
  monitorApi.logOperationGroups().then(({ data: res }) => {
    operationGroupOptions.value = res.data.items.map((g) => ({ label: g, value: g }))
  })
}

// 统计数据
const stats = ref({ todayCount: 0, todayErrorCount: 0, avgResponseTime: 0, activeUserCount: 0, errorRate: 0 })
const statsLoading = ref(true)
const loadStats = () => {
  statsLoading.value = true
  monitorApi.logStats().then(({ data: res }) => {
    stats.value = res.data
    statsLoading.value = false
  })
}

// 日期范围
const dateRange = ref<[number, number] | null>(null)
const handleDateRangeChange = (val: [number, number] | null) => {
  if (val) {
    listParams.value.startTime = formatDateTime(new Date(val[0]))
    listParams.value.endTime = formatDateTime(new Date(val[1]))
  } else {
    listParams.value.startTime = null
    listParams.value.endTime = null
  }
  getDataList()
}

const {
  listParams,
  clearSearch,
  pagination,
  rowKey,
  activeFilters,
  activeFilterCount,
  clearFilter,
  handleKeywordEnter
} = useCrud({
  list: {
    keyword: null,
    operationType: null,
    operationGroup: null,
    responseCode: null,
    clientUsername: null,
    clientIp: null,
    startTime: null,
    endTime: null,
    pageIndex: 1,
    pageSize: 10
  },
  fetchList: () => getDataList(),
  filters: [
    { key: 'keyword', label: '关键词' },
    { key: 'operationType', label: '操作类型', dictName: 'SystemLogOperType' },
    { key: 'operationGroup', label: '操作分组', options: operationGroupOptions },
    { key: 'responseCode', label: '响应状态', options: responseCodeOptions },
    { key: 'clientUsername', label: '操作用户' },
    { key: 'clientIp', label: '客户端IP' }
  ],
  urlSync: { exclude: ['startTime', 'endTime'] }
})

// 详情抽屉
const showDetail = ref(false)
const selectedLog = ref<SystemLogItem | null>(null)
const rowProps = (row: SystemLogItem) => ({
  style: 'cursor: pointer',
  onClick: () => {
    selectedLog.value = row
    showDetail.value = true
  }
})

// 展示列信息
const dataColumns: DataTableColumns<SystemLogItem> = [
  { key: 'operationGroup', title: '操作模块', width: 140, ellipsis: { tooltip: true } },
  {
    key: 'operationName',
    title: '操作名称',
    width: 180,
    ellipsis: { tooltip: true }
  },
  {
    key: 'operationMethod',
    title: '请求方式',
    width: 90,
    align: 'center',
    ellipsis: { tooltip: false },
    render(row) {
      return h(
        NebulaTag,
        { type: row.operationMethod === 'POST' ? 'info' : 'default', bordered: false },
        {
          default: () => row.operationMethod
        }
      )
    }
  },
  {
    key: 'operationUrl',
    title: '请求地址',
    width: 200,
    ellipsis: {
      tooltip: {
        contentStyle: { maxWidth: '480px' }
      }
    }
  },
  {
    key: 'operationParam',
    title: '操作参数',
    width: 200,
    ellipsis: {
      tooltip: {
        contentStyle: { maxWidth: '720px' }
      }
    }
  },
  {
    key: 'clientUsername',
    title: '操作用户',
    width: 120,
    ellipsis: { tooltip: true }
  },
  {
    key: 'clientIp',
    title: '操作IP',
    width: 100,
    ellipsis: { tooltip: true }
  },
  {
    key: 'clientDevice',
    title: '操作设备',
    width: 120,
    ellipsis: { tooltip: true }
  },
  { key: 'operationTime', title: '发生时间', width: 180 },
  {
    key: 'operationSpend',
    title: '响应时间',
    width: 90,
    align: 'center',
    ellipsis: { tooltip: false },
    valueResolver: (val: number) => (val ? val + 'ms' : '失败'),
    render(row) {
      let type: NTagType
      if (row.operationMethod === 'GET') {
        type =
          row.operationSpend < 500
            ? 'success'
            : row.operationSpend < 1500
              ? 'info'
              : row.operationSpend < 5000
                ? 'warning'
                : 'error'
      } else {
        type =
          row.operationSpend < 2000
            ? 'success'
            : row.operationSpend < 5000
              ? 'info'
              : row.operationSpend < 10000
                ? 'warning'
                : 'error'
      }
      return h(
        NebulaTag,
        { type, bordered: false },
        {
          default: () => (row.operationSpend ? row.operationSpend + 'ms' : '失败')
        }
      )
    }
  },
  {
    key: 'responseCode',
    title: '响应状态',
    width: 90,
    align: 'center',
    ellipsis: { tooltip: false },
    render(row) {
      let type: NTagType = 'warning'
      if (row.responseCode === 200) {
        type = 'success'
      } else if (row.responseCode === 500) {
        type = 'error'
      }
      return h(
        NebulaTag,
        { type, bordered: false },
        {
          default: () => row.responseCode
        }
      )
    }
  },
  {
    key: 'responseMsg',
    title: '响应消息',
    width: 200,
    ellipsis: {
      tooltip: {
        contentStyle: { maxWidth: '480px' }
      }
    }
  }
]

// 列可见性与排序
const {
  visibleColumns,
  scrollX,
  showPanel: showColumnPanel
} = useTableColumns(dataColumns as unknown as DataTableColumns)

// 加载列表
const dataRef = ref<SystemLogItem[]>()
const dataLoading = ref(true)
const getDataList = () => {
  dataLoading.value = true
  monitorApi.logList(listParams.value).then(({ data: res }) => {
    dataLoading.value = false
    dataRef.value = res.data.items
    pagination.itemCount = res.data.total
  })
}

// 自动刷新
const autoRefresh = ref(false)
const refreshInterval = ref(30000)
const refreshTimer = ref<number | null>(null)
const intervalOptions = [
  { label: '10 秒', value: 10000 },
  { label: '30 秒', value: 30000 },
  { label: '60 秒', value: 60000 }
]

const startAutoRefresh = () => {
  stopAutoRefresh()
  getDataList()
  loadStats()
  refreshTimer.value = window.setInterval(() => {
    getDataList()
    loadStats()
  }, refreshInterval.value)
}

const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

watch(refreshInterval, () => {
  if (autoRefresh.value) {
    startAutoRefresh()
  }
})

// 清理
const showCleanupModal = ref(false)
const cleanupRange = ref<[number, number] | null>(null)
const cleanupLoading = ref(false)
const dialog = useDialog()

const handleCleanup = () => {
  if (!cleanupRange.value) return
  dialog.warning({
    title: '二次确认',
    content: '此操作将永久删除选定时间范围内的日志记录，是否继续？',
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      cleanupLoading.value = true
      const startTime = formatDateTime(new Date(cleanupRange.value![0]))
      const endTime = formatDateTime(new Date(cleanupRange.value![1]))
      try {
        await monitorApi.logCleanup(startTime, endTime)
        showCleanupModal.value = false
        cleanupRange.value = null
        getDataList()
        loadStats()
      } finally {
        cleanupLoading.value = false
      }
    }
  })
}

onMounted(() => {
  getDataList()
  loadStats()
  loadOperationGroups()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style lang="scss" scoped></style>
