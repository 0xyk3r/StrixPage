<template>
  <n-modal v-model:show="show" preset="card" title="使用统计" style="width: 640px">
    <n-spin :show="loading">
      <n-space vertical :size="16">
        <n-statistic label="运行时访问次数">
          <n-number-animation :from="0" :to="accessCount" />
        </n-statistic>

        <template v-if="usages.length > 0">
          <n-text strong>静态引用</n-text>
          <n-data-table
            :columns="columns"
            :data="usages"
            :bordered="false"
            :single-line="false"
            size="small"
            :pagination="false"
          />
        </template>

        <n-empty v-else description="暂无静态引用记录" />
      </n-space>
    </n-spin>
  </n-modal>
</template>

<script lang="ts" setup>
import { dictApi } from '@/api/dict'
import type { DataTableColumn } from 'naive-ui'

const props = defineProps<{ dictKey: string }>()
const show = defineModel<boolean>('show', { default: false })

const loading = ref(false)
const accessCount = ref(0)
const usages = ref<any[]>([])

const usageTypeMap: Record<string, string> = {
  CONTROLLER: '后端控制器',
  SERVICE: '后端服务',
  FRONTEND: '前端组件',
  VALIDATION: '校验注解'
}

const columns: DataTableColumn[] = [
  {
    title: '引用类型',
    key: 'usageType',
    width: 120,
    render: (row: any) => usageTypeMap[row.usageType] || row.usageType
  },
  { title: '引用位置', key: 'usageLocation', ellipsis: { tooltip: true } },
  {
    title: '扫描时间',
    key: 'scannedAt',
    width: 160,
    render: (row: any) => row.scannedAt?.replace('T', ' ')?.substring(0, 19) ?? '-'
  }
]

async function loadData() {
  try {
    loading.value = true
    const { data: res } = await dictApi.usage(props.dictKey)
    const data = res.data
    accessCount.value = data?.accessCount ?? 0
    usages.value = data?.usages ?? []
  } catch (e) {
    console.error('加载使用统计失败', e)
  } finally {
    loading.value = false
  }
}

watch(show, (val) => {
  if (val && props.dictKey) loadData()
})
</script>
