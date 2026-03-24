<template>
  <div class="nebula-puzzle">
    <!-- 验证图片区域 -->
    <div ref="imageRef" class="nebula-puzzle__image">
      <img v-if="bgImage" :src="`data:image/png;base64,${bgImage}`" alt="验证背景" />

      <!-- 刷新 -->
      <Transition name="nebula-fade">
        <button v-if="canRefresh" class="nebula-puzzle__refresh" aria-label="刷新验证码" @click="handleRefresh">
          <StrixIcon icon="refresh-cw" :size="16" />
        </button>
      </Transition>

      <!-- 状态提示 -->
      <Transition name="nebula-tip">
        <div v-if="tipText" :class="['nebula-puzzle__tip', `nebula-puzzle__tip--${status}`]">
          <StrixIcon :icon="status === 'success' ? 'circle-check' : 'circle-alert'" :size="16" />
          <span>{{ tipText }}</span>
        </div>
      </Transition>

      <!-- 拼图块 -->
      <div
        v-if="puzzleImage"
        class="nebula-puzzle__piece"
        :style="{ width: pieceWidth + 'px', height: '100%', left: thumbLeft, transition: thumbTransition }"
      >
        <img :src="`data:image/png;base64,${puzzleImage}`" alt="拼图块" />
      </div>
    </div>

    <!-- 滑动条 -->
    <div ref="trackRef" class="nebula-puzzle__track">
      <div class="nebula-puzzle__track-text">{{ hintText }}</div>

      <!-- 进度填充 -->
      <div :class="['nebula-puzzle__fill', fillClass]" :style="{ width: fillWidth, transition: fillTransition }" />
      <div class="nebula-puzzle__fill-text">{{ doneText }}</div>

      <!-- 滑块拇指 -->
      <div
        :class="['nebula-puzzle__thumb', thumbClass]"
        :style="{ left: thumbLeft, transition: thumbTransition }"
        @mousedown="onDragStart"
        @touchstart="onDragStart"
      >
        <StrixIcon :icon="thumbIcon" :size="20" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import StrixIcon from '@/components/icon/StrixIcon.vue'
import { http } from '@/plugins/axios'
import { sm4Encrypt } from '@/components/captcha/utils/captcha-sm4'
import type { ApiResponse } from '@/@types/plugins/axios'

// ---- 常量 ----
const STANDARD_WIDTH = 310
const PIECE_RATIO = 60 / 400
const THUMB_SIZE = 44
const SUCCESS_DELAY = 800
const ERROR_DELAY = 1000
const RESET_DURATION = 300

type Status = 'idle' | 'moving' | 'success' | 'error'

interface CaptchaGetData {
  uuid: string
  originalImageBase64: string
  jigsawImageBase64: string
  secretKey: string
}

interface CaptchaCheckData {
  result: boolean
  captchaVerification: string
}

const emit = defineEmits<{
  success: [payload: { captchaVerification: string }]
}>()

// ---- 模板引用 ----
const imageRef = ref<HTMLElement>()
const trackRef = ref<HTMLElement>()

// ---- 状态 ----
const bgImage = ref('')
const puzzleImage = ref('')
const uuid = ref('')
const secretKey = ref('')
const status = ref<Status>('idle')
const tipText = ref('')
const hintText = ref('向右滑动完成验证')
const doneText = ref('')
const canRefresh = ref(true)
const thumbLeft = ref('0px')
const fillWidth = ref('0px')
const thumbTransition = ref('')
const fillTransition = ref('')

// 拖动临时变量
let dragStartX = 0
let dragStartTime = 0

// ---- 计算属性 ----
const actualWidth = computed(() => imageRef.value?.offsetWidth || STANDARD_WIDTH)
const pieceWidth = computed(() => Math.floor(actualWidth.value * PIECE_RATIO))

const thumbIcon = computed(() => {
  if (status.value === 'success') return 'check'
  if (status.value === 'error') return 'x'
  return 'arrow-right'
})

const thumbClass = computed(() => ({
  'nebula-puzzle__thumb--moving': status.value === 'moving',
  'nebula-puzzle__thumb--success': status.value === 'success',
  'nebula-puzzle__thumb--error': status.value === 'error'
}))

const fillClass = computed(() => ({
  'nebula-puzzle__fill--moving': status.value === 'moving',
  'nebula-puzzle__fill--success': status.value === 'success',
  'nebula-puzzle__fill--error': status.value === 'error'
}))

// ---- API ----
const fetchCaptcha = async () => {
  try {
    const { data: res } = await http.post<ApiResponse<CaptchaGetData>>(
      'system/captcha/get',
      { captchaType: 'blockPuzzle' },
      { meta: { operate: '验证码获取', notify: false } }
    )
    if (res.data) {
      uuid.value = res.data.uuid
      bgImage.value = res.data.originalImageBase64
      puzzleImage.value = res.data.jigsawImageBase64
      secretKey.value = res.data.secretKey
    } else {
      tipText.value = res.msg || '获取验证码失败'
    }
  } catch {
    tipText.value = '获取验证码失败，请重试'
  }
}

const verifyCaptcha = async () => {
  const moveDistance = parseInt(thumbLeft.value)
  const standardDistance = (moveDistance * STANDARD_WIDTH) / actualWidth.value
  const pointData = { x: standardDistance, y: 5 }
  const pointJson = secretKey.value ? sm4Encrypt(JSON.stringify(pointData), secretKey.value) : JSON.stringify(pointData)

  try {
    const { data: res } = await http.post<ApiResponse<CaptchaCheckData>>(
      'system/captcha/check',
      { captchaType: 'blockPuzzle', pointJson, uuid: uuid.value },
      { meta: { operate: '验证码校验', notify: false } }
    )
    if (res.data?.result) {
      onSuccess(res.data.captchaVerification)
    } else {
      onError(res.msg)
    }
  } catch {
    onError()
  }
}

// ---- 拖动逻辑 ----
const getClientX = (e: MouseEvent | TouchEvent): number => {
  return e instanceof TouchEvent && e.touches.length > 0 ? e.touches[0]!.clientX : (e as MouseEvent).clientX
}

const onDragStart = (e: MouseEvent | TouchEvent) => {
  if (status.value === 'success') return
  e.preventDefault()
  e.stopPropagation()

  const trackRect = trackRef.value?.getBoundingClientRect()
  if (!trackRect) return

  dragStartX = getClientX(e) - trackRect.left
  dragStartTime = Date.now()
  status.value = 'moving'
  hintText.value = ''

  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('touchmove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
  document.addEventListener('touchend', onDragEnd)
}

const onDragMove = (e: MouseEvent | TouchEvent) => {
  if (status.value !== 'moving') return

  const trackRect = trackRef.value?.getBoundingClientRect()
  if (!trackRect) return

  const maxLeft = trackRect.width - THUMB_SIZE
  let left = getClientX(e) - trackRect.left - dragStartX
  left = Math.max(0, Math.min(left, maxLeft))

  thumbLeft.value = left + 'px'
  fillWidth.value = left + THUMB_SIZE / 2 + 'px'
}

const onDragEnd = () => {
  if (status.value !== 'moving') return

  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('touchmove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('touchend', onDragEnd)

  verifyCaptcha()
}

// ---- 结果处理 ----
const onSuccess = (captchaVerification: string) => {
  status.value = 'success'
  canRefresh.value = false
  const duration = ((Date.now() - dragStartTime) / 1000).toFixed(2)
  tipText.value = `验证成功 ${duration}s`
  doneText.value = '验证通过'

  setTimeout(() => {
    tipText.value = ''
    emit('success', { captchaVerification })
  }, SUCCESS_DELAY)
}

const onError = (msg?: string) => {
  status.value = 'error'
  tipText.value = msg || '验证失败，请重试'

  setTimeout(() => refresh(), ERROR_DELAY)
}

// ---- 刷新 ----
const refresh = () => {
  canRefresh.value = true
  status.value = 'idle'
  tipText.value = ''
  doneText.value = ''
  hintText.value = '向右滑动完成验证'

  const sec = RESET_DURATION / 1000 + 's'
  thumbTransition.value = `left ${sec} ease`
  fillTransition.value = `width ${sec} ease`

  thumbLeft.value = '0px'
  fillWidth.value = '0px'

  fetchCaptcha()

  setTimeout(() => {
    thumbTransition.value = ''
    fillTransition.value = ''
  }, RESET_DURATION)
}

const handleRefresh = () => {
  if (status.value === 'moving') return
  refresh()
}

onMounted(() => fetchCaptcha())

defineExpose({ refresh })
</script>
