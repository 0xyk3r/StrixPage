<template>
  <div :class="{ 'nebula-column-panel-push': showColumnPanel }">
    <strix-block cleanable @clear="clearSearch">
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input v-model:value="listParams.keyword" clearable
                       placeholder="按字典标识或名称搜索" />
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
        <n-form-item label="字典状态" path="status">
          <n-select v-model:value="addForm.status" :options="commonSwitchRef" clearable
                    placeholder="请选择字典状态" />
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
import StrixBlock from '@/components/common/StrixBlock.vue'
import StrixTag from '@/components/common/StrixTag.vue'
import { dictApi } from '@/api/dict'
import { useCrud } from '@/composables/useCrud'
import { useDict } from '@/composables/useDict.ts'
import { handleOperate } from '@/utils/strix-table-tool'
import { textField, selectField, remarkField } from '@/utils/form-rules'
import { type DataTableColumns, type FormRules } from 'naive-ui'
import StrixExportDialog from '@/components/common/StrixExportDialog.vue'
import StrixColumnPanel from '@/components/common/StrixColumnPanel.vue'
import { createPaginatedFetcher } from '@/composables/useTableExport'
import { useTableColumns } from '@/composables/useTableColumns'
import StrixIcon from '@/components/icon/StrixIcon.vue'

const router = useRouter()

// 本页面操作提示关键词
const _baseName = '系统字典'
const showExportDialog = ref(false)
const fetchAllData = createPaginatedFetcher(dictApi.urls.list, 'items', () => listParams.value)

// 加载字典
const commonFlagRef = useDict('CommonFlag')
const commonSwitchRef = useDict('CommonSwitch')
const dictDataTypeRef = useDict('DictDataType')

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
  list: {
    keyword: null,
    status: null,
    provided: null,
    pageIndex: 1,
    pageSize: 10
  },
  fetchList: () => getDataList(),
  addForm: {
    key: null,
    name: null,
    dataType: 2,
    status: 1,
    remark: null
  },
  editForm: {
    key: null,
    name: null,
    dataType: null,
    status: null,
    remark: null
  },
  api: dictApi,
  draftKey: 'SystemDict'
})

// 展示列信息
const dataColumns: DataTableColumns = [
  { key: 'key', title: '字典标识', width: 240 },
  { key: 'name', title: '字典名称', width: 320 },
  { key: 'version', title: '字典版本', width: 90, align: 'center' },
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
  {
    key: 'dataType',
    title: '字典数据类型',
    width: 120,
    align: 'center',
    dictName: 'DictDataType',
    render(row: any) {
      return h(StrixTag, { value: row.dataType, dictName: 'DictDataType' })
    }
  },
  {
    key: 'provided',
    title: '是否内置',
    width: 90,
    align: 'center',
    dictName: 'CommonFlag',
    render(row: any) {
      return h(StrixTag, { value: row.provided, dictName: 'CommonFlag' })
    }
  },
  { key: 'remark', title: '备注', width: 180, titleAlign: 'center' },
  {
    key: 'actions',
    title: '操作',
    width: 180,
    align: 'center',
    render(row: any) {
      return handleOperate([
        {
          type: 'info',
          label: '查看字典数据',
          icon: 'list',
          onClick: () => viewDictData(row.key)
        },
        {
          type: 'warning',
          label: '编辑',
          icon: 'square-pen',
          disabled: row.provided === 1,
          onClick: () => showEdit(row.id)
        },
        {
          type: 'error',
          label: '删除',
          icon: 'trash',
          disabled: row.provided === 1,
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
  dictApi.list(listParams.value).then(({ data: res }) => {
    dataLoading.value = false
    dataRef.value = res.data.items
    pagination.itemCount = res.data.total
  })
}
onMounted(getDataList)

const viewDictData = (key: string) => {
  router.push({ path: `/system/dict/${key}` })
}
const formRules: FormRules = {
  key: textField('字典标识', { min: 2, max: 64 }),
  name: textField('字典名称', { min: 2, max: 32 }),
  dataType: selectField('字典数据类型'),
  status: selectField('字典状态'),
  remark: remarkField()
}
</script>

<style lang="scss" scoped></style>
