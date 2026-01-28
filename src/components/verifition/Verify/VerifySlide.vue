<template>
  <div class="verify-slide">
    <!-- 验证图片区域 -->
    <div
      :style="{
        width: computedSize.imgWidth,
        height: computedSize.imgHeight
      }"
      class="verify-slide__image-panel"
    >
      <!-- 背景图片 -->
      <img
        v-if="backImgBase"
        :src="`data:image/png;base64,${backImgBase}`"
        alt="验证背景"
        class="verify-slide__bg-image"
      />

      <!-- 刷新按钮 -->
      <Transition name="fade">
        <button v-if="showRefresh" aria-label="刷新验证码" class="verify-slide__refresh" @click="handleRefresh">
          <StrixIcon :size="20" icon="refresh-cw" />
        </button>
      </Transition>

      <!-- 提示信息 -->
      <Transition name="slide-up">
        <div v-if="tipWords" :class="['verify-slide__tip', statusClass]">
          <StrixIcon :icon="tipIcon" :size="18" class="verify-slide__tip-icon" />
          <span>{{ tipWords }}</span>
        </div>
      </Transition>

      <!-- 滑块拼图块 -->
      <div
        v-if="blockBackImgBase"
        :style="{
          width: blockWidth + 'px',
          height: computedSize.imgHeight,
          left: moveBlockLeft,
          transition: transitionLeft
        }"
        class="verify-slide__puzzle-block"
      >
        <img :src="`data:image/png;base64,${blockBackImgBase}`" alt="拼图块" class="verify-slide__puzzle-image" />
      </div>
    </div>

    <!-- 滑动条区域 -->
    <div
      ref="barAreaRef"
      :style="{
        width: computedSize.barWidth,
        height: computedSize.barHeight
      }"
      class="verify-slide__bar"
    >
      <!-- 提示文字 -->
      <div class="verify-slide__bar-text">{{ displayText }}</div>

      <!-- 已滑动区域 -->
      <div
        :class="barFillClass"
        :style="{
          width: barFillWidth,
          transition: transitionWidth
        }"
        class="verify-slide__bar-fill"
      >
        <div class="verify-slide__bar-fill-text">{{ finishText }}</div>
      </div>

      <!-- 滑块 -->
      <div
        :class="sliderClass"
        :style="{
          left: moveBlockLeft,
          transition: transitionLeft
        }"
        class="verify-slide__slider"
        @mousedown="handleStart"
        @touchstart="handleStart"
      >
        <StrixIcon :icon="sliderIcon" :size="24" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { http } from '@/plugins/axios'
import { aesEncrypt } from '../utils/ase'

interface Props {
  imgSize?: {
    width: string
    height: string
  }
  blockSize?: {
    width: string
    height: string
  }
  barSize?: {
    width: string
    height: string
  }
  vSpace?: number
  explain?: string
}

const props = withDefaults(defineProps<Props>(), {
  imgSize: () => ({ width: '400px', height: '200px' }),
  blockSize: () => ({ width: '60px', height: '60px' }),
  barSize: () => ({ width: '400px', height: '50px' }),
  vSpace: 5,
  explain: '向右滑动完成验证'
})

const emit = defineEmits<{
  success: [payload: { captchaVerification: string }]
}>()

// 响应式状态
const barAreaRef = ref<HTMLElement | null>(null)
const backImgBase = ref('')
const blockBackImgBase = ref('')
const backToken = ref('')
const secretKey = ref('')

const moveBlockLeft = ref('0')
const leftBarWidth = ref('0')
const displayText = ref(props.explain)
const finishText = ref('')
const tipWords = ref('')

const status = ref<'idle' | 'moving' | 'success' | 'error'>('idle')
const showRefresh = ref(true)

const transitionLeft = ref('')
const transitionWidth = ref('')

const startMoveTime = ref(0)
const endMoveTime = ref(0)
const startX = ref(0)

// 计算尺寸
const computedSize = reactive({
  imgWidth: '0',
  imgHeight: '0',
  barWidth: '0',
  barHeight: '0'
})

// 拼图块宽度
const blockWidth = computed(() => {
  const width = parseInt(props.blockSize.width)
  // 根据实际图片宽度按比例计算
  const imgWidth = parseInt(computedSize.imgWidth)
  return Math.floor((imgWidth * width) / 400)
})

// 滑块图标
const sliderIcon = computed(() => {
  switch (status.value) {
    case 'success':
      return 'check'
    case 'error':
      return 'x'
    default:
      return 'arrow-right'
  }
})

// 滑块样式类
const sliderClass = computed(() => {
  return {
    'verify-slide__slider--moving': status.value === 'moving',
    'verify-slide__slider--success': status.value === 'success',
    'verify-slide__slider--error': status.value === 'error'
  }
})

// 状态样式类
const statusClass = computed(() => {
  return {
    'verify-slide__tip--success': status.value === 'success',
    'verify-slide__tip--error': status.value === 'error'
  }
})

// 提示图标
const tipIcon = computed(() => {
  return status.value === 'success' ? 'circle-check' : 'circle-alert'
})

// 进度条填充宽度（延伸到滑块中心）
const barFillWidth = computed(() => {
  if (!leftBarWidth.value || leftBarWidth.value === '0') return '0'
  const sliderRadius = 50
  const currentWidth = parseInt(leftBarWidth.value)
  return currentWidth + sliderRadius + 'px'
})

// 进度条样式类
const barFillClass = computed(() => {
  return {
    'verify-slide__bar-fill--moving': status.value === 'moving',
    'verify-slide__bar-fill--success': status.value === 'success',
    'verify-slide__bar-fill--error': status.value === 'error'
  }
})

// 计算尺寸
const calculateSize = () => {
  const parseSize = (size: string, containerSize: number) => {
    if (size.includes('%')) {
      return (parseInt(size) / 100) * containerSize + 'px'
    }
    return size
  }

  const container = barAreaRef.value?.parentElement
  const containerWidth = container?.offsetWidth || window.innerWidth
  const containerHeight = container?.offsetHeight || window.innerHeight

  computedSize.imgWidth = parseSize(props.imgSize.width, containerWidth)
  computedSize.imgHeight = parseSize(props.imgSize.height, containerHeight)
  computedSize.barWidth = parseSize(props.barSize.width, containerWidth)
  computedSize.barHeight = parseSize(props.barSize.height, containerHeight)
}

// 获取验证码图片
const getPicture = async () => {
  try {
    const { data: res } = await http.post(
      'captcha/get',
      { captchaType: 'blockPuzzle' },
      { meta: { operate: '验证码获取', notify: false } }
    )

    if (res.data.repCode === '0000') {
      backImgBase.value = res.data.repData.originalImageBase64
      blockBackImgBase.value = res.data.repData.jigsawImageBase64
      backToken.value = res.data.repData.token
      secretKey.value = res.data.repData.secretKey
    } else {
      handleError(res.data)
    }
  } catch (error) {
    console.error('获取验证码失败:', error)
    tipWords.value = '获取验证码失败，请重试'
  }
}

// 处理错误响应
const handleError = (data: any) => {
  const errorMessages: Record<string, string> = {
    '6113': '验证系统未初始化，请稍后重试',
    '6201': '请求次数过多，请稍后重试',
    '6202': '错误次数过多，请稍后重试',
    '6204': '验证次数过多，请稍后重试'
  }
  tipWords.value = errorMessages[data.repCode] || data.repMsg || '验证失败'
}

// 获取客户端 X 坐标的辅助函数
const getClientX = (e: MouseEvent | TouchEvent): number => {
  if (e instanceof TouchEvent && e.touches.length > 0) {
    return e.touches[0]!.clientX
  }
  return (e as MouseEvent).clientX
}

// 开始拖动
const handleStart = (e: MouseEvent | TouchEvent) => {
  if (status.value === 'success') return

  e.preventDefault()
  e.stopPropagation()

  const clientX = getClientX(e)
  const barRect = barAreaRef.value?.getBoundingClientRect()
  if (!barRect) return

  startX.value = clientX - barRect.left
  startMoveTime.value = Date.now()
  status.value = 'moving'
  displayText.value = ''

  document.addEventListener('mousemove', handleMove)
  document.addEventListener('touchmove', handleMove)
  document.addEventListener('mouseup', handleEnd)
  document.addEventListener('touchend', handleEnd)
}

// 拖动中
const handleMove = (e: MouseEvent | TouchEvent) => {
  if (status.value !== 'moving') return

  const clientX = getClientX(e)
  const barRect = barAreaRef.value?.getBoundingClientRect()
  if (!barRect) return

  let left = clientX - barRect.left - startX.value
  const maxLeft = barRect.width - parseInt(computedSize.barHeight)

  // 限制移动范围
  left = Math.max(0, Math.min(left, maxLeft))

  moveBlockLeft.value = left + 'px'
  leftBarWidth.value = left + 'px'
}

// 结束拖动
const handleEnd = () => {
  if (status.value !== 'moving') return

  document.removeEventListener('mousemove', handleMove)
  document.removeEventListener('touchmove', handleMove)
  document.removeEventListener('mouseup', handleEnd)
  document.removeEventListener('touchend', handleEnd)

  endMoveTime.value = Date.now()
  verifyPosition()
}

// 验证位置
const verifyPosition = async () => {
  const moveDistance = parseInt(moveBlockLeft.value)
  // 将移动距离转换为标准310px下的距离
  const standardDistance = (moveDistance * 310) / parseInt(computedSize.imgWidth)

  const pointData = { x: standardDistance, y: 5.0 }
  const pointJson = secretKey.value ? aesEncrypt(JSON.stringify(pointData), secretKey.value) : JSON.stringify(pointData)

  try {
    const { data: res } = await http.post(
      'captcha/check',
      {
        captchaType: 'blockPuzzle',
        pointJson,
        token: backToken.value
      },
      { meta: { operate: '验证码校验', notify: false } }
    )

    if (res.data.repCode === '0000') {
      handleSuccess(pointData)
    } else {
      handleVerifyError()
    }
  } catch (error) {
    console.error('验证失败:', error)
    handleVerifyError()
  }
}

// 验证成功
const handleSuccess = (pointData: { x: number; y: number }) => {
  status.value = 'success'
  showRefresh.value = false

  const duration = ((endMoveTime.value - startMoveTime.value) / 1000).toFixed(2)
  tipWords.value = `验证成功 ${duration}s`
  finishText.value = '验证通过'

  const captchaVerification = secretKey.value
    ? aesEncrypt(`${backToken.value}---${JSON.stringify(pointData)}`, secretKey.value)
    : `${backToken.value}---${JSON.stringify(pointData)}`

  setTimeout(() => {
    tipWords.value = ''
    emit('success', { captchaVerification })
  }, 800)
}

// 验证失败
const handleVerifyError = () => {
  status.value = 'error'
  tipWords.value = '验证失败，请重试'

  setTimeout(() => {
    refresh()
  }, 1000)
}

// 刷新
const refresh = () => {
  showRefresh.value = true
  status.value = 'idle'
  finishText.value = ''
  tipWords.value = ''

  transitionLeft.value = 'left 0.3s ease'
  transitionWidth.value = 'width 0.3s ease'

  moveBlockLeft.value = '0'
  leftBarWidth.value = '0'

  getPicture()

  setTimeout(() => {
    transitionLeft.value = ''
    transitionWidth.value = ''
    displayText.value = props.explain
  }, 300)
}

// 手动刷新按钮点击
const handleRefresh = () => {
  if (status.value === 'moving') return
  refresh()
}

// 初始化
const init = () => {
  calculateSize()
  getPicture()
}

// 监听尺寸变化
watch(() => props.imgSize, init, { deep: true })

// 挂载时初始化
onMounted(() => {
  init()
})

// 暴露方法
defineExpose({
  refresh
})
</script>

<style lang="scss" scoped>
.verify-slide {
  width: 100%;
  user-select: none;
  -webkit-user-select: none;
  display: flex;
  flex-direction: column;
  align-items: center;

  &__image-panel {
    position: relative;
    margin-bottom: 16px;
    border-radius: 16px;
    overflow: hidden;
    background: #f8fafc;
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }

  &__bg-image {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }

  &__refresh {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 40px;
    height: 40px;
    border: none;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    border-radius: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #475569;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
    z-index: 10;

    &:hover {
      background: white;
      color: #0ea5e9;
      transform: rotate(90deg);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &:active {
      transform: rotate(90deg) scale(0.95);
    }
  }

  &__tip {
    position: absolute;
    left: 0;
    bottom: 0;
    right: 0;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    color: white;
    z-index: 5;

    &--success {
      background: rgba(34, 197, 94, 0.95);
    }

    &--error {
      background: rgba(239, 68, 68, 0.95);
    }
  }

  &__tip-icon {
    flex-shrink: 0;
  }

  &__puzzle-block {
    position: absolute;
    top: 0;
    z-index: 3;
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2));
  }

  &__puzzle-image {
    width: 100%;
    height: 100%;
    display: block;
    pointer-events: none;
  }

  &__bar {
    position: relative;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border: 2px solid #e2e8f0;
    border-radius: 25px;
    overflow: hidden;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  &__bar-text {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    color: #94a3b8;
    font-weight: 500;
    pointer-events: none;
    z-index: 1;
  }

  &__bar-fill {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
    border-radius: 23px;
    z-index: 2;
    transition: background 0.3s ease;

    &--moving {
      background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
    }

    &--success {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    }

    &--error {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    }
  }

  &__bar-fill-text {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    color: white;
    font-weight: 600;
    pointer-events: none;
  }

  &__slider {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    left: 0;
    width: 50px;
    height: 50px;
    background: white;
    border: 3px solid #e2e8f0;
    border-radius: 50%;
    cursor: grab;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
    z-index: 10;
    user-select: none;
    -webkit-user-select: none;

    &:hover {
      border-color: #0ea5e9;
      color: #0ea5e9;
      box-shadow:
        0 10px 15px -3px rgba(14, 165, 233, 0.2),
        0 4px 6px -2px rgba(14, 165, 233, 0.1);
      transform: translateY(-50%) scale(1.05);
    }

    &--moving {
      cursor: grabbing;
      border-color: #0ea5e9;
      color: #0ea5e9;
      box-shadow:
        0 10px 15px -3px rgba(14, 165, 233, 0.3),
        0 4px 6px -2px rgba(14, 165, 233, 0.15);
      transform: translateY(-50%) scale(1.05);
    }

    &--success {
      border-color: #22c55e;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
      cursor: default;
      box-shadow:
        0 10px 15px -3px rgba(34, 197, 94, 0.3),
        0 4px 6px -2px rgba(34, 197, 94, 0.15);

      &:hover {
        transform: translateY(-50%) scale(1);
      }
    }

    &--error {
      border-color: #ef4444;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      cursor: default;
      animation: shake 0.5s ease;

      &:hover {
        transform: translateY(-50%) scale(1);
      }
    }
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateY(-50%) translateX(0);
  }
  25% {
    transform: translateY(-50%) translateX(-5px);
  }
  75% {
    transform: translateY(-50%) translateX(5px);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

@media (max-width: 640px) {
  .verify-slide {
    &__image-panel {
      border-radius: 12px;
      margin-bottom: 12px;
    }

    &__refresh {
      width: 36px;
      height: 36px;
      top: 8px;
      right: 8px;
    }

    &__tip {
      height: 40px;
      font-size: 14px;
    }

    &__bar {
      border-radius: 20px;
    }

    &__slider {
      width: 44px;
      height: 44px;
    }

    &__bar-text,
    &__bar-fill-text {
      font-size: 14px;
    }
  }
}
</style>
