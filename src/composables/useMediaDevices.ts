/**
 * 枚举音频输入设备并响应热插拔。
 * 未授权麦克风时设备 label 为空（浏览器隐私保护），授权后调用 refresh() 可补全真实名称。
 */
export function useMediaDevices() {
  const inputs = ref<MediaDeviceInfo[]>([])

  const options = computed(() => [
    { label: '默认设备', value: '' },
    ...inputs.value.map((d) => ({
      label: d.label || `麦克风 ${d.deviceId.slice(0, 6)}`,
      value: d.deviceId
    }))
  ])

  async function refresh() {
    try {
      const list = await navigator.mediaDevices.enumerateDevices()
      inputs.value = list.filter((d) => d.kind === 'audioinput')
    } catch {
      /* 忽略枚举失败 */
    }
  }

  function onDeviceChange() {
    refresh()
  }

  onMounted(() => {
    refresh()
    navigator.mediaDevices?.addEventListener?.('devicechange', onDeviceChange)
  })

  onUnmounted(() => {
    navigator.mediaDevices?.removeEventListener?.('devicechange', onDeviceChange)
  })

  return { inputs, options, refresh }
}
