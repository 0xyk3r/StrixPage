<template>
  <n-modal v-model:show="show" preset="card" :title="mode === 'export' ? '导出字典' : '导入字典'" style="width: 680px">
    <!-- 导出模式 -->
    <div v-if="mode === 'export'">
      <n-space vertical :size="12">
        <n-text>选择要导出的字典：</n-text>
        <n-checkbox-group v-model:value="selectedKeys">
          <n-space vertical :size="4">
            <n-checkbox v-for="d in dictList" :key="d.key" :value="d.key" :label="`${d.name} (${d.key})`" />
          </n-space>
        </n-checkbox-group>
        <n-space>
          <n-button size="small" @click="selectedKeys = dictList.map(d => d.key)">全选</n-button>
          <n-button size="small" @click="selectedKeys = []">取消全选</n-button>
        </n-space>
      </n-space>
    </div>

    <!-- 导入模式 -->
    <div v-else>
      <n-space vertical :size="12">
        <n-upload :max="1" accept=".json" :default-upload="false" @change="handleFileChange">
          <n-button>选择 JSON 文件</n-button>
        </n-upload>

        <template v-if="importPreview.length > 0">
          <n-text strong>预览 ({{ importPreview.length }} 个字典)</n-text>
          <n-data-table
            :columns="previewColumns"
            :data="importPreview"
            :bordered="false"
            :single-line="false"
            size="small"
            :max-height="300"
            :pagination="false"
          />

          <n-form-item label="冲突策略" label-placement="left">
            <n-radio-group v-model:value="conflictStrategy">
              <n-radio value="SKIP">跳过</n-radio>
              <n-radio value="OVERWRITE">覆盖</n-radio>
              <n-radio value="RENAME">重命名</n-radio>
            </n-radio-group>
          </n-form-item>
        </template>
      </n-space>
    </div>

    <template #footer>
      <n-flex justify="end">
        <n-button @click="show = false">取消</n-button>
        <n-button
          v-if="mode === 'export'"
          type="primary"
          :loading="processing"
          :disabled="selectedKeys.length === 0"
          @click="handleExport"
        >
          导出 ({{ selectedKeys.length }})
        </n-button>
        <n-button
          v-else
          type="primary"
          :loading="processing"
          :disabled="importPreview.length === 0"
          @click="handleImport"
        >
          导入
        </n-button>
      </n-flex>
    </template>
  </n-modal>
</template>

<script lang="ts" setup>
import { dictApi } from '@/api/dict'
import type { DictItem } from '@/api/dict'
import type { DataTableColumn, UploadFileInfo } from 'naive-ui'

const props = defineProps<{
  mode: 'export' | 'import'
  dictList: DictItem[]
}>()
const show = defineModel<boolean>('show', { default: false })
const emit = defineEmits<{ success: [] }>()

const processing = ref(false)
const selectedKeys = ref<string[]>([])
const importPreview = ref<any[]>([])
const conflictStrategy = ref('SKIP')

const previewColumns: DataTableColumn[] = [
  { title: '键名', key: 'key', width: 160 },
  { title: '名称', key: 'name' },
  { title: '数据项数', key: 'dataCount', width: 100, render: (row: any) => String(row.dictDataList?.length ?? 0) }
]

async function handleExport() {
  try {
    processing.value = true
    const { data: res } = await dictApi.exportDicts({ dictKeys: selectedKeys.value })
    const json = JSON.stringify(res.data?.dicts ?? res.data ?? [], null, 2)
    downloadJson(json, `strix-dicts-export-${Date.now()}.json`)
    show.value = false
  } finally {
    processing.value = false
  }
}

function downloadJson(json: string, filename: string) {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function handleFileChange(data: { fileList: UploadFileInfo[] }) {
  const file = data.fileList[0]?.file
  if (!file) {
    importPreview.value = []
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target?.result as string)
      importPreview.value = Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      const message = useMessage()
      message.error('JSON 文件解析失败')
      importPreview.value = []
    }
  }
  reader.readAsText(file)
}

async function handleImport() {
  try {
    processing.value = true
    await dictApi.importDicts({ dicts: importPreview.value, conflictStrategy: conflictStrategy.value })
    show.value = false
    emit('success')
  } finally {
    processing.value = false
  }
}

watch(show, (val) => {
  if (val) {
    selectedKeys.value = []
    importPreview.value = []
    conflictStrategy.value = 'SKIP'
  }
})
</script>
