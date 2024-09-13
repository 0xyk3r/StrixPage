import { cloneDeep } from 'lodash'
import type { FormInst, PaginationInfo } from 'naive-ui'
import { reactive, ref, type Ref } from 'vue'

/**
 * 创建分页配置
 * @param params 分页配置参数
 * @param loadFunc 加载数据方法
 * @returns 分页配置
 */
export const createPagination = (params: Ref<any>, loadFunc: () => void) => {
  const dataPagination = reactive({
    page: 1,
    pageSize: 10,
    showSizePicker: true,
    pageSizes: [10, 20, 30, 50, 100],
    itemCount: 0,
    prefix(info: PaginationInfo) {
      return `共 ${info.itemCount} 条`
    },
    onChange: (page: number) => {
      dataPagination.page = page
      params.value.pageIndex = page
      loadFunc()
    },
    onUpdatePageSize: (pageSize: number) => {
      dataPagination.pageSize = pageSize
      dataPagination.page = 1
      params.value.pageSize = pageSize
      params.value.pageIndex = 1
      loadFunc()
    }
  })

  return dataPagination
}

/**
 * 通用页面逻辑
 * @param initGetDataListParams 初始查询参数
 * @param getDataListFunc 获取数据列表方法
 * @param initAddDataForm 初始新增表单表单
 * @param initEditDataForm 初始编辑表单表单
 * @returns
 */
export function usePage(
  initGetDataListParams: any,
  getDataListFunc: Function,
  initAddDataForm: any,
  initEditDataForm: any,
  initDataFormFunc?: Function
) {
  const getDataListParams = ref(cloneDeep(initGetDataListParams))
  const clearSearch = () => {
    getDataListParams.value = cloneDeep(initGetDataListParams)
    getDataListFunc()
  }
  const dataPagination = createPagination(getDataListParams, () => {
    getDataListFunc()
  })
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
