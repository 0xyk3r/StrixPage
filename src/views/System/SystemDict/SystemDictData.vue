<template>
  <div :class="{ 'nebula-column-panel-push': showColumnPanel }">
    <strix-block cleanable @clear="clearSearch">
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input v-model:value="listParams.keyword" clearable placeholder="按名称搜索" />
              <n-button ghost type="primary" @click="getDataList">搜索</n-button>
            </n-input-group>
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
      <n-form :model="listParams" :show-feedback="false" label-placement="left" label-width="auto">
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-form-item-gi label="字典状态" path="status" span="6 s:3 m:2">
            <n-select
              v-model:value="listParams.status"
              :options="commonSwitchRef"
              clearable
              placeholder="请选择字典数据状态"
              @update:value="getDataList"
            />
          </n-form-item-gi>
        </n-grid>
      </n-form>
    </strix-block>

    <n-data-table
      :columns="visibleColumns"
      :data="dataRef"
      :loading="dataLoading"
      :pagination="pagination"
      :remote="true"
      :row-key="rowKey"
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
          <n-select v-model:value="addForm.style" :options="dictDataStyleRef" clearable placeholder="请选择字典样式" />
        </n-form-item>
        <n-form-item label="字典状态" path="status">
          <n-select v-model:value="addForm.status" :options="commonSwitchRef" clearable placeholder="请选择字典状态" />
        </n-form-item>
        <n-form-item label="备注信息" path="remark">
          <n-input
            v-model:value="addForm.remark"
            :autosize="{
              minRows: 3,
              maxRows: 5
            }"
            placeholder="在此输入备注信息"
            type="textarea"
          />
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
            <n-input v-model:value="editForm.value" clearable placeholder="请输入字典值" />
          </n-form-item>
          <n-form-item label="字典标签" path="label">
            <n-input v-model:value="editForm.label" clearable placeholder="请输入字典标签" />
          </n-form-item>
          <n-form-item label="字典排序" path="sort">
            <n-input-number v-model:value="editForm.sort" clearable placeholder="请输入字典排序" />
          </n-form-item>
          <n-form-item label="字典样式" path="style">
            <n-select
              v-model:value="editForm.style"
              :options="dictDataStyleRef"
              clearable
              placeholder="请选择字典样式"
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
              :autosize="{
                minRows: 3,
                maxRows: 5
              }"
              placeholder="在此输入备注信息"
              type="textarea"
            />
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
import NebulaTag from '@/components/common/NebulaTag.vue'
import StrixBlock from '@/components/common/StrixBlock.vue'
import StrixTag from '@/components/common/StrixTag.vue'
import { dictApi } from '@/api/dict'
import { useCrud } from '@/composables/useCrud'
import { useDict } from '@/composables/useDict.ts'
import { handleOperate } from '@/utils/strix-table-tool'
import { remarkField, selectField, textField } from '@/utils/form-rules'
import { type DataTableColumns, type FormRules } from 'naive-ui'
import StrixColumnPanel from '@/components/common/StrixColumnPanel.vue'
import StrixExportDialog from '@/components/common/StrixExportDialog.vue'
import { createPaginatedFetcher } from '@/composables/useTableExport'
import { useTableColumns } from '@/composables/useTableColumns'
import StrixIcon from '@/components/icon/StrixIcon.vue'

const route = useRoute()

// 本页面操作提示关键词
const _baseName = '系统字典数据'
const showExportDialog = ref(false)

// 路由参数
const dictKey = route.params.dictKey as string

// 加载字典
const dictDataStyleRef = useDict('DictDataStyle')
const commonSwitchRef = useDict('CommonSwitch')

const {
  listParams,
  clearSearch,
  pagination,
  rowKey,
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
  tryCloseEdit
} = useCrud({
  list: { pageIndex: 1, pageSize: 10 },
  fetchList: () => getDataList(),
  addForm: { key: null, value: null, label: null, sort: null, style: '', status: 1, remark: null },
  editForm: {
    key: null,
    value: null,
    label: null,
    sort: null,
    style: '',
    status: null,
    remark: null
  },
  api: {
    detail: (id: string) => dictApi.dataDetail(dictKey, id),
    create: (data: any) => dictApi.dataCreate(dictKey, data),
    update: (id: string, data: any) => dictApi.dataUpdate(dictKey, id, data),
    remove: (id: string) => dictApi.dataRemove(dictKey, id)
  },
  draftKey: 'SystemDictData'
})

const fetchAllData = createPaginatedFetcher(
  () => dictApi.urls.dataList(dictKey),
  'items',
  () => listParams.value
)

// 展示列信息
const dataColumns: DataTableColumns = [
  { key: 'value', title: '字典值', width: 240 },
  { key: 'label', title: '字典标签', width: 240 },
  { key: 'sort', title: '字典排序', width: 90, align: 'center' },
  {
    key: 'style',
    title: '字典样式预览',
    width: 240,
    align: 'center',
    exportable: false,
    render(row: any) {
      return h(NebulaTag, { type: row.style || 'default' }, () => row.label)
    }
  },
  {
    key: 'status',
    title: '字典状态',
    width: 90,
    align: 'center',
    dictName: 'CommonSwitch',
    render(row: any) {
      return h(StrixTag, { value: row.status, dictName: 'CommonSwitch' })
    }
  },
  { key: 'remark', title: '备注', width: 180 },
  {
    key: 'actions',
    title: '操作',
    width: 130,
    align: 'center',
    render(row: any) {
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
          popconfirmMessage: '是否确认删除这条数据? 且该操作不可恢复!'
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
  dictApi.dataList(dictKey, listParams.value).then(({ data: res }) => {
    dataLoading.value = false
    dataRef.value = res.data.items
    pagination.itemCount = res.data.total
  })
}
onMounted(getDataList)

const formRules: FormRules = {
  key: textField('字典标识', { min: 2, max: 64 }),
  value: textField('字典值', { min: 1, max: 64 }),
  label: textField('字典标签', { min: 1, max: 64 }),
  sort: selectField('字典排序值'),
  style: textField('字典样式', { required: false, max: 32 }),
  status: selectField('字典状态'),
  remark: remarkField()
}
</script>

<style lang="scss" scoped></style>
