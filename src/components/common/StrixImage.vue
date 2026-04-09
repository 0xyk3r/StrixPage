<template>
  <n-image :src="imageSrc" :width="width" lazy />
</template>
<script lang="ts" setup>
import { commonApi } from '@/api/common'
import { convertBlob } from '@/utils/strix-file-util.ts'

const { value } = defineProps({
  value: { type: [String, Number], required: true },
  width: { type: Number, required: true }
})

const imageSrc = ref('')

// 加载图像并创建 blob Url
const loadObject = () => {
  if (value) {
    commonApi.fileDownload(String(value)).then((res) => {
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
  () => value,
  () => {
    revokeObject()
    loadObject()
  }
)
</script>
<style lang="scss" scoped></style>
