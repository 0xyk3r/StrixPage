<template>
  <div>
    <n-h3 prefix="bar" align-text type="success">
      <n-text type="success">
        {{ _baseName }}管理
      </n-text>
    </n-h3>
    <strix-block style="margin-bottom: 20px" show-clear-button @clear-search="clearSearch">
      <template #show>
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen" style="margin-bottom: 15px">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input v-model:value="getDataListParams.keyword" placeholder="请输入搜索条件（任务名称）" clearable />
              <n-button type="primary" ghost @click="getDataList">
                搜索
              </n-button>
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

    <n-data-table :loading="dataLoading" :columns="dataColumns" :data="dataRef" :row-key="dataRowKey"
      :pagination="dataPagination" />

    <n-modal v-model:show="addDataModalShow" preset="card" :title="'添加' + _baseName" class="strix-model-primary"
      size="huge" @after-leave="initDataForm">
      <n-form ref="addDataFormRef" :model="addDataForm" :rules="addDataRules" label-placement="left" label-width="auto"
        require-mark-placement="right-hanging">
        <n-form-item label="任务名称" path="name">
          <n-input v-model:value="addDataForm.name" placeholder="请输入任务名称" clearable />
        </n-form-item>
        <n-form-item label="调用目标" path="invokeTarget">
          <n-popover trigger="focus" placement="bottom-start">
            <template #trigger>
              <n-input v-model:value="addDataForm.invokeTarget" placeholder="请输入调用目标" clearable />
            </template>
            <p>请输入 组件名称.方法名称() 或 组件名称.方法名称(...参数列表)</p>
            <p>其中组件名称为 @Component 注解的值，参数列表可选、数量不限</p>
            <p>strixTestJob.testSomething() 或 strixTestJob.testParams('abc', 1, 1.21D, 22222L, true)</p>
            <p>为了系统安全考虑，所有定时任务调用目标类需使用 @StrixJob 注解，否则无法添加和调用。</p>
          </n-popover>
        </n-form-item>
        <n-form-item label="Cron 表达式" path="cronExpression">
          <n-input v-model:value="addDataForm.cronExpression" placeholder="请输入 Cron 表达式" clearable />
        </n-form-item>
        <n-form-item label="计划错误策略" path="misfirePolicy">
          <n-select v-model:value="addDataForm.misfirePolicy" :options="jobMisfireRef" placeholder="请选择计划错误策略"
            clearable />
        </n-form-item>
        <n-form-item label="是否并发执行" path="concurrent">
          <n-select v-model:value="addDataForm.concurrent" :options="commonSwitchRef" placeholder="请选择是否并发执行" clearable />
        </n-form-item>
        <n-form-item label="任务状态" path="status">
          <n-select v-model:value="addDataForm.status" :options="jobStatusRef" placeholder="请选择任务状态" clearable />
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

    <n-modal v-model:show="editDataModalShow" preset="card" :title="'修改' + _baseName" class="strix-model-primary"
      size="huge" @after-leave="initDataForm">
      <n-spin :show="editDataFormLoading">
        <n-form ref="editDataFormRef" :model="editDataForm" :rules="editDataRules" label-placement="left"
          label-width="auto" require-mark-placement="right-hanging">
          <n-form-item label="任务名称" path="name">
            <n-input v-model:value="editDataForm.name" placeholder="请输入任务名称" clearable />
          </n-form-item>
          <n-form-item label="调用目标" path="invokeTarget">
            <n-input v-model:value="editDataForm.invokeTarget" placeholder="请输入调用目标" clearable />
          </n-form-item>
          <n-form-item label="Cron 表达式" path="cronExpression">
            <n-input v-model:value="editDataForm.cronExpression" placeholder="请输入 Cron 表达式" clearable />
          </n-form-item>
          <n-form-item label="计划错误策略" path="misfirePolicy">
            <n-select v-model:value="editDataForm.misfirePolicy" :options="jobMisfireRef" placeholder="请选择计划错误策略"
              clearable />
          </n-form-item>
          <n-form-item label="是否并发执行" path="concurrent">
            <n-select v-model:value="editDataForm.concurrent" :options="commonSwitchRef" placeholder="请选择是否并发执行"
              clearable />
          </n-form-item>
          <n-form-item label="任务状态" path="status">
            <n-select v-model:value="editDataForm.status" :options="jobStatusRef" placeholder="请选择任务状态" clearable />
          </n-form-item>
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
import StrixTag from '@/components/StrixTag.vue'
import { createPagination } from '@/plugins/pagination.js'
import { useDictsStore } from '@/stores/dicts'
import { createStrixMessage } from '@/utils/strix-message'
import { handleOperate } from '@/utils/strix-table-tool'
import _, { cloneDeep } from 'lodash'
import { NButton, NDataTable, NGi, NGrid, NSpace, NSpin } from 'naive-ui'
import { getCurrentInstance, h, onMounted, provide, ref } from 'vue'

const { proxy } = getCurrentInstance()
const dictsStore = useDictsStore()

// 本页面操作提示关键词
const _baseName = '定时任务'

// 加载字典
const commonSwitchRef = ref([])
const jobMisfireRef = ref([])
const jobStatusRef = ref([])
provide('CommonSwitchDict', commonSwitchRef)
provide('JobMisfireDict', jobMisfireRef)
provide('JobStatusDict', jobStatusRef)
onMounted(() => {
  dictsStore.getDictData('CommonSwitch', commonSwitchRef)
  dictsStore.getDictData('JobMisfire', jobMisfireRef)
  dictsStore.getDictData('JobStatus', jobStatusRef)
})

// 获取列表请求参数
const initGetDataListParams = {
  keyword: null,
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
  { key: 'name', width: 150, title: '任务名称' },
  { key: 'invokeTarget', width: 240, title: '调用目标' },
  { key: 'cronExpression', width: 100, title: 'Cron 表达式' },
  {
    key: 'misfirePolicy',
    width: 100,
    title: '错过执行策略',
    render(row) {
      return h(StrixTag, { value: row.misfirePolicy, dictName: 'JobMisfire' })
    }
  },
  {
    key: 'concurrent',
    width: 100,
    title: '并发执行',
    render(row) {
      return h(StrixTag, { value: row.concurrent, dictName: 'CommonSwitch' })
    }
  },
  {
    key: 'status',
    width: 100,
    title: '状态',
    render(row) {
      return h(StrixTag, { value: row.status, dictName: 'JobStatus' })
    }
  },
  {
    title: '操作',
    width: 240,
    render(row) {
      return handleOperate([
        { type: 'info', label: '运行一次', icon: 'ion:play-outline', onClick: () => runJob(row.id) },
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
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  proxy.$http.get('system/job', { params: getDataListParams.value, operate: `加载${_baseName}列表` }).then(({ data: res }) => {
    dataLoading.value = false
    dataRef.value = res.data.items
  })
}
onMounted(getDataList)

const dataRowKey = (rowData) => rowData.id

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
  group: 'DEFAULT',
  invokeTarget: null,
  cronExpression: null,
  misfirePolicy: null,
  concurrent: null,
  status: null
}
const addDataForm = ref(cloneDeep(initAddDataForm))
const addDataRules = {
  name: [
    { required: true, message: '请输入任务名称', trigger: 'blur' },
    { min: 2, max: 64, message: '任务名称长度需在 2 - 64 字之内', trigger: 'blur' }
  ],
  invokeTarget: [
    { required: true, message: '请输入调用目标', trigger: 'blur' },
    { min: 5, max: 512, message: '调用目标需在 5 - 512 字之内', trigger: 'blur' }
  ],
  cronExpression: [
    { required: true, message: '请输入 Cron 表达式', trigger: 'blur' },
    { min: 5, max: 128, message: 'Cron 表达式 长度需在 5 - 128 字之内', trigger: 'blur' }
  ],
  misfirePolicy: [
    { type: 'number', required: true, message: '请选择计划错误策略', trigger: 'change' }
  ],
  concurrent: [
    { type: 'number', required: true, message: '请选择是否并发执行', trigger: 'change' }
  ],
  status: [
    { type: 'number', required: true, message: '请选择任务状态', trigger: 'change' }
  ]
}
const showAddDataModal = () => {
  addDataModalShow.value = true
}
const addData = () => {
  proxy.$refs.addDataFormRef.validate((errors) => {
    if (errors) return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    proxy.$http.post('system/job/update', addDataForm.value, { operate: `添加${_baseName}` }).then(() => {
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
  group: 'DEFAULT',
  invokeTarget: null,
  cronExpression: null,
  misfirePolicy: null,
  concurrent: null,
  status: null
}
const editDataForm = ref(cloneDeep(initEditDataForm))
const editDataRules = {
  name: [
    { required: true, message: '请输入任务名称', trigger: 'blur' },
    { min: 2, max: 64, message: '任务名称长度需在 2 - 64 字之内', trigger: 'blur' }
  ],
  invokeTarget: [
    { required: true, message: '请输入调用目标', trigger: 'blur' },
    { min: 5, max: 512, message: '调用目标需在 5 - 512 字之内', trigger: 'blur' }
  ],
  cronExpression: [
    { required: true, message: '请输入 Cron 表达式', trigger: 'blur' },
    { min: 5, max: 128, message: 'Cron 表达式 长度需在 5 - 128 字之内', trigger: 'blur' }
  ],
  misfirePolicy: [
    { type: 'number', required: true, message: '请选择计划错误策略', trigger: 'change' }
  ],
  concurrent: [
    { type: 'number', required: true, message: '请选择是否并发执行', trigger: 'change' }
  ],
  status: [
    { type: 'number', required: true, message: '请选择任务状态', trigger: 'change' }
  ]
}
const showEditDataModal = (id) => {
  editDataModalShow.value = true
  editDataFormLoading.value = true
  // 加载编辑前信息
  proxy.$http.get(`system/job/${id}`, { operate: `加载${_baseName}信息` }).then(({ data: res }) => {
    editDataId = id
    const canUpdateFields = Object.keys(initEditDataForm)
    editDataForm.value = _.pick(res.data, canUpdateFields)
    editDataFormLoading.value = false
  })
}
const editData = () => {
  proxy.$refs.editDataFormRef.validate((errors) => {
    if (errors) return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    proxy.$http.post(`system/job/update/${editDataId}`, editDataForm.value, { operate: `修改${_baseName}` }).then(() => {
      initDataForm()
      getDataList()
    })
  })
}

const deleteData = (id) => {
  proxy.$http.post(`system/job/remove/${id}`, null, { operate: `删除${_baseName}` }).then(() => {
    getDataList()
  })
}

const runJob = (id) => {
  proxy.$http.post(`system/job/run/${id}`, null, { operate: `运行任务` }).then(() => {
  })
}

</script>
<script>
export default {
  name: 'SystemModuleJobIndex'
}
</script>

<style lang="scss" scoped>
::v-deep(.expand-menu-pane) {
  .n-grid:not(:last-child) {
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--color-border);
  }

  .n-grid {
    align-items: center;
  }
}

::v-deep(.expand-permission-pane) {
  .n-tag:not(:last-child) {
    margin: 0 8px 8px 0;
  }
}
</style>
