<template>
  <n-image :width="width" :src="imageSrc" lazy />
</template>
<script setup>
import { convertBlob } from '@/utils/strix-file-util.js'
import { NImage } from 'naive-ui'
import { getCurrentInstance, onMounted, onUnmounted, ref, watch } from 'vue'

const $props = defineProps({
  value: { type: [String, Number], required: true },
  width: { type: Number, required: true }
})

const { proxy } = getCurrentInstance()

const imageSrc = ref('')

watch(
  () => $props.value,
  () => {
    revokeObject()
    loadObject()
  }
)

onMounted(() => {
  loadObject()
})
onUnmounted(() => {
  revokeObject()
})

// 加载图像并创建 blob Url
const loadObject = () => {
  if ($props.value) {
    proxy.$http.get(`system/common/file/${$props.value}`, { operate: '加载图像', responseType: 'blob' }).then((res) => {
      imageSrc.value = convertBlob(res)
    })
  }
}

// 释放blob URL地址
const revokeObject = () => {
  if (imageSrc.value) {
    window.URL.revokeObjectURL(imageSrc.value)
  }
}
</script>
<style lang="scss" scoped></style>
