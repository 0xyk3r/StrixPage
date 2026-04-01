<template>
  <div :class="{ 'nebula-column-panel-push': showColumnPanel }">
    <strix-block cleanable @clear="clearSearch">
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input v-model:value="getDataListParams.workflowId" clearable placeholder="请输入搜索条件" />
              <n-button ghost type="primary" @click="getDataList">搜索</n-button>
            </n-input-group>
          </n-gi>
          <n-gi span="6 s:3 m:4" class="nebula-export__trigger-gi">
            <n-button quaternary type="primary" @click="showColumnPanel = !showColumnPanel">
              <template #icon><strix-icon icon="columns-3" :size="16" /></template>
              列配置
            </n-button>
            <n-button quaternary type="primary" @click="showExportDialog = true">
              <template #icon><strix-icon icon="download" :size="16" /></template>
              导出
            </n-button>
          </n-gi>
        </n-grid>
      </template>
    </strix-block>
    <n-data-table
      :columns="visibleColumns"
      :data="dataRef"
      :loading="dataLoading"
      :pagination="dataPagination"
      :remote="true"
      :row-key="dataRowKey"
      table-layout="fixed"
    />

    <strix-export-dialog
      v-model:show="showExportDialog"
      :columns="dataColumns"
      :data="dataRef || []"
      :fetch-all-data="fetchAllData"
      :title="_baseName"
    />

    <strix-column-panel v-model:show="showColumnPanel" />
  </div>
</template>

<script lang="ts" setup>
import { http } from '@/plugins/axios'
import { usePage } from '@/composables/usePage.ts'
import { type DataTableColumns } from 'naive-ui'
import NebulaTag from '@/components/common/NebulaTag.vue'
import StrixNameFetcher from '@/components/data/StrixNameFetcher.vue'
import { handleOperate } from '@/utils/strix-table-tool'
import StrixTag from '@/components/common/StrixTag.vue'
import StrixExportDialog from '@/components/common/StrixExportDialog.vue'
import StrixColumnPanel from '@/components/common/StrixColumnPanel.vue'
import { createPaginatedFetcher } from '@/composables/useTableExport'
import { useTableColumns } from '@/composables/useTableColumns'
import { useDictStore } from '@/stores/dict'
import StrixIcon from '@/components/icon/StrixIcon.vue'

// 本页面操作提示关键词
const _baseName = '待我处理工作列表'
const _baseApiPrefix = 'system/workflow'
const showExportDialog = ref(false)
const fetchAllData = createPaginatedFetcher('system/workflow/unfinished', 'items', () => getDataListParams.value)

// 加载字典
// const WorkflowNodeTypeRef = useDict('WorkflowNodeType')

const { getDataListParams, clearSearch, dataPagination, dataRowKey } = usePage(
  {
    workflowId: '',
    pageIndex: 1,
    pageSize: 10
  },
  () => {
    getDataList()
  },
  null,
  null
)

// 展示列信息
const dataColumns: DataTableColumns = [
  { key: 'instanceName', title: '标题', width: 180 },
  {
    key: 'workflowId',
    title: '流程模型',
    width: 180,
    valueResolver: async (val: any) => {
      if (!val) return ''
      try {
        const { data: res } = await http.get('system/common/namefetcher', {
          params: { dataType: 'workflow', dataId: val },
          meta: { operate: '数据 ID 映射' }
        })
        return res.data?.name || String(val)
      } catch {
        return String(val)
      }
    },
    render(row: any) {
      return h(StrixNameFetcher, { dataType: 'workflow', dataId: row.workflowId })
    }
  },
  {
    key: 'instanceCreatedBy',
    title: '发起人',
    width: 140,
    valueResolver: async (val: any) => {
      if (!val) return ''
      try {
        const { data: res } = await http.get('system/common/namefetcher', {
          params: { dataType: 'systemmanager', dataId: val },
          meta: { operate: '数据 ID 映射' }
        })
        return res.data?.name || String(val)
      } catch {
        return String(val)
      }
    },
    render(row: any) {
      return h(StrixNameFetcher, { dataType: 'systemmanager', dataId: row.instanceCreatedBy })
    }
  },
  { key: 'instanceCreatedTime', title: '提交时间', width: 160 },
  {
    key: 'nodeType',
    title: '当前节点',
    width: 140,
    dictName: 'WorkflowNodeType',
    render(row: any) {
      return h(StrixTag, {
        value: row.nodeType,
        dictName: 'WorkflowNodeType'
      })
    }
  },
  {
    key: 'operationType',
    title: '状态',
    width: 140,
    align: 'center',
    valueResolver: (val: any) => {
      if (!val) return '待处理'
      const dictData = useDictStore().dictMap['WorkflowOperationType']
      if (dictData?.dictDataList) {
        const item = dictData.dictDataList.find((d: any) => d.value === val)
        if (item) return item.label
      }
      return String(val)
    },
    render(row: any) {
      if (!row.operationType) {
        return h(NebulaTag, { type: 'warning' }, () => '待处理')
      }
      return h(StrixTag, {
        value: row.operationType,
        dictName: 'WorkflowOperationType'
      })
    }
  },
  { key: 'taskAssignStartTime', title: '任务到达时间', width: 180 },
  {
    key: 'actions',
    title: '操作',
    width: 180,
    align: 'center',
    render(row: any) {
      return handleOperate([
        {
          type: 'info',
          label: '审批',
          icon: 'file-check-corner',
          onClick: () => console.log('审批', row)
        }
      ])
    }
  }
]

// 列可见性与排序
const { visibleColumns, showPanel: showColumnPanel } = useTableColumns(dataColumns)

// 加载列表
const dataRef = ref()
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  http
    .get(`${_baseApiPrefix}/unfinished`, {
      params: getDataListParams.value,
      meta: { operate: `加载${_baseName}列表` }
    })
    .then(({ data: res }) => {
      dataLoading.value = false
      dataRef.value = res.data.items
      dataPagination.itemCount = res.data.total
    })
}
onMounted(getDataList)
</script>

<style lang="scss" scoped></style>
