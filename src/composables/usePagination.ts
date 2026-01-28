import type { PaginationInfo } from 'naive-ui'

/**
 * 创建分页配置
 * @param params 分页配置参数
 * @param loadFunc 加载数据方法
 * @returns 分页配置
 */
export const usePagination = (params: Ref<any>, loadFunc: () => void) => {
  const dataPagination = reactive({
    page: params.value.pageIndex || 1,
    pageSize: params.value.pageSize || 10,
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
