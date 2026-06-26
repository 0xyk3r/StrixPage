<template>
  <div>
    <!-- 搜索栏 -->
    <strix-block>
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input v-model:value="keyword" clearable placeholder="按名称或标识搜索" @keydown.enter="loadData" />
          </n-gi>
          <n-gi span="6 s:3 m:4" class="nebula-export__trigger-gi">
            <n-space align="center" :size="4">
              <n-button v-auth="'system:config:add'" type="primary" @click="showAdd">
                <template #icon>
                  <strix-icon icon="plus" :size="16" />
                </template>
                新增配置
              </n-button>
              <n-button :loading="loading" quaternary type="primary" @click="loadData">
                <template #icon>
                  <strix-icon icon="refresh-cw" :size="16" />
                </template>
                刷新
              </n-button>
            </n-space>
          </n-gi>
        </n-grid>
      </template>
    </strix-block>

    <!-- 配置列表 -->
    <n-data-table
      :columns="columns"
      :data="filteredData"
      :loading="loading"
      :bordered="false"
      :single-line="false"
      :row-key="(row: SystemConfigItem) => row.id"
      size="small"
    />

    <!-- 新增/编辑模态框 -->
    <n-modal
      v-model:show="showModal"
      class="strix-form-modal"
      preset="card"
      :title="isEdit ? '编辑配置' : '新增配置'"
      style="width: 560px"
    >
      <n-form ref="formRef" :model="formModel" :rules="formRules" label-placement="left" label-width="80">
        <n-form-item label="配置标识" path="key">
          <n-input v-model:value="formModel.key" :disabled="isEdit" placeholder="如 system.login.captcha" />
        </n-form-item>
        <n-form-item label="配置名称" path="name">
          <n-input v-model:value="formModel.name" placeholder="如 登录验证码开关" />
        </n-form-item>
        <n-form-item label="配置类型" path="type">
          <n-select v-model:value="formModel.type" :options="typeOptions" placeholder="选择类型" />
        </n-form-item>
        <n-form-item label="配置值" path="value">
          <n-input
            v-if="formModel.type !== 1"
            v-model:value="formModel.value"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 6 }"
            placeholder="请输入配置值"
          />
          <n-switch v-else v-model:value="switchValue" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input
            v-model:value="formModel.remark"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 4 }"
            placeholder="配置说明 (可选)"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-flex justify="end">
          <n-button @click="showModal = false">取消</n-button>
          <n-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</n-button>
        </n-flex>
      </template>
    </n-modal>
    <StrixCommentPanel v-bind="commentPanelProps" />
  </div>
</template>

<script lang="ts" setup>
import type { SystemConfigItem } from '@/api/system-config'
import { systemConfigApi } from '@/api/system-config'
import { handleOperate } from '@/utils/strix-table-tool'
import { useFormSchema } from '@/composables/useFormSchema'
import type { DataTableColumn, FormInst } from 'naive-ui'
import { NTag } from 'naive-ui'
import StrixCommentPanel from '@/components/common/StrixCommentPanel.vue'
import { useComment } from '@/composables/useComment'

const loading = ref(false)
const data = ref<SystemConfigItem[]>([])
const keyword = ref('')

const filteredData = computed(() => {
  if (!keyword.value) return data.value
  const kw = keyword.value.toLowerCase()
  return data.value.filter((item) => item.name.toLowerCase().includes(kw) || item.key.toLowerCase().includes(kw))
})

const showModal = ref(false)
const isEdit = ref(false)
const editId = ref('')
const submitLoading = ref(false)
const formRef = ref<FormInst | null>(null)
const formModel = ref({
  key: '',
  name: '',
  type: 2 as number,
  value: '',
  remark: ''
})

const switchValue = computed({
  get: () => formModel.value.value === 'true',
  set: (val: boolean) => {
    formModel.value.value = val ? 'true' : 'false'
  }
})

const typeOptions = [
  { label: '开关', value: 1 },
  { label: '内容', value: 2 }
]

const schemaGroup = computed(() => (isEdit.value ? 'update' : 'insert'))
const formRules = useFormSchema('SystemConfigUpdateReq', schemaGroup)

const { commentButton, panelProps: commentPanelProps } = useComment('SystemConfig')

const loadData = async () => {
  try {
    loading.value = true
    const { data: res } = await systemConfigApi.list()
    data.value = res.data?.items ?? []
  } catch (e) {
    console.error('加载配置列表失败', e)
  } finally {
    loading.value = false
  }
}

const showAdd = () => {
  isEdit.value = false
  editId.value = ''
  formModel.value = { key: '', name: '', type: 2, value: '', remark: '' }
  showModal.value = true
}

const showEdit = (row: SystemConfigItem) => {
  isEdit.value = true
  editId.value = row.id
  formModel.value = {
    key: row.key,
    name: row.name,
    type: row.type,
    value: row.value ?? '',
    remark: row.remark ?? ''
  }
  showModal.value = true
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  try {
    submitLoading.value = true
    if (isEdit.value) {
      await systemConfigApi.update(editId.value, formModel.value)
    } else {
      await systemConfigApi.add(formModel.value)
    }
    showModal.value = false
    await loadData()
  } catch (e) {
    console.error('保存配置失败', e)
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = async (row: SystemConfigItem) => {
  await systemConfigApi.remove(row.id)
  await loadData()
}

const formatTime = (time: string | null) => {
  if (!time) return '-'
  return time.replace('T', ' ').substring(0, 19)
}

const columns: DataTableColumn<SystemConfigItem>[] = [
  { title: '配置标识', key: 'key', width: 200, ellipsis: { tooltip: true } },
  { title: '配置名称', key: 'name', width: 160 },
  {
    title: '类型',
    key: 'type',
    width: 80,
    render: (row) =>
      h(NTag, { type: row.type === 1 ? 'info' : 'success', size: 'small', bordered: false }, () =>
        row.type === 1 ? '开关' : '内容'
      )
  },
  {
    title: '配置值',
    key: 'value',
    ellipsis: { tooltip: true },
    render: (row) => {
      if (row.type === 1) {
        return h(NTag, { type: row.value === 'true' ? 'success' : 'default', size: 'small', bordered: false }, () =>
          row.value === 'true' ? '开启' : '关闭'
        )
      }
      return row.value ?? '-'
    }
  },
  { title: '备注', key: 'remark', ellipsis: { tooltip: true } },
  {
    title: '更新时间',
    key: 'updatedTime',
    width: 160,
    render: (row) => formatTime(row.updatedTime)
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    fixed: 'right',
    render: (row) =>
      handleOperate([
        commentButton(row),
        {
          label: '编辑',
          icon: 'edit',
          auth: 'system:config:update',
          onClick: () => showEdit(row)
        },
        {
          type: 'error',
          label: '删除',
          icon: 'trash',
          auth: 'system:config:remove',
          popconfirm: true,
          popconfirmMessage: `确定删除配置「${row.name}」吗？`,
          onClick: () => handleDelete(row)
        }
      ])
  }
]

onMounted(() => loadData())
</script>
