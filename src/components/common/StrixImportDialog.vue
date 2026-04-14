<template>
  <n-modal
    v-model:show="show"
    :mask-closable="false"
    class="strix-form-modal"
    preset="card"
    size="small"
    style="max-width: 720px"
    title="导入数据"
    @after-leave="handleAfterLeave"
  >
    <!-- 步骤指示器 -->
    <n-steps :current="step" size="small" class="strix-import__steps">
      <n-step title="上传文件" />
      <n-step title="列映射" />
      <n-step title="预览导入" />
      <n-step title="导入结果" />
    </n-steps>

    <!-- Step 1: 上传文件 -->
    <div v-if="step === 1" class="strix-import__body">
      <n-upload
        accept=".xlsx,.csv"
        :default-upload="false"
        :max="1"
        :show-file-list="false"
        directory-dnd
        @change="handleUpload"
      >
        <n-upload-dragger class="strix-import__dragger">
          <div class="strix-import__dragger-icon">
            <strix-icon icon="upload" :size="40" />
          </div>
          <p class="strix-import__dragger-title">拖拽文件到此处，或点击上传</p>
          <p class="strix-import__dragger-hint">支持 .xlsx、.csv 格式，单次最多 1000 行</p>
        </n-upload-dragger>
      </n-upload>

      <div v-if="fileInfo" class="strix-import__file-info">
        <strix-icon icon="file-text" :size="16" />
        <span>{{ fileInfo.name }}</span>
        <n-tag size="small" :bordered="false">{{ validRowCount }} 行数据</n-tag>
      </div>

      <n-button quaternary type="primary" size="small" class="strix-import__template-btn" @click="downloadTemplate">
        <template #icon>
          <strix-icon icon="download" :size="14" />
        </template>
        下载导入模板
      </n-button>
    </div>

    <!-- Step 2: 列映射 -->
    <div v-if="step === 2" class="strix-import__body">
      <p class="strix-import__section-hint">
        将 Excel 列映射到系统字段（
        <n-text type="error">*</n-text>
        为必填）
      </p>
      <n-scrollbar style="max-height: 360px">
        <table class="strix-import__mapping-table">
          <thead>
          <tr>
            <th>Excel 列</th>
            <th>系统字段</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="header in headers" :key="header">
            <td>{{ header }}</td>
            <td>
              <n-select
                v-model:value="mapping[header]"
                :options="getFieldOptions(header)"
                size="small"
                clearable
                placeholder="不导入此列"
                style="min-width: 180px"
              />
            </td>
          </tr>
          </tbody>
        </table>
      </n-scrollbar>

      <n-alert v-if="!allRequiredMapped" type="warning" :bordered="false" style="margin-top: 12px">
        部分必填字段尚未映射，请检查映射关系
      </n-alert>
    </div>

    <!-- Step 3: 预览导入 -->
    <div v-if="step === 3" class="strix-import__body">
      <div class="strix-import__preview-header">
        <n-space align="center">
          <n-text>共 {{ validRowCount }} 行</n-text>
          <n-text v-if="errorRowCount > 0" type="error">{{ errorRowCount }} 行有校验错误</n-text>
          <n-text v-else type="success">校验全部通过</n-text>
        </n-space>
        <n-space align="center">
          <span class="strix-import__strategy-label">重复数据：</span>
          <n-radio-group v-model:value="duplicateStrategy" size="small">
            <n-radio-button value="SKIP">跳过</n-radio-button>
            <n-radio-button value="UPSERT">覆盖更新</n-radio-button>
          </n-radio-group>
        </n-space>
      </div>
      <n-data-table
        :columns="previewColumns"
        :data="previewData"
        :max-height="320"
        :pagination="{ pageSize: 50 }"
        :row-class-name="previewRowClass"
        size="small"
        virtual-scroll
      />
    </div>

    <!-- Step 4: 导入结果 -->
    <div v-if="step === 4" class="strix-import__body">
      <div v-if="importResult" class="strix-import__result">
        <div class="strix-import__result-summary">
          <n-statistic label="总计" :value="importResult.total" />
          <n-statistic label="成功">
            <template #default>
              <n-text type="success">{{ importResult.successCount }}</n-text>
            </template>
          </n-statistic>
          <n-statistic v-if="importResult.skippedCount > 0" label="跳过">
            <template #default>
              <n-text type="warning">{{ importResult.skippedCount }}</n-text>
            </template>
          </n-statistic>
          <n-statistic v-if="importResult.failedCount > 0" label="失败">
            <template #default>
              <n-text type="error">{{ importResult.failedCount }}</n-text>
            </template>
          </n-statistic>
        </div>

        <div v-if="importResult.successCount === importResult.total" class="strix-import__result-success">
          <strix-icon icon="check-circle" :size="48" />
          <n-text type="success" style="font-size: 16px">全部导入成功！</n-text>
        </div>

        <div v-if="importResult.errors.length > 0" class="strix-import__result-errors">
          <div class="strix-import__result-errors-header">
            <n-text depth="3">错误详情</n-text>
            <n-button quaternary size="small" type="primary" @click="downloadErrors">
              <template #icon>
                <strix-icon icon="download" :size="14" />
              </template>
              下载错误明细
            </n-button>
          </div>
          <n-data-table
            :columns="errorColumns"
            :data="errorTableData"
            :max-height="200"
            :pagination="false"
            size="small"
          />
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <template #action>
      <n-space justify="end">
        <n-button v-if="step > 1 && step < 4" @click="step--">上一步</n-button>
        <n-button v-if="step === 1" :disabled="!fileInfo || validRowCount === 0" type="primary" @click="goToMapping">
          下一步
        </n-button>
        <n-button v-if="step === 2" :disabled="!allRequiredMapped" type="primary" @click="goToPreview">
          下一步
        </n-button>
        <n-button v-if="step === 3" :loading="importing" type="primary" @click="doImport">
          开始导入
        </n-button>
        <n-button v-if="step === 4" type="primary" @click="handleDone">完成</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script lang="ts" setup>
import type { DataTableColumn } from 'naive-ui'
import StrixIcon from '@/components/icon/StrixIcon.vue'
import { type ImportFieldConfig, type ImportResult, useTableImport } from '@/composables/useTableImport'
import type { AxiosResponse } from 'axios'
import type { RetResult } from '@/api/types'

const props = defineProps<{
  fields: ImportFieldConfig[]
  importApi: (data: {
    items: Record<string, any>[]
    duplicateStrategy: string
  }) => Promise<AxiosResponse<RetResult<ImportResult>>>
  title?: string
}>()

const emit = defineEmits<{
  done: []
}>()

const show = defineModel<boolean>('show', { default: false })

const {
  step,
  fileInfo,
  headers,
  mapping,
  mappedData,
  mappedFields,
  allRequiredMapped,
  validRowCount,
  validationErrors,
  errorRowCount,
  importing,
  importResult,
  duplicateStrategy,
  handleFileChange,
  getFieldOptions,
  validateAll,
  doImport,
  downloadTemplate,
  downloadErrors,
  reset
} = useTableImport({
  fields: () => props.fields,
  importApi: props.importApi,
  title: props.title
})

const message = useMessage()

// ===== 上传处理 =====
const handleUpload = ({ file }: { file: { file: File | null } }) => {
  if (file.file) {
    handleFileChange(file.file)
  }
}

// ===== 步骤导航 =====
const goToMapping = () => {
  if (validRowCount.value > 1000) {
    message.warning('数据行数超过 1000 行上限，请减少数据量')
    return
  }
  step.value = 2
}

const goToPreview = () => {
  validateAll()
  step.value = 3
}

// ===== 预览表格列 =====
const previewColumns = computed<DataTableColumn[]>(() => {
  const cols: DataTableColumn[] = mappedFields.value.map((field) => ({
    key: field.key,
    title: field.label,
    width: 140,
    ellipsis: { tooltip: true }
  }))
  cols.push({
    key: '_validation',
    title: '校验',
    width: 180,
    render(_, rowIndex) {
      const errors = validationErrors.value.get(rowIndex)
      if (errors && errors.size > 0) {
        const msgs = Array.from(errors.values())
        return h('span', { style: 'color: var(--n-text-color-error, #d03050)' }, msgs.join('；'))
      }
      return h('span', { style: 'color: var(--n-text-color-success, #18a058)' }, '✓')
    }
  })
  return cols
})

// ===== 预览数据 =====
const previewData = computed(() => mappedData.value)

// ===== 预览行样式 =====
const previewRowClass = (_: any, rowIndex: number) => {
  return validationErrors.value.has(rowIndex) ? 'strix-import-error-row' : ''
}

// ===== 错误结果表格 =====
const errorColumns: DataTableColumn[] = [
  { key: 'row', title: '行号', width: 80 },
  { key: 'field', title: '字段', width: 120 },
  { key: 'message', title: '错误信息', ellipsis: { tooltip: true } }
]

const errorTableData = computed(
  () =>
    importResult.value?.errors
      .filter((e) => e.row >= 0)
      .map((e) => ({ row: e.row + 1, field: e.field, message: e.message })) ?? []
)

// ===== 完成处理 =====
const handleDone = () => {
  show.value = false
  if (importResult.value && importResult.value.successCount > 0) {
    emit('done')
  }
}

const handleAfterLeave = () => {
  reset()
}
</script>

<style lang="scss" scoped>
.strix-import__steps {
  margin-bottom: $space-4;
}

.strix-import__body {
  min-height: 200px;
}

.strix-import__dragger {
  padding: $space-6 $space-4;
  text-align: center;
}

.strix-import__dragger-icon {
  color: var(--strix-text-muted);
  margin-bottom: $space-2;
}

.strix-import__dragger-title {
  font-size: $text-sm;
  color: var(--strix-text-primary);
  margin: 0 0 $space-1;
}

.strix-import__dragger-hint {
  font-size: $text-xs;
  color: var(--strix-text-muted);
  margin: 0;
}

.strix-import__file-info {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-top: $space-3;
  padding: $space-2 $space-3;
  background: var(--strix-bg-surface);
  border-radius: $radius-sm;
  font-size: $text-xs;
}

.strix-import__template-btn {
  margin-top: $space-3;
}

.strix-import__section-hint {
  font-size: $text-xs;
  color: var(--strix-text-secondary);
  margin: 0 0 $space-3;
}

.strix-import__mapping-table {
  width: 100%;
  border-collapse: collapse;
  font-size: $text-xs;

  th,
  td {
    padding: $space-2 $space-3;
    text-align: left;
    border-bottom: 1px solid var(--strix-border-subtle);
  }

  th {
    font-weight: $weight-semibold;
    color: var(--strix-text-secondary);
    background: var(--strix-bg-surface);
  }
}

.strix-import__preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-3;
}

.strix-import__strategy-label {
  font-size: $text-xs;
  color: var(--strix-text-secondary);
}

:deep(.strix-import-error-row td) {
  background: rgba(208, 48, 80, 0.06) !important;
}

.strix-import__result {
  padding: $space-2 0;
}

.strix-import__result-summary {
  display: flex;
  gap: $space-6;
  justify-content: center;
  margin-bottom: $space-4;
}

.strix-import__result-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
  padding: $space-4;
  color: var(--strix-text-success, #18a058);
}

.strix-import__result-errors {
  margin-top: $space-3;
}

.strix-import__result-errors-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-2;
}
</style>
