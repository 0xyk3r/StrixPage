import { reactive } from 'vue'

export const createPagination = (params, loadFunc) => {
    const dataPagination = reactive({
        page: 1,
        pageSize: 10,
        showSizePicker: true,
        pageSizes: [10, 20, 30, 50, 100],
        prefix({ itemCount }) {
            return `共 ${itemCount} 条`
        },
        onChange: (page) => {
            dataPagination.page = page
            params.value.pageIndex = page
            loadFunc()
        },
        onUpdatePageSize: (pageSize) => {
            dataPagination.pageSize = pageSize
            dataPagination.page = 1
            params.value.pageSize = pageSize
            params.value.pageIndex = 1
            loadFunc()
        }
    })

    return dataPagination
}
