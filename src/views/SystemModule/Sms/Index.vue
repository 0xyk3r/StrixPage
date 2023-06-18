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
              <n-input v-model:value="getDataListParams.keyword" placeholder="请输入搜索条件（配置Key、名称）" clearable />
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
      :pagination="dataPagination" :expanded-row-keys="dataExpandedRowKeys"
      @update-expanded-row-keys="dataExpandedRowKeysChange" />

    <n-modal v-model:show="addDataModalShow" preset="card" :title="'添加' + _baseName" class="strix-model-primary"
      :class="isSmallWindow ? 'strix-full-modal' : ''" size="huge" @after-leave="initDataForm">
      <n-form ref="addDataFormRef" :model="addDataForm" :rules="addDataRules" label-placement="left" label-width="auto"
        require-mark-placement="right-hanging">
        <n-form-item label="配置 Key" path="key">
          <n-input v-model:value="addDataForm.key" placeholder="请输入配置 Key" clearable />
        </n-form-item>
        <n-form-item label="配置名称" path="name">
          <n-input v-model:value="addDataForm.name" placeholder="请输入配置名称" clearable />
        </n-form-item>
        <n-form-item label="短信平台" path="platform">
          <n-select v-model:value="addDataForm.platform" :options="strixSmsPlatformRef" placeholder="请选择短信平台"
            clearable />
        </n-form-item>
        <n-form-item label="所属地域" path="regionId">
          <n-input v-model:value="addDataForm.regionId" placeholder="请输入所属地域" clearable />
        </n-form-item>
        <n-form-item label="AccessKey" path="accessKey">
          <n-input v-model:value="addDataForm.accessKey" placeholder="请输入AccessKey" clearable />
        </n-form-item>
        <n-form-item label="AccessSecret" path="accessSecret">
          <n-input v-model:value="addDataForm.accessSecret" placeholder="请输入AccessSecret" clearable />
        </n-form-item>
        <n-form-item label="备注信息" path="remark">
          <n-input v-model:value="addDataForm.remark" placeholder="在此输入备注信息" type="textarea" :autosize="{
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

    <n-modal v-model:show="editDataModalShow" preset="card" :title="'修改' + _baseName" class="strix-model-primary"
      :class="isSmallWindow ? 'strix-full-modal' : ''" size="huge" @after-leave="initDataForm">
      <n-spin :show="editDataFormLoading">
        <n-form ref="editDataFormRef" :model="editDataForm" :rules="editDataRules" label-placement="left"
          label-width="auto" require-mark-placement="right-hanging">
          <n-form-item label="配置 Key" path="key">
            <n-input v-model:value="editDataForm.key" placeholder="请输入配置 Key" clearable />
          </n-form-item>
          <n-form-item label="配置名称" path="name">
            <n-input v-model:value="editDataForm.name" placeholder="请输入配置名称" clearable />
          </n-form-item>
          <n-form-item label="短信平台" path="platform">
            <n-select v-model:value="editDataForm.platform" :options="strixSmsPlatformRef" placeholder="请选择短信平台"
              clearable />
          </n-form-item>
          <n-form-item label="所属地域" path="regionId">
            <n-input v-model:value="editDataForm.regionId" placeholder="请输入所属地域" clearable />
          </n-form-item>
          <n-form-item label="AccessKey" path="accessKey">
            <n-input v-model:value="editDataForm.accessKey" placeholder="请输入AccessKey" clearable />
          </n-form-item>
          <n-form-item label="AccessSecret" path="accessSecret">
            <n-input v-model:value="editDataForm.accessSecret" placeholder="请输入新的AccessSecret (不输入则不改变)" clearable />
          </n-form-item>
          <n-form-item label="备注信息" path="remark">
            <n-input v-model:value="editDataForm.remark" placeholder="在此输入备注信息" type="textarea" :autosize="{
              minRows: 3,
              maxRows: 5
            }" />
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
import _ from 'lodash'
import { NButton, NDataTable, NGi, NGrid, NScrollbar, NSpace, NSpin, NTabPane, NTabs, NTag } from 'naive-ui'
import { getCurrentInstance, h, onMounted, provide, ref } from 'vue'

const { proxy } = getCurrentInstance()
const dictsStore = useDictsStore()

// 本页面操作提示关键词
const _baseName = '短信服务'

defineProps({
  isSmallWindow: {
    type: Boolean, default: false
  }
})

// 加载字典
const strixSmsPlatformRef = ref([])
provide('StrixSmsPlatformDict', strixSmsPlatformRef)
onMounted(() => {
  dictsStore.getDictData('StrixSmsPlatform', strixSmsPlatformRef)
})

// 获取列表请求参数
const getDataListParams = ref({
  keyword: '',
  pageIndex: 1,
  pageSize: 10
})
const clearSearch = () => {
  getDataListParams.value.keyword = ''
  getDataList()
}
// 展示列信息
const dataColumns = [
  {
    type: "expand",
    renderExpand: (row) => {
      if (!row.expandTab) row.expandTab = 'sign'
      if (!row.loaded) {
        return h(NSpin, { size: 'large', description: '加载中...' })
      }

      const expandSmsSignChildrenVNode = [
        h(NDataTable, {
          columns: [
            { title: '签名', key: 'name', width: 200 },
            {
              title: '签名状态', key: 'status', width: 80, render: (row) => {
                let tagType = 'default'
                let tagLabel = ''
                switch (row.status) {
                  case 1:
                    tagType = 'warning'
                    tagLabel = '待审核'
                    break
                  case 2:
                    tagType = 'success'
                    tagLabel = '审核通过'
                    break
                  case 3:
                    tagType = 'error'
                    tagLabel = '审核未通过'
                    break
                  case 4:
                    tagType = 'default'
                    tagLabel = '审核取消'
                    break
                  default:
                    tagType = 'default'
                    tagLabel = '未知'
                    break
                }
                return h(NTag, {
                  type: tagType,
                  bordered: false
                }, {
                  default: () => tagLabel
                })
              }
            },
            { title: '创建时间', key: 'createTime', width: 160 }
          ],
          data: row.signs,
          rowKey: (row) => row.id,
        }, null)
      ]

      const expandSmsTemplateChildrenVNode = [
        h(NDataTable, {
          columns: [
            { title: '模板 Code', key: 'code', width: 160 },
            { title: '模板名称', key: 'name', width: 160 },
            {
              title: '模板类型', key: 'type', width: 100, render: (row) => {
                let tagType = 'primary'
                let tagLabel = ''
                switch (row.status) {
                  case 1:
                    tagLabel = '验证码'
                    break
                  case 2:
                    tagLabel = '通知短信'
                    break
                  case 3:
                    tagLabel = '推广短信'
                    break
                  case 4:
                    tagLabel = '国际短信'
                    break
                  case 5:
                    tagLabel = '数字短信'
                    break
                  default:
                    tagLabel = '未知'
                    break
                }
                return h(NTag, {
                  type: tagType,
                  bordered: false
                }, {
                  default: () => tagLabel
                })
              }
            },
            {
              title: '模板状态', key: 'status', width: 100, render: (row) => {
                let tagType = 'default'
                let tagLabel = ''
                switch (row.status) {
                  case 1:
                    tagType = 'warning'
                    tagLabel = '待审核'
                    break
                  case 2:
                    tagType = 'success'
                    tagLabel = '审核通过'
                    break
                  case 3:
                    tagType = 'error'
                    tagLabel = '审核未通过'
                    break
                  case 4:
                    tagType = 'default'
                    tagLabel = '审核取消'
                    break
                  default:
                    tagType = 'default'
                    tagLabel = '未知'
                    break
                }
                return h(NTag, {
                  type: tagType,
                  bordered: false
                }, {
                  default: () => tagLabel
                })
              }
            },
            { title: '模板内容', key: 'content', width: 600 },
            { title: '创建时间', key: 'createTime', width: 160 }
          ],
          data: row.templates,
          rowKey: (row) => row.id,
        }, null)
      ]

      return h(
        NTabs,
        {
          type: 'segment',
          animated: true,
          value: row.expandTab,
          'onUpdate:value': (value) => { row.expandTab = value }
        },
        () => [
          h(NTabPane, { name: 'sign', tab: '短信签名', class: 'expand-sign-pane' }, () =>
            h(NScrollbar, { xScrollable: true }, () => h('div', { style: 'min-width: 600px; padding-bottom: 10px;' }, [expandSmsSignChildrenVNode]))
          ),
          h(NTabPane, { name: 'template', tab: '短信模板', class: 'expand-template-pane' }, () =>
            h(NScrollbar, { xScrollable: true }, () => h('div', { style: 'min-width: 1200px; padding-bottom: 10px;' }, [expandSmsTemplateChildrenVNode]))
          )
        ]
      )
    }
  },
  { key: 'key', width: 120, title: '配置 Key' },
  { key: 'name', width: 120, title: '配置名称' },
  {
    key: 'platform',
    width: 100,
    title: '平台',
    render(row) {
      return h(StrixTag, { value: row.platform, dictName: 'StrixSmsPlatform' })
    }
  },
  { key: 'regionId', width: 100, title: '地域' },
  { key: 'accessKey', width: 150, title: 'AccessKey' },
  { key: 'remark', width: 150, title: '备注' },
  { key: 'createTime', width: 150, title: '创建时间' },
  {
    title: '操作',
    width: 240,
    render(row) {
      return handleOperate([
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
  proxy.$http.get('system/sms', { params: getDataListParams.value, operate: `加载${_baseName}列表` }).then(({ data: res }) => {
    dataLoading.value = false
    // 清除展开行
    dataExpandedRowKeys.value = []
    dataRef.value = res.data.configs
  })
}
onMounted(getDataList)

const dataRowKey = (rowData) => rowData.id
const dataExpandedRowKeys = ref([])
const dataExpandedRowKeysChange = (value) => {
  // 只获取新展开的
  const diffs = _.differenceWith(value, dataExpandedRowKeys.value, _.isEqual);
  dataExpandedRowKeys.value = value
  diffs.forEach(diff => {
    const row = _.find(dataRef.value, { id: diff })
    if (row) {
      proxy.$http.get(`system/sms/${row.id}`, { operate: `加载${_baseName}信息` }).then(({ data: res }) => {
        row.signs = res.data.signs
        row.templates = res.data.templates
        row.loaded = true
      })
    }
  })
}

const initDataForm = () => {
  addDataModalShow.value = false
  editDataModalShow.value = false
  editDataFormLoading.value = false
  addDataForm.value = {
    key: '',
    name: '',
    platform: null,
    regionId: '',
    accessKey: '',
    accessSecret: '',
    remark: ''
  }
  editDataId = ''
  editDataForm.value = {
    key: '',
    name: '',
    platform: '',
    regionId: '',
    accessKey: '',
    accessSecret: '',
    remark: ''
  }
}

const addDataModalShow = ref(false)
const addDataForm = ref({
  key: '',
  name: '',
  platform: null,
  regionId: '',
  accessKey: '',
  accessSecret: '',
  remark: ''
})
const addDataRules = {
  key: [
    { required: true, message: '请输入配置 Key', trigger: 'blur' },
    { min: 2, max: 32, message: '配置 Key 长度需在 2 - 32 字之内', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入配置名称', trigger: 'blur' },
    { min: 2, max: 32, message: '配置名称长度需在 2 - 32 字之内', trigger: 'blur' }
  ],
  platform: [
    { type: 'number', required: true, message: '请选择平台', trigger: 'change' }
  ],
  regionId: [
    { required: true, message: '请输入区域', trigger: 'blur' },
    { min: 1, max: 32, message: '区域长度需在 1 - 32 字之内', trigger: 'blur' }
  ],
  accessKey: [
    { required: true, message: '请输入 AccessKey', trigger: 'blur' },
    { max: 64, message: 'AccessKey 长度需在 64 字之内', trigger: 'blur' }
  ],
  accessSecret: [
    { required: true, message: '请输入 AccessSecret', trigger: 'blur' },
    { max: 64, message: 'AccessSecret 长度需在 64 字之内', trigger: 'blur' }
  ],
  remark: [
    { max: 255, message: '备注长度需在 255 字之内', trigger: 'blur' }
  ]
}
const showAddDataModal = () => {
  addDataModalShow.value = true
}
const addData = () => {
  proxy.$refs.addDataFormRef.validate((errors) => {
    if (errors) return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    proxy.$http.post('system/sms/update', addDataForm.value, { operate: `添加${_baseName}` }).then(() => {
      initDataForm()
      getDataList()
    })
  })
}

const editDataModalShow = ref(false)
const editDataFormLoading = ref(false)
let editDataId = ''
const editDataForm = ref({
  key: '',
  name: '',
  platform: '',
  regionId: '',
  accessKey: '',
  accessSecret: '',
  remark: ''
})
const editDataRules = {
  key: [
    { required: true, message: '请输入配置 Key', trigger: 'blur' },
    { min: 2, max: 32, message: '配置 Key 长度需在 2 - 32 字之内', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入配置名称', trigger: 'blur' },
    { min: 2, max: 32, message: '配置名称长度需在 2 - 32 字之内', trigger: 'blur' }
  ],
  platform: [
    { type: 'number', required: true, message: '请选择平台', trigger: 'change' }
  ],
  regionId: [
    { required: true, message: '请输入区域', trigger: 'blur' },
    { min: 1, max: 32, message: '区域长度需在 1 - 32 字之内', trigger: 'blur' }
  ],
  accessKey: [
    { required: true, message: '请输入 AccessKey', trigger: 'blur' },
    { max: 64, message: 'AccessKey 长度需在 64 字之内', trigger: 'blur' }
  ],
  accessSecret: [
    { max: 64, message: 'AccessSecret 长度需在 64 字之内', trigger: 'blur' }
  ],
  remark: [
    { max: 255, message: '备注长度需在 255 字之内', trigger: 'blur' }
  ]
}
const showEditDataModal = (id) => {
  editDataModalShow.value = true
  editDataFormLoading.value = true
  // 加载编辑前信息
  proxy.$http.get(`system/sms/${id}`, { operate: `加载${_baseName}信息` }).then(({ data: res }) => {
    const canUpdateFields = []
    _.forOwn(editDataForm.value, function (value, key) {
      canUpdateFields.push(key)
    })
    editDataId = id
    editDataForm.value = _.pick(res.data, canUpdateFields)
    editDataFormLoading.value = false
  })
}
const editData = () => {
  proxy.$refs.editDataFormRef.validate((errors) => {
    if (errors) return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    proxy.$http.post(`system/sms/update/${editDataId}`, editDataForm.value, { operate: `修改${_baseName}` }).then(() => {
      initDataForm()
      getDataList()
    })
  })
}

const deleteData = (id) => {
  proxy.$http.post(`system/sms/remove/${id}`, null, { operate: `删除${_baseName}` }).then(() => {
    getDataList()
  })
}

</script>
<script>
export default {
  name: 'SystemModuleSmsIndex'
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
