<template>
  <div>
    <strix-block cleanable @clear="clearSearch">
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input
                v-model:value="getDataListParams.workflowId"
                clearable
                placeholder="请输入搜索条件"
              />
              <n-button ghost type="primary" @click="getDataList">搜索</n-button>
            </n-input-group>
          </n-gi>
        </n-grid>
      </template>
    </strix-block>
    <n-data-table
      :columns="dataColumns"
      :data="dataRef"
      :loading="dataLoading"
      :pagination="dataPagination"
      :remote="true"
      :row-key="dataRowKey"
      table-layout="fixed"
    />
  </div>
</template>

<script lang="ts" setup>
import { http } from '@/plugins/axios'
import { usePage } from '@/utils/common-page-util'
import { type DataTableColumns, NTag } from 'naive-ui'
import StrixNameFetcher from '@/components/StrixNameFetcher.vue'
import { handleOperate } from '@/utils/strix-table-tool'
import StrixTag from '@/components/StrixTag.vue'

// 本页面操作提示关键词
const _baseName = '待我处理工作列表'
const _baseApiPrefix = 'system/workflow'

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
    render(row: any) {
      return h(StrixNameFetcher, { dataType: 'workflow', dataId: row.workflowId })
    }
  },
  {
    key: 'instanceCreateBy',
    title: '发起人',
    width: 140,
    render(row: any) {
      return h(StrixNameFetcher, { dataType: 'systemmanager', dataId: row.instanceCreateBy })
    }
  },
  { key: 'instanceCreateTime', title: '提交时间', width: 160 },
  {
    key: 'nodeType',
    title: '当前节点',
    width: 140,
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
    render(row: any) {
      if (!row.operationType) {
        return h(NTag, { type: 'warning' }, { default: () => '待处理' })
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
          icon: 'ion:create-outline',
          onClick: () => console.log('审批', row)
        }
      ])
    }
  }
]

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
