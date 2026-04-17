import type { AxiosResponse } from 'axios'
import type { RetResult } from '@/api/types'
import type { MaybeRefOrGetter } from 'vue'

/** 导入字段配置 */
export interface ImportFieldConfig {
  /** API 字段名 */
  key: string
  /** 显示标签（用于列映射和模板表头） */
  label: string
  /** 是否必填 */
  required?: boolean
  /** 字段类型 */
  type?: 'text' | 'number'
  /** 关联字典名称（用于模板提示） */
  dictName?: string
  /** 字典选项（用于模板下拉和标签→值自动转换） */
  dictOptions?: Array<{ label: string; value: any }>
  /** 值转换函数（原始字符串 → 提交值） */
  transform?: (raw: any) => any
}

/** 后端返回的导入结果 */
export interface ImportResult {
  total: number
  successCount: number
  failedCount: number
  skippedCount: number
  errors: ImportError[]
}

/** 单行导入错误 */
export interface ImportError {
  row: number
  field: string
  message: string
}

/** useTableImport 配置 */
export interface UseTableImportConfig {
  fields: MaybeRefOrGetter<ImportFieldConfig[]>
  importApi: (data: {
    items: Record<string, any>[]
    duplicateStrategy: string
  }) => Promise<AxiosResponse<RetResult<ImportResult>>>
  title?: string
}

export function useTableImport(config: UseTableImportConfig) {
  const { importApi, title = '数据' } = config
  const fields = computed(() => toValue(config.fields))

  // ===== 状态 =====
  const step = ref(1)
  const fileInfo = ref<{ name: string; size: number } | null>(null)
  const rawData = ref<any[][]>([])
  const headers = ref<string[]>([])
  const mapping = ref<Record<string, string>>({})
  const validationErrors = ref<Map<number, Map<string, string>>>(new Map())
  const importing = ref(false)
  const importResult = ref<ImportResult | null>(null)
  const duplicateStrategy = ref<'SKIP' | 'UPSERT'>('SKIP')

  // ===== 已映射的字段列表 =====
  const mappedFields = computed(() => {
    const mappedKeys = new Set(Object.values(mapping.value).filter(Boolean))
    return fields.value.filter((f) => mappedKeys.has(f.key))
  })

  // ===== 映射后的数据 =====
  const mappedData = computed<Record<string, any>[]>(() => {
    return rawData.value.map((row) => {
      const obj: Record<string, any> = {}
      headers.value.forEach((header, idx) => {
        const fieldKey = mapping.value[header]
        if (!fieldKey) return
        const field = fields.value.find((f) => f.key === fieldKey)
        let value = row[idx]
        if (value === undefined || value === null) value = ''
        if (field?.transform) {
          value = field.transform(value)
        } else if (field?.dictOptions?.length) {
          // 字典字段：标签 → 值 自动转换
          const strVal = String(value).trim()
          const opt = field.dictOptions.find((o) => String(o.label) === strVal)
          if (opt !== undefined) {
            value = opt.value
          } else if (field.type === 'number' && value !== '') {
            value = Number(value)
          }
        } else if (field?.type === 'number' && value !== '') {
          value = Number(value)
        }
        obj[fieldKey] = value
      })
      return obj
    })
  })

  // ===== 必填字段是否全部映射 =====
  const allRequiredMapped = computed(() => {
    const mappedKeys = new Set(Object.values(mapping.value).filter(Boolean))
    return fields.value.filter((f) => f.required).every((f) => mappedKeys.has(f.key))
  })

  // ===== 有效数据行数（非空行） =====
  const validRowCount = computed(
    () => rawData.value.filter((row) => row.some((cell) => cell !== '' && cell != null)).length
  )

  // ===== 文件解析 =====
  const handleFileChange = async (file: File) => {
    const XLSX = await import('xlsx')
    const data = await file.arrayBuffer()
    const wb = XLSX.read(data, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]!]
    if (!ws) {
      fileInfo.value = null
      return
    }
    const jsonData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

    if (jsonData.length < 2) {
      fileInfo.value = null
      return
    }

    headers.value = (jsonData[0] as any[]).map(String)
    rawData.value = jsonData.slice(1).filter((row) => row.some((cell) => cell !== '' && cell != null))
    fileInfo.value = { name: file.name, size: file.size }
    autoMap()
  }

  // ===== 自动列映射 =====
  const autoMap = () => {
    const map: Record<string, string> = {}
    const usedKeys = new Set<string>()

    for (const header of headers.value) {
      // 精确标签匹配
      let field = fields.value.find((f) => !usedKeys.has(f.key) && f.label === header)
      // 精确 key 匹配
      if (!field) field = fields.value.find((f) => !usedKeys.has(f.key) && f.key === header)
      // 模糊匹配（包含）
      if (!field)
        field = fields.value.find(
          (f) => !usedKeys.has(f.key) && (header.includes(f.label) || f.label.includes(header))
        )

      if (field) {
        map[header] = field.key
        usedKeys.add(field.key)
      }
    }
    mapping.value = map
  }

  // ===== 获取映射下拉选项（排除已选） =====
  const getFieldOptions = (currentHeader: string) => {
    const usedKeys = new Set(
      Object.entries(mapping.value)
        .filter(([h, k]) => h !== currentHeader && k)
        .map(([, k]) => k)
    )
    return [
      { label: '—— 不导入此列 ——', value: '' },
      ...fields.value.map((f) => ({
        label: `${f.label}${f.required ? ' *' : ''}`,
        value: f.key,
        disabled: usedKeys.has(f.key)
      }))
    ]
  }

  // ===== 数据校验 =====
  const validateAll = (): boolean => {
    const errorMap = new Map<number, Map<string, string>>()
    mappedData.value.forEach((row, idx) => {
      const rowErrors = new Map<string, string>()
      for (const field of fields.value) {
        const val = row[field.key]
        if (
          field.required &&
          (val === null ||
            val === undefined ||
            val === '' ||
            (typeof val === 'number' && isNaN(val)))
        ) {
          rowErrors.set(field.key, `${field.label}不能为空`)
        }
      }
      if (rowErrors.size > 0) errorMap.set(idx, rowErrors)
    })
    validationErrors.value = errorMap
    return errorMap.size === 0
  }

  // ===== 错误行数统计 =====
  const errorRowCount = computed(() => validationErrors.value.size)

  // ===== 执行导入 =====
  const doImport = async () => {
    importing.value = true
    try {
      const resp = await importApi({
        items: mappedData.value,
        duplicateStrategy: duplicateStrategy.value
      })
      importResult.value = resp.data.data
      step.value = 4
    } catch (e) {
      importResult.value = {
        total: mappedData.value.length,
        successCount: 0,
        failedCount: mappedData.value.length,
        skippedCount: 0,
        errors: [{ row: -1, field: 'general', message: e instanceof Error ? e.message : '导入请求失败' }]
      }
      step.value = 4
    } finally {
      importing.value = false
    }
  }

  // ===== 下载模板 =====
  const downloadTemplate = async () => {
    const XLSX = await import('xlsx')
    const currentFields = fields.value
    const headerRow = currentFields.map((f) => `${f.label}${f.required ? ' *' : ''}`)
    const ws = XLSX.utils.aoa_to_sheet([headerRow])

    ws['!cols'] = currentFields.map((f) => ({ wch: Math.max(f.label.length * 2 + 4, 15) }))

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '导入模板')

    // 收集有字典选项的字段
    const dictFields = currentFields.filter((f) => f.dictOptions?.length)

    // 添加字典参考表
    if (dictFields.length > 0) {
      const refData: any[][] = [['字段', '可选值', '对应编号']]
      dictFields.forEach((field) => {
        field.dictOptions!.forEach((opt) => {
          refData.push([field.label, opt.label, opt.value])
        })
      })
      const refWs = XLSX.utils.aoa_to_sheet(refData)
      refWs['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 12 }]
      XLSX.utils.book_append_sheet(wb, refWs, '字典参考')
    }

    // 生成 xlsx 数据
    const xlsxData = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer

    // 有字典字段时，注入数据校验到 sheet1.xml
    if (dictFields.length > 0) {
      const { unzipSync, zipSync } = await import('fflate')
      const zipData = unzipSync(new Uint8Array(xlsxData))

      const sheetXmlBytes = zipData['xl/worksheets/sheet1.xml']
      if (sheetXmlBytes) {
        let sheetXml = new TextDecoder().decode(sheetXmlBytes)

        const escXml = (s: string) =>
          s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

        // 构建 dataValidations XML
        let dvCount = 0
        const dvItems = currentFields
          .map((field, colIdx) => {
            if (!field.dictOptions?.length) return ''
            dvCount++
            const labels = field.dictOptions.map((o) => escXml(o.label)).join(',')
            const col = XLSX.utils.encode_col(colIdx)
            const errMsg = escXml(`请输入有效的${field.label}`)
            return `<dataValidation type="list" sqref="${col}2:${col}1001" allowBlank="1" showInputMessage="1" showErrorMessage="1" error="${errMsg}" errorTitle="输入错误"><formula1>"${labels}"</formula1></dataValidation>`
          })
          .filter(Boolean)
          .join('')

        const dvXml = `<dataValidations count="${dvCount}">${dvItems}</dataValidations>`

        // 在 </sheetData> 后插入（OOXML 要求 dataValidations 在 sheetData 之后、pageMargins 之前）
        sheetXml = sheetXml.replace('</sheetData>', `</sheetData>${dvXml}`)
        zipData['xl/worksheets/sheet1.xml'] = new TextEncoder().encode(sheetXml)
      }

      const modifiedZip = zipSync(zipData)
      const blob = new Blob([modifiedZip as unknown as ArrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title}导入模板.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      XLSX.writeFile(wb, `${title}导入模板.xlsx`)
    }
  }

  // ===== 下载错误明细 =====
  const downloadErrors = async () => {
    if (!importResult.value?.errors?.length) return
    const XLSX = await import('xlsx')

    const errorRows = importResult.value.errors
      .filter((e) => e.row >= 0)
      .map((e) => ({
        行号: e.row + 1,
        字段: e.field,
        错误信息: e.message
      }))
    const ws = XLSX.utils.json_to_sheet(errorRows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '错误明细')
    XLSX.writeFile(wb, `${title}导入错误明细.xlsx`)
  }

  // ===== 重置 =====
  const reset = () => {
    step.value = 1
    fileInfo.value = null
    rawData.value = []
    headers.value = []
    mapping.value = {}
    validationErrors.value = new Map()
    importing.value = false
    importResult.value = null
    duplicateStrategy.value = 'SKIP'
  }

  return {
    step,
    fileInfo,
    rawData,
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
    autoMap,
    getFieldOptions,
    validateAll,
    doImport,
    downloadTemplate,
    downloadErrors,
    reset
  }
}
