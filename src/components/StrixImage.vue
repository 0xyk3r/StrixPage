<template>
  <n-image :width="width" :src="imageSrc" lazy />
</template>
<script setup lang="ts">
import { http } from '@/plugins/axios'
import { convertBlob } from '@/utils/strix-file-util'

const $props = defineProps({
  value: { type: [String, Number], required: true },
  width: { type: Number, required: true }
})

const imageSrc = ref('')

// 加载图像并创建 blob Url
const loadObject = () => {
  if ($props.value) {
    http
      .get(`system/common/file/${$props.value}`, {
        responseType: 'blob',
        meta: { operate: '加载图像' }
      })
      .then((res) => {
        imageSrc.value = convertBlob(res)
      })
  }
}
onMounted(loadObject)

// 释放blob URL地址
const revokeObject = () => {
  if (imageSrc.value) {
    window.URL.revokeObjectURL(imageSrc.value)
    imageSrc.value = ''
  }
}
onUnmounted(revokeObject)

watch(
  () => $props.value,
  () => {
    revokeObject()
    loadObject()
  }
)
</script>
<style lang="scss" scoped></style>
