import { cloneDeep } from 'lodash-es'
import type { FormInst } from 'naive-ui'
import { usePagination } from '@/composables/usePagination.ts'

/**
 * 通用页面逻辑
 * @param initGetDataListParams 初始查询参数
 * @param getDataListFunc 获取数据列表方法
 * @param initAddDataForm 初始新增表单表单
 * @param initEditDataForm 初始编辑表单表单
 * @param initDataFormFunc 初始化表单方法
 * @returns
 */
export function usePage(
  initGetDataListParams: any,
  getDataListFunc: () => void,
  initAddDataForm: any,
  initEditDataForm: any,
  initDataFormFunc?: () => void
) {
  const getDataListParams = ref(cloneDeep(initGetDataListParams))
  const dataPagination = usePagination(getDataListParams, () => {
    getDataListFunc()
  })
  const clearSearch = () => {
    getDataListParams.value = cloneDeep(initGetDataListParams)
    dataPagination.page = initGetDataListParams.pageIndex || 1
    dataPagination.pageSize = initGetDataListParams.pageSize || 10
    getDataListFunc()
  }
  const dataRowKey = (row: any) => row.id

  const addDataModalShow = ref(false)
  const addDataForm = ref(cloneDeep(initAddDataForm))
  const addDataFormRef = ref<FormInst | null>(null)
  const editDataModalShow = ref(false)
  const editDataFormLoading = ref(false)
  const editDataId = ref('')
  const editDataForm = ref(cloneDeep(initEditDataForm))
  const editDataFormRef = ref<FormInst | null>(null)
  const initDataForm = () => {
    addDataModalShow.value = false
    editDataModalShow.value = false
    editDataFormLoading.value = false
    addDataForm.value = cloneDeep(initAddDataForm)
    editDataId.value = ''
    editDataForm.value = cloneDeep(initEditDataForm)
    if (initDataFormFunc) {
      initDataFormFunc()
    }
  }

  return {
    getDataListParams,
    clearSearch,
    dataPagination,
    dataRowKey,
    addDataModalShow,
    addDataForm,
    addDataFormRef,
    editDataModalShow,
    editDataFormLoading,
    editDataId,
    initEditDataForm,
    editDataForm,
    editDataFormRef,
    initDataForm
  }
}
