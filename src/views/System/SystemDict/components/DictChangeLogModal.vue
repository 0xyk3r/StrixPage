<template>
  <n-modal v-model:show="show" preset="card" title="变更历史" style="width: 800px">
    <n-data-table
      :columns="columns"
      :data="logList"
      :loading="loading"
      :bordered="false"
      :single-line="false"
      size="small"
      :pagination="pagination"
      remote
      @update:page="loadData"
    />

    <!-- JSON Diff 抽屉 -->
    <n-drawer v-model:show="showDiff" width="600" placement="right">
      <n-drawer-content title="数据快照对比">
        <n-grid :cols="2" :x-gap="12">
          <n-gi>
            <n-text strong>变更前</n-text>
            <n-code :code="diffBefore" language="json" word-wrap style="margin-top: 8px" />
          </n-gi>
          <n-gi>
            <n-text strong>变更后</n-text>
            <n-code :code="diffAfter" language="json" word-wrap style="margin-top: 8px" />
          </n-gi>
        </n-grid>
      </n-drawer-content>
    </n-drawer>
  </n-modal>
</template>

<script lang="ts" setup>
import { dictApi } from '@/api/dict'
import { NButton, NPopconfirm, NSpace, type DataTableColumn } from 'naive-ui'

const props = defineProps<{ dictKey: string }>()
const show = defineModel<boolean>('show', { default: false })

const loading = ref(false)
const logList = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const showDiff = ref(false)
const diffBefore = ref('')
const diffAfter = ref('')

const pagination = computed(() => ({
  page: currentPage.value,
  pageSize: pageSize.value,
  pageCount: Math.ceil(total.value / pageSize.value)
}))

const changeTypeMap: Record<string, string> = {
  DICT_CREATED: '创建字典',
  DICT_UPDATED: '修改字典',
  DICT_DELETED: '删除字典',
  DICT_CLONED: '克隆字典',
  DICT_IMPORTED: '导入字典',
  DATA_ADDED: '新增数据项',
  DATA_UPDATED: '修改数据项',
  DATA_DELETED: '删除数据项',
  DATA_SORTED: '排序数据项'
}

const columns: DataTableColumn[] = [
  {
    title: '变更类型',
    key: 'changeType',
    width: 120,
    render: (row: any) => changeTypeMap[row.changeType] || row.changeType
  },
  { title: '操作人', key: 'operatorName', width: 100 },
  { title: '备注', key: 'remark', ellipsis: { tooltip: true } },
  {
    title: '时间',
    key: 'createdTime',
    width: 160,
    render: (row: any) => row.createdTime?.replace('T', ' ')?.substring(0, 19) ?? '-'
  },
  {
    title: '操作',
    key: 'actions',
    width: 140,
    render: (row: any) =>
      h(NSpace, { size: 4 }, () => [
        h(
          NButton,
          { size: 'small', quaternary: true, type: 'primary', onClick: () => viewDiff(row) },
          () => '查看快照'
        ),
        row.snapshotBefore
          ? h(
              NPopconfirm,
              { onPositiveClick: () => handleRollback(row.id) },
              { trigger: () => h(NButton, { size: 'small', quaternary: true, type: 'warning' }, () => '回滚'), default: () => '确定回滚到此版本？' }
            )
          : null
      ])
  }
]

function viewDiff(row: any) {
  diffBefore.value = formatJson(row.snapshotBefore)
  diffAfter.value = formatJson(row.snapshotAfter)
  showDiff.value = true
}

function formatJson(raw: string | null): string {
  if (!raw) return '(无)'
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

async function handleRollback(logId: string) {
  await dictApi.rollback(logId)
  await loadData(1)
}

async function loadData(page?: number) {
  if (page) currentPage.value = page
  try {
    loading.value = true
    const { data: res } = await dictApi.changelog(props.dictKey, {
      pageIndex: currentPage.value,
      pageSize: pageSize.value
    })
    logList.value = res.data?.records ?? res.data?.items ?? []
    total.value = res.data?.total ?? 0
  } catch (e) {
    console.error('加载变更历史失败', e)
  } finally {
    loading.value = false
  }
}

watch(show, (val) => {
  if (val && props.dictKey) loadData(1)
})
</script>
