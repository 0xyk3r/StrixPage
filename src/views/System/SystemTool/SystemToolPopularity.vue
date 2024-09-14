<template>
  <div>
    <n-layout has-sider>
      <n-layout-sider
        class="clear-bg-color"
        content-style="height: 100%; padding: 10px;"
        :native-scrollbar="false"
        bordered
      >
        <n-card class="full-h">
          <div class="strix-button-group">
            <n-button type="primary" size="small" @click="initDataForm"> 添加配置 </n-button>
            <n-button type="info" size="small" @click="getDataList"> 刷新列表 </n-button>
          </div>
          <n-spin :show="dataLoading">
            <n-menu
              v-model:value="editDataId"
              key-field="id"
              label-field="name"
              :options="dataRef"
              :render-extra="renderDataMenuExtra"
              @update:value="handleSelectDataChanged"
            />
          </n-spin>
        </n-card>
      </n-layout-sider>
      <n-layout content-style="padding: 10px;" :native-scrollbar="false">
        <n-grid x-gap="12" y-gap="12" :cols="5">
          <n-gi span="2">
            <n-card class="full-h">
              <n-h3 prefix="bar" align-text type="info">
                <n-text type="info">配置详情 - {{ editDataId ? '编辑' : '创建' }}</n-text>
              </n-h3>
              <n-spin :show="editDataFormLoading">
                <n-form
                  ref="editDataFormRef"
                  :model="editDataForm"
                  :rules="editDataRules"
                  label-placement="left"
                  label-width="auto"
                  require-mark-placement="right-hanging"
                >
                  <n-form-item span="2 s:1" label="配置Key" path="configKey">
                    <n-input
                      v-model:value="editDataForm.configKey"
                      placeholder="请输入配置Key"
                      :disabled="editDataId != null"
                      clearable
                    />
                  </n-form-item>
                  <n-form-item span="2 s:1" label="配置名称" path="name">
                    <n-input
                      v-model:value="editDataForm.name"
                      placeholder="请输入配置名称"
                      clearable
                    />
                  </n-form-item>
                  <n-form-item span="2 s:1" label="初始值" path="initialValue">
                    <n-input-number
                      v-model:value="editDataForm.initialValue"
                      placeholder="初始值（参与乘算）"
                      style="width: 100%"
                      clearable
                    />
                  </n-form-item>
                  <n-form-item span="2 s:1" label="倍率" path="magValue">
                    <n-input-number
                      v-model:value="editDataForm.magValue"
                      :precision="2"
                      placeholder="乘算倍率"
                      style="width: 100%"
                      clearable
                    />
                  </n-form-item>
                  <n-form-item span="2 s:1" label="附加值" path="extraValue">
                    <n-input-number
                      v-model:value="editDataForm.extraValue"
                      placeholder="附加值（不参与乘算）"
                      style="width: 100%"
                      clearable
                    />
                  </n-form-item>
                </n-form>
              </n-spin>
              <div class="strix-button-group">
                <n-button type="primary" @click="editData"> 保存 </n-button>
                <n-button type="warning"> 重置 </n-button>
              </div>
            </n-card>
          </n-gi>
          <n-gi span="3">
            <n-card class="full-h">
              <n-h3 prefix="bar" align-text type="info">
                <n-text type="info">数据列表</n-text>
              </n-h3>
              <n-data-table
                :remote="true"
                :loading="popularityDataLoading"
                :columns="popularityDataColumns"
                :data="popularityDataRef"
                :pagination="popularityDataPagination"
                :row-key="popularityDataRowKey"
                :min-height="290"
                :max-height="290"
              >
                <template #empty>
                  <n-empty size="large" :description="editDataId ? '无数据' : '请选择配置'" />
                </template>
              </n-data-table>
            </n-card>
          </n-gi>
          <n-gi span="5">
            <n-card class="full-h">
              <n-h3 prefix="bar" align-text type="info">
                <n-text type="info">数据计算器</n-text>
              </n-h3>
              <div v-if="editDataId != null" class="popularity-calc">
                <div>(</div>
                <div>
                  <n-tooltip trigger="hover">
                    <template #trigger>
                      <span>{{ editDataForm.initialValue }}</span>
                    </template>
                    初始值
                  </n-tooltip>
                </div>
                <div>+</div>
                <div>
                  <n-tooltip trigger="hover">
                    <template #trigger>
                      <n-input-number
                        v-model:value="calcInput"
                        :show-button="false"
                        style="width: 100px"
                      />
                    </template>
                    原始数值（真实数值）
                  </n-tooltip>
                </div>
                <div>)</div>
                <div>x</div>
                <div>
                  <n-tooltip trigger="hover">
                    <template #trigger>
                      <span>{{ editDataForm.magValue }}</span>
                    </template>
                    倍率
                  </n-tooltip>
                </div>
                <div>+</div>
                <div>
                  <n-tooltip trigger="hover">
                    <template #trigger>
                      <span>{{ editDataForm.extraValue }}</span>
                    </template>
                    附加值
                  </n-tooltip>
                </div>
                <div>=</div>
                <div>
                  <n-tooltip trigger="hover">
                    <template #trigger>
                      <span>{{
                        Math.ceil(
                          (editDataForm.initialValue + calcInput) * editDataForm.magValue +
                            editDataForm.extraValue
                        )
                      }}</span>
                    </template>
                    最终结果
                  </n-tooltip>
                </div>
              </div>
              <n-empty v-else size="large" description="选择一个配置" />
            </n-card>
          </n-gi>
        </n-grid>
      </n-layout>
    </n-layout>
  </div>
</template>

<script setup lang="ts">
import { http } from '@/plugins/axios'
import { createPagination } from '@/utils/common-page-util'
import { createStrixMessage } from '@/utils/strix-message'
import { handleOperate } from '@/utils/strix-table-tool'
import { cloneDeep, debounce, pick } from 'lodash'
import { NInputNumber, type DataTableColumns, type FormInst, type FormRules } from 'naive-ui'

const _baseName = '热度工具配置'
const _baseApiPrefix = 'system/tool/popularity'

// 加载列表
const dataRef = ref()
const dataLoading = ref(true)
const getDataList = () => {
  dataLoading.value = true
  http
    .get(`${_baseApiPrefix}`, {
      meta: { operate: `加载${_baseName}列表` }
    })
    .then(({ data: res }) => {
      dataLoading.value = false
      dataRef.value = res.data.items
    })
}
onMounted(getDataList)

const handleSelectDataChanged = () => {
  if (editDataId.value) {
    // 加载编辑前信息
    http
      .get(`${_baseApiPrefix}/${editDataId.value}`, { meta: { operate: `加载${_baseName}信息` } })
      .then(({ data: res }) => {
        const canUpdateFields = Object.keys(initEditDataForm)
        editDataForm.value = pick(res.data, canUpdateFields)
        editDataFormLoading.value = false
      })
    // 加载数据列表
    getPopularitDataList()
  } else {
    initDataForm()
  }
}
const renderDataMenuExtra = (row: any) => {
  return h(
    'div',
    {
      style: {
        float: 'right'
      }
    },
    handleOperate(
      [
        {
          type: 'error',
          label: '删除',
          icon: 'ion:trash-outline',
          onClick: () => deleteData(row.id),
          popconfirm: true,
          popconfirmMessage: '是否确认删除这条数据? 且该操作不可恢复!'
        }
      ],
      'tiny'
    )
  )
}

// 重置表单
const initDataForm = () => {
  editDataFormLoading.value = false
  editDataId.value = null
  editDataForm.value = cloneDeep(initEditDataForm)
  popularityDataRef.value = []
}

// 编辑数据
const editDataFormLoading = ref(false)
let editDataId = ref(null)
const initEditDataForm = {
  name: null,
  configKey: null,
  initialValue: null,
  extraValue: null,
  magValue: null
}
const editDataForm = ref<any>(cloneDeep(initEditDataForm))
const editDataFormRef = ref<FormInst | null>(null)
const editDataRules: FormRules = {
  name: [
    { required: true, message: '请输入配置名称', trigger: 'blur' },
    { min: 1, max: 32, message: '配置名称长度需在 1 - 32 字之内', trigger: 'blur' }
  ],
  configKey: [
    { required: true, message: '请输入配置Key', trigger: 'blur' },
    { min: 1, max: 32, message: '配置Key长度需在 1 - 32 字之内', trigger: 'blur' }
  ],
  initialValue: [{ type: 'number', required: true, message: '请输入初始值', trigger: 'change' }],
  extraValue: [{ type: 'number', required: true, message: '请输入附加值', trigger: 'change' }],
  magValue: [{ type: 'number', required: true, message: '请输入倍率', trigger: 'change' }]
}
const editData = () => {
  editDataFormRef.value?.validate((errors) => {
    if (errors)
      return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    http
      .post(
        `${_baseApiPrefix}/update${editDataId.value ? '/' + editDataId.value : ''}`,
        editDataForm.value,
        { meta: { operate: `保存${_baseName}` } }
      )
      .then(() => {
        initDataForm()
        getDataList()
      })
  })
}

// 删除数据
const deleteData = (id: string) => {
  http
    .post(`${_baseApiPrefix}/remove/${id}`, null, {
      meta: { operate: `删除${_baseName}` }
    })
    .then(() => {
      getDataList()
    })
}

// 获取列表请求参数
const initGetPopularitDataListParams = {
  pageIndex: 1,
  pageSize: 10
}
const getPopularitDataListParams = ref(cloneDeep(initGetPopularitDataListParams))
// 展示列信息
const popularityDataColumns: DataTableColumns = [
  { key: 'dataId', title: '数据ID', width: 120 },
  {
    key: 'originalValue',
    title: '原始数值',
    minWidth: 150,
    width: 150,
    render(row: any) {
      return h(NInputNumber, {
        value: row.originalValue,
        showButton: false,
        updateValueOnInput: false,
        onUpdateValue: (val) => {
          row.originalValue = val
          updatePopularityDataValue(row.id, val)
        },
        style: {
          minWidth: '120px'
        }
      })
    }
  },
  {
    key: 'showValue',
    title: '显示数值',
    width: 100,
    render(row: any) {
      return calcResult(row.originalValue)
    }
  },
  {
    key: 'actions',
    title: '操作',
    width: 80,
    render(row: any) {
      return handleOperate([
        {
          type: 'error',
          label: '删除',
          icon: 'ion:trash-outline',
          onClick: () => deletePopularitData(row.id),
          popconfirm: true,
          popconfirmMessage: '是否确认删除这条数据? 且该操作不可恢复!'
        }
      ])
    }
  }
]
// 加载列表
const popularityDataRef = ref()
const popularityDataLoading = ref(false)
const getPopularitDataList = () => {
  if (!editDataId.value) return createStrixMessage('warning', '请先选择配置', '请先选择配置')
  popularityDataLoading.value = true
  http
    .get(`${_baseApiPrefix}/${editDataId.value}/data`, {
      params: getPopularitDataListParams.value,
      meta: { operate: `加载热度数据列表` }
    })
    .then(({ data: res }) => {
      popularityDataLoading.value = false
      popularityDataRef.value = res.data.items
      popularityDataPagination.itemCount = res.data.total
    })
}
const popularityDataRowKey = (row: any) => row.id
const popularityDataPagination = createPagination(getPopularitDataListParams, getPopularitDataList)

// 修改数据数值
const updatePopularityDataValue = debounce((id, value) => {
  http
    .post(
      `${_baseApiPrefix}/${editDataId.value}/data/update/${id}`,
      { originalValue: value },
      { meta: { operate: '修改热度数据数值' } }
    )
    .then(() => {
      getPopularitDataList()
    })
}, 300)

// 删除数据
const deletePopularitData = (id: string) => {
  http
    .post(`${_baseApiPrefix}/${editDataId.value}/data/remove/${id}`, null, {
      meta: { operate: '删除热度数据' }
    })
    .then(() => {
      getPopularitDataList()
    })
}

const calcInput = ref(0)
const calcResult = (value: number) => {
  if (value == null) value = calcInput.value
  if (!editDataId.value) return 0
  const { initialValue, magValue, extraValue } = editDataForm.value
  return Math.ceil((initialValue + value) * magValue + extraValue)
}
</script>

<style lang="less" scoped>
.popularity-calc {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  height: 78px;
  > * {
    margin: 0 5px;
  }

  .iconify {
    margin-right: 10px;
  }
}
</style>
