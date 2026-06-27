<template>
  <div class="ai-model-config-page">
    <strix-block cleanable @clear="clearSearch">
      <template #body>
        <n-grid :cols="6" :x-gap="20" :y-gap="10" item-responsive responsive="screen">
          <n-gi span="6 s:3 m:2">
            <n-input v-model:value="keyword" clearable placeholder="搜索模型名称或 Key" @keydown.enter="loadList" />
          </n-gi>
          <n-gi span="2">
            <n-select
              v-model:value="filterType"
              :options="typeOptions"
              clearable
              placeholder="模型类型"
              style="width: 160px"
              @update:value="loadList"
            />
          </n-gi>
          <n-gi span="2">
            <n-button type="primary" @click="showAdd">添加模型配置</n-button>
          </n-gi>
        </n-grid>
      </template>
    </strix-block>

    <n-data-table
      :columns="columns"
      :data="filteredList"
      :loading="loading"
      :row-key="(row: AiModelConfigResp) => row.id"
      :scroll-x="scrollX"
      table-layout="fixed"
      remote
    />

    <n-modal
      v-model:show="showModal"
      :title="editId ? '编辑模型配置' : '添加模型配置'"
      class="strix-form-modal"
      preset="card"
      size="huge"
      style="max-width: 720px"
      @after-leave="resetForm"
    >
      <ai-model-config-form
        ref="formRef"
        :edit-id="editId"
        :initial-data="editData"
        @saved="onSaved"
        @cancel="showModal = false"
      />
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import { h } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import { NButton, NSwitch, NTag } from 'naive-ui'
import type { AiModelConfigResp } from '@/api/ai'
import { aiApi } from '@/api/ai'
import AiModelConfigForm from './AiModelConfigForm.vue'
import { useTableColumns } from '@/composables/useTableColumns.ts'
import { handleOperate } from '@/utils/strix-table-tool.ts'

const message = useMessage()

const list = ref<AiModelConfigResp[]>([])
const loading = ref(false)
const showModal = ref(false)
const editId = ref('')
const editData = ref<AiModelConfigResp | null>(null)
const formRef = ref()
const keyword = ref('')
const filterType = ref<number | null>(null)

const MODEL_TYPE_LABEL: Record<number, string> = {
  1: 'TEXT',
  2: 'VISION',
  3: 'TTS',
  4: 'STT',
  5: 'IMAGE_GEN',
  6: 'ASR'
}

const MODEL_TYPE_COLOR: Record<number, string> = {
  1: 'info',
  2: 'success',
  3: 'warning',
  4: 'error',
  5: 'default',
  6: 'warning'
}

const typeOptions = Object.entries(MODEL_TYPE_LABEL).map(([v, l]) => ({
  label: l,
  value: Number(v)
}))

const filteredList = computed(() => {
  return list.value.filter((item) => {
    const matchKeyword = !keyword.value || item.name.includes(keyword.value) || item.key.includes(keyword.value)
    const matchType = filterType.value === null || item.type === filterType.value
    return matchKeyword && matchType
  })
})

const loadList = () => {
  loading.value = true
  aiApi
    .modelConfigList()
    .then((res) => {
      list.value = (res.data?.data ?? []) as AiModelConfigResp[]
    })
    .finally(() => {
      loading.value = false
    })
}

const clearSearch = () => {
  keyword.value = ''
  filterType.value = null
  loadList()
}

const showAdd = () => {
  editId.value = ''
  editData.value = null
  showModal.value = true
}

const showEdit = (row: AiModelConfigResp) => {
  editId.value = row.id
  editData.value = row
  showModal.value = true
}

function onSaved() {
  showModal.value = false
  loadList()
}

function resetForm() {
  editId.value = ''
  editData.value = null
}

function deleteRow(id: string) {
  aiApi.modelConfigRemove(id).then(() => {
    message.success('删除成功')
    loadList()
  })
}

async function testConnection(row: AiModelConfigResp) {
  const msg = message.loading('正在测试连通性...', { duration: 0 })
  try {
    const res = await aiApi.modelConfigTest(row.id)
    msg.destroy()
    if (res.data?.code === 200) {
      message.success(res.data.data ?? '连通性测试通过')
    } else {
      message.error(res.data?.msg ?? '连通性测试失败')
    }
  } catch {
    msg.destroy()
    message.error('连通性测试失败')
  }
}

const columns: DataTableColumns<AiModelConfigResp> = [
  { title: 'Key', key: 'key', width: 240, ellipsis: true },
  { title: '名称', key: 'name', width: 240, ellipsis: true },
  {
    title: '类型',
    key: 'type',
    width: 100,
    render: (row) =>
      h(NTag, { type: MODEL_TYPE_COLOR[row.type] as any, size: 'small' }, () => MODEL_TYPE_LABEL[row.type] ?? '未知')
  },
  { title: '模型名称', key: 'modelName', width: 240, ellipsis: true },
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) =>
      h(NSwitch, {
        value: row.status === 1,
        disabled: true,
        size: 'small'
      })
  },
  { title: '备注', key: 'remark', width: 200, ellipsis: true },
  {
    title: '操作',
    key: 'actions',
    width: 130,
    fixed: 'right',
    render(row) {
      return handleOperate([
        {
          type: 'info',
          label: '测试',
          icon: 'plug',
          disabled: row.type > 2,
          onClick: () => testConnection(row)
        },
        {
          type: 'warning',
          label: '编辑',
          icon: 'square-pen',
          onClick: () => showEdit(row)
        },
        {
          type: 'error',
          label: '删除',
          icon: 'trash',
          onClick: () => deleteRow(row.id),
          popconfirm: true,
          popconfirmMessage: `确认删除模型配置「${row.name}」？`
        }
      ])
    }
  }
]

const { scrollX } = useTableColumns(columns as unknown as DataTableColumns)

onMounted(() => loadList())
</script>

<style lang="scss" scoped>
.ai-model-config-page {
  padding: 16px;
}
</style>
