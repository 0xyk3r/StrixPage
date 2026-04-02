import type { AxiosResponse } from 'axios'
import { cloneDeep, pick } from 'lodash-es'
import type { FormInst } from 'naive-ui'
import type { RetResult } from '@/api/types'
import { useFormDraft } from '@/composables/useFormDraft'
import { usePagination } from '@/composables/usePagination'
import { createStrixMessage } from '@/utils/strix-message'

/** CRUD API 接口 */
export interface CrudApi {
  detail?: (id: string) => Promise<AxiosResponse<RetResult>>
  create?: (data: any) => Promise<AxiosResponse<RetResult>>
  update?: (id: string, data: any) => Promise<AxiosResponse<RetResult>>
  remove?: (id: string) => Promise<AxiosResponse<RetResult>>
}

/** 生命周期钩子 */
export interface UseCrudHooks {
  /** 打开新增弹窗前（可加载下拉数据等） */
  beforeShowAdd?: () => void | Promise<void>
  /** 打开编辑弹窗前（detail 加载前） */
  beforeShowEdit?: (id: string) => void | Promise<void>
  /** 编辑详情加载后（可变换数据或设置额外状态） */
  afterShowEdit?: (detail: any) => void
  /** 新增提交前变换表单数据 */
  transformAdd?: (form: any) => any
  /** 编辑提交前变换表单数据 */
  transformEdit?: (form: any) => any
  /** 新增成功后 */
  afterAdd?: () => void
  /** 编辑成功后 */
  afterEdit?: () => void
  /** 删除成功后 */
  afterDelete?: () => void
  /** 表单重置时 */
  onReset?: () => void
}

/** useCrud 配置 */
export interface UseCrudConfig {
  /** 搜索/筛选初始参数 */
  list?: Record<string, any>
  /** 刷新列表回调 */
  fetchList: () => void
  /** 新增表单初始值（不传则不启用新增功能） */
  addForm?: Record<string, any>
  /** 编辑表单初始值（不传则不启用编辑功能） */
  editForm?: Record<string, any>
  /** API 服务（传入则自动生成 CRUD 方法） */
  api?: CrudApi
  /** 生命周期钩子 */
  hooks?: UseCrudHooks
  /** 草稿缓存标识（传入即启用表单草稿自动保存） */
  draftKey?: string
}

const VALIDATION_FAIL_TITLE = '表单校验失败'
const VALIDATION_FAIL_CONTENT = '请检查表单中的错误，并根据提示修改'

export function useCrud(config: UseCrudConfig) {
  const { fetchList, api, hooks } = config
  const initAddForm = config.addForm
  const initEditForm = config.editForm

  // ===== 列表/搜索 =====
  const listParams = ref(cloneDeep(config.list || {}))
  const pagination = usePagination(listParams, fetchList)

  const clearSearch = () => {
    listParams.value = cloneDeep(config.list || {})
    pagination.page = config.list?.pageIndex || 1
    pagination.pageSize = config.list?.pageSize || 10
    fetchList()
  }

  const rowKey = (row: any) => row.id

  // ===== 新增表单 =====
  const addModal = ref(false)
  const addForm = ref(initAddForm ? cloneDeep(initAddForm) : {})
  const addFormRef = ref<FormInst | null>(null)

  // ===== 编辑表单 =====
  const editModal = ref(false)
  const editLoading = ref(false)
  const editId = ref('')
  const editForm = ref(initEditForm ? cloneDeep(initEditForm) : {})
  const editFormRef = ref<FormInst | null>(null)

  // ===== 草稿自动保存 =====
  const draft = config.draftKey ? useFormDraft(config.draftKey) : null

  // ===== 重置 =====
  const resetForms = () => {
    draft?.stopAutoSave()
    addModal.value = false
    editModal.value = false
    editLoading.value = false
    if (initAddForm) addForm.value = cloneDeep(initAddForm)
    editId.value = ''
    if (initEditForm) editForm.value = cloneDeep(initEditForm)
    hooks?.onReset?.()
  }

  // ===== 自动 CRUD 方法 =====

  /** 打开新增弹窗 */
  const showAdd = async (initialValues?: Record<string, any>) => {
    if (initAddForm) addForm.value = cloneDeep(initAddForm)
    if (initialValues) Object.assign(addForm.value, initialValues)
    await hooks?.beforeShowAdd?.()
    addModal.value = true
    if (draft) {
      draft.checkAndRestore(addForm, 'add')
      draft.startAutoSave(addForm, 'add')
    }
  }

  /** 打开编辑弹窗并加载详情 */
  const showEdit = async (id: string) => {
    if (!api?.detail) return
    editModal.value = true
    editLoading.value = true
    try {
      await hooks?.beforeShowEdit?.(id)
      const { data: res } = await api.detail(id)
      editId.value = id
      if (initEditForm) {
        const canUpdateFields = Object.keys(initEditForm)
        editForm.value = pick(res.data, canUpdateFields)
      } else {
        editForm.value = res.data
      }
      hooks?.afterShowEdit?.(res.data)
      if (draft) {
        draft.checkAndRestore(editForm, 'edit', id)
        draft.startAutoSave(editForm, 'edit', id)
      }
    } finally {
      editLoading.value = false
    }
  }

  /** 校验并提交新增 */
  const submitAdd = async () => {
    if (!api?.create) return
    try {
      await addFormRef.value?.validate()
    } catch {
      createStrixMessage('warning', VALIDATION_FAIL_TITLE, VALIDATION_FAIL_CONTENT)
      return
    }
    const data = hooks?.transformAdd?.(cloneDeep(addForm.value)) ?? addForm.value
    await api.create(data)
    draft?.clearDraft('add')
    resetForms()
    fetchList()
    hooks?.afterAdd?.()
  }

  /** 校验并提交编辑 */
  const submitEdit = async () => {
    if (!api?.update) return
    try {
      await editFormRef.value?.validate()
    } catch {
      createStrixMessage('warning', VALIDATION_FAIL_TITLE, VALIDATION_FAIL_CONTENT)
      return
    }
    const data = hooks?.transformEdit?.(cloneDeep(editForm.value)) ?? editForm.value
    await api.update(editId.value, data)
    draft?.clearDraft('edit', editId.value)
    resetForms()
    fetchList()
    hooks?.afterEdit?.()
  }

  /** 删除行 */
  const deleteRow = async (id: string) => {
    if (!api?.remove) return
    await api.remove(id)
    fetchList()
    hooks?.afterDelete?.()
  }

  return {
    // 列表
    listParams,
    clearSearch,
    pagination,
    rowKey,
    // 新增表单
    addModal,
    addForm,
    addFormRef,
    // 编辑表单
    editModal,
    editLoading,
    editId,
    editForm,
    editFormRef,
    // 操作
    showAdd,
    showEdit,
    submitAdd,
    submitEdit,
    deleteRow,
    resetForms,
    // 工具（用于 pick 字段等场景）
    initEditForm
  }
}
