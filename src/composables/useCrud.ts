import type { AxiosResponse } from 'axios'
import { cloneDeep, debounce, isEqual, pick } from 'lodash-es'
import type { FormInst } from 'naive-ui'
import type { RetResult } from '@/api/types'
import { useFormDraft } from '@/composables/useFormDraft'
import { type FilterDefinition, useFilterState } from '@/composables/useFilterState'
import { type FilterUrlConfig, useFilterUrl } from '@/composables/useFilterUrl'
import { usePagination } from '@/composables/usePagination'
import { createStrixMessage } from '@/utils/strix-message'

/** CRUD API 接口 */
export interface CrudApi {
  detail?: (id: string) => Promise<AxiosResponse<RetResult>>
  create?: (data: any) => Promise<AxiosResponse<RetResult>>
  update?: (id: string, data: any) => Promise<AxiosResponse<RetResult>>
  remove?: (id: string) => Promise<AxiosResponse<RetResult>>
  batchRemove?: (ids: string[]) => Promise<AxiosResponse<RetResult>>
  batchModify?: (data: { ids: string[]; field: string; value: string }) => Promise<AxiosResponse<RetResult>>
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
  /** 启用批量操作（传 true 或配置对象） */
  batch?: boolean | { disabledKey?: string }
  /** 筛选字段定义（启用 Filter Chips） */
  filters?: FilterDefinition[]
  /** URL 同步配置（传 true 使用默认配置，传对象自定义） */
  urlSync?: boolean | FilterUrlConfig
}

const VALIDATION_FAIL_TITLE = '表单校验失败'
const VALIDATION_FAIL_CONTENT = '请检查表单中的错误，并根据提示修改'

export function useCrud(config: UseCrudConfig) {
  const { fetchList, api, hooks } = config
  const initAddForm = config.addForm
  const initEditForm = config.editForm

  // ===== 列表/搜索 =====
  const listParams = ref(cloneDeep(config.list || {}))
  const listDefaults = cloneDeep(config.list || {})

  // ===== URL 持久化 =====
  const urlSyncConfig = config.urlSync === true ? {} : config.urlSync || undefined
  if (config.urlSync) {
    useFilterUrl({ params: listParams, defaults: listDefaults, urlConfig: urlSyncConfig })
  }

  const pagination = usePagination(listParams, fetchList)

  // ===== 实时搜索（关键词去抖） =====
  const debouncedFetch = debounce(fetchList, 500)
  const hasKeyword = config.list != null && 'keyword' in config.list

  if (hasKeyword) {
    watch(() => listParams.value.keyword, () => {
      debouncedFetch()
    })
  }

  const handleKeywordEnter = (e: KeyboardEvent) => {
    if (e.isComposing) return
    debouncedFetch.cancel()
    fetchList()
  }

  // ===== 筛选状态 =====
  const filterState = config.filters
    ? useFilterState({
      definitions: config.filters,
      params: listParams,
      defaults: listDefaults,
      onClear: () => {
        debouncedFetch.cancel()
        fetchList()
      }
    })
    : null

  const activeFilters = filterState?.activeFilters ?? computed(() => [])
  const activeFilterCount = filterState?.activeFilterCount ?? computed(() => 0)
  const clearFilter = filterState?.clearFilter ?? (() => {
  })

  const clearSearch = () => {
    debouncedFetch.cancel()
    listParams.value = cloneDeep(config.list || {})
    pagination.page = config.list?.pageIndex || 1
    pagination.pageSize = config.list?.pageSize || 10
    fetchList()
  }

  const rowKey = (row: any) => row.id

  // ===== 批量操作 =====
  const batchEnabled = !!config.batch
  const checkedRowKeys = ref<Array<string | number>>([])

  const onCheckedRowKeysChange = (keys: Array<string | number>) => {
    checkedRowKeys.value = keys
  }

  const clearSelection = () => {
    checkedRowKeys.value = []
  }

  const hasSelection = computed(() => checkedRowKeys.value.length > 0)
  const selectedCount = computed(() => checkedRowKeys.value.length)

  const selectionColumn = batchEnabled
    ? {
      type: 'selection' as const,
      disabled: (row: any) => {
        if (typeof config.batch === 'object' && config.batch.disabledKey) {
          return !!row[config.batch.disabledKey]
        }
        return false
      }
    }
    : null

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

  // ===== 表单快照（用于脏检测） =====
  const addFormSnapshot = ref<Record<string, any>>({})
  const editFormSnapshot = ref<Record<string, any>>({})

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

  // ===== 未保存离开提示 =====
  const dialog = useDialog()

  const confirmLeave = (hasDraft: boolean): Promise<boolean> => {
    return new Promise((resolve) => {
      dialog.warning({
        title: '确认离开',
        content: hasDraft
          ? '表单数据已自动暂存，下次打开时可以恢复。确定要离开吗？'
          : '你有未保存的更改，离开后将丢失。确定要离开吗？',
        positiveText: '离开',
        negativeText: '继续编辑',
        onPositiveClick: () => resolve(true),
        onNegativeClick: () => resolve(false),
        onClose: () => resolve(false),
        onMaskClick: () => resolve(false)
      })
    })
  }

  /** 尝试关闭新增弹窗（有未保存更改时弹出确认） */
  const tryCloseAdd = async () => {
    if (!isEqual(addForm.value, addFormSnapshot.value)) {
      const confirmed = await confirmLeave(!!draft)
      if (!confirmed) return
    }
    addModal.value = false
  }

  /** 尝试关闭编辑弹窗（有未保存更改时弹出确认） */
  const tryCloseEdit = async () => {
    if (!isEqual(editForm.value, editFormSnapshot.value)) {
      const confirmed = await confirmLeave(!!draft)
      if (!confirmed) return
    }
    editModal.value = false
  }

  // ===== 自动 CRUD 方法 =====

  /** 打开新增弹窗 */
  const showAdd = async (initialValues?: Record<string, any>) => {
    if (initAddForm) addForm.value = cloneDeep(initAddForm)
    if (initialValues && !(initialValues instanceof Event)) Object.assign(addForm.value, initialValues)
    await hooks?.beforeShowAdd?.()
    if (draft) await draft.checkAndRestore(addForm, 'add')
    addFormSnapshot.value = cloneDeep(addForm.value)
    addModal.value = true
    if (draft) draft.startAutoSave(addForm, 'add')
  }

  /** 打开编辑弹窗并加载详情 */
  const showEdit = async (id: string) => {
    if (!api?.detail) return
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
      if (draft) await draft.checkAndRestore(editForm, 'edit', id)
      editFormSnapshot.value = cloneDeep(editForm.value)
      editModal.value = true
      if (draft) draft.startAutoSave(editForm, 'edit', id)
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

  /** 批量删除（含确认弹窗） */
  const batchDelete = async () => {
    if (!api?.batchRemove || checkedRowKeys.value.length === 0) return

    return new Promise<void>((resolve) => {
      dialog.warning({
        title: '批量删除确认',
        content: `确定要删除选中的 ${checkedRowKeys.value.length} 条数据吗？该操作不可恢复！`,
        positiveText: '确认删除',
        negativeText: '取消',
        onPositiveClick: async () => {
          await api.batchRemove!(checkedRowKeys.value as string[])
          clearSelection()
          fetchList()
          hooks?.afterDelete?.()
          resolve()
        },
        onNegativeClick: () => resolve(),
        onClose: () => resolve(),
        onMaskClick: () => resolve()
      })
    })
  }

  /** 批量修改字段 */
  const batchModify = async (field: string, value: string) => {
    if (!api?.batchModify || checkedRowKeys.value.length === 0) return
    await api.batchModify({ ids: checkedRowKeys.value as string[], field, value })
    clearSelection()
    fetchList()
  }

  return {
    // 列表
    listParams,
    clearSearch,
    handleKeywordEnter,
    pagination,
    rowKey,
    // 批量操作
    checkedRowKeys,
    onCheckedRowKeysChange,
    clearSelection,
    hasSelection,
    selectedCount,
    selectionColumn,
    batchDelete,
    batchModify,
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
    tryCloseAdd,
    tryCloseEdit,
    // 工具（用于 pick 字段等场景）
    initEditForm,
    // 筛选状态
    activeFilters,
    activeFilterCount,
    clearFilter
  }
}
