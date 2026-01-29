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
                placeholder="请输入搜索条件（配置Key、名称）"
              />
              <n-button ghost type="primary" @click="getDataList"> 搜索</n-button>
            </n-input-group>
          </n-gi>
          <n-gi :span="1">
            <n-button type="primary" @click="showAddDataModal"> 添加{{ _baseName }}</n-button>
          </n-gi>
        </n-grid>
      </template>
    </strix-block>

    <n-data-table
      :columns="dataColumns"
      :data="dataRef"
      :expanded-row-keys="dataExpandedRowKeys"
      :loading="dataLoading"
      :pagination="dataPagination"
      :row-key="dataRowKey"
      table-layout="fixed"
      @update-expanded-row-keys="dataExpandedRowKeysChange"
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
        <n-form-item label="配置 Key" path="key">
          <n-input v-model:value="addDataForm.key" clearable placeholder="请输入配置 Key" />
        </n-form-item>
        <n-form-item label="配置名称" path="name">
          <n-input v-model:value="addDataForm.name" clearable placeholder="请输入配置名称" />
        </n-form-item>
        <n-form-item label="存储平台" path="platform">
          <n-select
            v-model:value="addDataForm.platform"
            :options="ossPlatformRef"
            clearable
            placeholder="请选择存储平台"
          />
        </n-form-item>
        <n-form-item label="存储地域" path="region">
          <n-input v-model:value="addDataForm.region" clearable placeholder="请输入存储地域" />
        </n-form-item>
        <n-form-item label="公网节点" path="publicEndpoint">
          <n-input v-model:value="addDataForm.publicEndpoint" clearable placeholder="请输入公网节点" />
        </n-form-item>
        <n-form-item label="内网节点" path="privateEndpoint">
          <n-input v-model:value="addDataForm.privateEndpoint" clearable placeholder="请输入内网节点" />
        </n-form-item>
        <n-form-item label="AccessKey" path="accessKey">
          <n-input v-model:value="addDataForm.accessKey" clearable placeholder="请输入AccessKey" />
        </n-form-item>
        <n-form-item label="AccessSecret" path="accessSecret">
          <n-input v-model:value="addDataForm.accessSecret" clearable placeholder="请输入AccessSecret" />
        </n-form-item>
        <n-form-item label="备注信息" path="remark">
          <n-input
            v-model:value="addDataForm.remark"
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
          <n-form-item label="配置 Key" path="key">
            <n-input v-model:value="editDataForm.key" clearable placeholder="请输入配置 Key" />
          </n-form-item>
          <n-form-item label="配置名称" path="name">
            <n-input v-model:value="editDataForm.name" clearable placeholder="请输入配置名称" />
          </n-form-item>
          <n-form-item label="存储平台" path="platform">
            <n-select
              v-model:value="editDataForm.platform"
              :options="ossPlatformRef"
              clearable
              placeholder="请选择存储平台"
            />
          </n-form-item>
          <n-form-item label="存储地域" path="region">
            <n-input v-model:value="editDataForm.region" clearable placeholder="请输入存储地域" />
          </n-form-item>
          <n-form-item label="公网节点" path="publicEndpoint">
            <n-input v-model:value="editDataForm.publicEndpoint" clearable placeholder="请输入公网节点" />
          </n-form-item>
          <n-form-item label="内网节点" path="privateEndpoint">
            <n-input v-model:value="editDataForm.privateEndpoint" clearable placeholder="请输入内网节点" />
          </n-form-item>
          <n-form-item label="AccessKey" path="accessKey">
            <n-input v-model:value="editDataForm.accessKey" clearable placeholder="请输入AccessKey" />
          </n-form-item>
          <n-form-item label="AccessSecret" path="accessSecret">
            <n-input
              v-model:value="editDataForm.accessSecret"
              clearable
              placeholder="请输入新的AccessSecret (不输入则不改变)"
            />
          </n-form-item>
          <n-form-item label="备注信息" path="remark">
            <n-input
              v-model:value="editDataForm.remark"
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
          <n-button type="primary" @click="editData"> 确定</n-button>
        </n-flex>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import StrixBlock from '@/components/common/StrixBlock.vue'
import StrixTag from '@/components/common/StrixTag.vue'
import { http } from '@/plugins/axios'
import { usePage } from '@/composables/usePage.ts'
import { useDict } from '@/composables/useDict.ts'
import { createStrixMessage } from '@/utils/strix-message'
import { handleOperate } from '@/utils/strix-table-tool'
import { differenceWith, find, isEqual, pick } from 'lodash-es'
import { type DataTableColumns, type FormRules, NDataTable, NScrollbar, NSpin, NTabPane, NTabs, NTag } from 'naive-ui'

// 本页面操作提示关键词
const _baseName = '存储服务'

// 加载字典
const ossPlatformRef = useDict('OssPlatform')

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
    key: null,
    name: null,
    platform: null,
    region: null,
    publicEndpoint: null,
    privateEndpoint: null,
    accessKey: null,
    accessSecret: null,
    remark: null
  },
  {
    key: null,
    name: null,
    platform: null,
    region: null,
    publicEndpoint: null,
    privateEndpoint: null,
    accessKey: null,
    accessSecret: null,
    remark: null
  }
)

// 展示列信息
const dataColumns: DataTableColumns = [
  {
    type: 'expand',
    renderExpand: (row: any) => {
      if (!row.expandTab) row.expandTab = 'bucket'
      if (!row.loaded) {
        return h(NSpin, { size: 'large', description: '加载中...' })
      }

      const expandOssBucketChildrenVNode = [
        h(NDataTable, {
          columns: [
            { title: 'Bucket 名称', key: 'name', width: 200 },
            { title: '创建时间', key: 'createdTime', width: 160 },
            { title: '备注', key: 'remark', width: 160 }
          ],
          data: row.buckets,
          rowKey: (row: any) => row.id
        })
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
              key: 'secretType',
              title: '文件权限类型',
              width: 100,
              render(row: any) {
                const tagText = row.secretType === 1 ? '管理端文件' : '用户端文件'
                return h(
                  NTag,
                  { type: row.secretType === 1 ? 'success' : 'info', bordered: false },
                  {
                    default: () => tagText + '/' + row.secretLevel
                  }
                )
              }
            },
            { key: 'remark', title: '备注', width: 150 }
          ],
          data: row.fileGroups,
          rowKey: (row) => row.id
        })
      ]

      return h(
        NTabs,
        {
          type: 'segment',
          animated: true,
          value: row.expandTab,
          'onUpdate:value': (value) => {
            row.expandTab = value
          }
        },
        () => [
          h(NTabPane, { name: 'bucket', tab: '存储空间', class: 'expand-sign-pane' }, () =>
            h(NScrollbar, { xScrollable: true }, () =>
              h('div', { style: 'min-width: 600px; padding-bottom: 10px;' }, [expandOssBucketChildrenVNode])
            )
          ),
          h(NTabPane, { name: 'template', tab: '文件分组', class: 'expand-template-pane' }, () =>
            h(NScrollbar, { xScrollable: true }, () =>
              h('div', { style: 'min-width: 1200px; padding-bottom: 10px;' }, [expandOssFileGroupChildrenVNode])
            )
          )
        ]
      )
    }
  },
  { key: 'key', width: 140, title: '配置 Key' },
  { key: 'name', width: 160, title: '配置名称' },
  {
    key: 'platform',
    width: 120,
    title: '平台',
    align: 'center',
    render(row: any) {
      return h(StrixTag, { value: row.platform, dictName: 'OssPlatform' })
    }
  },
  { key: 'region', width: 120, title: '地域' },
  { key: 'publicEndpoint', width: 180, title: '公网节点' },
  { key: 'privateEndpoint', width: 180, title: '内网节点' },
  { key: 'accessKey', width: 160, title: 'AccessKey' },
  { key: 'remark', width: 180, title: '备注' },
  { key: 'createdTime', width: 180, title: '创建时间' },
  {
    key: 'actions',
    title: '操作',
    align: 'center',
    width: 180,
    render(row: any) {
      return handleOperate([
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
    .get('system/oss', {
      params: getDataListParams.value,
      meta: { operate: `加载${_baseName}列表` }
    })
    .then(({ data: res }) => {
      dataLoading.value = false
      // 清除展开行
      dataExpandedRowKeys.value = []
      dataRef.value = res.data.configs
    })
}
onMounted(getDataList)

const dataExpandedRowKeys = ref<Array<string | number>>([])
const dataExpandedRowKeysChange = (value: Array<string | number>) => {
  // 只获取新展开的
  const diffs = differenceWith(value, dataExpandedRowKeys.value, isEqual)
  dataExpandedRowKeys.value = value
  diffs.forEach((diff) => {
    const row = find(dataRef.value, { id: diff })
    if (row) {
      http.get(`system/oss/${row.id}`, { meta: { operate: `加载${_baseName}信息` } }).then(({ data: res }) => {
        row.buckets = res.data.buckets
        row.fileGroups = res.data.fileGroups
        row.loaded = true
      })
    }
  })
}

const addDataRules: FormRules = {
  key: [
    { required: true, message: '请输入配置 Key', trigger: 'blur' },
    { min: 2, max: 32, message: '配置 Key 长度需在 2 - 32 字之内', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入配置名称', trigger: 'blur' },
    { min: 2, max: 32, message: '配置名称长度需在 2 - 32 字之内', trigger: 'blur' }
  ],
  platform: [{ type: 'number', required: true, message: '请选择平台', trigger: 'change' }],
  region: [
    { required: true, message: '请输入区域', trigger: 'blur' },
    { min: 1, max: 32, message: '区域长度需在 1 - 32 字之内', trigger: 'blur' }
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
    { required: true, message: '请输入 AccessSecret', trigger: 'blur' },
    { max: 64, message: 'AccessSecret 长度需在 64 字之内', trigger: 'blur' }
  ],
  remark: [{ max: 255, message: '备注长度需在 255 字之内', trigger: 'blur' }]
}
const showAddDataModal = () => {
  addDataModalShow.value = true
}
const addData = () => {
  addDataFormRef.value?.validate((errors) => {
    if (errors) return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    http.post('system/oss/update', addDataForm.value, { meta: { operate: `添加${_baseName}` } }).then(() => {
      initDataForm()
      getDataList()
    })
  })
}

const editDataRules: FormRules = {
  key: [
    { required: true, message: '请输入配置 Key', trigger: 'blur' },
    { min: 2, max: 32, message: '配置 Key 长度需在 2 - 32 字之内', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入配置名称', trigger: 'blur' },
    { min: 2, max: 32, message: '配置名称长度需在 2 - 32 字之内', trigger: 'blur' }
  ],
  platform: [{ type: 'number', required: true, message: '请选择平台', trigger: 'change' }],
  region: [
    { required: true, message: '请输入区域', trigger: 'blur' },
    { min: 1, max: 32, message: '区域长度需在 1 - 32 字之内', trigger: 'blur' }
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
  accessSecret: [{ max: 64, message: 'AccessSecret 长度需在 64 字之内', trigger: 'blur' }],
  remark: [{ max: 255, message: '备注长度需在 255 字之内', trigger: 'blur' }]
}
const showEditDataModal = (id: string) => {
  editDataModalShow.value = true
  editDataFormLoading.value = true
  // 加载编辑前信息
  http.get(`system/oss/${id}`, { meta: { operate: `加载${_baseName}信息` } }).then(({ data: res }) => {
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
      .post(`system/oss/update/${editDataId.value}`, editDataForm.value, {
        meta: { operate: `修改${_baseName}` }
      })
      .then(() => {
        initDataForm()
        getDataList()
      })
  })
}

const deleteData = (id: string) => {
  http.post(`system/oss/remove/${id}`, null, { meta: { operate: `删除${_baseName}` } }).then(() => {
    getDataList()
  })
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
