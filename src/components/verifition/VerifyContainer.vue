<template>
  <div v-show="showBox" :class="mode == 'pop' ? 'mask' : ''">
    <div
      :class="mode == 'pop' ? 'verifybox' : ''"
      :style="{ 'max-width': parseInt(imgSize.width) + 30 + 'px' }"
    >
      <div v-if="mode == 'pop'" class="verifybox-top">
        请完成安全验证
        <span class="verifybox-close" @click="close">
          <Icon :width="28" color="#000" icon="ion-close" />
        </span>
      </div>
      <div :style="{ padding: mode == 'pop' ? '15px' : '0' }" class="verifybox-bottom">
        <!-- 验证码容器 -->
        <component
          :is="verifyComponent"
          ref="instance"
          :arith="arith"
          :barSize="barSize"
          :blockSize="blockSize"
          :captchaType="captchaType"
          :explain="explain"
          :figure="figure"
          :imgSize="imgSize"
          :mode="mode"
          :type="verifyType"
          :vSpace="vSpace"
        ></component>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
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
