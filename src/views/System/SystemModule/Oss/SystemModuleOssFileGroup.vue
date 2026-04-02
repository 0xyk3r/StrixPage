<template>
  <div :class="{ 'nebula-column-panel-push': showColumnPanel }">
    <strix-block cleanable @clear="clearSearch">
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input-group>
              <n-input v-model:value="listParams.keyword" clearable placeholder="按名称搜索" />
              <n-button ghost type="primary" @click="getDataList">搜索</n-button>
            </n-input-group>
          </n-gi>
          <n-gi :span="1">
            <n-button type="primary" @click="showAdd"> 添加{{ _baseName }}</n-button>
          </n-gi>
          <n-gi span="6 s:2 m:3" class="nebula-export__trigger-gi">
            <n-button quaternary type="primary" @click="showColumnPanel = !showColumnPanel">
              <template #icon><strix-icon icon="columns-3" :size="16" /></template>
              列配置
            </n-button>
            <n-button quaternary type="primary" @click="showExportDialog = true">
              <template #icon><strix-icon icon="download" :size="16" /></template>
              导出
            </n-button>
          </n-gi>
        </n-grid>
        <n-alert style="margin-top: 15px" title="提醒" type="warning">
          文件分组与文件属于强绑定模式，所以文件组创建后不建议进行修改或删除操作，删除会导致该文件组下所有文件无法获取。
        </n-alert>
      </template>
      <n-form :model="listParams" :show-feedback="false" label-placement="left" label-width="auto">
        <n-grid :cols="6" :x-gap="20" :y-gap="5" item-responsive responsive="screen">
          <n-form-item-gi label="存储配置 Key" path="configKey" span="6 s:3 m:2">
            <n-select
              v-model:value="listParams.configKey"
              :options="ossConfigSelectList"
              clearable
              placeholder="请选择存储配置 Key"
              @update:value="getDataList"
            />
          </n-form-item-gi>
        </n-grid>
      </n-form>
    </strix-block>

    <n-data-table
      :columns="visibleColumns"
      :data="dataRef"
      :loading="dataLoading"
      :pagination="pagination"
      :remote="true"
      :row-key="rowKey"
      table-layout="fixed"
    />

    <strix-export-dialog
      v-model:show="showExportDialog"
      :columns="dataColumns"
      :data="dataRef || []"
      :fetch-all-data="fetchAllData"
      :title="_baseName"
    />

    <strix-column-panel v-model:show="showColumnPanel" />

    <n-modal
      v-model:show="addModal"
      :title="'添加' + _baseName"
      class="strix-form-modal"
      preset="card"
      size="huge"
      @after-leave="resetForms"
    >
      <n-form
        ref="addFormRef"
        :model="addForm"
        :rules="addDataRules"
        label-placement="left"
        label-width="auto"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="文件组配置 Key" path="key">
          <n-input v-model:value="addForm.key" clearable placeholder="请输入文件组配置 Key" />
        </n-form-item>
        <n-form-item label="存储配置 Key" path="configKey">
          <n-select
            v-model:value="addForm.configKey"
            :options="ossConfigSelectList"
            clearable
            placeholder="请选择存储配置 Key"
          />
        </n-form-item>
        <n-form-item label="文件组名称" path="name">
          <n-input v-model:value="addForm.name" clearable placeholder="请输入文件组名称" />
        </n-form-item>
        <n-form-item label="Bucket 名称" path="bucketName">
          <n-input v-model:value="addForm.bucketName" clearable placeholder="请输入存储空间 (Bucket) 名称" />
        </n-form-item>
        <n-form-item label="Bucket 域名" path="bucketDomain">
          <n-input v-model:value="addForm.bucketDomain" clearable placeholder="请输入Bucket自定义域名" />
        </n-form-item>
        <n-form-item label="基础路径" path="baseDir">
          <n-input
            v-model:value="addForm.baseDir"
            clearable
            placeholder="请输入基础路径，即文件相对于存储空间的路径，无需/开头"
          />
        </n-form-item>
        <n-form-item label="允许的扩展名" path="allowExtension">
          <n-dynamic-tags
            v-model:value="addForm.allowExtension"
            type="primary"
            @create="handleAllowExtensionCreate"
          />
        </n-form-item>
        <n-form-item label="查看权限类型" path="secretType">
          <n-select
            v-model:value="addForm.secretType"
            :options="ossFileGroupSecretTypeRef"
            clearable
            placeholder="请选择查看权限类型"
          />
        </n-form-item>
        <n-form-item label="查看权限等级" path="secretLevel">
          <n-input-number v-model:value="addForm.secretLevel" clearable placeholder="请输入查看权限等级" />
        </n-form-item>
        <n-form-item label="备注信息" path="remark">
          <n-input
            v-model:value="addForm.remark"
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
          <n-button @click="addModal = false">取消</n-button>
          <n-button type="primary" @click="submitAdd"> 确定</n-button>
        </n-flex>
      </template>
    </n-modal>

    <n-modal
      v-model:show="editModal"
      :title="'修改' + _baseName"
      class="strix-form-modal"
      preset="card"
      size="huge"
      @after-leave="resetForms"
    >
      <n-spin :show="editLoading">
        <n-form
          ref="editFormRef"
          :model="editForm"
          :rules="editDataRules"
          label-placement="left"
          label-width="auto"
          require-mark-placement="right-hanging"
        >
          <n-form-item label="文件组名称" path="name">
            <n-input v-model:value="editForm.name" clearable placeholder="请输入文件组名称" />
          </n-form-item>
          <n-form-item label="Bucket 域名" path="bucketDomain">
            <n-input v-model:value="editForm.bucketDomain" clearable placeholder="请输入Bucket自定义域名" />
          </n-form-item>
          <n-form-item label="基础路径" path="baseDir">
            <n-input
              v-model:value="editForm.baseDir"
              clearable
              placeholder="请输入基础路径，即文件相对于存储空间的路径，无需/开头"
            />
          </n-form-item>
          <n-form-item label="允许的扩展名" path="allowExtension">
            <n-dynamic-tags
              v-model:value="editForm.allowExtension"
              type="primary"
              @create="handleAllowExtensionCreate"
            />
          </n-form-item>
          <n-form-item label="查看权限类型" path="secretType">
            <n-select
              v-model:value="editForm.secretType"
              :options="ossFileGroupSecretTypeRef"
              clearable
              placeholder="请选择查看权限类型"
            />
          </n-form-item>
          <n-form-item label="查看权限等级" path="secretLevel">
            <n-input-number v-model:value="editForm.secretLevel" clearable placeholder="请输入查看权限等级" />
          </n-form-item>
          <n-form-item label="备注信息" path="remark">
            <n-input
              v-model:value="editForm.remark"
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
          <n-button @click="editModal = false">取消</n-button>
          <n-button type="primary" @click="submitEdit"> 确定</n-button>
        </n-flex>
      </template>
    </n-modal>

    <n-modal v-model:show="uploadModalShow" class="strix-form-modal" preset="card" size="huge" title="上传文件">
      <n-upload
        :action="uploadUrl"
        :headers="{ Authorization: `Bearer ${loginToken}` }"
        :max="5"
        :show-remove-button="false"
        directory-dnd
        multiple
      >
        <n-upload-dragger>
          <div style="margin-bottom: 12px">
            <n-icon :depth="3" size="48">
              <StrixIcon icon="package-open"></StrixIcon>
            </n-icon>
          </div>
          <n-text style="font-size: 16px"> 点击或者拖动文件到该区域来上传</n-text>
        </n-upload-dragger>
      </n-upload>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import StrixBlock from '@/components/common/StrixBlock.vue'
import StrixTag from '@/components/common/StrixTag.vue'
import { ossApi } from '@/api/oss'
import type { SelectDataItem } from '@/api/types'
import { useCrud } from '@/composables/useCrud'
import { useDict } from '@/composables/useDict.ts'
import { createStrixMessage } from '@/utils/strix-message'
import { handleOperate } from '@/utils/strix-table-tool'
import { type DataTableColumns, type FormRules } from 'naive-ui'
import { type LoginInfoStore, useLoginInfoStore } from '@/stores/login-info.ts'
import { storeToRefs } from 'pinia'
import StrixExportDialog from '@/components/common/StrixExportDialog.vue'
import StrixColumnPanel from '@/components/common/StrixColumnPanel.vue'
import { createPaginatedFetcher } from '@/composables/useTableExport'
import { useTableColumns } from '@/composables/useTableColumns'
import StrixIcon from '@/components/icon/StrixIcon.vue'

// 本页面操作提示关键词
const _baseName = '文件分组'
const showExportDialog = ref(false)
const fetchAllData = createPaginatedFetcher(ossApi.urls.fileGroupList, 'fileGroups', () => listParams.value)

const loginInfoStore = useLoginInfoStore()
const { loginToken } = storeToRefs(loginInfoStore) as LoginInfoStore

// 加载字典
const ossFileGroupSecretTypeRef = useDict('OssFileGroupSecretType')

const {
  listParams,
  clearSearch,
  pagination,
  rowKey,
  addModal,
  addForm,
  addFormRef,
  editModal,
  editLoading,
  editForm,
  editFormRef,
  showAdd,
  showEdit,
  submitAdd,
  submitEdit,
  deleteRow,
  resetForms
} = useCrud({
  list: {
    keyword: null,
    configKey: null,
    pageIndex: 1,
    pageSize: 10
  },
  fetchList: () => getDataList(),
  addForm: {
    key: null,
    configKey: null,
    name: null,
    bucketName: null,
    bucketDomain: null,
    baseDir: null,
    allowExtension: [],
    secretType: null,
    secretLevel: 1,
    remark: null
  },
  editForm: {
    name: null,
    bucketDomain: null,
    baseDir: null,
    allowExtension: [],
    secretType: null,
    secretLevel: null,
    remark: null
  },
  api: {
    detail: (id: string) => ossApi.fileGroupDetail(id),
    create: (data: any) => ossApi.fileGroupCreate(data),
    update: (id: string, data: any) => ossApi.fileGroupUpdate(id, data),
    remove: (id: string) => ossApi.fileGroupRemove(id)
  },
  hooks: {
    transformAdd: (form: any) => {
      form.allowExtension = form.allowExtension.join(',')
      return form
    },
    transformEdit: (form: any) => {
      form.allowExtension = form.allowExtension.join(',')
      return form
    },
    afterShowEdit: (detail: any) => {
      editForm.value.allowExtension = detail.allowExtension.split(',')
    }
  }
})

// 展示列信息
const dataColumns: DataTableColumns = [
  { key: 'key', title: '文件组 Key', width: 140 },
  { key: 'name', title: '文件组名称', width: 160 },
  { key: 'configKey', title: '存储服务 Key', width: 140 },
  { key: 'bucketName', title: '所属 Bucket', width: 140 },
  { key: 'bucketDomain', title: '自定义域名', width: 240 },
  { key: 'baseDir', title: '基础路径', width: 160 },
  { key: 'allowExtension', title: '允许的拓展名', width: 240 },
  {
    key: 'secretType',
    title: '文件权限类型',
    width: 120,
    align: 'center',
    render(row: any) {
      return h(StrixTag, {
        value: row.secretType,
        dictName: 'OssFileGroupSecretType',
        afterLabel: ' / ' + row.secretLevel
      })
    }
  },
  { key: 'remark', title: '备注', width: 180 },
  {
    key: 'actions',
    title: '操作',
    width: 220,
    align: 'center',
    render(row: any) {
      return handleOperate([
        {
          type: 'info',
          label: '上传文件',
          icon: 'upload',
          onClick: () => showUploadModal(row.key)
        },
        {
          type: 'warning',
          label: '编辑',
          icon: 'square-pen',
          onClick: () => showEdit(row.id)
        },
        {
          type: 'error',
          label: '删除',
          icon: 'trash',
          onClick: () => deleteRow(row.id),
          popconfirm: true,
          popconfirmMessage: '是否确认删除这条数据? 删除后会导致该文件组下的所有文件无法访问！ 且该操作不可恢复!'
        }
      ])
    }
  }
]

// 列可见性与排序
const { visibleColumns, showPanel: showColumnPanel } = useTableColumns(dataColumns)

// 加载列表
const dataRef = ref()
const dataLoading = ref(true)
// 加载数据
const getDataList = () => {
  dataLoading.value = true
  ossApi
    .fileGroupList(listParams.value)
    .then(({ data: res }) => {
      dataLoading.value = false
      dataRef.value = res.data.fileGroups
      pagination.itemCount = res.data.total
    })
}
onMounted(getDataList)

// 加载存储配置选项
const ossConfigSelectList = ref<SelectDataItem[]>([])
const getOssConfigSelectList = () => {
  ossApi.configSelect().then(({ data: res }) => {
    ossConfigSelectList.value = res.data.options
  })
}
onMounted(getOssConfigSelectList)

const handleAllowExtensionCreate = (label: string): string => {
  if (!/^\.?\w+$/.test(label)) {
    createStrixMessage('warning', '操作失败', '请输入正确的文件拓展名')
    return 'error'
  }

  return label.startsWith('.') ? label : '.' + label
}

const uploadModalShow = ref(false)
const uploadFileGroupKey = ref('default')
const uploadUrl = computed(() => `/api/system/common/file/${uploadFileGroupKey.value}/upload`)
const showUploadModal = (key: string) => {
  uploadModalShow.value = true
  uploadFileGroupKey.value = key
}

const addDataRules: FormRules = {
  key: [
    { required: true, message: '请输入配置 Key', trigger: 'blur' },
    { min: 2, max: 32, message: '配置 Key 长度需在 2 - 32 字之内', trigger: 'blur' }
  ],
  configKey: [{ required: true, message: '请选择存储配置', trigger: 'change' }],
  name: [
    { required: true, message: '请输入配置名称', trigger: 'blur' },
    { min: 2, max: 32, message: '配置名称长度需在 2 - 32 字之内', trigger: 'blur' }
  ],
  bucketName: [
    { required: true, message: '请输入 Bucket 名称', trigger: 'blur' },
    { min: 1, max: 64, message: 'Bucket 名称长度需在 1 - 64 字之内', trigger: 'blur' }
  ],
  bucketDomain: [{ max: 64, message: 'Bucket 域名长度需在 64 字之内', trigger: 'blur' }],
  baseDir: [{ max: 64, message: '基础路径长度需在 64 字之内', trigger: 'blur' }],
  allowExtension: [
    {
      trigger: 'change',
      validator(rule, value) {
        if (value.length == 0) return new Error('请填入允许上传的文件拓展名')
        return true
      }
    }
  ],
  secretType: [{ type: 'number', required: true, message: '请选择查看权限类型', trigger: 'change' }],
  secretLevel: [
    { type: 'number', required: true, message: '请填写查看权限等级', trigger: 'blur' },
    { type: 'number', min: 0, max: 10, message: '请输入有效数值 (1-10)', trigger: 'change' }
  ],
  remark: [{ max: 255, message: '备注长度需在 255 字之内', trigger: 'blur' }]
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

// 移除 allowExtension 中的错误项
const removeErrorAllowExtension = (allowExtension: string[]) => {
  if (allowExtension.includes('error')) {
    allowExtension.splice(allowExtension.indexOf('error'), 1)
  }
}
watch(
  () => addForm.value.allowExtension,
  (val) => removeErrorAllowExtension(val)
)
watch(
  () => editForm.value.allowExtension,
  (val) => removeErrorAllowExtension(val)
)
</script>

<style lang="scss" scoped></style>
