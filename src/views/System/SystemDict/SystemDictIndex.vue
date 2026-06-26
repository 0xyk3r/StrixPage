<template>
  <n-layout has-sider>
    <!-- 左侧分组树 -->
    <n-layout-sider
      bordered
      :width="200"
      :collapsed-width="0"
      collapse-mode="width"
      :collapsed="siderCollapsed"
      show-trigger
      @update:collapsed="siderCollapsed = $event"
      style="min-height: calc(100vh - 120px)"
    >
      <DictGroupTree
        ref="groupTreeRef"
        :selected-group-id="selectedGroupId"
        @update:selected-group-id="onGroupChange"
      />
    </n-layout-sider>

    <!-- 右侧主内容 -->
    <n-layout-content style="padding: 0 0 0 12px">
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
                <n-input
                  v-model:value="listParams.keyword"
                  clearable
                  placeholder="按字典标识或名称搜索"
                  @keydown.enter="handleKeywordEnter"
                />
              </n-gi>
              <n-gi :span="1">
                <n-button type="primary" @click="showAdd()"> 添加{{ _baseName }}</n-button>
              </n-gi>
              <n-gi span="6 s:2 m:3" class="nebula-export__trigger-gi">
                <n-button quaternary type="primary" @click="showSearchModal = true">
                  <template #icon><strix-icon icon="search" :size="16" /></template>
                  全局搜索
                </n-button>
                <n-button quaternary type="primary" @click="openImportExport('export')">
                  <template #icon><strix-icon icon="download" :size="16" /></template>
                  导出
                </n-button>
                <n-button quaternary type="primary" @click="openImportExport('import')">
                  <template #icon><strix-icon icon="upload" :size="16" /></template>
                  导入
                </n-button>
                <n-button quaternary type="primary" @click="showColumnPanel = !showColumnPanel">
                  <template #icon><strix-icon icon="columns-3" :size="16" /></template>
                  列配置
                </n-button>
                <n-button quaternary type="primary" @click="showExportDialog = true">
                  <template #icon><strix-icon icon="file-down" :size="16" /></template>
                  表格导出
                </n-button>
              </n-gi>
            </n-grid>
          </template>
          <n-form :model="listParams" :show-feedback="false" label-placement="left" label-width="auto">
            <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
              <n-form-item-gi label="字典状态" path="status" span="6 s:3 m:2">
                <n-select
                  v-model:value="listParams.status"
                  :options="commonSwitchRef"
                  clearable
                  placeholder="请选择字典状态"
                  @update:value="getDataList"
                />
              </n-form-item-gi>
              <n-form-item-gi label="是否内置" path="provided" span="6 s:3 m:2">
                <n-select
                  v-model:value="listParams.provided"
                  :options="commonFlagRef"
                  clearable
                  placeholder="请选择字典是否内置"
                  @update:value="getDataList"
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
          :row-props="rowProps"
          @update:checked-row-keys="onCheckedRowKeysChange"
        />

        <StrixBatchBar :count="selectedCount" @clear="clearSelection">
          <n-popselect :options="commonSwitchRef" @update:value="(v: number) => batchModify('status', String(v))">
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
          :columns="dataColumns as unknown as DataTableColumns"
          :data="dataRef || []"
          :fetch-all-data="fetchAllData"
          :selected-rows="selectedRows"
          :title="_baseName"
        />

        <strix-column-panel v-model:show="showColumnPanel" />

        <!-- 添加字典模态框 -->
        <n-modal
          :show="addModal"
          :title="'添加' + _baseName"
          class="strix-form-modal"
          preset="card"
          size="huge"
          @update:show="tryCloseAdd"
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
            <n-form-item label="字典标识" path="key">
              <n-input v-model:value="addForm.key" clearable placeholder="请输入字典标识" />
            </n-form-item>
            <n-form-item label="字典名称" path="name">
              <n-input v-model:value="addForm.name" clearable placeholder="请输入字典名称" />
            </n-form-item>
            <n-form-item label="数据类型" path="dataType">
              <n-select
                v-model:value="addForm.dataType"
                :options="dictDataTypeRef"
                clearable
                placeholder="请选择字典数据类型"
              />
            </n-form-item>
            <n-form-item label="字典分组" path="groupId">
              <n-select
                v-model:value="addForm.groupId"
                :options="groupOptions"
                clearable
                placeholder="请选择字典分组"
              />
            </n-form-item>
            <n-form-item label="父级字典" path="parentDictKey">
              <n-select
                v-model:value="addForm.parentDictKey"
                :options="parentDictOptions"
                clearable
                filterable
                placeholder="级联关系的父级字典"
              />
            </n-form-item>
            <n-form-item label="字典状态" path="status">
              <n-select
                v-model:value="addForm.status"
                :options="commonSwitchRef"
                clearable
                placeholder="请选择字典状态"
              />
            </n-form-item>
            <n-form-item label="备注信息" path="remark">
              <n-input
                v-model:value="addForm.remark"
                :autosize="{ minRows: 3, maxRows: 5 }"
                placeholder="在此输入备注信息"
                type="textarea"
              />
            </n-form-item>
          </n-form>
          <template #footer>
            <n-flex justify="end">
              <n-button @click="tryCloseAdd">取消</n-button>
              <n-button type="primary" :loading="submitLoading" @click="submitAdd"> 确定</n-button>
            </n-flex>
          </template>
        </n-modal>

        <!-- 修改字典模态框 -->
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
              <n-form-item label="字典标识" path="key">
                <n-input v-model:value="editForm.key" clearable placeholder="请输入字典标识" />
              </n-form-item>
              <n-form-item label="字典名称" path="name">
                <n-input v-model:value="editForm.name" clearable placeholder="请输入字典名称" />
              </n-form-item>
              <n-form-item label="数据类型" path="dataType">
                <n-select
                  v-model:value="editForm.dataType"
                  :options="dictDataTypeRef"
                  clearable
                  placeholder="请选择字典数据类型"
                />
              </n-form-item>
              <n-form-item label="字典分组" path="groupId">
                <n-select
                  v-model:value="editForm.groupId"
                  :options="groupOptions"
                  clearable
                  placeholder="请选择字典分组"
                />
              </n-form-item>
              <n-form-item label="父级字典" path="parentDictKey">
                <n-select
                  v-model:value="editForm.parentDictKey"
                  :options="parentDictOptions"
                  clearable
                  filterable
                  placeholder="级联关系的父级字典"
                />
              </n-form-item>
              <n-form-item label="字典状态" path="status">
                <n-select
                  v-model:value="editForm.status"
                  :options="commonSwitchRef"
                  clearable
                  placeholder="请选择字典状态"
                />
              </n-form-item>
              <n-form-item label="备注信息" path="remark">
                <n-input
                  v-model:value="editForm.remark"
                  :autosize="{ minRows: 3, maxRows: 5 }"
                  placeholder="在此输入备注信息"
                  type="textarea"
                />
              </n-form-item>
            </n-form>
          </n-spin>
          <template #footer>
            <n-flex justify="end">
              <n-button @click="tryCloseEdit">取消</n-button>
              <n-button type="primary" :loading="submitLoading" @click="submitEdit"> 确定</n-button>
            </n-flex>
          </template>
        </n-modal>
      </div>

      <!-- 弹窗组件 -->
      <DictGlobalSearchModal v-model:show="showSearchModal" @select="onSearchSelect" />
      <DictCloneModal v-model:show="showCloneModal" :source-dict-key="cloneSourceKey" @success="getDataList" />
      <DictChangeLogModal v-model:show="showChangeLogModal" :dict-key="changeLogDictKey" />
      <DictUsageModal v-model:show="showUsageModal" :dict-key="usageDictKey" />
      <DictImportExportModal
        v-model:show="showImportExportModal"
        :mode="importExportMode"
        :dict-list="dataRef ?? []"
        @success="getDataList"
      />
    </n-layout-content>
    <StrixCommentPanel v-bind="commentPanelProps" />
  </n-layout>
</template>

<script lang="ts" setup>
import StrixBlock from '@/components/common/StrixBlock.vue'
import StrixTag from '@/components/common/StrixTag.vue'
import type { DictDataItem, DictItem } from '@/api/dict'
import { dictApi } from '@/api/dict'
import type { DictGroupItem } from '@/api/dict-group'
import { dictGroupApi } from '@/api/dict-group'
import { useCrud } from '@/composables/useCrud'
import { useDict } from '@/composables/useDict.ts'
import { handleOperate } from '@/utils/strix-table-tool'
import { type DataTableColumns, NDataTable, NTag } from 'naive-ui'
import StrixExportDialog from '@/components/common/StrixExportDialog.vue'
import StrixColumnPanel from '@/components/common/StrixColumnPanel.vue'
import { createPaginatedFetcher } from '@/composables/useTableExport'
import { useTableColumns } from '@/composables/useTableColumns'
import StrixIcon from '@/components/icon/StrixIcon.vue'
import StrixBatchBar from '@/components/common/StrixBatchBar.vue'
import DictGroupTree from './components/DictGroupTree.vue'
import DictGlobalSearchModal from './components/DictGlobalSearchModal.vue'
import DictCloneModal from './components/DictCloneModal.vue'
import DictChangeLogModal from './components/DictChangeLogModal.vue'
import DictUsageModal from './components/DictUsageModal.vue'
import DictImportExportModal from './components/DictImportExportModal.vue'
import StrixCommentPanel from '@/components/common/StrixCommentPanel.vue'
import { useComment } from '@/composables/useComment'

const router = useRouter()

const _baseName = '系统字典'
const showExportDialog = ref(false)
const fetchAllData = createPaginatedFetcher(dictApi.urls.list, 'items', () => listParams.value)

// 分组相关
const selectedGroupId = ref<string | null>(null)
const siderCollapsed = ref(false)
const groupTreeRef = ref<InstanceType<typeof DictGroupTree> | null>(null)
const groups = ref<DictGroupItem[]>([])

const groupOptions = computed(() => groups.value.map((g) => ({ label: g.name, value: g.id })))

// 父级字典选项（从当前列表数据中选取）
const parentDictOptions = computed(() =>
  (dataRef.value ?? []).map((d: DictItem) => ({ label: `${d.name} (${d.key})`, value: d.key }))
)

// 加载分组列表
async function loadGroups() {
  try {
    const { data: res } = await dictGroupApi.list()
    groups.value = res.data?.items ?? []
  } catch (e) {
    console.error('加载分组失败', e)
  }
}

function onGroupChange(id: string | null) {
  selectedGroupId.value = id
  getDataList()
}

// 弹窗状态
const showSearchModal = ref(false)
const showCloneModal = ref(false)
const cloneSourceKey = ref('')
const showChangeLogModal = ref(false)
const changeLogDictKey = ref('')
const showUsageModal = ref(false)
const usageDictKey = ref('')
const showImportExportModal = ref(false)
const importExportMode = ref<'export' | 'import'>('export')

function openImportExport(mode: 'export' | 'import') {
  importExportMode.value = mode
  showImportExportModal.value = true
}

function onSearchSelect(dictKey: string) {
  viewDictData(dictKey)
}

// 加载字典
const commonFlagRef = useDict('CommonFlag')
const commonSwitchRef = useDict('CommonSwitch')
const dictDataTypeRef = useDict('DictDataType')

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
  submitLoading,
  deleteRow,
  resetForms,
  tryCloseAdd,
  tryCloseEdit,
  formRules,
  activeFilters,
  activeFilterCount,
  clearFilter,
  handleKeywordEnter
} = useCrud({
  list: {
    keyword: null,
    status: null,
    provided: null,
    groupId: null,
    pageIndex: 1,
    pageSize: 10
  },
  fetchList: () => getDataList(),
  addForm: {
    key: null,
    name: null,
    dataType: 2,
    status: 1,
    remark: null,
    groupId: null,
    parentDictKey: null
  },
  editForm: {
    key: null,
    name: null,
    dataType: null,
    status: null,
    remark: null,
    groupId: null,
    parentDictKey: null
  },
  api: dictApi,
  draftKey: 'SystemDict',
  batch: { disabledKey: 'provided' },
  filters: [
    { key: 'keyword', label: '关键词' },
    { key: 'status', label: '字典状态', dictName: 'CommonSwitch' },
    { key: 'provided', label: '是否内置', dictName: 'CommonFlag' }
  ],
  urlSync: true,
  schemaDto: 'DictUpdateReq'
})

const { commentButton, panelProps: commentPanelProps } = useComment('SystemDict')

// 展开行：内联预览
const expandedDataCache = ref<Record<string, DictDataItem[]>>({})

async function loadExpandData(dictKey: string) {
  if (expandedDataCache.value[dictKey]) return
  try {
    const { data: res } = await dictApi.dataList(dictKey, { pageSize: 10, pageIndex: 1 })
    expandedDataCache.value[dictKey] = res.data?.items ?? []
  } catch (e) {
    console.error('加载字典数据预览失败', e)
  }
}

function rowProps(row: Record<string, unknown>) {
  return {
    onClick: (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('button') || target.closest('.n-checkbox') || target.closest('a')) return
    }
  }
}

// 展示列信息
const dataColumns: DataTableColumns<DictItem> = [
  ...(selectionColumn ? [selectionColumn] : []),
  {
    type: 'expand',
    renderExpand: (row) => {
      const items = expandedDataCache.value[row.key]
      if (!items) {
        loadExpandData(row.key)
        return h('div', { style: 'padding: 8px; color: var(--strix-text-tertiary)' }, '加载中...')
      }
      if (items.length === 0) {
        return h('div', { style: 'padding: 8px; color: var(--strix-text-tertiary)' }, '暂无字典数据')
      }
      return h(NDataTable, {
        size: 'small',
        bordered: false,
        singleLine: false,
        columns: [
          { title: '值', key: 'value', width: 120 },
          { title: '标签', key: 'label', width: 120 },
          {
            title: '样式',
            key: 'style',
            width: 80,
            render: (r: DictDataItem) => h(StrixTag, { value: r.value, dictName: row.key })
          },
          {
            title: '状态',
            key: 'status',
            width: 80,
            render: (r: DictDataItem) => h(StrixTag, { value: r.status, dictName: 'CommonSwitch' })
          }
        ],
        data: items,
        pagination: false
      } as Record<string, unknown>)
    }
  },
  { key: 'key', title: '字典标识', width: 200 },
  { key: 'name', title: '字典名称', width: 200 },
  {
    key: 'groupName',
    title: '分组',
    width: 100,
    render(row) {
      if (!row.groupName) return h('span', { style: 'color: var(--strix-text-tertiary)' }, '-')
      return h(
        NTag,
        {
          size: 'small',
          bordered: false,
          style: 'cursor: pointer',
          onClick: () => {
            selectedGroupId.value = row.groupId
            getDataList()
          }
        },
        () => row.groupName
      )
    }
  },
  { key: 'version', title: '版本', width: 70, align: 'center' },
  {
    key: 'status',
    title: '状态',
    width: 80,
    align: 'center',
    dictName: 'CommonSwitch',
    render(row) {
      return h(StrixTag, { value: row.status, dictName: 'CommonSwitch' })
    }
  },
  {
    key: 'dataType',
    title: '数据类型',
    width: 100,
    align: 'center',
    dictName: 'DictDataType',
    render(row) {
      return h(StrixTag, { value: row.dataType, dictName: 'DictDataType' })
    }
  },
  {
    key: 'provided',
    title: '内置',
    width: 70,
    align: 'center',
    dictName: 'CommonFlag',
    render(row) {
      return h(StrixTag, { value: row.provided, dictName: 'CommonFlag' })
    }
  },
  { key: 'remark', title: '备注', width: 140, titleAlign: 'center', ellipsis: { tooltip: true } },
  {
    key: 'actions',
    title: '操作',
    width: 260,
    align: 'center',
    render(row) {
      const isProvided = row.provided === 1
      return handleOperate([
        commentButton(row),
        {
          type: 'info',
          label: '数据',
          icon: 'list',
          onClick: () => viewDictData(row.key)
        },
        {
          type: 'warning',
          label: isProvided ? '查看' : '编辑',
          icon: isProvided ? 'eye' : 'square-pen',
          onClick: () => showEdit(row.id)
        },
        {
          label: '克隆',
          icon: 'copy',
          onClick: () => {
            cloneSourceKey.value = row.key
            showCloneModal.value = true
          }
        },
        {
          label: '历史',
          icon: 'clock',
          onClick: () => {
            changeLogDictKey.value = row.key
            showChangeLogModal.value = true
          }
        },
        {
          label: '统计',
          icon: 'bar-chart-2',
          onClick: () => {
            usageDictKey.value = row.key
            showUsageModal.value = true
          }
        },
        {
          type: 'error',
          label: '删除',
          icon: 'trash',
          disabled: isProvided,
          onClick: () => deleteRow(row.id),
          popconfirm: true,
          popconfirmMessage: '是否确认删除这条数据? 且该操作不可恢复!'
        }
      ])
    }
  }
]

// 列可见性与排序
const { visibleColumns, showPanel: showColumnPanel } = useTableColumns(dataColumns as unknown as DataTableColumns)

// 加载列表
const dataRef = ref<DictItem[]>()
const dataLoading = ref(true)

const selectedRows = computed(() => dataRef.value?.filter((row) => checkedRowKeys.value.includes(row.id)) ?? [])

const getDataList = () => {
  // 同步分组筛选
  if (selectedGroupId.value !== null) {
    listParams.value.groupId = selectedGroupId.value === '' ? '__ungrouped__' : selectedGroupId.value
  } else {
    listParams.value.groupId = null
  }

  dataLoading.value = true
  expandedDataCache.value = {}
  dictApi
    .list(listParams.value)
    .then(({ data: res }) => {
      dataRef.value = res.data.items
      pagination.itemCount = res.data.total
    })
    .finally(() => {
      dataLoading.value = false
    })
}

onMounted(() => {
  getDataList()
  loadGroups()
})

const viewDictData = (key: string) => {
  router.push({ path: `/system/dict/${key}` })
}
</script>

<style lang="scss" scoped></style>
