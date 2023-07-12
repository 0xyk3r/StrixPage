<template>
  <div>
    <n-h3 prefix="bar" align-text type="success">
      <n-text type="success">{{ _baseName }}管理</n-text>
    </n-h3>
    <strix-block style="margin-bottom: 20px" show-clear-button @clear-search="clearSearch">
      <template #show>
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen" style="margin-bottom: 15px">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input v-model:value="getDataListParams.keyword" placeholder="请输入搜索条件（名称）" clearable />
              <n-button type="primary" ghost @click="getDataList">搜索</n-button>
            </n-input-group>
          </n-gi>
          <n-gi :span="1">
            <n-button type="primary" @click="showAddDataModal()">
              添加{{ _baseName }}
            </n-button>
          </n-gi>
        </n-grid>
      </template>
    </strix-block>
    <n-data-table v-model:expanded-row-keys="dataExpandedRowKeys" :remote="true" :loading="dataLoading"
      :columns="dataColumns" :data="dataRef" :pagination="dataPagination" :row-key="dataRowKey" :cascade="false"
      :allow-checking-not-loaded="true" @load="onDataChildrenLoad" />

    <n-modal v-model:show="addDataModalShow" preset="card" :title="'添加' + _baseName" class="strix-model-primary"
      size="huge" @after-leave="initDataForm">
      <n-form ref="addDataFormRef" :model="addDataForm" :rules="addDataRules" label-placement="left" label-width="auto"
        require-mark-placement="right-hanging">
        <n-form-item label="地区名称" path="name">
          <n-input v-model:value="addDataForm.name" placeholder="请输入地区名称" clearable />
        </n-form-item>
        <n-form-item label="父级地区" path="parentId">
          <n-tree-select v-model:value="addDataForm.parentId" :options="systemRegionCascaderOptions" placeholder="选择父级地区"
            cascade clearable filterable check-strategy="all" key-field="value" />
        </n-form-item>
        <n-form-item label="备注信息" path="remarks">
          <n-input v-model:value="addDataForm.remarks" placeholder="在此输入备注信息" type="textarea" :autosize="{
            minRows: 3,
            maxRows: 5
          }" />
        </n-form-item>
      </n-form>

      <template #footer>
        <n-space class="strix-form-modal-footer">
          <n-button @click="addDataModalShow = false">取消</n-button>
          <n-button type="primary" @click="addData">确定</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="editDataModalShow" preset="card" :title="'修改' + _baseName" class="strix-model-primary"
      size="huge" @after-leave="initDataForm">
      <n-spin :show="editDataFormLoading">
        <n-form ref="editDataFormRef" :model="editDataForm" :rules="editDataRules" label-placement="left"
          label-width="auto" require-mark-placement="right-hanging">
          <n-form-item label="地区名称" path="name">
            <n-input v-model:value="editDataForm.name" placeholder="请输入地区名称" clearable />
          </n-form-item>
          <n-form-item label="父级地区" path="parentId">
            <n-tree-select v-model:value="editDataForm.parentId" :options="systemRegionCascaderOptions"
              placeholder="选择父级地区" cascade clearable filterable check-strategy="all" key-field="value" />
          </n-form-item>
          <n-form-item label="备注信息" path="remarks">
            <n-input v-model:value="editDataForm.remarks" placeholder="在此输入备注信息" type="textarea" :autosize="{
              minRows: 3,
              maxRows: 5
            }" />
          </n-form-item>
        </n-form>
      </n-spin>

      <template #footer>
        <n-space class="strix-form-modal-footer">
          <n-button @click="editDataModalShow = false">取消</n-button>
          <n-button type="primary" @click="editData">确定</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import StrixBlock from '@/components/StrixBlock.vue'
import { createPagination } from '@/plugins/pagination.js'
import { createStrixMessage } from '@/utils/strix-message'
import { handleOperate } from '@/utils/strix-table-tool.js'
import { cloneDeep, pick } from 'lodash'
import { NButton, NDataTable, NTag } from 'naive-ui'
import { getCurrentInstance, h, onMounted, ref } from 'vue'

const { proxy } = getCurrentInstance()

// 本页面操作提示关键词
const _baseName = '系统地区'

// 获取列表请求参数
const initGetDataListParams = {
  keyword: null,
  parentId: null,
  pageIndex: 1,
  pageSize: 10
}
const getDataListParams = ref(cloneDeep(initGetDataListParams))
const clearSearch = () => {
  getDataListParams.value = cloneDeep(initGetDataListParams)
  getDataList()
}
// 展示列信息
const dataColumns = [
  { key: 'name', title: '地区名称', width: 200 },
  { key: 'fullName', title: '完整地区名称', width: 320 },
  {
    key: 'level',
    title: '地区层级',
    width: 100,
    render(row) {
      const tagTypes = ['default', 'success', 'info', 'warning', 'error', 'default']
      const tagType = tagTypes[row.level] || 'default'
      const tagBordered = row.level === 6
      return h(NTag, { type: tagType, bordered: tagBordered }, {
        default: () => {
          const levels = ['一', '二', '三', '四', '五', '六']
          return levels[row.level - 1] + '级地区'
        }
      })
    }
  },
  { key: 'remarks', title: '备注信息', width: 200 },
  {
    title: '操作',
    width: 200,
    render(row) {
      return handleOperate([
        { type: 'info', label: '添加子项', icon: 'ion:add', onClick: () => showAddDataModal(row.id) },
        { type: 'warning', label: '编辑', icon: 'ion:create-outline', onClick: () => showEditDataModal(row.id) },
        {
          type: 'error',
          label: '删除',
          icon: 'ion:trash-outline',
          onClick: () => deleteData(row.id),
          popconfirm: true,
          popconfirmMessage: '是否确认删除这条数据? 该操作不可恢复!'
        }
      ])
    }
  }
]
// 分页配置
const dataPagination = createPagination(getDataListParams, () => { getDataList() })
// 加载列表
const dataRef = ref()
// 使所有数据可展开
const handleAddIsLeaf = (data) => {
  data.forEach(d => {
    d.isLeaf = false
  })
}
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  // 清除展开行
  dataExpandedRowKeys.value = []
  proxy.$http.get('system/region', { params: getDataListParams.value, operate: `加载${_baseName}列表` }).then(({ data: res }) => {
    dataLoading.value = false
    dataRef.value = res.data.systemRegionList
    dataPagination.itemCount = res.data.total
    handleAddIsLeaf(dataRef.value)
  })
}
onMounted(getDataList)
const dataRowKey = (rowData) => rowData.id
const dataExpandedRowKeys = ref([])
const onDataChildrenLoad = (row) => {
  return new Promise((resolve) => {
    proxy.$http.get(`system/region/${row.id}/children`, { operate: `加载${_baseName}子级列表` }).then(({ data: res }) => {
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
  proxy.$http.get('system/region/cascader', { operate: `加载${_baseName}下拉列表` }).then(({ data: res }) => {
    systemRegionCascaderOptions.value = res.data.options
  })
}

const initDataForm = () => {
  addDataModalShow.value = false
  editDataModalShow.value = false
  editDataFormLoading.value = false
  addDataForm.value = cloneDeep(initAddDataForm)
  editDataId = null
  editDataForm.value = cloneDeep(initEditDataForm)
}

const addDataModalShow = ref(false)
const initAddDataForm = {
  name: null,
  parentId: null,
  remarks: null
}
const addDataForm = ref(cloneDeep(initAddDataForm))
const addDataRules = {
  name: [{ required: true, message: '请输入地区名称', trigger: 'blur' }],
}
const showAddDataModal = (id) => {
  getSystemRegionSelectList()
  addDataForm.value.parentId = id || ''
  addDataModalShow.value = true
}
const addData = () => {
  proxy.$refs.addDataFormRef.validate((errors) => {
    if (errors) return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    proxy.$http.post('system/region/update', addDataForm.value, { operate: `添加${_baseName}` }).then(() => {
      initDataForm()
      getDataList()
    })
  })
}

const editDataModalShow = ref(false)
const editDataFormLoading = ref(false)
let editDataId = null
const initEditDataForm = {
  name: null,
  parentId: null,
  remarks: null
}
const editDataForm = ref(cloneDeep(initEditDataForm))
const editDataRules = {
  name: [{ required: true, message: '请输入地区名称', trigger: 'blur' }],
}
const showEditDataModal = (id) => {
  editDataModalShow.value = true
  editDataFormLoading.value = true
  getSystemRegionSelectList()
  // 加载编辑前信息
  proxy.$http.get(`system/region/${id}`, { operate: `加载${_baseName}信息` }).then(({ data: res }) => {
    editDataId = id
    const canUpdateFields = Object.keys(initEditDataForm)
    editDataForm.value = pick(res.data, canUpdateFields)
    editDataFormLoading.value = false
  })
}
const editData = () => {
  proxy.$refs.editDataFormRef.validate((errors) => {
    if (errors) return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    proxy.$http.post(`system/region/update/${editDataId}`, editDataForm.value, { operate: `修改${_baseName}` }).then(() => {
      initDataForm()
      getDataList()
    })
  })
}

const deleteData = (id) => {
  proxy.$http.post(`system/region/remove/${id}`, null, { operate: `删除${_baseName}` }).then(() => {
    getDataList()
  })
}

</script>
<script>
export default {
  name: 'SystemRegionIndex'
}
</script>

<style lang="scss" scoped></style>
