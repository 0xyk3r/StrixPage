<template>
  <div>
    <n-h3 prefix="bar" align-text type="success">
      <n-text type="success">
        {{ funName }}管理
      </n-text>
    </n-h3>
    <strix-block style="margin-bottom: 20px" show-clear-button @clear-search="clearSearch">
      <template #show>
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen" style="margin-bottom: 15px">
          <n-gi span="6 m:2 l:2">
            <n-input-group>
              <n-input v-model:value="getDataListParams.keyword" placeholder="请输入搜索条件（名称）" clearable />
              <n-button type="primary" ghost @click="getDataList">
                搜索
              </n-button>
            </n-input-group>
          </n-gi>
          <n-gi :span="1">
            <n-button type="primary" @click="showAddDataModal()">
              添加{{ funName }}
            </n-button>
          </n-gi>
        </n-grid>
        <n-alert title="注意事项" type="error">
          在已有业务数据使用过地区数据后，<b>不要修改地区的层级关系</b>，否则可能会导致业务数据地区层级结构异常。<br>
          例如将<b>一级地区A</b>中的<b>二级地区</b>移动至<b>一级地区B</b>中，或移动至其他等级地区中。
        </n-alert>
      </template>
    </strix-block>
    <n-data-table :remote="true" :loading="dataLoading" :columns="dataColumns" :data="dataData"
      :pagination="dataPagination" :row-key="dataRowKey" :cascade="false" :allow-checking-not-loaded="true"
      v-model:expanded-row-keys="dataExpandedRowKeys" @load="onDataChildrenLoad" />

    <n-modal v-model:show="addDataModalShow" preset="card" :title="'添加' + funName" class="strix-model-primary"
      size="huge">
      <n-form ref="addDataFormRef" :model="addDataForm" :rules="addDataRules" label-placement="left" label-width="auto"
        require-mark-placement="right-hanging">
        <n-form-item label="地区名称" path="name">
          <n-input v-model:value="addDataForm.name" placeholder="请输入地区名称" />
        </n-form-item>
        <n-form-item label="父级地区" path="parentId">
          <n-tree-select v-model:value="addDataForm.parentId" :options="systemRegionCascaderOptions"
            placeholder="选择父级地区" cascade clearable filterable check-strategy="all" key-field="value" />
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
          <n-button type="primary" @click="addData">
            确定
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="editDataModalShow" preset="card" :title="'修改' + funName" class="strix-model-primary"
      size="huge">
      <n-form ref="editDataFormRef" :model="editDataForm" :rules="editDataRules" label-placement="left"
        label-width="auto" require-mark-placement="right-hanging">
        <n-form-item label="地区名称" path="name">
          <n-input v-model:value="editDataForm.name" placeholder="请输入地区名称" />
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

      <template #footer>
        <n-space class="strix-form-modal-footer">
          <n-button @click="editDataModalShow = false">取消</n-button>
          <n-button type="primary" @click="editData">
            确定
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import StrixBlock from '@/components/StrixBlock.vue'
import { h, onMounted, reactive, ref } from 'vue'
import { createStrixNotify } from '@/utils/strix-notify'
import { NButton, NTag, NDataTable, NPopconfirm } from 'naive-ui'
import { Icon } from '@iconify/vue'
import useCurrentInstance from '@/utils/strix-instance-tool'
import _ from 'lodash'

const { proxy } = useCurrentInstance()

// 本页面操作提示关键词
const funName = '系统地区'

// 获取列表请求参数
const getDataListParams = ref({
  keyword: '',
  parentId: '',
  current: 1,
  size: 10
})
// 展示列信息
const dataColumns = [
  {
    key: 'name',
    title: '地区名称',
    width: 200
  }, {
    key: 'fullName',
    title: '完整地区名称',
    width: 320
  }, {
    key: 'level',
    title: '地区层级',
    width: 100,
    render(row) {
      let tagType = 'default'
      let tagBordered = false
      switch (row.level) {
        case 2:
          tagType = 'success'
          break
        case 3:
          tagType = 'info'
          break
        case 4:
          tagType = 'warning'
          break
        case 5:
          tagType = 'error'
          break
        case 6:
          tagType = 'default'
          tagBordered = true
          break
      }
      return h(NTag, {
        type: tagType,
        bordered: tagBordered
      }, {
        default: () => {
          if (row.level === 1) return '一级地区'
          else if (row.level === 2) return '二级地区'
          else if (row.level === 3) return '三级地区'
          else if (row.level === 4) return '四级地区'
          else if (row.level === 5) return '五级地区'
          else if (row.level === 6) return '六级地区'
        }
      })
    }
  }, {
    key: 'remarks',
    title: '备注信息',
    width: 200
  }, {
    title: '操作',
    width: 200,
    render(row) {
      return [
        h(NButton,
          {
            size: 'medium',
            type: 'info',
            style: 'margin-right: 10px',
            onClick: () => showAddDataModal(row.id)
          },
          () => h(Icon, { icon: 'ion:add' })
        ),
        h(NButton,
          {
            size: 'medium',
            type: 'warning',
            style: 'margin-right: 10px',
            onClick: () => showEditDataModal(row.id)
          },
          () => h(Icon, { icon: 'ion:create-outline' })
        ),
        h(NPopconfirm,
          {
            onPositiveClick: () => deleteData(row.id)
          }, {
          trigger: () => h(NButton,
            {
              size: 'medium',
              type: 'error',
              style: 'margin-right: 10px'
            },
            () => h(Icon, { icon: 'ion:trash-outline' })
          ),
          default: () => '是否确认删除这条数据? 该操作不可恢复!'
        }
        )
      ]
    }
  }
]
// 分页配置
const dataPagination = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 20, 30, 50, 100],
  prefix({ itemCount }) {
    return `共 ${itemCount} 条`
  },
  onChange: (page) => {
    dataPagination.page = page
    getDataListParams.value.current = page
    getDataList()
  },
  onUpdatePageSize: (pageSize) => {
    dataPagination.pageSize = pageSize
    dataPagination.page = 1
    getDataListParams.value.size = pageSize
    getDataListParams.value.current = 1
    getDataList()
  }
})
// 加载列表
const dataData = ref()
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
  proxy.$http.get('system/region', { params: getDataListParams.value }).then(({ data: res }) => {
    if (res.code !== 200) {
      createStrixNotify('warning', `获取${funName}列表失败`, res.msg)
    }
    dataLoading.value = false
    dataData.value = res.data.systemRegionList
    dataPagination.itemCount = res.data.total
    handleAddIsLeaf(dataData.value)
  })
}
onMounted(() => {
  getDataList()
})
const dataRowKey = (rowData) => rowData.id
const dataExpandedRowKeys = ref([])
const onDataChildrenLoad = (row) => {
  return new Promise((resolve) => {
    proxy.$http.get(`system/region/${row.id}/children`).then(({ data: res }) => {
      if (res.code !== 200) {
        createStrixNotify('warning', `加载${funName}子级列表失败`, res.msg)
      }
      const children = res.data.children
      handleAddIsLeaf(children)
      row.children = children
      resolve()
    })
  })
}
const clearSearch = () => {
  getDataListParams.value.keyword = ''
  getDataList()
}
// 加载所有地区级联选项
const systemRegionCascaderOptions = ref([])
const getSystemRegionSelectList = () => {
  proxy.$http.get('system/region/cascader').then(({ data: res }) => {
    if (res.code !== 200) {
      createStrixNotify('warning', `加载${funName}下拉列表失败`, res.msg)
    }
    systemRegionCascaderOptions.value = res.data.options
  })
}

const initDataForm = () => {
  addDataModalShow.value = false
  editDataModalShow.value = false
  addDataForm.value = {
    name: '',
    parentId: '',
    remarks: ''
  }
  editDataId = ''
  editDataForm.value = {
    name: '',
    parentId: '',
    remarks: ''
  }
}

const addDataModalShow = ref(false)
const addDataForm = ref({
  name: '',
  parentId: '',
  remarks: ''
})
const addDataRules = {
  name: [{
    required: true,
    message: '请输入地区名称'
  }]
}
const showAddDataModal = (id) => {
  getSystemRegionSelectList()
  if (id) {
    addDataForm.value.parentId = id
  }
  addDataModalShow.value = true
}
const addData = () => {
  proxy.$refs.addDataFormRef.validate((errors) => {
    if (!errors) {
      proxy.$http.post('system/region/update', addDataForm.value).then(({ data: res }) => {
        if (res.code !== 200) {
          return createStrixNotify('warning', `添加${funName}失败`, res.msg)
        }
        createStrixNotify('success', '操作成功', `添加${funName}成功`)
        initDataForm()
        getDataList()
      })
    } else {
      createStrixNotify('warning', '表单校验失败', '请检查表单中的错误提示并修改')
    }
  })
}

const editDataModalShow = ref(false)
let editDataId = ''
const editDataForm = ref({
  name: '',
  parentId: '',
  remarks: ''
})
const editDataRules = {
  name: [{
    required: true,
    message: '请输入地区名称'
  }]
}
const showEditDataModal = (id) => {
  getSystemRegionSelectList()
  // 加载编辑前信息
  proxy.$http.get(`system/region/${id}`).then(({ data: res }) => {
    if (res.code !== 200) {
      return createStrixNotify('error', `查询${funName}信息失败`, res.msg)
    }
    const canUpdateFields = []
    _.forOwn(editDataForm.value, function (value, key) {
      canUpdateFields.push(key)
    })
    editDataId = id
    editDataForm.value = _.pick(res.data, canUpdateFields)
  })
  editDataModalShow.value = true
}
const editData = () => {
  proxy.$refs.editDataFormRef.validate((errors) => {
    if (!errors) {
      proxy.$http.post(`system/region/update/${editDataId}`, editDataForm.value).then(({ data: res }) => {
        if (res.code !== 200) {
          return createStrixNotify('warning', `修改${funName}失败`, res.msg)
        }
        createStrixNotify('success', '操作成功', `修改${funName}成功`)
        initDataForm()
        getDataList()
      })
    } else {
      createStrixNotify('warning', '表单校验失败', '请检查表单中的错误提示并修改')
    }
  })
}

const deleteData = (id) => {
  proxy.$http.post(`system/region/remove/${id}`).then(({ data: res }) => {
    if (res.code !== 200) {
      return createStrixNotify('error', `删除${funName}失败`, res.msg)
    }
    createStrixNotify('success', '提示信息', `删除${funName}成功`)
    getDataList()
  })
}

</script>
<script>
export default {
  name: 'SystemRegionIndex'
}
</script>

<style lang="scss" scoped>

</style>
