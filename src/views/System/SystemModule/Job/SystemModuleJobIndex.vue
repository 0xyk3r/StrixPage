<template>
  <div>
    <strix-block cleanable @clear="clearSearch">
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input v-model:value="getDataListParams.keyword" clearable placeholder="请输入搜索条件（任务名称）" />
              <n-button ghost type="primary" @click="getDataList"> 搜索</n-button>
            </n-input-group>
          </n-gi>
          <n-gi :span="1">
            <n-button type="primary" @click="showAddDataModal()"> 添加{{ _baseName }}</n-button>
          </n-gi>
        </n-grid>
      </template>
    </strix-block>

    <n-data-table
      :columns="dataColumns"
      :data="dataRef"
      :loading="dataLoading"
      :pagination="dataPagination"
      :row-key="dataRowKey"
      table-layout="fixed"
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
        <n-form-item label="任务名称" path="name">
          <n-input v-model:value="addDataForm.name" clearable placeholder="请输入任务名称" />
        </n-form-item>
        <n-form-item label="调用目标" path="invokeTarget">
          <n-popover placement="bottom-start" trigger="focus">
            <template #trigger>
              <n-input v-model:value="addDataForm.invokeTarget" clearable placeholder="请输入调用目标" />
            </template>
            <p>请输入 组件名称.方法名称() 或 组件名称.方法名称(...参数列表)</p>
            <p>其中组件名称为 @Component 注解的值，参数列表可选、数量不限</p>
            <p>strixTestJob.testSomething() 或 strixTestJob.testParams('abc', 1, 1.21D, 22222L, true)</p>
            <p>为了系统安全考虑，所有定时任务调用目标类需使用 @StrixJob 注解，否则无法添加和调用。</p>
          </n-popover>
        </n-form-item>
        <n-form-item label="Cron 表达式" path="cronExpression">
          <n-input v-model:value="addDataForm.cronExpression" clearable placeholder="请输入 Cron 表达式" />
        </n-form-item>
        <n-form-item label="计划错误策略" path="misfirePolicy">
          <n-select
            v-model:value="addDataForm.misfirePolicy"
            :options="jobMisfireRef"
            clearable
            placeholder="请选择计划错误策略"
          />
        </n-form-item>
        <n-form-item label="是否并发执行" path="concurrent">
          <n-select
            v-model:value="addDataForm.concurrent"
            :options="commonSwitchRef"
            clearable
            placeholder="请选择是否并发执行"
          />
        </n-form-item>
        <n-form-item label="任务状态" path="status">
          <n-select v-model:value="addDataForm.status" :options="jobStatusRef" clearable placeholder="请选择任务状态" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-flex justify="end">
          <n-button @click="addDataModalShow = false">取消</n-button>
          <n-button type="primary" @click="addData"> 确定</n-button>
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
          <n-form-item label="任务名称" path="name">
            <n-input v-model:value="editDataForm.name" clearable placeholder="请输入任务名称" />
          </n-form-item>
          <n-form-item label="调用目标" path="invokeTarget">
            <n-input v-model:value="editDataForm.invokeTarget" clearable placeholder="请输入调用目标" />
          </n-form-item>
          <n-form-item label="Cron 表达式" path="cronExpression">
            <n-input v-model:value="editDataForm.cronExpression" clearable placeholder="请输入 Cron 表达式" />
          </n-form-item>
          <n-form-item label="计划错误策略" path="misfirePolicy">
            <n-select
              v-model:value="editDataForm.misfirePolicy"
              :options="jobMisfireRef"
              clearable
              placeholder="请选择计划错误策略"
            />
          </n-form-item>
          <n-form-item label="是否并发执行" path="concurrent">
            <n-select
              v-model:value="editDataForm.concurrent"
              :options="commonSwitchRef"
              clearable
              placeholder="请选择是否并发执行"
            />
          </n-form-item>
          <n-form-item label="任务状态" path="status">
            <n-select
              v-model:value="editDataForm.status"
              :options="jobStatusRef"
              clearable
              placeholder="请选择任务状态"
            />
          </n-form-item>
        </n-form>
      </n-spin>
      <template #footer>
        <n-flex justify="end">
          <n-button @click="editDataModalShow = false">取消</n-button>
          <n-button type="primary" @click="editData"> 确定</n-button>
        </n-flex>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import StrixBlock from '@/components/StrixBlock.vue'
import StrixTag from '@/components/StrixTag.vue'
import { http } from '@/plugins/axios'
import { usePage } from '@/utils/common-page-util'
import { useDict } from '@/utils/strix-dict-util'
import { createStrixMessage } from '@/utils/strix-message'
import { handleOperate } from '@/utils/strix-table-tool'
import { pick } from 'lodash-es'
import { type DataTableColumns, type FormRules } from 'naive-ui' // 本页面操作提示关键词

// 本页面操作提示关键词
const _baseName = '定时任务'

// 加载字典
const commonSwitchRef = useDict('CommonSwitch')
const jobMisfireRef = useDict('JobMisfire')
const jobStatusRef = useDict('JobStatus')

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
    pageIndex: 1,
    pageSize: 10
  },
  () => {
    getDataList()
  },
  {
    name: null,
    group: 'DEFAULT',
    invokeTarget: null,
    cronExpression: null,
    misfirePolicy: null,
    concurrent: null,
    status: null
  },
  {
    name: null,
    group: 'DEFAULT',
    invokeTarget: null,
    cronExpression: null,
    misfirePolicy: null,
    concurrent: null,
    status: null
  }
)

// 展示列信息
const dataColumns: DataTableColumns = [
  { key: 'name', width: 240, title: '任务名称' },
  { key: 'invokeTarget', width: 320, title: '调用目标' },
  { key: 'cronExpression', width: 160, title: 'Cron 表达式' },
  {
    key: 'misfirePolicy',
    title: '错过执行策略',
    width: 120,
    align: 'center',
    render(row: any) {
      return h(StrixTag, { value: row.misfirePolicy, dictName: 'JobMisfire' })
    }
  },
  {
    key: 'concurrent',
    title: '并发执行',
    width: 120,
    align: 'center',
    render(row: any) {
      return h(StrixTag, { value: row.concurrent, dictName: 'CommonSwitch' })
    }
  },
  {
    key: 'status',
    title: '状态',
    width: 120,
    align: 'center',
    render(row: any) {
      return h(StrixTag, { value: row.status, dictName: 'JobStatus' })
    }
  },
  {
    key: 'actions',
    title: '操作',
    width: 180,
    align: 'center',
    render(row: any) {
      return handleOperate([
        {
          type: 'info',
          label: '运行一次',
          icon: 'play',
          onClick: () => runJob(row.id)
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
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  http
    .get('system/job', {
      params: getDataListParams.value,
      meta: { operate: `加载${_baseName}列表` }
    })
    .then(({ data: res }) => {
      dataLoading.value = false
      dataRef.value = res.data.items
    })
}
onMounted(getDataList)

const addDataRules: FormRules = {
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
  misfirePolicy: [{ type: 'number', required: true, message: '请选择计划错误策略', trigger: 'change' }],
  concurrent: [{ type: 'number', required: true, message: '请选择是否并发执行', trigger: 'change' }],
  status: [{ type: 'number', required: true, message: '请选择任务状态', trigger: 'change' }]
}
const showAddDataModal = () => {
  addDataModalShow.value = true
}
const addData = () => {
  addDataFormRef.value?.validate((errors) => {
    if (errors) return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    http.post('system/job/update', addDataForm.value, { meta: { operate: `添加${_baseName}` } }).then(() => {
      initDataForm()
      getDataList()
    })
  })
}

const editDataRules: FormRules = {
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
  misfirePolicy: [{ type: 'number', required: true, message: '请选择计划错误策略', trigger: 'change' }],
  concurrent: [{ type: 'number', required: true, message: '请选择是否并发执行', trigger: 'change' }],
  status: [{ type: 'number', required: true, message: '请选择任务状态', trigger: 'change' }]
}
const showEditDataModal = (id: string) => {
  editDataModalShow.value = true
  editDataFormLoading.value = true
  // 加载编辑前信息
  http.get(`system/job/${id}`, { meta: { operate: `加载${_baseName}信息` } }).then(({ data: res }) => {
    editDataId.value = id
    const canUpdateFields = Object.keys(initEditDataForm)
    editDataForm.value = pick(res.data, canUpdateFields)
    editDataFormLoading.value = false
  })
}
const editData = () => {
  editDataFormRef.value?.validate((errors) => {
    if (errors) return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    http
      .post(`system/job/update/${editDataId.value}`, editDataForm.value, {
        meta: { operate: `修改${_baseName}` }
      })
      .then(() => {
        initDataForm()
        getDataList()
      })
  })
}

const deleteData = (id: string) => {
  http.post(`system/job/remove/${id}`, null, { meta: { operate: `删除${_baseName}` } }).then(() => {
    getDataList()
  })
}

const runJob = (id: string) => {
  http.post(`system/job/run/${id}`, null, { meta: { operate: `运行任务` } }).then(() => {})
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
