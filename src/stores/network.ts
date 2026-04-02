import { defineStore } from 'pinia'

export const useNetworkStore = defineStore('network', () => {
  const isOnline = ref(navigator.onLine)
  const wasOffline = ref(false)

  function handleOnline() {
    if (!isOnline.value) wasOffline.value = true
    isOnline.value = true
  }

  function handleOffline() {
    isOnline.value = false
  }

  function clearWasOffline() {
    wasOffline.value = false
  }

  function init() {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    isOnline.value = navigator.onLine
  }

  function destroy() {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }

  return { isOnline, wasOffline, clearWasOffline, init, destroy }
})
