<template>
  <n-modal
    v-model:show="show"
    :mask-closable="true"
    class="strix-form-modal"
    preset="card"
    size="small"
    style="max-width: 460px"
    title="导出数据"
    @after-leave="resetConfig"
  >
    <div class="nebula-export">
      <!-- 导出范围 -->
      <div class="nebula-export__section">
        <div class="nebula-export__label">导出范围</div>
        <n-radio-group v-model:value="config.scope">
          <n-space>
            <n-radio-button value="current">当前页</n-radio-button>
            <n-radio-button v-if="canFetchAll" value="all">全部数据</n-radio-button>
            <n-radio-button v-if="hasSelection" value="selected"> 已选 ({{ selectedCount }}) </n-radio-button>
          </n-space>
        </n-radio-group>
      </div>

      <!-- 文件格式 -->
      <div class="nebula-export__section">
        <div class="nebula-export__label">文件格式</div>
        <n-radio-group v-model:value="config.format">
          <n-space>
            <n-radio-button value="xlsx">Excel (.xlsx)</n-radio-button>
            <n-radio-button value="csv">CSV (.csv)</n-radio-button>
          </n-space>
        </n-radio-group>
      </div>

      <!-- 导出列选择 -->
      <div class="nebula-export__section">
        <div class="nebula-export__label">
          导出列
          <span class="nebula-export__col-actions">
            <n-button quaternary size="tiny" type="primary" @click="toggleAll(true)">全选</n-button>
            <n-button quaternary size="tiny" @click="toggleAll(false)">全不选</n-button>
          </span>
        </div>
        <div class="nebula-export__columns">
          <n-checkbox
            v-for="col in config.columns"
            :key="col.key"
            v-model:checked="col.enabled"
            class="nebula-export__col-item"
          >
            {{ col.title }}
          </n-checkbox>
        </div>
      </div>

      <!-- 文件名 -->
      <div class="nebula-export__section">
        <div class="nebula-export__label">文件名</div>
        <n-input v-model:value="config.filename" placeholder="请输入文件名">
          <template #suffix>
            <span class="nebula-export__ext">.{{ config.format }}</span>
          </template>
        </n-input>
      </div>
    </div>

    <template #action>
      <n-space justify="end">
        <n-button @click="show = false">取消</n-button>
        <n-button :disabled="!hasEnabledColumns" :loading="exporting" type="primary" @click="handleExport">
          导出
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script lang="ts" setup>
import type { DataTableColumn } from 'naive-ui'
import {
  type ExportConfig,
  exportData,
  type ExportFormat,
  type ExportScope,
  extractExportableColumns,
  generateFilename
} from '@/composables/useTableExport'

const props = withDefaults(
  defineProps<{
    /** n-data-table 列定义 */
    columns: DataTableColumn[]
    /** 当前页数据 */
    data: any[]
    /** 页面标题，用于生成默认文件名 */
    title: string
    /** 已选行数据（配合 checked-row-keys） */
    selectedRows?: any[]
    /** 获取全部数据的方法 */
    fetchAllData?: () => Promise<any[]>
  }>(),
  {
    selectedRows: () => [],
    fetchAllData: undefined
  }
)

const show = defineModel<boolean>('show', { default: false })

const canFetchAll = computed(() => typeof props.fetchAllData === 'function')
const hasSelection = computed(() => props.selectedRows.length > 0)
const selectedCount = computed(() => props.selectedRows.length)

const defaultConfig = (): ExportConfig => ({
  scope: 'current' as ExportScope,
  format: 'xlsx' as ExportFormat,
  columns: extractExportableColumns(props.columns),
  filename: generateFilename(props.title)
})

const config = ref<ExportConfig>(defaultConfig())
const exporting = ref(false)

const hasEnabledColumns = computed(() => config.value.columns.some((c) => c.enabled))

const toggleAll = (enabled: boolean) => {
  config.value.columns.forEach((c) => (c.enabled = enabled))
}

const resetConfig = () => {
  config.value = defaultConfig()
  exporting.value = false
}

const message = useMessage()

const handleExport = async () => {
  exporting.value = true
  try {
    let data: any[]
    switch (config.value.scope) {
      case 'selected':
        data = props.selectedRows
        break
      case 'all':
        if (props.fetchAllData) {
          data = await props.fetchAllData()
        } else {
          data = props.data
        }
        break
      default:
        data = props.data
    }

    if (!data || data.length === 0) {
      message.warning('没有可导出的数据')
      exporting.value = false
      return
    }

    await exportData(data, config.value)
    message.success(`已导出 ${data.length} 条数据`)
    show.value = false
  } catch (e) {
    message.error('导出失败，请重试')
    console.error('Export error:', e)
  } finally {
    exporting.value = false
  }
}

watch(show, (val) => {
  if (val) {
    config.value = defaultConfig()
  }
})
</script>
