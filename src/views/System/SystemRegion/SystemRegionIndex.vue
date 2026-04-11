<template>
  <div :class="{ 'nebula-column-panel-push': showColumnPanel }">
    <strix-block cleanable @clear="clearSearch">
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input v-model:value="listParams.keyword" clearable placeholder="请输入搜索条件（名称）" />
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
    </strix-block>
    <n-data-table
      v-model:expanded-row-keys="dataExpandedRowKeys"
      :allow-checking-not-loaded="true"
      :cascade="false"
      :columns="visibleColumns"
      :data="dataRef"
      :loading="dataLoading"
      :pagination="pagination"
      :remote="true"
      :row-key="rowKey"
      table-layout="fixed"
      @load="onDataChildrenLoad"
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
        <n-form-item label="地区名称" path="name">
          <n-input v-model:value="addForm.name" clearable placeholder="请输入地区名称" />
        </n-form-item>
        <n-form-item label="父级地区" path="parentId">
          <n-tree-select
            v-model:value="addForm.parentId"
            :options="systemRegionCascaderOptions"
            cascade
            clearable
            filterable
            key-field="value"
            placeholder="选择父级地区"
          />
        </n-form-item>
        <n-form-item label="备注信息" path="remarks">
          <n-input
            v-model:value="addForm.remarks"
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
          <n-button type="primary" @click="submitAdd">确定</n-button>
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
          <n-form-item label="地区名称" path="name">
            <n-input v-model:value="editForm.name" clearable placeholder="请输入地区名称" />
          </n-form-item>
          <n-form-item label="父级地区" path="parentId">
            <n-tree-select
              v-model:value="editForm.parentId"
              :options="systemRegionCascaderOptions"
              cascade
              clearable
              filterable
              key-field="value"
              placeholder="选择父级地区"
            />
          </n-form-item>
          <n-form-item label="备注信息" path="remarks">
            <n-input
              v-model:value="editForm.remarks"
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
          <n-button type="primary" @click="submitEdit">确定</n-button>
        </n-flex>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import type { NTagType } from '@/@types/naive-ui'
import NebulaTag from '@/components/common/NebulaTag.vue'
import StrixBlock from '@/components/common/StrixBlock.vue'
import { regionApi } from '@/api/region'
import type { CascaderDataItem } from '@/api/types'
import { useCrud } from '@/composables/useCrud'
import { handleOperate } from '@/utils/strix-table-tool'
import { textField } from '@/utils/form-rules'
import { type DataTableColumns, type FormRules } from 'naive-ui'
import StrixExportDialog from '@/components/common/StrixExportDialog.vue'
import StrixColumnPanel from '@/components/common/StrixColumnPanel.vue'
import { createPaginatedFetcher } from '@/composables/useTableExport'
import { useTableColumns } from '@/composables/useTableColumns'
import StrixIcon from '@/components/icon/StrixIcon.vue'

// 本页面操作提示关键词
const _baseName = '系统地区'
const showExportDialog = ref(false)

// 加载所有地区级联选项
const systemRegionCascaderOptions = ref<CascaderDataItem[]>([])
const getSystemRegionSelectList = () => {
  regionApi.cascader().then(({ data: res }) => {
    systemRegionCascaderOptions.value = res.data.options
  })
}

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
  list: { keyword: null, parentId: null, pageIndex: 1, pageSize: 10 },
  fetchList: () => getDataList(),
  addForm: { name: null, parentId: null, remarks: null },
  editForm: { name: null, parentId: null, remarks: null },
  api: regionApi,
  hooks: {
    beforeShowAdd: () => getSystemRegionSelectList(),
    beforeShowEdit: () => getSystemRegionSelectList()
  },
  draftKey: 'SystemRegion'
})

const fetchAllData = createPaginatedFetcher(regionApi.urls.list, 'systemRegionList', () => listParams.value)

// 展示列信息
const dataColumns: DataTableColumns = [
  { key: 'name', title: '地区名称', width: 180 },
  { key: 'fullName', title: '完整地区名称', width: 320 },
  {
    key: 'level',
    title: '地区层级',
    width: 140,
    align: 'center',
    valueMap: {
      '1': '一级地区',
      '2': '二级地区',
      '3': '三级地区',
      '4': '四级地区',
      '5': '五级地区',
      '6': '六级地区'
    },
    render(row: any) {
      const tagTypes = ['default', 'success', 'info', 'warning', 'error', 'default']
      const tagType: NTagType = (tagTypes[row.level] as NTagType) || 'default'
      const tagBordered = row.level === 6
      return h(
        NebulaTag,
        { type: tagType, bordered: tagBordered },
        {
          default: () => {
            const levels = ['一', '二', '三', '四', '五', '六']
            return levels[row.level - 1] + '级地区'
          }
        }
      )
    }
  },
  { key: 'remarks', title: '备注信息', width: 180 },
  {
    key: 'actions',
    title: '操作',
    width: 180,
    align: 'center',
    render(row: any) {
      return handleOperate([
        {
          type: 'info',
          label: '添加子项',
          icon: 'plus',
          onClick: () => showAdd({ parentId: row.id || '' })
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
// 使所有数据可展开
const handleAddIsLeaf = (data: any[]) => {
  data.forEach((d) => {
    d.isLeaf = false
  })
}
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  // 清除展开行
  dataExpandedRowKeys.value = []
  regionApi.list(listParams.value).then(({ data: res }) => {
    dataLoading.value = false
    dataRef.value = res.data.systemRegionList
    pagination.itemCount = res.data.total
    handleAddIsLeaf(dataRef.value)
  })
}
onMounted(getDataList)
const dataExpandedRowKeys = ref<string[]>([])
const onDataChildrenLoad = (row: any) => {
  return new Promise<void>((resolve) => {
    regionApi.children(row.id).then(({ data: res }) => {
      const children = res.data.children
      handleAddIsLeaf(children)
      row.children = children
      row.isLeaf = row.children.length === 0
      resolve()
    })
  })
}

const formRules: FormRules = {
  name: textField('地区名称')
}
</script>

<style lang="scss" scoped></style>
