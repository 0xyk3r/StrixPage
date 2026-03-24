<template>
  <div class="nebula-login">
    <!-- 交互式点阵网格 -->
    <canvas ref="gridCanvas" class="nebula-login__grid" />
    <div class="nebula-login__scanlines" />

    <!-- HUD 四角装饰 -->
    <div class="nebula-login__hud-corner nebula-login__hud-corner--tl" />
    <div class="nebula-login__hud-corner nebula-login__hud-corner--tr" />
    <div class="nebula-login__hud-corner nebula-login__hud-corner--bl" />
    <div class="nebula-login__hud-corner nebula-login__hud-corner--br" />
    <div class="nebula-login__hud-label nebula-login__hud-label--tl">SYS.ONLINE // SECURE</div>
    <div class="nebula-login__hud-label nebula-login__hud-label--br">NODE.STRIX // v3.2.1</div>

    <!-- 切角面板 -->
    <div class="nebula-login__panel">
      <div class="nebula-login__frame">
        <!-- 面板扫描线 -->
        <div class="nebula-login__scan" />

        <!-- 面板标题栏 -->
        <div class="nebula-login__panel-header">
          <span class="nebula-login__panel-id">PANEL::AUTH-01</span>
          <span class="nebula-login__panel-status">
            <span class="nebula-login__status-dot" />
            ACTIVE
          </span>
        </div>

        <!-- Logo -->
        <div class="nebula-login__logo">
          <span class="nebula-login__logo-text">Strix</span>
          <span class="nebula-login__logo-dot" />
        </div>

        <!-- 标语 -->
        <div class="nebula-login__tagline">
          <span class="nebula-login__tagline-text">Control Center</span>
          <span class="nebula-login__cursor" />
        </div>

        <!-- 表单 -->
        <form class="nebula-login__form" @submit.prevent="handleSubmit">
          <!-- 账号 -->
          <div
            :class="['nebula-login__field', { focused: focusedField === 'loginName', 'has-error': errors.loginName }]"
            :style="{ '--d': '1.05s' }"
          >
            <div class="nebula-login__field-label">
              <span class="nebula-login__indicator" />
              <span class="nebula-login__label-text">登录账号</span>
              <span class="nebula-login__required">*</span>
            </div>
            <div class="nebula-login__input-shell">
              <input
                v-model="form.loginName"
                class="nebula-login__input"
                type="text"
                placeholder="ENTER_USERNAME"
                maxlength="20"
                autocomplete="username"
                @focus="focusedField = 'loginName'"
                @blur="
                  focusedField = ''
                  validateField('loginName')
                "
                @input="clearError('loginName')"
              />
            </div>
            <div v-if="errors.loginName" class="nebula-login__field-error">
              <StrixIcon icon="alert-circle" :size="11" />
              {{ errors.loginName }}
            </div>
          </div>

          <!-- 密码 -->
          <div
            :class="[
              'nebula-login__field',
              { focused: focusedField === 'loginPassword', 'has-error': errors.loginPassword }
            ]"
            :style="{ '--d': '1.15s' }"
          >
            <div class="nebula-login__field-label">
              <span class="nebula-login__indicator" />
              <span class="nebula-login__label-text">登录密码</span>
              <span class="nebula-login__required">*</span>
            </div>
            <div class="nebula-login__input-shell">
              <input
                v-model="form.loginPassword"
                class="nebula-login__input nebula-login__input--password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="ENTER_PASSWORD"
                maxlength="20"
                autocomplete="current-password"
                @focus="focusedField = 'loginPassword'"
                @blur="
                  focusedField = ''
                  validateField('loginPassword')
                "
                @input="clearError('loginPassword')"
              />
              <button
                type="button"
                class="nebula-login__toggle-pwd"
                tabindex="-1"
                @click="showPassword = !showPassword"
              >
                <StrixIcon :icon="showPassword ? 'eye-off' : 'eye'" :size="16" />
              </button>
            </div>
            <div v-if="errors.loginPassword" class="nebula-login__field-error">
              <StrixIcon icon="alert-circle" :size="11" />
              {{ errors.loginPassword }}
            </div>
          </div>

          <!-- 登录按钮 -->
          <div class="nebula-login__actions">
            <button type="submit" class="nebula-login__submit" :disabled="isLogging">
              <span class="nebula-login__submit-content">
                <template v-if="isLogging">
                  <span class="nebula-login__spinner" />
                  AUTHENTICATING
                </template>
                <template v-else>
                  <span class="nebula-login__bracket">[</span>
                  登 录
                  <span class="nebula-login__bracket">]</span>
                </template>
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 验证码 -->
    <CaptchaContainer ref="captchaRef" @success="onCaptchaSuccess" />

    <!-- 版权 -->
    <div class="nebula-login__copyright">
      Copyright &copy; 2026 ProjectAn Strix |
      <a href="https://beian.miit.gov.cn/" target="_blank">京ICP备2022027076号-1</a>
    </div>
  </div>
</template>

<script lang="ts" setup>
import StrixIcon from '@/components/icon/StrixIcon.vue'
import CaptchaContainer from '@/components/captcha/CaptchaContainer.vue'
import { http } from '@/plugins/axios'
import { useLoginInfoStore } from '@/stores/login-info'
import { useTabsBarStore } from '@/stores/tabs-bar'
import { initStrixLoadingBar } from '@/utils/strix-loading-bar'
import { createStrixMessage, initStrixMessage } from '@/utils/strix-message'

const route = useRoute()
const router = useRouter()
const tabBarStore = useTabsBarStore()
const loginInfoStore = useLoginInfoStore()

initStrixLoadingBar(useLoadingBar())
initStrixMessage()

const loggedJumpPath = route.query.to || '/'

// ---- 交互式点阵网格 ----
const gridCanvas = ref<HTMLCanvasElement | null>(null)
let animId = 0
let mouseX = -999
let mouseY = -999

interface Dot {
  x: number
  y: number
  base: number
  a: number
  phase: number
  speed: number
}

onMounted(() => {
  if (route.query.r === 'e') {
    createStrixMessage('error', '登录状态失效', '由于在其他设备上登录或凭据过期，登录状态已失效，请重新登录')
  }
  initGrid()
})

onUnmounted(() => {
  cancelAnimationFrame(animId)
  window.removeEventListener('resize', resizeGrid)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseleave', onMouseLeave)
})

const dots: Dot[] = []
const SPACE = 36

function resizeGrid() {
  const canvas = gridCanvas.value
  if (!canvas) return
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  dots.length = 0
  const cols = Math.ceil(canvas.width / SPACE) + 1
  const rows = Math.ceil(canvas.height / SPACE) + 1
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push({
        x: c * SPACE,
        y: r * SPACE,
        base: 0.045 + Math.random() * 0.035,
        a: 0,
        phase: Math.random() * Math.PI * 2,
        speed: 0.004 + Math.random() * 0.008
      })
    }
  }
}

function onMouseMove(e: MouseEvent) {
  mouseX = e.clientX
  mouseY = e.clientY
}

function onMouseLeave() {
  mouseX = -999
  mouseY = -999
}

function drawFrame(t: number) {
  const canvas = gridCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const cx = canvas.width / 2
  const cy = canvas.height / 2

  for (const d of dots) {
    d.phase += d.speed
    const wave = Math.sin(d.phase) * 0.015
    const dc = Math.sqrt((d.x - cx) ** 2 + (d.y - cy) ** 2)
    const ripple = Math.sin(dc * 0.007 - t * 0.0008) * 0.025
    const dm = Math.sqrt((d.x - mouseX) ** 2 + (d.y - mouseY) ** 2)
    const mi = Math.max(0, 1 - dm / 180)
    const target = d.base + wave + ripple + mi * 0.4
    d.a += (target - d.a) * 0.07
    const sz = 1.2 + mi * 2.5

    ctx.beginPath()
    ctx.arc(d.x, d.y, sz, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(99,226,183,${d.a})`
    ctx.fill()

    if (mi > 0.15) {
      ctx.beginPath()
      ctx.arc(d.x, d.y, sz + 5, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(99,226,183,${mi * 0.08})`
      ctx.lineWidth = 0.5
      ctx.stroke()
    }
  }

  animId = requestAnimationFrame(drawFrame)
}

function initGrid() {
  resizeGrid()
  window.addEventListener('resize', resizeGrid)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseleave', onMouseLeave)
  animId = requestAnimationFrame(drawFrame)
}

// ---- 表单状态 ----
const isLogging = ref(false)
const showPassword = ref(false)
const focusedField = ref('')
const form = reactive({
  loginName: '',
  loginPassword: '',
  captchaVerification: ''
})

// ---- 表单验证 ----
const errors = reactive<Record<string, string>>({
  loginName: '',
  loginPassword: ''
})

const rules: Record<string, Array<{ test: (v: string) => boolean; msg: string }>> = {
  loginName: [
    { test: (v) => !!v.trim(), msg: '请输入登录账号' },
    { test: (v) => v.length >= 2 && v.length <= 16, msg: '长度在2-16字符之间' }
  ],
  loginPassword: [
    { test: (v) => !!v.trim(), msg: '请输入登录密码' },
    { test: (v) => v.length >= 5 && v.length <= 16, msg: '长度在5-16字符之间' }
  ]
}

const validateField = (field: string): boolean => {
  const value = (form as any)[field] as string
  const fieldRules = rules[field] || []
  for (const rule of fieldRules) {
    if (!rule.test(value)) {
      errors[field] = rule.msg
      return false
    }
  }
  errors[field] = ''
  return true
}

const clearError = (field: string) => {
  if (errors[field]) errors[field] = ''
}

const validateAll = (): boolean => {
  let valid = true
  for (const field of Object.keys(rules)) {
    if (!validateField(field)) valid = false
  }
  return valid
}

// ---- 验证码 ----
const captchaRef = ref<InstanceType<typeof CaptchaContainer> | null>(null)

const handleSubmit = () => {
  if (!validateAll()) {
    createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')
    return
  }
  captchaRef.value?.show()
}

const onCaptchaSuccess = (payload: { captchaVerification: string }) => {
  form.captchaVerification = payload.captchaVerification
  login()
}

// ---- 登录请求 ----
const login = () => {
  if (!validateAll()) return

  isLogging.value = true
  http
    .post('system/login', { ...form }, { meta: { operate: '登录', notify: false } })
    .then(({ data: res }) => {
      const loginManagerType = res.data.info.type
      loginInfoStore.updateLoginInfo(res)
      tabBarStore.delAllVisitedRoutes()
      createStrixMessage(
        'success',
        '登录成功',
        `${loginManagerType === 1 ? '超级管理员' : '当前用户'}：` + res.data.info.nickname
      )
      const pushPath = (loggedJumpPath !== '/login' ? loggedJumpPath : '/') as string
      router.push(pushPath)
    })
    .catch(() => {
      form.loginPassword = ''
    })
    .finally(() => {
      isLogging.value = false
    })
}
</script>
