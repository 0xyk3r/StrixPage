<!-- src/views/System/SystemModule/Workflow/WorkflowMonitor.vue -->
<template>
  <div class="wf-monitor">
    <!-- Stats Cards -->
    <n-grid :cols="4" :x-gap="16" :y-gap="16" responsive="screen" item-responsive>
      <n-gi span="4 s:2 m:1" v-for="card in statsCards" :key="card.label">
        <n-card size="small">
          <n-statistic :label="card.label" :value="card.value">
            <template #prefix>
              <component :is="card.icon" :size="20" :color="card.color" />
            </template>
          </n-statistic>
        </n-card>
      </n-gi>
    </n-grid>

    <!-- Recent instances -->
    <n-card size="small" title="运行中的流程实例" style="margin-top: 16px">
      <n-data-table
        :columns="columns"
        :data="instances"
        :loading="loading"
        :pagination="{ pageSize: 10 }"
        :row-key="(row: any) => row.id"
        table-layout="fixed"
        size="small"
      />
    </n-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { workflowApi } from '@/api/workflow'
import type { WfStatsResp, WfInstance } from '@/api/workflow'
import { handleOperate } from '@/utils/strix-table-tool'
import { Layers, Play, CheckCircle, Clock } from 'lucide-vue-next'
import { type DataTableColumns, NTag } from 'naive-ui'

const router = useRouter()
const stats = ref<WfStatsResp>({
  totalDefinitions: 0,
  activeDefinitions: 0,
  runningInstances: 0,
  completedToday: 0,
  pendingTasks: 0,
  avgCompletionTime: 0
})
const instances = ref<WfInstance[]>([])
const loading = ref(true)

const statsCards = computed(() => [
  { label: '流程定义', value: stats.value.totalDefinitions, icon: Layers, color: '#409eff' },
  { label: '运行中实例', value: stats.value.runningInstances, icon: Play, color: '#e6a23c' },
  { label: '今日完成', value: stats.value.completedToday, icon: CheckCircle, color: '#67c23a' },
  { label: '待办任务', value: stats.value.pendingTasks, icon: Clock, color: '#f56c6c' }
])

const columns: DataTableColumns = [
  { key: 'title', title: '流程名称', width: 200 },
  { key: 'initiatorName', title: '发起人', width: 120 },
  {
    key: 'status',
    title: '状态',
    width: 100,
    render(row: any) {
      const map: Record<number, { label: string; type: string }> = {
        1: { label: '运行中', type: 'info' },
        2: { label: '已完成', type: 'success' },
        3: { label: '已拒绝', type: 'error' },
        4: { label: '已撤销', type: 'warning' },
        5: { label: '已挂起', type: 'default' }
      }
      const s = map[row.status] || { label: '未知', type: 'default' }
      return h(NTag, { type: s.type as any, size: 'small' }, () => s.label)
    }
  },
  { key: 'startTime', title: '发起时间', width: 180 },
  {
    key: 'actions',
    title: '操作',
    width: 120,
    render(row: any) {
      return handleOperate([
        {
          type: 'primary',
          label: '详情',
          icon: 'eye',
          onClick: () => router.push({ name: 'WorkflowInstanceDetail', params: { id: row.id } })
        }
      ])
    }
  }
]

onMounted(async () => {
  loading.value = true
  try {
    const [statsRes, instancesRes] = await Promise.all([
      workflowApi.stats(),
      workflowApi.instanceList({ pageIndex: 1, pageSize: 20, status: 1 })
    ])
    stats.value = statsRes.data.data
    instances.value = instancesRes.data.data.items
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.wf-monitor {
  padding: 0;
}
</style>
