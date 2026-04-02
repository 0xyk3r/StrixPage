import type { FormItemRule } from 'naive-ui'

// ===== 基础规则生成器 =====

/** 必填文本字段 */
export function requiredInput(label: string): FormItemRule {
  return { required: true, message: `请输入${label}`, trigger: 'blur' }
}

/** 必选字段（下拉框、单选等） */
export function requiredSelect(label: string): FormItemRule {
  return { type: 'number', required: true, message: `请选择${label}`, trigger: 'change' }
}

/** 字符串长度范围限制 */
export function lengthRange(label: string, min: number, max: number): FormItemRule {
  return { min, max, message: `${label}长度需在 ${min} - ${max} 字之内`, trigger: 'blur' }
}

/** 最大长度限制 */
export function maxLength(label: string, max: number): FormItemRule {
  return { max, message: `${label}长度需在 ${max} 字之内`, trigger: 'blur' }
}

/** 数字范围限制 */
export function numberRange(label: string, min: number, max: number): FormItemRule {
  return { type: 'number', min, max, message: `请输入有效${label} (${min}-${max})`, trigger: 'change' }
}

// ===== 组合规则生成器 =====

interface TextFieldOptions {
  /** 是否必填（默认 true） */
  required?: boolean
  /** 最小长度 */
  min?: number
  /** 最大长度 */
  max?: number
}

/** 文本输入字段：必填 + 可选长度限制 */
export function textField(label: string, opts?: TextFieldOptions): FormItemRule[] {
  const rules: FormItemRule[] = []
  if (opts?.required !== false) {
    rules.push(requiredInput(label))
  }
  if (opts?.min != null && opts?.max != null) {
    rules.push(lengthRange(label, opts.min, opts.max))
  } else if (opts?.max != null) {
    rules.push(maxLength(label, opts.max))
  }
  return rules
}

/** 选择字段：必填 */
export function selectField(label: string): FormItemRule[] {
  return [requiredSelect(label)]
}

/** 备注字段：仅最大长度限制 */
export function remarkField(max = 255): FormItemRule[] {
  return [maxLength('备注', max)]
}

/** 数字输入字段：必填 + 可选范围 */
export function numberField(label: string, opts?: { min?: number; max?: number }): FormItemRule[] {
  const rules: FormItemRule[] = [{ type: 'number', required: true, message: `请输入${label}`, trigger: 'change' }]
  if (opts?.min != null && opts?.max != null) {
    rules.push(numberRange(label, opts.min, opts.max))
  }
  return rules
}
