import type { FormItemRule, FormRules } from 'naive-ui'
import { formSchemaApi } from '@/api/form-schema'
import type { FieldSchema, FormSchemaResp, SchemaOverrides } from '@/api/form-schema'

/** 密码复杂度校验器 */
function passwordComplexityValidator(_rule: FormItemRule, value: string): boolean | Error {
  if (!value) return true
  let categories = 0
  if (/[A-Z]/.test(value)) categories++
  if (/[a-z]/.test(value)) categories++
  if (/\d/.test(value)) categories++
  if (/[^A-Za-z0-9]/.test(value)) categories++
  if (value.length < 8 || categories < 3) {
    return new Error('密码需至少8位, 包含大写字母、小写字母、数字、特殊字符中的至少3类')
  }
  return true
}

/** 构建长度提示信息 */
function buildLengthMessage(label: string, min?: number, max?: number): string {
  if (min != null && max != null) return `${label}长度应为 ${min}~${max} 个字符`
  if (min != null) return `${label}长度不能少于 ${min} 个字符`
  if (max != null) return `${label}长度不能超过 ${max} 个字符`
  return ''
}

/** 将单个字段 Schema 转换为 Naive UI FormItemRule[] */
function convertToNaiveRules(config: FieldSchema, currentGroup?: string | null): FormItemRule[] {
  const rules: FormItemRule[] = []
  const label = config.label || ''
  const isSelect = config.type === 'select'
  const isNumber = config.type === 'number'

  // 必填规则 (检查 requiredGroups: 当前 group 是否在必填组中)
  const isRequired = config.required && (
    !currentGroup ||
    !config.requiredGroups ||
    config.requiredGroups.length === 0 ||
    config.requiredGroups.includes(currentGroup as 'insert' | 'update')
  )
  if (isRequired) {
    if (isSelect) {
      rules.push({
        required: true,
        trigger: 'change',
        validator(_rule: FormItemRule, value: unknown) {
          if (value === null || value === undefined || value === '') {
            return new Error(`请选择${label}`)
          }
          return true
        }
      })
    } else if (isNumber) {
      rules.push({
        type: 'number',
        required: true,
        message: `请输入${label}`,
        trigger: 'change'
      })
    } else {
      rules.push({
        required: true,
        message: `请输入${label}`,
        trigger: 'blur'
      })
    }
  }

  // 长度/范围规则
  if (config.min != null || config.max != null) {
    if (isNumber) {
      if (config.min != null && config.max != null) {
        rules.push({
          type: 'number',
          min: config.min,
          max: config.max,
          message: `请输入有效${label} (${config.min}-${config.max})`,
          trigger: 'change'
        })
      } else if (config.min != null) {
        rules.push({ type: 'number', min: config.min, message: `${label}不能小于 ${config.min}`, trigger: 'change' })
      } else if (config.max != null) {
        rules.push({ type: 'number', max: config.max, message: `${label}不能大于 ${config.max}`, trigger: 'change' })
      }
    } else {
      rules.push({
        min: config.min,
        max: config.max,
        message: buildLengthMessage(label, config.min, config.max),
        trigger: 'blur'
      })
    }
  }

  // 正则规则
  if (config.pattern) {
    rules.push({
      pattern: new RegExp(config.pattern),
      message: `${label}格式不正确`,
      trigger: 'blur'
    })
  }

  // 密码复杂度规则
  if (config.complexity) {
    rules.push({
      validator: passwordComplexityValidator,
      trigger: 'blur'
    })
  }

  return rules
}

/** Schema 缓存 key 前缀 */
const CACHE_PREFIX = 'form-schema:'

/**
 * 从后端获取表单 Schema 并转换为 Naive UI FormRules
 *
 * @param dtoName DTO 名称 (如 'SystemManagerUpdateReq')
 * @param group 验证组: 'insert' / 'update' / Ref<'insert' | 'update'>. 不传则包含所有字段
 * @param overrides 前端专有规则覆盖/追加
 * @returns 响应式 FormRules (异步加载, 初始为空对象)
 */
export function useFormSchema(
  dtoName: string,
  group?: 'insert' | 'update' | Ref<'insert' | 'update'>,
  overrides?: SchemaOverrides
): Ref<FormRules> {
  const rules = ref<FormRules>({})
  const schema = ref<FormSchemaResp | null>(null)

  const loadSchema = async () => {
    const cacheKey = CACHE_PREFIX + dtoName
    const cached = sessionStorage.getItem(cacheKey)

    if (cached) {
      try {
        schema.value = JSON.parse(cached)
        return
      } catch {
        sessionStorage.removeItem(cacheKey)
      }
    }

    try {
      const { data: res } = await formSchemaApi.get(dtoName)
      schema.value = res.data
      sessionStorage.setItem(cacheKey, JSON.stringify(res.data))
    } catch (e) {
      console.error(`[useFormSchema] 加载 Schema 失败: ${dtoName}`, e)
      // 降级: schema 加载失败时 rules 为空, 表单仍可提交, 后端校验兜底
    }
  }

  const buildRules = () => {
    if (!schema.value) return

    const groupValue = group ? (isRef(group) ? group.value : group) : null
    const result: FormRules = {}

    for (const [field, config] of Object.entries(schema.value.fields)) {
      // 组过滤: 如果指定了 group, 且该字段有 groups 定义, 则只包含匹配的字段
      if (groupValue && config.groups && config.groups.length > 0) {
        if (!config.groups.includes(groupValue)) continue
      }
      result[field] = convertToNaiveRules(config, groupValue)
    }

    // 合并 overrides
    if (overrides) {
      for (const [field, override] of Object.entries(overrides)) {
        if (override.replace) {
          result[field] = override.replace
        } else if (override.append) {
          const existing = Array.isArray(result[field]) ? result[field] : []
          result[field] = [...(existing as FormItemRule[]), ...override.append]
        }
      }
    }

    rules.value = result
  }

  onMounted(async () => {
    await loadSchema()
    buildRules()
  })

  // 如果 group 是响应式的, watch 变化重新生成
  if (group && isRef(group)) {
    watch(group, buildRules)
  }

  // schema 加载完成后也触发 buildRules
  watch(schema, buildRules)

  return rules
}
