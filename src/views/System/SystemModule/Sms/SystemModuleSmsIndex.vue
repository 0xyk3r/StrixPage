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
            <n-button type="primary" @click="showAddDataModal()"> 添加{{ _baseName }}</n-button>
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
        <n-form-item label="短信平台" path="platform">
          <n-select
            v-model:value="addDataForm.platform"
            :options="strixSmsPlatformRef"
            clearable
            placeholder="请选择短信平台"
          />
        </n-form-item>
        <n-form-item label="所属地域" path="regionId">
          <n-input v-model:value="addDataForm.regionId" clearable placeholder="请输入所属地域" />
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
          <n-form-item label="短信平台" path="platform">
            <n-select
              v-model:value="editDataForm.platform"
              :options="strixSmsPlatformRef"
              clearable
              placeholder="请选择短信平台"
            />
          </n-form-item>
          <n-form-item label="所属地域" path="regionId">
            <n-input v-model:value="editDataForm.regionId" clearable placeholder="请输入所属地域" />
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
import type { NTagType } from '@/@types/naive-ui'
import StrixBlock from '@/components/StrixBlock.vue'
import StrixTag from '@/components/StrixTag.vue'
import { http } from '@/plugins/axios'
import { usePage } from '@/utils/common-page-util'
import { useDict } from '@/utils/strix-dict-util'
import { createStrixMessage } from '@/utils/strix-message'
import { handleOperate } from '@/utils/strix-table-tool'
import { differenceWith, find, isEqual, pick } from 'lodash-es'
import { type DataTableColumns, type FormRules, NDataTable, NScrollbar, NSpin, NTabPane, NTabs, NTag } from 'naive-ui'

// 本页面操作提示关键词
const _baseName = '短信服务'

// 加载字典
const strixSmsPlatformRef = useDict('StrixSmsPlatform')

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
    regionId: null,
    accessKey: null,
    accessSecret: null,
    remark: null
  },
  {
    key: null,
    name: null,
    platform: null,
    regionId: null,
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
      if (!row.expandTab) row.expandTab = 'sign'
      if (!row.loaded) {
        return h(NSpin, { size: 'large', description: '加载中...' })
      }

      const expandSmsSignChildrenVNode = [
        h(NDataTable, {
          columns: [
            { title: '签名', key: 'name', width: 200 },
            {
              title: '签名状态',
              key: 'status',
              width: 80,
              render: (row: any) => {
                let tagType: NTagType = 'default'
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
                return h(NTag, { type: tagType, bordered: false }, { default: () => tagLabel })
              }
            },
            { title: '创建时间', key: 'createdTime', width: 160 }
          ],
          data: row.signs,
          rowKey: (row: any) => row.id
        })
      ]

      const expandSmsTemplateChildrenVNode = [
        h(NDataTable, {
          columns: [
            { title: '模板 Code', key: 'code', width: 160 },
            { title: '模板名称', key: 'name', width: 160 },
            {
              title: '模板类型',
              key: 'type',
              width: 100,
              render: (row: any) => {
                const tagType: NTagType = 'primary'
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
                return h(NTag, { type: tagType, bordered: false }, { default: () => tagLabel })
              }
            },
            {
              title: '模板状态',
              key: 'status',
              width: 100,
              render: (row: any) => {
                let tagType: NTagType = 'default'
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
                return h(NTag, { type: tagType, bordered: false }, { default: () => tagLabel })
              }
            },
            { title: '模板内容', key: 'content', width: 600 },
            { title: '创建时间', key: 'createdTime', width: 160 }
          ],
          data: row.templates,
          rowKey: (row: any) => row.id
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
          h(NTabPane, { name: 'sign', tab: '短信签名', class: 'expand-sign-pane' }, () =>
            h(NScrollbar, { xScrollable: true }, () =>
              h('div', { style: 'min-width: 600px; padding-bottom: 10px;' }, [expandSmsSignChildrenVNode])
            )
          ),
          h(NTabPane, { name: 'template', tab: '短信模板', class: 'expand-template-pane' }, () =>
            h(NScrollbar, { xScrollable: true }, () =>
              h('div', { style: 'min-width: 1200px; padding-bottom: 10px;' }, [expandSmsTemplateChildrenVNode])
            )
          )
        ]
      )
    }
  },
  { key: 'key', width: 180, title: '配置 Key' },
  { key: 'name', width: 240, title: '配置名称' },
  {
    key: 'platform',
    title: '平台',
    width: 120,
    align: 'center',
    render(row: any) {
      return h(StrixTag, { value: row.platform, dictName: 'StrixSmsPlatform' })
    }
  },
  { key: 'regionId', width: 120, title: '地域', align: 'center' },
  { key: 'accessKey', width: 180, title: 'AccessKey' },
  { key: 'remark', width: 240, title: '备注' },
  { key: 'createdTime', width: 180, title: '创建时间' },
  {
    key: 'actions',
    title: '操作',
    width: 180,
    align: 'center',
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
    .get('system/sms', {
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
      http.get(`system/sms/${row.id}`, { meta: { operate: `加载${_baseName}信息` } }).then(({ data: res }) => {
        row.signs = res.data.signs
        row.templates = res.data.templates
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
  remark: [{ max: 255, message: '备注长度需在 255 字之内', trigger: 'blur' }]
}
const showAddDataModal = () => {
  addDataModalShow.value = true
}
const addData = () => {
  addDataFormRef.value?.validate((errors) => {
    if (errors) return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    http.post('system/sms/update', addDataForm.value, { meta: { operate: `添加${_baseName}` } }).then(() => {
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
  regionId: [
    { required: true, message: '请输入区域', trigger: 'blur' },
    { min: 1, max: 32, message: '区域长度需在 1 - 32 字之内', trigger: 'blur' }
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
  http.get(`system/sms/${id}`, { meta: { operate: `加载${_baseName}信息` } }).then(({ data: res }) => {
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
      .post(`system/sms/update/${editDataId.value}`, editDataForm.value, {
        meta: { operate: `修改${_baseName}` }
      })
      .then(() => {
        initDataForm()
        getDataList()
      })
  })
}

const deleteData = (id: string) => {
  http.post(`system/sms/remove/${id}`, null, { meta: { operate: `删除${_baseName}` } }).then(() => {
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
