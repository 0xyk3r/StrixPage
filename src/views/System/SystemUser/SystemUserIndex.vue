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
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input v-model:value="listParams.keyword" clearable placeholder="请输入搜索条件（昵称、手机号码）"
                     @keydown.enter="handleKeywordEnter" />
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
            <n-button v-auth="'system:user:add'" quaternary type="primary" @click="showImportDialog = true">
              <template #icon>
                <strix-icon icon="upload" :size="16" />
              </template>
              导入
            </n-button>
          </n-gi>
        </n-grid>
      </template>
      <n-form :model="listParams" :show-feedback="false" label-placement="left" label-width="auto">
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-form-item-gi label="用户状态" path="status" span="6 s:3 m:2">
            <n-select
              v-model:value="listParams.status"
              :options="systemUserStatusRef"
              clearable
              placeholder="请选择用户状态"
            />
          </n-form-item-gi>
        </n-grid>
      </n-form>
    </strix-block>
    <n-data-table
      :checked-row-keys="checkedRowKeys"
      :columns="visibleColumns"
      :data="dataRef"
      :loading="dataLoading"
      :pagination="pagination"
      :remote="true"
      :row-key="rowKey"
      table-layout="fixed"
      @update:checked-row-keys="onCheckedRowKeysChange"
    />

    <StrixBatchBar :count="selectedCount" @clear="clearSelection">
      <n-popselect
        :options="systemUserStatusRef"
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
      :columns="(dataColumns as unknown as DataTableColumns)"
      :data="dataRef || []"
      :fetch-all-data="fetchAllData"
      :selected-rows="selectedRows"
      :title="_baseName"
    />

    <StrixImportDialog
      v-model:show="showImportDialog"
      :fields="userImportFields"
      :import-api="userApi.batchCreate"
      title="系统用户"
      @done="getDataList()"
    />

    <strix-column-panel v-model:show="showColumnPanel" />

    <n-modal
      :show="editModal"
      :title="'修改' + _baseName"
      class="strix-form-modal"
      preset="card"
      size="huge"
      @update:show="tryCloseEdit"
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
          <n-form-item label="用户昵称" path="nickname">
            <n-input v-model:value="editForm.nickname" clearable placeholder="请输入用户昵称" />
          </n-form-item>
          <n-form-item label="手机号码" path="phoneNumber">
            <n-input v-model:value="editForm.phoneNumber" clearable placeholder="请输入手机号码" />
          </n-form-item>
          <n-form-item label="用户状态" path="status">
            <n-select
              v-model:value="editForm.status"
              :options="systemUserStatusRef"
              clearable
              placeholder="请选择用户状态"
            />
          </n-form-item>
        </n-form>
      </n-spin>

      <template #footer>
        <n-flex justify="end">
          <n-button @click="tryCloseEdit">取消</n-button>
          <n-button type="primary" @click="submitEdit">确定</n-button>
        </n-flex>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import StrixBlock from '@/components/common/StrixBlock.vue'
import StrixTag from '@/components/common/StrixTag.vue'
import StrixColumnPanel from '@/components/common/StrixColumnPanel.vue'
import StrixExportDialog from '@/components/common/StrixExportDialog.vue'
import StrixImportDialog from '@/components/common/StrixImportDialog.vue'
import type { ImportFieldConfig } from '@/composables/useTableImport'
import StrixBatchBar from '@/components/common/StrixBatchBar.vue'
import StrixIcon from '@/components/icon/StrixIcon.vue'
import { useTableColumns } from '@/composables/useTableColumns'
import { createPaginatedFetcher } from '@/composables/useTableExport'
import { userApi } from '@/api/user'
import type { SystemUserItem } from '@/api/user'
import { useCrud } from '@/composables/useCrud'
import { useDict } from '@/composables/useDict.ts'
import { handleOperate } from '@/utils/strix-table-tool'
import { type DataTableColumns } from 'naive-ui'

// 本页面操作提示关键词
const _baseName = '系统用户'
const showExportDialog = ref(false)
const showImportDialog = ref(false)

const userImportFields = computed<ImportFieldConfig[]>(() => [
  { key: 'nickname', label: '用户昵称', required: true },
  { key: 'phoneNumber', label: '手机号码', required: true },
  {
    key: 'status',
    label: '用户状态',
    required: true,
    type: 'number',
    dictName: 'SystemUserStatus',
    dictOptions: systemUserStatusRef.value?.map((d) => ({ label: d.label, value: d.value })) ?? []
  }
])
const fetchAllData = createPaginatedFetcher(userApi.urls.list, 'systemUserList', () => listParams.value)

// 加载字典
const systemUserStatusRef = useDict('SystemUserStatus')

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
  handleKeywordEnter,
  editModal,
  editLoading,
  editForm,
  editFormRef,
  showEdit,
  submitEdit,
  deleteRow,
  resetForms,
  tryCloseEdit,
  formRules
} = useCrud({
  list: {
    keyword: null,
    status: null,
    pageIndex: 1,
    pageSize: 10
  },
  fetchList: () => getDataList(),
  filters: [
    { key: 'keyword', label: '关键词' },
    { key: 'status', label: '用户状态', dictName: 'SystemUserStatus' }
  ],
  urlSync: true,
  editForm: {
    nickname: null,
    status: null,
    phoneNumber: null
  },
  api: userApi,
  draftKey: 'SystemUser',
  batch: true,
  schemaDto: 'SystemUserUpdateReq'
})

// 展示列信息
const dataColumns: DataTableColumns<SystemUserItem> = [
  ...(selectionColumn ? [selectionColumn] : []),
  { key: 'nickname', title: '用户昵称', width: 200 },
  { key: 'phoneNumber', title: '手机号码', width: 200 },
  {
    key: 'status',
    title: '用户状态',
    width: 140,
    align: 'center',
    dictName: 'SystemUserStatus',
    render(row) {
      return h(StrixTag, { value: row.status, dictName: 'SystemUserStatus' })
    }
  },
  {
    key: 'actions',
    title: '操作',
    width: 130,
    align: 'center',
    render(row) {
      return handleOperate([
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
const { visibleColumns, showPanel: showColumnPanel } = useTableColumns(dataColumns as unknown as DataTableColumns)

// 加载列表
const dataRef = ref<SystemUserItem[]>()
const dataLoading = ref(true)
const selectedRows = computed(() =>
  dataRef.value?.filter((row) => checkedRowKeys.value.includes(row.id)) ?? []
)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  userApi.list(listParams.value).then(({ data: res }) => {
    dataLoading.value = false
    dataRef.value = res.data.systemUserList
    pagination.itemCount = res.data.total
  })
}
onMounted(getDataList)


</script>

<style lang="scss" scoped></style>
