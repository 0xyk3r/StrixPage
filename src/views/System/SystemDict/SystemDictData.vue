<template>
  <div :class="{ 'nebula-column-panel-push': showColumnPanel }">
    <strix-block cleanable @clear="clearSearch">
      <template #search>
        <n-input
          v-model:value="listParams.keyword"
          clearable
          placeholder="按名称搜索"
          @keydown.enter="handleKeywordEnter"
        />
      </template>
      <template #actions>
        <n-button type="primary" @click="showAdd()"> 添加{{ _baseName }}</n-button>
        <n-button :type="sortMode ? 'warning' : 'default'" quaternary @click="toggleSortMode">
          <template #icon>
            <strix-icon icon="arrow-up-down" :size="16" />
          </template>
          {{ sortMode ? '退出排序' : '排序模式' }}
        </n-button>
        <n-button v-if="sortMode" type="primary" size="small" :loading="sortSaving" @click="saveSortOrder">
          保存排序
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
        <n-button v-auth="'system:dict:data:add'" quaternary type="primary" @click="showImportDialog = true">
          <template #icon>
            <strix-icon icon="upload" :size="16" />
          </template>
          导入
        </n-button>
      </template>
      <n-form :model="listParams" :show-feedback="false" label-placement="left" label-width="auto">
        <n-form-item label="字典状态" path="status">
          <n-select
            v-model:value="listParams.status"
            :options="commonSwitchRef"
            clearable
            placeholder="请选择字典数据状态"
            @update:value="getDataList"
          />
        </n-form-item>
      </n-form>
    </strix-block>

    <!-- 排序模式：拖拽列表 -->
    <template v-if="sortMode">
      <VueDraggable v-model="sortableItems" handle=".drag-handle" style="margin: 12px 0">
        <div v-for="item in sortableItems" :key="item.id" class="dict-sort-item">
          <span class="drag-handle" style="cursor: grab; margin-right: 8px">⠿</span>
          <n-tag :type="(item.style || 'default') as any" size="small" :bordered="false" style="margin-right: 8px">
            {{ item.label }}
          </n-tag>
          <n-text depth="3">{{ item.value }}</n-text>
          <n-tag v-if="item.isDefault === 1" type="warning" size="tiny" :bordered="false" style="margin-left: 8px">
            默认
          </n-tag>
          <template v-if="getValidityStatus(item) !== 'valid'">
            <n-tag
              :type="getValidityStatus(item) === 'expired' ? 'error' : 'info'"
              size="tiny"
              :bordered="false"
              style="margin-left: 8px"
            >
              {{ getValidityStatus(item) === 'expired' ? '已过期' : '未生效' }}
            </n-tag>
          </template>
        </div>
      </VueDraggable>
    </template>

    <!-- 普通模式：数据表格 -->
    <template v-else>
      <n-data-table
        :checked-row-keys="checkedRowKeys"
        :columns="visibleColumns"
        :scroll-x="scrollX"
        :data="dataRef"
        :loading="dataLoading"
        :pagination="pagination"
        :remote="true"
        :row-key="rowKey"
        table-layout="fixed"
        @update:checked-row-keys="onCheckedRowKeysChange"
      />
    </template>

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

    <StrixImportDialog
      v-model:show="showImportDialog"
      :fields="dictDataImportFields"
      :import-api="dictDataImportApi"
      title="字典数据"
      @done="getDataList()"
    />

    <strix-column-panel v-model:show="showColumnPanel" />

    <!-- 添加字典数据模态框 -->
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
        <n-form-item label="字典值" path="value">
          <n-input v-model:value="addForm.value" clearable placeholder="请输入字典值" />
        </n-form-item>
        <n-form-item label="字典标签" path="label">
          <n-input v-model:value="addForm.label" clearable placeholder="请输入字典标签" />
        </n-form-item>
        <n-form-item label="字典排序" path="sort">
          <n-input-number v-model:value="addForm.sort" clearable placeholder="请输入字典排序" />
        </n-form-item>
        <n-form-item label="字典样式" path="style">
          <StrixStylePicker v-model:value="addForm.style" />
        </n-form-item>
        <n-form-item v-if="parentDictKey" label="父级值" path="parentValue">
          <n-select
            v-model:value="addForm.parentValue"
            :options="parentDictOptions"
            clearable
            filterable
            placeholder="选择父级字典数据值"
          />
        </n-form-item>
        <n-form-item label="默认值" path="isDefault">
          <n-switch v-model:value="addFormIsDefault" @update:value="onDefaultToggle('add', $event)" />
        </n-form-item>
        <n-form-item label="有效期" path="validRange">
          <n-date-picker v-model:value="addValidRange" type="datetimerange" clearable style="width: 100%" />
        </n-form-item>
        <n-form-item label="字典状态" path="status">
          <n-select v-model:value="addForm.status" :options="commonSwitchRef" clearable placeholder="请选择字典状态" />
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

    <!-- 修改字典数据模态框 -->
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
          <n-form-item label="字典值" path="value">
            <n-input v-model:value="editForm.value" clearable placeholder="请输入字典值" :disabled="isProvided" />
          </n-form-item>
          <n-form-item label="字典标签" path="label">
            <n-input v-model:value="editForm.label" clearable placeholder="请输入字典标签" />
          </n-form-item>
          <n-form-item label="字典排序" path="sort">
            <n-input-number v-model:value="editForm.sort" clearable placeholder="请输入字典排序" />
          </n-form-item>
          <n-form-item label="字典样式" path="style">
            <StrixStylePicker v-model:value="editForm.style" />
          </n-form-item>
          <n-form-item v-if="parentDictKey" label="父级值" path="parentValue">
            <n-select
              v-model:value="editForm.parentValue"
              :options="parentDictOptions"
              clearable
              filterable
              placeholder="选择父级字典数据值"
            />
          </n-form-item>
          <n-form-item label="默认值" path="isDefault">
            <n-switch v-model:value="editFormIsDefault" @update:value="onDefaultToggle('edit', $event)" />
          </n-form-item>
          <n-form-item label="有效期" path="validRange">
            <n-date-picker v-model:value="editValidRange" type="datetimerange" clearable style="width: 100%" />
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
    <StrixCommentPanel v-bind="commentPanelProps" />
  </div>
</template>

<script lang="ts" setup>
import NebulaTag from '@/components/common/NebulaTag.vue'
import StrixBlock from '@/components/common/StrixBlock.vue'
import StrixTag from '@/components/common/StrixTag.vue'
import StrixStylePicker from '@/components/common/StrixStylePicker.vue'
import type { DictDataItem } from '@/api/dict'
import { dictApi } from '@/api/dict'
import { useCrud } from '@/composables/useCrud'
import { useDict } from '@/composables/useDict.ts'
import { handleOperate } from '@/utils/strix-table-tool'
import { type DataTableColumns, NTag } from 'naive-ui'
import StrixColumnPanel from '@/components/common/StrixColumnPanel.vue'
import StrixExportDialog from '@/components/common/StrixExportDialog.vue'
import StrixImportDialog from '@/components/common/StrixImportDialog.vue'
import type { ImportFieldConfig } from '@/composables/useTableImport'
import { createPaginatedFetcher } from '@/composables/useTableExport'
import { useTableColumns } from '@/composables/useTableColumns'
import StrixIcon from '@/components/icon/StrixIcon.vue'
import StrixBatchBar from '@/components/common/StrixBatchBar.vue'
import { VueDraggable } from 'vue-draggable-plus'
import StrixCommentPanel from '@/components/common/StrixCommentPanel.vue'
import { useComment } from '@/composables/useComment'

const route = useRoute()
const message = useMessage()

const _baseName = '系统字典数据'
const showExportDialog = ref(false)
const showImportDialog = ref(false)

const dictKey = route.params.dictKey as string

// 字典详情（获取 parentDictKey 和 provided 状态）
const parentDictKey = ref<string | null>(null)
const isProvided = ref(false)

async function loadDictInfo() {
  try {
    const { data: res } = await dictApi.detail(dictKey)
    parentDictKey.value = res.data?.parentDictKey ?? null
    isProvided.value = res.data?.provided === 1
  } catch (e) {
    console.error('加载字典详情失败', e)
  }
}

// 父级字典数据选项
const parentDictData = ref<any[]>([])
const parentDictOptions = computed(() =>
  parentDictData.value.map((d) => ({ label: `${d.label} (${d.value})`, value: d.value }))
)

async function loadParentDictData() {
  if (!parentDictKey.value) return
  try {
    const { data: res } = await dictApi.dataList(parentDictKey.value, { pageSize: 100, pageIndex: 1 })
    parentDictData.value = res.data?.items ?? []
  } catch (e) {
    console.error('加载父级字典数据失败', e)
  }
}

watch(parentDictKey, (val) => {
  if (val) loadParentDictData()
})

// 排序模式
const sortMode = ref(false)
const sortableItems = ref<DictDataItem[]>([])
const sortSaving = ref(false)

function toggleSortMode() {
  if (!sortMode.value) {
    sortableItems.value = [...(dataRef.value ?? [])]
    sortMode.value = true
  } else {
    sortMode.value = false
  }
}

async function saveSortOrder() {
  try {
    sortSaving.value = true
    const sortedIds = sortableItems.value.map((item) => item.id)
    await dictApi.batchSort(dictKey, { sortedIds })
    sortMode.value = false
    await getDataList()
  } finally {
    sortSaving.value = false
  }
}

// 有效期辅助
function getValidityStatus(item: DictDataItem): 'valid' | 'expired' | 'not_started' {
  const now = new Date()
  if (item.validTo && new Date(item.validTo) < now) return 'expired'
  if (item.validFrom && new Date(item.validFrom) > now) return 'not_started'
  return 'valid'
}

// 默认值切换
const addFormIsDefault = ref(false)
const editFormIsDefault = ref(false)

function onDefaultToggle(mode: 'add' | 'edit', val: boolean) {
  const form = mode === 'add' ? addForm : editForm
  form.value.isDefault = val ? 1 : 0
  if (val) {
    const existing = (dataRef.value ?? []).find((d) => d.isDefault === 1)
    if (existing) {
      message.warning(`当前已有默认值「${existing.label}」，保存后将替换`)
    }
  }
}

// 有效期范围双向绑定
const addValidRange = computed<[number, number] | null>({
  get: (): [number, number] | null => {
    if (addForm.value.validFrom && addForm.value.validTo) {
      return [new Date(addForm.value.validFrom).getTime(), new Date(addForm.value.validTo).getTime()] as [
        number,
        number
      ]
    }
    return null
  },
  set: (val: [number, number] | null) => {
    if (val) {
      addForm.value.validFrom = new Date(val[0]).toISOString()
      addForm.value.validTo = new Date(val[1]).toISOString()
    } else {
      addForm.value.validFrom = null
      addForm.value.validTo = null
    }
  }
})

const editValidRange = computed<[number, number] | null>({
  get: (): [number, number] | null => {
    if (editForm.value.validFrom && editForm.value.validTo) {
      return [new Date(editForm.value.validFrom).getTime(), new Date(editForm.value.validTo).getTime()] as [
        number,
        number
      ]
    }
    return null
  },
  set: (val: [number, number] | null) => {
    if (val) {
      editForm.value.validFrom = new Date(val[0]).toISOString()
      editForm.value.validTo = new Date(val[1]).toISOString()
    } else {
      editForm.value.validFrom = null
      editForm.value.validTo = null
    }
  }
})

const dictDataImportFields = computed<ImportFieldConfig[]>(() => [
  { key: 'value', label: '字典值', required: true },
  { key: 'label', label: '字典标签', required: true },
  { key: 'sort', label: '字典排序', required: true, type: 'number' },
  {
    key: 'style',
    label: '字典样式',
    dictName: 'DictDataStyle',
    dictOptions: dictDataStyleRef.value?.map((d) => ({ label: d.label, value: d.value })) ?? []
  },
  {
    key: 'status',
    label: '字典状态',
    required: true,
    type: 'number',
    dictName: 'CommonSwitch',
    dictOptions: commonSwitchRef.value?.map((d) => ({ label: d.label, value: d.value })) ?? []
  },
  { key: 'remark', label: '备注' }
])

const dictDataImportApi = (data: { items: Record<string, any>[]; duplicateStrategy: string }) =>
  dictApi.dataBatchCreate(dictKey, data)

// 加载字典
const dictDataStyleRef = useDict('DictDataStyle')
const commonSwitchRef = useDict('CommonSwitch')

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
  handleKeywordEnter,
  formRules
} = useCrud({
  list: { pageIndex: 1, pageSize: 10 },
  fetchList: () => getDataList(),
  addForm: {
    key: null,
    value: null,
    label: null,
    sort: null,
    style: 'DEFAULT',
    status: 1,
    remark: null,
    parentValue: null,
    isDefault: 0,
    validFrom: null,
    validTo: null
  },
  editForm: {
    key: null,
    value: null,
    label: null,
    sort: null,
    style: 'DEFAULT',
    status: null,
    remark: null,
    parentValue: null,
    isDefault: 0,
    validFrom: null,
    validTo: null
  },
  api: {
    detail: (id: string) => dictApi.dataDetail(dictKey, id),
    create: (data: any) => dictApi.dataCreate(dictKey, data),
    update: (id: string, data: any) => dictApi.dataUpdate(dictKey, id, data),
    remove: (id: string) => dictApi.dataRemove(dictKey, id),
    batchRemove: (ids: string[]) => dictApi.dataBatchRemove(dictKey, ids),
    batchModify: (data: { ids: string[]; field: string; value: string }) => dictApi.dataBatchModify(dictKey, data)
  },
  draftKey: 'SystemDictData',
  batch: true,
  schemaDto: 'DictDataUpdateReq',
  hooks: {
    afterEdit: () => {
      editFormIsDefault.value = editForm.value.isDefault === 1
    }
  }
})

const { commentButton, panelProps: commentPanelProps } = useComment('SystemDictData')

const fetchAllData = createPaginatedFetcher(
  () => dictApi.urls.dataList(dictKey),
  'items',
  () => listParams.value
)

// 展示列信息
const dataColumns: DataTableColumns<DictDataItem> = [
  ...(selectionColumn ? [selectionColumn] : []),
  { key: 'value', title: '字典值', width: 160 },
  { key: 'label', title: '字典标签', width: 160 },
  { key: 'sort', title: '排序', width: 70, align: 'center' },
  {
    key: 'isDefault',
    title: '默认',
    width: 60,
    align: 'center',
    render(row) {
      return row.isDefault === 1
        ? h('span', { style: 'color: var(--strix-color-star); font-size: 16px' }, '★')
        : h('span', { style: 'color: var(--strix-text-tertiary)' }, '-')
    }
  },
  {
    key: 'style',
    title: '样式预览',
    width: 160,
    align: 'center',
    exportable: false,
    render(row) {
      return h(NebulaTag, { type: row.style || 'default' }, () => row.label)
    }
  },
  {
    key: 'validity',
    title: '有效期',
    width: 90,
    align: 'center',
    render(row) {
      const status = getValidityStatus(row)
      if (status === 'expired') return h(NTag, { size: 'small', type: 'error', bordered: false }, () => '已过期')
      if (status === 'not_started') return h(NTag, { size: 'small', type: 'info', bordered: false }, () => '未生效')
      if (row.validFrom || row.validTo)
        return h(NTag, { size: 'small', type: 'success', bordered: false }, () => '有效')
      return h('span', { style: 'color: var(--strix-text-tertiary)' }, '永久')
    }
  },
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
  { key: 'remark', title: '备注', width: 140, ellipsis: { tooltip: true } },
  {
    key: 'actions',
    title: '操作',
    width: 130,
    align: 'center',
    render(row) {
      return handleOperate([
        commentButton(row),
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
          disabled: isProvided.value,
          onClick: () => deleteRow(row.id),
          popconfirm: true,
          popconfirmMessage: '是否确认删除这条数据? 且该操作不可恢复!'
        }
      ])
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
const dataRef = ref<DictDataItem[]>()
const dataLoading = ref(true)

const selectedRows = computed(() => dataRef.value?.filter((row) => checkedRowKeys.value.includes(row.id)) ?? [])

const getDataList = () => {
  dataLoading.value = true
  dictApi
    .dataList(dictKey, listParams.value)
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
  loadDictInfo()
})
</script>

<style lang="scss" scoped>
.dict-sort-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 4px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--card-color);
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
}
</style>
