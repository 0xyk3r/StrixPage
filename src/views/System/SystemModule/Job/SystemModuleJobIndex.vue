<template>
  <div :class="{ 'nebula-column-panel-push': showColumnPanel }">
    <strix-block
      cleanable
      :active-filters="activeFilters"
      :active-filter-count="activeFilterCount"
      @clear="clearSearch"
      @clear-filter="clearFilter"
    >
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input v-model:value="listParams.keyword" clearable placeholder="请输入搜索条件（任务名称）"
                     @keydown.enter="handleKeywordEnter" />
          </n-gi>
          <n-gi :span="1">
            <n-button type="primary" @click="showAdd()"> 添加{{ _baseName }}</n-button>
          </n-gi>
          <n-gi span="6 s:2 m:3" class="nebula-export__trigger-gi">
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
      :checked-row-keys="checkedRowKeys"
      :columns="visibleColumns"
      :data="dataRef"
      :loading="dataLoading"
      :pagination="pagination"
      :row-key="rowKey"
      table-layout="fixed"
      @update:checked-row-keys="onCheckedRowKeysChange"
    />

    <StrixBatchBar :count="selectedCount" @clear="clearSelection">
      <n-popselect
        :options="jobStatusRef"
        @update:value="(v: number) => batchModify('status', String(v))"
      >
        <n-button size="small" quaternary type="primary">
          <template #icon>
            <strix-icon icon="toggle-left" :size="14" />
          </template>
          批量修改状态
        </n-button>
      </n-popselect>
      <n-button size="small" quaternary type="error" @click="batchDelete">
        <template #icon>
          <strix-icon icon="trash-2" :size="14" />
        </template>
        批量删除
      </n-button>
    </StrixBatchBar>

    <strix-export-dialog
      v-model:show="showExportDialog"
      :columns="dataColumns"
      :data="dataRef || []"
      :fetch-all-data="fetchAllData"
      :selected-rows="selectedRows"
      :title="_baseName"
    />

    <strix-column-panel v-model:show="showColumnPanel" />

    <n-modal
      :show="addModal"
      :title="'添加' + _baseName"
      class="strix-form-modal"
      preset="card"
      @update:show="tryCloseAdd"
      size="huge"
      @after-leave="resetForms"
    >
      <n-form
        ref="addFormRef"
        :model="addForm"
        :rules="formRules"
        label-placement="left"
        label-width="auto"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="任务名称" path="name">
          <n-input v-model:value="addForm.name" clearable placeholder="请输入任务名称" />
        </n-form-item>
        <n-form-item label="调用目标" path="invokeTarget">
          <n-popover placement="bottom-start" trigger="focus">
            <template #trigger>
              <n-input v-model:value="addForm.invokeTarget" clearable placeholder="请输入调用目标" />
            </template>
            <p>请输入 组件名称.方法名称() 或 组件名称.方法名称(...参数列表)</p>
            <p>其中组件名称为 @Component 注解的值，参数列表可选、数量不限</p>
            <p>strixTestJob.testSomething() 或 strixTestJob.testParams('abc', 1, 1.21D, 22222L, true)</p>
            <p>为了系统安全考虑，所有定时任务调用目标类需使用 @StrixJob 注解，否则无法添加和调用。</p>
          </n-popover>
        </n-form-item>
        <n-form-item label="Cron 表达式" path="cronExpression">
          <n-input v-model:value="addForm.cronExpression" clearable placeholder="请输入 Cron 表达式" />
        </n-form-item>
        <n-form-item label="计划错误策略" path="misfirePolicy">
          <n-select
            v-model:value="addForm.misfirePolicy"
            :options="jobMisfireRef"
            clearable
            placeholder="请选择计划错误策略"
          />
        </n-form-item>
        <n-form-item label="是否并发执行" path="concurrent">
          <n-select
            v-model:value="addForm.concurrent"
            :options="commonSwitchRef"
            clearable
            placeholder="请选择是否并发执行"
          />
        </n-form-item>
        <n-form-item label="任务状态" path="status">
          <n-select v-model:value="addForm.status" :options="jobStatusRef" clearable placeholder="请选择任务状态" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-flex justify="end">
          <n-button @click="tryCloseAdd">取消</n-button>
          <n-button type="primary" @click="submitAdd"> 确定</n-button>
        </n-flex>
      </template>
    </n-modal>

    <n-modal
      :show="editModal"
      :title="'修改' + _baseName"
      class="strix-form-modal"
      preset="card"
      @update:show="tryCloseEdit"
      size="huge"
      @after-leave="resetForms"
    >
      <n-spin :show="editLoading">
        <n-form
          ref="editFormRef"
          :model="editForm"
          :rules="formRules"
          label-placement="left"
          label-width="auto"
          require-mark-placement="right-hanging"
        >
          <n-form-item label="任务名称" path="name">
            <n-input v-model:value="editForm.name" clearable placeholder="请输入任务名称" />
          </n-form-item>
          <n-form-item label="调用目标" path="invokeTarget">
            <n-input v-model:value="editForm.invokeTarget" clearable placeholder="请输入调用目标" />
          </n-form-item>
          <n-form-item label="Cron 表达式" path="cronExpression">
            <n-input v-model:value="editForm.cronExpression" clearable placeholder="请输入 Cron 表达式" />
          </n-form-item>
          <n-form-item label="计划错误策略" path="misfirePolicy">
            <n-select
              v-model:value="editForm.misfirePolicy"
              :options="jobMisfireRef"
              clearable
              placeholder="请选择计划错误策略"
            />
          </n-form-item>
          <n-form-item label="是否并发执行" path="concurrent">
            <n-select
              v-model:value="editForm.concurrent"
              :options="commonSwitchRef"
              clearable
              placeholder="请选择是否并发执行"
            />
          </n-form-item>
          <n-form-item label="任务状态" path="status">
            <n-select v-model:value="editForm.status" :options="jobStatusRef" clearable placeholder="请选择任务状态" />
          </n-form-item>
        </n-form>
      </n-spin>
      <template #footer>
        <n-flex justify="end">
          <n-button @click="tryCloseEdit">取消</n-button>
          <n-button type="primary" @click="submitEdit"> 确定</n-button>
        </n-flex>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import StrixBlock from '@/components/common/StrixBlock.vue'
import StrixTag from '@/components/common/StrixTag.vue'
import { jobApi } from '@/api/job'
import { useCrud } from '@/composables/useCrud'
import { useDict } from '@/composables/useDict.ts'
import { handleOperate } from '@/utils/strix-table-tool'
import { selectField, textField } from '@/utils/form-rules'
import { type DataTableColumns, type FormRules } from 'naive-ui'
import StrixExportDialog from '@/components/common/StrixExportDialog.vue'
import StrixColumnPanel from '@/components/common/StrixColumnPanel.vue'
import { createPaginatedFetcher } from '@/composables/useTableExport'
import { useTableColumns } from '@/composables/useTableColumns'
import StrixIcon from '@/components/icon/StrixIcon.vue'
import StrixBatchBar from '@/components/common/StrixBatchBar.vue'

// 本页面操作提示关键词
const _baseName = '定时任务'
const showExportDialog = ref(false)
const fetchAllData = createPaginatedFetcher(jobApi.urls.list, 'items', () => listParams.value)

// 加载字典
const commonSwitchRef = useDict('CommonSwitch')
const jobMisfireRef = useDict('JobMisfire')
const jobStatusRef = useDict('JobStatus')

const {
  listParams,
  clearSearch,
  pagination,
  rowKey,
  checkedRowKeys,
  onCheckedRowKeysChange,
  clearSelection,
  selectedCount,
  selectionColumn,
  batchDelete,
  batchModify,
  activeFilters,
  activeFilterCount,
  clearFilter,
  addModal,
  addForm,
  addFormRef,
  editModal,
  editLoading,
  editForm,
  editFormRef,
  showAdd,
  showEdit,
  submitAdd,
  submitEdit,
  deleteRow,
  resetForms,
  tryCloseAdd,
  tryCloseEdit,
  handleKeywordEnter
} = useCrud({
  list: {
    keyword: null,
    pageIndex: 1,
    pageSize: 10
  },
  fetchList: () => getDataList(),
  addForm: {
    name: null,
    group: 'DEFAULT',
    invokeTarget: null,
    cronExpression: null,
    misfirePolicy: null,
    concurrent: null,
    status: null
  },
  editForm: {
    name: null,
    group: 'DEFAULT',
    invokeTarget: null,
    cronExpression: null,
    misfirePolicy: null,
    concurrent: null,
    status: null
  },
  api: jobApi,
  draftKey: 'ModuleJob',
  batch: true,
  filters: [
    { key: 'keyword', label: '关键词' }
  ],
  urlSync: true
})

// 展示列信息
const dataColumns: DataTableColumns = [
  ...(selectionColumn ? [selectionColumn] : []),
  { key: 'name', width: 240, title: '任务名称' },
  { key: 'invokeTarget', width: 320, title: '调用目标' },
  { key: 'cronExpression', width: 160, title: 'Cron 表达式' },
  {
    key: 'misfirePolicy',
    title: '错过执行策略',
    width: 120,
    align: 'center',
    dictName: 'JobMisfire',
    render(row: any) {
      return h(StrixTag, { value: row.misfirePolicy, dictName: 'JobMisfire' })
    }
  },
  {
    key: 'concurrent',
    title: '并发执行',
    width: 120,
    align: 'center',
    dictName: 'CommonSwitch',
    render(row: any) {
      return h(StrixTag, { value: row.concurrent, dictName: 'CommonSwitch' })
    }
  },
  {
    key: 'status',
    title: '状态',
    width: 120,
    align: 'center',
    dictName: 'JobStatus',
    render(row: any) {
      return h(StrixTag, { value: row.status, dictName: 'JobStatus' })
    }
  },
  {
    key: 'actions',
    title: '操作',
    width: 180,
    align: 'center',
    render(row: any) {
      return handleOperate([
        {
          type: 'info',
          label: '运行一次',
          icon: 'play',
          onClick: () => runJob(row.id)
        },
        {
          type: 'warning',
          label: '编辑',
          icon: 'square-pen',
          onClick: () => showEdit(row.id)
        },
        {
          type: 'error',
          label: '删除',
          icon: 'trash',
          onClick: () => deleteRow(row.id),
          popconfirm: true,
          popconfirmMessage: '是否确认删除这条数据? 该操作不可恢复!'
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

const selectedRows = computed(() =>
  dataRef.value?.filter((row: any) => checkedRowKeys.value.includes(row.id)) ?? []
)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  jobApi.list(listParams.value).then(({ data: res }) => {
    dataLoading.value = false
    dataRef.value = res.data.items
  })
}
onMounted(getDataList)

const formRules: FormRules = {
  name: textField('任务名称', { min: 2, max: 64 }),
  invokeTarget: textField('调用目标', { min: 5, max: 512 }),
  cronExpression: textField('Cron 表达式', { min: 5, max: 128 }),
  misfirePolicy: selectField('计划错误策略'),
  concurrent: selectField('是否并发执行'),
  status: selectField('任务状态')
}

const runJob = (id: string) => {
  jobApi.run(id).then(() => {
  })
}
</script>

<style lang="scss" scoped>
::v-deep(.expand-menu-pane) {
  .n-grid:not(:last-child) {
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--color-border);
  }

  .n-grid {
    align-items: center;
  }
}

::v-deep(.expand-permission-pane) {
  .n-tag:not(:last-child) {
    margin: 0 8px 8px 0;
  }
}
</style>
