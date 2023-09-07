import { defineStore } from 'pinia'

export const useHttpCancelerStore = defineStore('httpCanceler', {
  state: () => ({
    requestingApi: []
  }),
  getters: {},
  actions: {
    addRequestingApi(api) {
      this.requestingApi.push(api)
    },
    delRequestingApiById(apiId) {
      this.requestingApi.forEach((item, index) => {
        if (item.strixRequestId === apiId) {
          this.requestingApi.splice(index, 1)
        }
      })
    },
    delRequestingApiByGroup(group) {
      this.requestingApi = this.requestingApi.filter((item) => item.strixRequestGroup !== group)
    },
    delAllRequestingApi() {
      this.$reset()
    },
    cancelRequestByGroup(group) {
      this.requestingApi.forEach((item) => {
        if (item.strixRequestGroup === group && typeof item.strixRequestCanceler === 'function') {
          item.strixRequestCanceler('取消请求')
        }
      })
      this.delRequestingApiByGroup(group)
    }
  }
})
