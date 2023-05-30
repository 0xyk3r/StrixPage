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
            <n-button type="primary" @click="showAddDataModal">
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
        <n-form-item label="存储平台" path="platform">
          <n-select v-model:value="addDataForm.platform" :options="ossConfigPlatformOptions" placeholder="请选择存储平台"
            clearable />
        </n-form-item>
        <n-form-item label="公网节点" path="publicEndpoint">
          <n-input v-model:value="addDataForm.publicEndpoint" placeholder="请输入公网节点" clearable />
        </n-form-item>
        <n-form-item label="内网节点" path="privateEndpoint">
          <n-input v-model:value="addDataForm.privateEndpoint" placeholder="请输入内网节点" clearable />
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
          <n-form-item label="存储平台" path="platform">
            <n-select v-model:value="editDataForm.platform" :options="ossConfigPlatformOptions" placeholder="请选择存储平台"
              clearable />
          </n-form-item>
          <n-form-item label="公网节点" path="publicEndpoint">
            <n-input v-model:value="editDataForm.publicEndpoint" placeholder="请输入公网节点" clearable />
          </n-form-item>
          <n-form-item label="内网节点" path="privateEndpoint">
            <n-input v-model:value="editDataForm.privateEndpoint" placeholder="请输入内网节点" clearable />
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
import { createPagination } from '@/plugins/pagination.js'
import { createStrixNotify } from '@/utils/strix-notify'
import { handleOperate } from '@/utils/strix-table-tool'
import _ from 'lodash'
import { NButton, NDataTable, NGi, NGrid, NScrollbar, NSpace, NSpin, NTabPane, NTabs, NTag } from 'naive-ui'
import { getCurrentInstance, h, onMounted, ref } from 'vue'

const { proxy } = getCurrentInstance()

// 本页面操作提示关键词
const _baseName = '存储服务'

defineProps({
  isSmallWindow: {
    type: Boolean, default: false
  }
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
      if (!row.expandTab) row.expandTab = 'bucket'
      if (!row.loaded) {
        return h(NSpin, { size: 'large', description: '加载中...' })
      }

      const expandOssBucketChildrenVNode = [
        h(NDataTable, {
          columns: [
            { title: 'Bucket 名称', key: 'name', width: 200 },
            {
              title: '存储类型',
              key: 'storageClass',
              width: 80,
              render: (row) => {
                const storageClassMap = {
                  Standard: { type: 'success', label: '标准存储' },
                  IA: { type: 'info', label: '低频访问存储' },
                  Archive: { type: 'warning', label: '归档存储' },
                  ColdArchive: { type: 'error', label: '冷归档存储' },
                  default: { type: 'default', label: '未知' }
                }
                const { type, label } = storageClassMap[row.storageClass] || storageClassMap.default
                return h(NTag, { type, bordered: false }, { default: () => label })
              }
            },
            { title: '地域', key: 'region', width: 160 },
            { title: '创建时间', key: 'createTime', width: 160 },
            { title: '备注', key: 'remark', width: 160 }
          ],
          data: row.buckets,
          rowKey: (row) => row.id,
        }, null)
      ]

      const expandOssFileGroupChildrenVNode = [
        h(NDataTable, {
          columns: [
            { key: 'key', title: '文件组 Key', width: 120 },
            { key: 'name', title: '文件组名称', width: 120 },
            { key: 'configKey', title: '存储服务 Key', width: 120 },
            { key: 'bucketName', title: '所属 Bucket', width: 120 },
            { key: 'bucketDomain', title: '自定义域名', width: 150 },
            { key: 'baseDir', title: '基础路径', width: 120 },
            { key: 'allowExtension', title: '允许的拓展名', width: 150 },
            {
              key: 'secretType', title: '文件权限类型', width: 100, render(row) {
                const tagText = row.secretType === 1 ? '管理端文件' : '用户端文件';
                return h(NTag, { type: row.secretType === 1 ? 'success' : 'info', bordered: false }, {
                  default: () => tagText + '/' + row.secretLevel
                })
              }
            },
            { key: 'remark', title: '备注', width: 150 }
          ],
          data: row.fileGroups,
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
          h(NTabPane, { name: 'bucket', tab: '存储空间', class: 'expand-sign-pane' }, () =>
            h(NScrollbar, { xScrollable: true }, () => h('div', { style: 'min-width: 600px; padding-bottom: 10px;' }, [expandOssBucketChildrenVNode]))
          ),
          h(NTabPane, { name: 'template', tab: '文件分组', class: 'expand-template-pane' }, () =>
            h(NScrollbar, { xScrollable: true }, () => h('div', { style: 'min-width: 1200px; padding-bottom: 10px;' }, [expandOssFileGroupChildrenVNode]))
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
      const option = _.find(ossConfigPlatformOptions, function (o) { return o.value === row.platform })
      return h(NTag, {
        type: option?.type || 'default',
        bordered: false
      }, {
        default: () => option?.label || '未知'
      })
    }
  },
  { key: 'publicEndpoint', width: 150, title: '公网节点' },
  { key: 'privateEndpoint', width: 150, title: '内网节点' },
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
  proxy.$http.get('system/oss', { params: getDataListParams.value, operate: `加载${_baseName}列表` }).then(({ data: res }) => {
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
      proxy.$http.get(`system/oss/${row.id}`, { operate: `加载${_baseName}信息` }).then(({ data: res }) => {
        row.buckets = res.data.buckets
        row.fileGroups = res.data.fileGroups
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
    platform: '',
    publicEndpoint: '',
    privateEndpoint: '',
    accessKey: '',
    accessSecret: '',
    remark: ''
  }
  editDataId = ''
  editDataForm.value = {
    key: '',
    name: '',
    platform: '',
    publicEndpoint: '',
    privateEndpoint: '',
    accessKey: '',
    accessSecret: '',
    remark: ''
  }
}

const addDataModalShow = ref(false)
const addDataForm = ref({
  key: '',
  name: '',
  platform: '',
  publicEndpoint: '',
  privateEndpoint: '',
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
    if (errors) return createStrixNotify('error', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    proxy.$http.post('system/oss/update', addDataForm.value, { operate: `添加${_baseName}` }).then(() => {
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
  publicEndpoint: '',
  privateEndpoint: '',
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
  publicEndpoint: [
    { required: true, message: '请输入公网节点', trigger: 'blur' },
    { min: 1, max: 128, message: '公网节点长度需在 1 - 128 字之内', trigger: 'blur' }
  ],
  privateEndpoint: [
    { required: true, message: '请输入内网节点', trigger: 'blur' },
    { min: 1, max: 128, message: '内网节点长度需在 1 - 128 字之内', trigger: 'blur' }
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
  proxy.$http.get(`system/oss/${id}`, { operate: `加载${_baseName}信息` }).then(({ data: res }) => {
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
    if (errors) return createStrixNotify('error', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    proxy.$http.post(`system/oss/update/${editDataId}`, editDataForm.value, { operate: `修改${_baseName}` }).then(() => {
      initDataForm()
      getDataList()
    })
  })
}

const deleteData = (id) => {
  proxy.$http.post(`system/oss/remove/${id}`, null, { operate: `删除${_baseName}` }).then(() => {
    getDataList()
  })
}

const ossConfigPlatformOptions = [
  { value: '', label: '未选择' },
  { value: 1, label: '阿里云', type: 'warning' },
  { value: 2, label: '腾讯云', type: 'primary' },
]

</script>
<script>
export default {
  name: 'SystemModuleOssIndex'
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
