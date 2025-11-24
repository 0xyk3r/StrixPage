<template>
  <div>
    <strix-block cleanable @clear="clearSearch">
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input
                v-model:value="getDataListParams.keyword"
                clearable
                placeholder="请输入搜索条件（名称）"
              />
              <n-button ghost type="primary" @click="getDataList">搜索</n-button>
            </n-input-group>
          </n-gi>
          <n-gi :span="1">
            <n-button type="primary" @click="showAddDataModal()"> 添加{{ _baseName }}</n-button>
          </n-gi>
        </n-grid>
      </template>
    </strix-block>
    <n-data-table
      v-model:expanded-row-keys="dataExpandedRowKeys"
      :allow-checking-not-loaded="true"
      :cascade="false"
      :columns="dataColumns"
      :data="dataRef"
      :loading="dataLoading"
      :pagination="dataPagination"
      :remote="true"
      :row-key="dataRowKey"
      table-layout="fixed"
      @load="onDataChildrenLoad"
    />

    <n-modal
      v-model:show="addDataModalShow"
      :title="'添加' + _baseName"
      class="strix-form-modal"
      preset="card"
      size="huge"
      @after-leave="initDataForm"
    >
      <n-form
        ref="addDataFormRef"
        :model="addDataForm"
        :rules="addDataRules"
        label-placement="left"
        label-width="auto"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="地区名称" path="name">
          <n-input v-model:value="addDataForm.name" clearable placeholder="请输入地区名称" />
        </n-form-item>
        <n-form-item label="父级地区" path="parentId">
          <n-tree-select
            v-model:value="addDataForm.parentId"
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
            v-model:value="addDataForm.remarks"
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
          <n-button @click="addDataModalShow = false">取消</n-button>
          <n-button type="primary" @click="addData">确定</n-button>
        </n-flex>
      </template>
    </n-modal>

    <n-modal
      v-model:show="editDataModalShow"
      :title="'修改' + _baseName"
      class="strix-form-modal"
      preset="card"
      size="huge"
      @after-leave="initDataForm"
    >
      <n-spin :show="editDataFormLoading">
        <n-form
          ref="editDataFormRef"
          :model="editDataForm"
          :rules="editDataRules"
          label-placement="left"
          label-width="auto"
          require-mark-placement="right-hanging"
        >
          <n-form-item label="地区名称" path="name">
            <n-input v-model:value="editDataForm.name" clearable placeholder="请输入地区名称" />
          </n-form-item>
          <n-form-item label="父级地区" path="parentId">
            <n-tree-select
              v-model:value="editDataForm.parentId"
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
              v-model:value="editDataForm.remarks"
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
          <n-button @click="editDataModalShow = false">取消</n-button>
          <n-button type="primary" @click="editData">确定</n-button>
        </n-flex>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import type { NTagType } from '@/@types/naive-ui'
import StrixBlock from '@/components/StrixBlock.vue'
import { http } from '@/plugins/axios'
import { usePage } from '@/utils/common-page-util'
import { createStrixMessage } from '@/utils/strix-message'
import { handleOperate } from '@/utils/strix-table-tool'
import { pick } from 'lodash'
import { type DataTableColumns, type FormRules, NTag } from 'naive-ui'

// 本页面操作提示关键词
const _baseName = '系统地区'

const {
  getDataListParams,
  clearSearch,
  dataPagination,
  dataRowKey,
  addDataModalShow,
  addDataForm,
  addDataFormRef,
  editDataModalShow,
  editDataFormLoading,
  editDataId,
  initEditDataForm,
  editDataForm,
  editDataFormRef,
  initDataForm
} = usePage(
  {
    keyword: null,
    parentId: null,
    pageIndex: 1,
    pageSize: 10
  },
  () => {
    getDataList()
  },
  {
    name: null,
    parentId: null,
    remarks: null
  },
  {
    name: null,
    parentId: null,
    remarks: null
  }
)

// 展示列信息
const dataColumns: DataTableColumns = [
  { key: 'name', title: '地区名称', width: 240 },
  { key: 'fullName', title: '完整地区名称', width: 360 },
  {
    key: 'level',
    title: '地区层级',
    width: 140,
    align: 'center',
    render(row: any) {
      const tagTypes = ['default', 'success', 'info', 'warning', 'error', 'default']
      const tagType: NTagType = (tagTypes[row.level] as NTagType) || 'default'
      const tagBordered = row.level === 6
      return h(
        NTag,
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
  { key: 'remarks', title: '备注信息', width: 240 },
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
          onClick: () => showAddDataModal(row.id)
        },
        {
          type: 'warning',
          label: '编辑',
          icon: 'square-pen',
          onClick: () => showEditDataModal(row.id)
        },
        {
          type: 'error',
          label: '删除',
          icon: 'trash',
          onClick: () => deleteData(row.id),
          popconfirm: true,
          popconfirmMessage: '是否确认删除这条数据? 该操作不可恢复!'
        }
      ])
    }
  }
]
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
  http
    .get('system/region', {
      params: getDataListParams.value,
      meta: { operate: `加载${_baseName}列表` }
    })
    .then(({ data: res }) => {
      dataLoading.value = false
      dataRef.value = res.data.systemRegionList
      dataPagination.itemCount = res.data.total
      handleAddIsLeaf(dataRef.value)
    })
}
onMounted(getDataList)
const dataExpandedRowKeys = ref([])
const onDataChildrenLoad = (row: any) => {
  return new Promise<void>((resolve) => {
    http
      .get(`system/region/${row.id}/children`, { meta: { operate: `加载${_baseName}子级列表` } })
      .then(({ data: res }) => {
        const children = res.data.children
        handleAddIsLeaf(children)
        row.children = children
        row.isLeaf = row.children.length === 0
        resolve()
      })
  })
}

// 加载所有地区级联选项
const systemRegionCascaderOptions = ref([])
const getSystemRegionSelectList = () => {
  http
    .get('system/region/cascader', { meta: { operate: `加载${_baseName}下拉列表` } })
    .then(({ data: res }) => {
      systemRegionCascaderOptions.value = res.data.options
    })
}

const addDataRules: FormRules = {
  name: [{ required: true, message: '请输入地区名称', trigger: 'blur' }]
}
const showAddDataModal = (id?: string) => {
  getSystemRegionSelectList()
  addDataForm.value.parentId = id || ''
  addDataModalShow.value = true
}
const addData = () => {
  addDataFormRef.value?.validate((errors) => {
    if (errors)
      return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    http
      .post('system/region/update', addDataForm.value, { meta: { operate: `添加${_baseName}` } })
      .then(() => {
        initDataForm()
        getDataList()
      })
  })
}

const editDataRules: FormRules = {
  name: [{ required: true, message: '请输入地区名称', trigger: 'blur' }]
}
const showEditDataModal = (id: string) => {
  editDataModalShow.value = true
  editDataFormLoading.value = true
  getSystemRegionSelectList()
  // 加载编辑前信息
  http
    .get(`system/region/${id}`, { meta: { operate: `加载${_baseName}信息` } })
    .then(({ data: res }) => {
      editDataId.value = id
      const canUpdateFields = Object.keys(initEditDataForm)
      editDataForm.value = pick(res.data, canUpdateFields)
      editDataFormLoading.value = false
    })
}
const editData = () => {
  editDataFormRef.value?.validate((errors) => {
    if (errors)
      return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    http
      .post(`system/region/update/${editDataId.value}`, editDataForm.value, {
        meta: { operate: `修改${_baseName}` }
      })
      .then(() => {
        initDataForm()
        getDataList()
      })
  })
}

const deleteData = (id: string) => {
  http
    .post(`system/region/remove/${id}`, null, { meta: { operate: `删除${_baseName}` } })
    .then(() => {
      getDataList()
    })
}
</script>

<style lang="scss" scoped></style>
