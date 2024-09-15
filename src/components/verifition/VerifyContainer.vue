<template>
  <div :class="mode == 'pop' ? 'mask' : ''" v-show="showBox">
    <div
      :class="mode == 'pop' ? 'verifybox' : ''"
      :style="{ 'max-width': parseInt(imgSize.width) + 30 + 'px' }"
    >
      <div class="verifybox-top" v-if="mode == 'pop'">
        请完成安全验证
        <span class="verifybox-close" @click="close">
          <Icon icon="ion-close" color="#000" :width="28" />
        </span>
      </div>
      <div class="verifybox-bottom" :style="{ padding: mode == 'pop' ? '15px' : '0' }">
        <!-- 验证码容器 -->
        <component
          :is="verifyComponent"
          :captchaType="captchaType"
          :type="verifyType"
          :figure="figure"
          :arith="arith"
          :mode="mode"
          :vSpace="vSpace"
          :explain="explain"
          :imgSize="imgSize"
          :blockSize="blockSize"
          :barSize="barSize"
          ref="instance"
        ></component>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import VerifySlide from './Verify/VerifySlide.vue'
import { Icon } from '@iconify/vue'

const { captchaType, mode } = defineProps({
  captchaType: { type: String, required: true },
  figure: { type: Number },
  arith: { type: Number },
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

const verifyComponent = computed(() => {
  if (captchaType === 'blockPuzzle') return VerifySlide
  return null
})

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
