import type { Canceler } from 'axios'
import { defineStore } from 'pinia'

export interface CancelableRequest {
  requestId?: string
  requestGroup?: string
  requestCanceler?: Canceler
}

export const useHttpCancelerStore = defineStore('httpCanceler', () => {
  const requestingApi = ref<CancelableRequest[]>([])

  function registerRequest(api: CancelableRequest) {
    requestingApi.value.push(api)
  }

  function removeRequestById(apiId: string) {
    requestingApi.value.forEach((item, index) => {
      if (item.requestId === apiId) {
        requestingApi.value.splice(index, 1)
      }
    })
  }

  function removeRequestByGroup(group: string) {
    requestingApi.value = requestingApi.value.filter((item) => item.requestGroup !== group)
  }

  function removeAllRequest() {
    requestingApi.value = []
  }

  function cancelRequestByGroup(group: string) {
    requestingApi.value.forEach((item) => {
      if (item.requestGroup === group && typeof item.requestCanceler === 'function') {
        item.requestCanceler('取消请求')
      }
    })
    removeRequestByGroup(group)
  }

  return {
    requestingApi,
    registerRequest,
    removeRequestById,
    removeRequestByGroup,
    removeAllRequest,
    cancelRequestByGroup
  }
})
