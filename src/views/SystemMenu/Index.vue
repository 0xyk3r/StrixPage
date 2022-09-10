<template>
  <div>
    <n-h3 prefix="bar" align-text type="success">
      <n-text type="success">
        {{ funName }}管理
      </n-text>
    </n-h3>
    <strix-block style="margin-bottom: 20px">
      <template #show>
        <n-grid :cols="6" style="margin-bottom: 15px">
          <n-gi :span="1">
            <n-button type="primary" @click="showAddDataModal()">
              添加{{ funName }}
            </n-button>
          </n-gi>
        </n-grid>
        <n-alert title="提醒" type="warning">
          Strix 理论支持无限级别的菜单， 但是仍不建议配置超过 3 级的菜单。
        </n-alert>
      </template>
    </strix-block>

    <n-data-table :remote="true" :loading="dataLoading" :columns="dataColumns" :data="dataData"
      :pagination="dataPagination" :row-key="dataRowKey" :cascade="false" :allow-checking-not-loaded="true" />

    <n-modal v-model:show="addDataModalShow" preset="card" :title="'添加' + funName" class="strix-model-primary"
      :class="isSmallWindow ? 'strix-full-modal':''" size="huge" @after-leave="initDataForm">
      <n-form ref="addDataFormRef" :model="addDataForm" :rules="addDataRules" label-placement="left" label-width="auto"
        require-mark-placement="right-hanging">
        <n-grid :cols="2" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
          <n-form-item-gi span="2 s:1" label="菜单名称" path="name">
            <n-input v-model:value="addDataForm.name" placeholder="请输入菜单名称" clearable />
          </n-form-item-gi>
          <n-form-item-gi span="2 s:1" label="父级地区" path="parentId">
            <n-tree-select v-model:value="addDataForm.parentId" :options="dataData" placeholder="选择父级地区" cascade
              clearable filterable check-strategy="all" key-field="id" label-field="name" />
          </n-form-item-gi>
          <n-form-item-gi span="2 s:2" label="菜单路由" path="url">
            <n-input v-model:value="addDataForm.url" placeholder="请输入菜单路由" clearable />
          </n-form-item-gi>
          <n-form-item-gi span="2 s:1" label="菜单图标" path="icon">
            <n-input v-model:value="addDataForm.icon" placeholder="请输入菜单图标" clearable />
          </n-form-item-gi>
          <n-form-item-gi span="2 s:1" label="菜单排序" path="sortValue">
            <n-input-number v-model:value="addDataForm.sortValue" placeholder="请输入菜单排序" clearable />
          </n-form-item-gi>
        </n-grid>
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
      :class="isSmallWindow ? 'strix-full-modal':''" size="huge" @after-leave="initDataForm">
      <n-spin :show="editDataFormLoading">
        <n-form ref="editDataFormRef" :model="editDataForm" :rules="editDataRules" label-placement="left"
          label-width="auto" require-mark-placement="right-hanging">
          <n-grid :cols="2" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
            <n-form-item-gi span="2 s:1" label="菜单名称" path="name">
              <n-input v-model:value="editDataForm.name" placeholder="请输入菜单名称" clearable />
            </n-form-item-gi>
            <n-form-item-gi span="2 s:1" label="父级地区" path="parentId">
              <n-tree-select v-model:value="editDataForm.parentId" :options="dataData" placeholder="选择父级地区" cascade
                clearable filterable check-strategy="all" key-field="id" label-field="name" />
            </n-form-item-gi>
            <n-form-item-gi span="2 s:2" label="菜单路由" path="url">
              <n-input v-model:value="editDataForm.url" placeholder="请输入菜单路由" clearable />
            </n-form-item-gi>
            <n-form-item-gi span="2 s:1" label="菜单图标" path="icon">
              <n-input v-model:value="editDataForm.icon" placeholder="请输入菜单图标" clearable />
            </n-form-item-gi>
            <n-form-item-gi span="2 s:1" label="菜单排序" path="sortValue">
              <n-input-number v-model:value="editDataForm.sortValue" placeholder="请输入菜单排序" clearable />
            </n-form-item-gi>
          </n-grid>
        </n-form>
      </n-spin>

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
import useCurrentInstance from '@/utils/strix-instance-tool'
import { createStrixNotify } from '@/utils/strix-notify'
import { Icon } from '@iconify/vue'
import { forOwn, kebabCase, pick } from 'lodash'
import { NButton, NDataTable, NPopconfirm } from 'naive-ui'
import { h, onMounted, reactive, ref } from 'vue'

const { proxy } = useCurrentInstance()

// 本页面操作提示关键词
const funName = '系统菜单'

defineProps({
  isSmallWindow: {
    type: Boolean, default: false
  }
})

// 获取列表请求参数
const getDataListParams = ref({
  current: 1,
  size: 10
})
// 展示列信息
const dataColumns = [
  {
    key: 'name',
    title: '菜单名称',
    width: 200
  }, {
    key: 'url',
    title: '菜单路由',
    width: 320
  }, {
    key: 'icon',
    title: '菜单图标',
    align: 'center',
    width: 90,
    render(row) {
      return h(Icon, { icon: 'ion:' + kebabCase(row.icon), width: 24 })
    }
  }, {
    key: 'sortValue',
    title: '菜单排序',
    width: 90
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
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  proxy.$http.get('system/menu', { params: getDataListParams.value }).then(({ data: res }) => {
    if (res.code !== 200) {
      createStrixNotify('warning', `获取${funName}列表失败`, res.msg)
    }
    dataLoading.value = false
    dataData.value = res.data.systemMenuList
    dataPagination.itemCount = res.data.total
  })
}
onMounted(() => {
  getDataList()
})
const dataRowKey = (rowData) => rowData.id

const initDataForm = () => {
  addDataModalShow.value = false
  editDataModalShow.value = false
  editDataFormLoading.value = false
  addDataForm.value = {
    name: '',
    url: '/',
    icon: '',
    parentId: '',
    sortValue: 0
  }
  editDataId = ''
  editDataForm.value = {
    name: '',
    url: '',
    icon: '',
    parentId: '',
    sortValue: 0
  }
}

const addDataModalShow = ref(false)
const addDataForm = ref({
  name: '',
  url: '/',
  icon: '',
  parentId: '',
  sortValue: 0
})
const addDataRules = {
  name: [{
    required: true,
    message: '请输入菜单名称'
  }],
  url: [{
    required: true,
    message: '请输入菜单路由'
  }],
  sortValue: [{
    validator(rule, value) {
      if (!value || value < 0 || value > 99999) {
        return new Error('请输入菜单排序 (1-99999)')
      }
      return true
    }
  }]
}
const showAddDataModal = (id) => {
  if (id) {
    addDataForm.value.parentId = id
  }
  addDataModalShow.value = true
}
const addData = () => {
  proxy.$refs.addDataFormRef.validate((errors) => {
    if (!errors) {
      proxy.$http.post('system/menu/update', addDataForm.value).then(({ data: res }) => {
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
const editDataFormLoading = ref(false)
let editDataId = ''
const editDataForm = ref({
  name: '',
  url: '',
  parentId: '',
  sortValue: 0
})
const editDataRules = {
  name: [{
    required: true,
    message: '请输入菜单名称'
  }],
  url: [{
    required: true,
    message: '请输入菜单路由'
  }],
  sortValue: [{
    trigger: 'change',
    validator(rule, value) {
      console.log(value)
      if (!value || value < 0 || value > 99999) {
        return new Error('请输入菜单排序 (1-99999)')
      }
      return true
    }
  }]
}
const showEditDataModal = (id) => {
  editDataModalShow.value = true
  editDataFormLoading.value = true
  // 加载编辑前信息
  proxy.$http.get(`system/menu/${id}`).then(({ data: res }) => {
    if (res.code !== 200) {
      return createStrixNotify('error', `查询${funName}信息失败`, res.msg)
    }
    const canUpdateFields = []
    forOwn(editDataForm.value, function (value, key) {
      canUpdateFields.push(key)
    })
    editDataId = id
    editDataForm.value = pick(res.data, canUpdateFields)
    editDataFormLoading.value = false
  })
}
const editData = () => {
  proxy.$refs.editDataFormRef.validate((errors) => {
    if (!errors) {
      proxy.$http.post(`system/menu/update/${editDataId}`, editDataForm.value).then(({ data: res }) => {
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
  proxy.$http.post(`system/menu/remove/${id}`).then(({ data: res }) => {
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
  name: 'SystemMenuIndex'
}
</script>

<style lang="scss" scoped>

</style>
