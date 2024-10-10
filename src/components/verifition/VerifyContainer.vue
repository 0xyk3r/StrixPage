<template>
  <div v-show="showBox" :class="mode == 'pop' ? 'mask' : ''">
    <n-card
      :class="mode == 'pop' ? 'verifybox' : ''"
      :style="{ 'max-width': parseInt(imgSize.width) + 80 + 'px' }"
      closable
      title="请完成安全验证"
    >
      <div :style="{ padding: mode == 'pop' ? '15px' : '0' }" class="verifybox-bottom">
        <VerifySlide
          ref="instance"
          :barSize="barSize"
          :blockSize="blockSize"
          :explain="explain"
          :imgSize="imgSize"
          :mode="mode"
          :type="verifyType"
          :vSpace="vSpace"
          @success="$emit('success', $event)"
        ></VerifySlide>
      </div>
    </n-card>
  </div>
</template>
<script lang="ts" setup>
import VerifySlide from '@/components/verifition/Verify/VerifySlide.vue'

const { mode } = defineProps({
  mode: { type: String, default: 'pop' },
  vSpace: { type: Number },
  explain: { type: String },
  imgSize: {
    type: Object,
    default() {
      return {
        width: '310px',
        height: '155px'
      }
    }
  },
  blockSize: { type: Object },
  barSize: { type: Object }
})
const instance = ref<any>({})
const clickShow = ref(false)
const verifyType = ref('2')

const showBox = computed(() => {
  if (mode == 'pop') return clickShow.value
  return true
})

const refresh = () => {
  if (instance.value.refresh) {
    instance.value.refresh()
  }
}

const close = () => {
  clickShow.value = false
}

const show = () => {
  if (mode == 'pop') clickShow.value = true
}

defineExpose({
  show,
  close,
  refresh
})
</script>
<style lang="scss" scoped>
@import '@/assets/style/components/verify.scss';
</style>
