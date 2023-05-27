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
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input v-model:value="getDataListParams.keyword" placeholder="按名称搜索" clearable />
              <n-button type="primary" ghost @click="getDataList">搜索</n-button>
            </n-input-group>
          </n-gi>
          <n-gi :span="1">
            <n-button type="primary" @click="showAddDataModal">
              添加{{ funName }}
            </n-button>
          </n-gi>
        </n-grid>
      </template>
      <n-form :model="getDataListParams" label-placement="left" label-width="auto" :show-feedback="false">
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-form-item-gi span="6 s:3 m:2" label="存储配置 Key" path="configKey">
            <n-select v-model:value="getDataListParams.configKey" :options="ossConfigSelectList" placeholder="请选择存储配置 Key"
              clearable @update:value="getDataList" @clear="getDataListParams.configKey = ''" />
          </n-form-item-gi>
        </n-grid>
      </n-form>
    </strix-block>

    <n-data-table :remote="true" :loading="dataLoading" :columns="dataColumns" :data="dataRef"
      :pagination="dataPagination" :row-key="dataRowKey" />

    <n-modal v-model:show="addDataModalShow" preset="card" :title="'添加' + funName" class="strix-model-primary"
      :class="isSmallWindow ? 'strix-full-modal' : ''" size="huge" @after-leave="initDataForm">
      <n-form ref="addDataFormRef" :model="addDataForm" :rules="addDataRules" label-placement="left" label-width="auto"
        require-mark-placement="right-hanging">
        <n-form-item label="存储配置 Key" path="configKey">
          <n-select v-model:value="addDataForm.configKey" :options="ossConfigSelectList" placeholder="请选择存储配置 Key"
            clearable />
        </n-form-item>
        <n-form-item label="Bucket 名称" path="name">
          <n-input v-model:value="addDataForm.name" placeholder="请输入 Bucket 名称" clearable />
        </n-form-item>
        <n-form-item label="存储类型" path="storageClass">
          <n-select v-model:value="addDataForm.storageClass" :options="storageClassOptions" placeholder="请选择存储类型"
            clearable />
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
  </div>
</template>

<script setup>
import StrixBlock from '@/components/StrixBlock.vue'
import { createPagination } from '@/plugins/pagination.js'
import { createStrixNotify } from '@/utils/strix-notify'
import { NButton, NDataTable, NTag } from 'naive-ui'
import { getCurrentInstance, h, onMounted, ref } from 'vue'

const { proxy } = getCurrentInstance()

// 本页面操作提示关键词
const funName = '存储空间'

defineProps({
  isSmallWindow: {
    type: Boolean, default: false
  }
})

// 获取列表请求参数
const getDataListParams = ref({
  keyword: '',
  configKey: null,
  pageIndex: 1,
  pageSize: 10
})
const clearSearch = () => {
  getDataListParams.value.keyword = ''
  getDataListParams.value.configKey = null
  getDataList()
}
// 展示列信息
const dataColumns = [
  { title: '存储空间名称', key: 'name', width: 250 },
  {
    title: '存储类型',
    key: 'storageClass',
    width: 100,
    render: (row) => {
      const { label, type } = storageClassOptions.find(item => item.value === row.storageClass)
      return h(NTag, { type, bordered: false }, { default: () => label })
    }
  },
  { title: '地域', key: 'region', width: 160 },
  { title: '创建时间', key: 'createTime', width: 160 }
]
// 分页配置
const dataPagination = createPagination(getDataListParams, () => { getDataList() })
// 加载列表
const dataRef = ref()
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  proxy.$http.get('system/oss/bucket', { params: getDataListParams.value, operate: `加载${funName}列表` }).then(({ data: res }) => {
    dataLoading.value = false
    dataRef.value = res.data.buckets
    dataPagination.itemCount = res.data.total
  })
}
onMounted(getDataList)
const dataRowKey = (rowData) => rowData.id

// 加载存储配置选项
const ossConfigSelectList = ref([])
const getOssConfigSelectList = () => {
  proxy.$http.get('system/oss/config/select', { operate: '加载存储配置下拉列表' }).then(({ data: res }) => {
    ossConfigSelectList.value = res.data.options
  })
}
onMounted(getOssConfigSelectList)

const storageClassOptions = [
  { value: 'Standard', label: '标准存储', type: 'success' },
  { value: 'IA', label: '低频访问存储', type: 'info' },
  { value: 'Archive', label: '归档存储', type: 'warning' },
  { value: 'ColdArchive', label: '冷归档存储', type: 'error' },
  { value: 'default', label: '未知', type: 'default' }
]

const initDataForm = () => {
  addDataModalShow.value = false
  addDataForm.value = {
    configKey: null,
    name: '',
    storageClass: null
  }
}

const addDataModalShow = ref(false)
const addDataForm = ref({
  configKey: null,
  name: '',
  storageClass: null
})
const addDataRules = {
  configKey: [
    { required: true, message: '请选择存储配置 Key', trigger: 'change' }
  ],
  name: [
    { required: true, message: '请输入 Bucket 名称', trigger: 'blur' },
    { min: 1, max: 64, message: 'Bucket 名称需在 1 - 64 字之内', trigger: 'blur' }
  ],
  storageClass: [
    { required: true, message: '请选择存储类型', trigger: 'change' }
  ]
}
const showAddDataModal = () => {
  addDataModalShow.value = true
}
const addData = () => {
  proxy.$refs.addDataFormRef.validate((errors) => {
    if (errors) return createStrixNotify('error', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    proxy.$http.post('system/oss/bucket/update', addDataForm.value, { operate: `添加${funName}` }).then(() => {
      initDataForm()
      getDataList()
    })
  })
}

</script>
<script>
export default {
  name: 'SystemModuleOssBucket'
}
</script>

<style lang="scss" scoped></style>
