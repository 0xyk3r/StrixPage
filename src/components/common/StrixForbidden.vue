<template>
  <div class="forbidden">
    <!-- 星空背景 -->
    <div class="forbidden__stars">
      <div v-for="i in 60" :key="i" class="star" :style="starStyle(i)" />
    </div>

    <!-- 盾牌装饰 -->
    <div class="forbidden__shield">
      <div class="shield-body">
        <ShieldAlert :size="80" :stroke-width="1" />
      </div>
      <div class="shield-pulse" />
      <div class="shield-pulse shield-pulse--delayed" />
    </div>

    <!-- 主内容 -->
    <div class="forbidden__content">
      <div class="forbidden__code">403</div>
      <h1 class="forbidden__title">访问被星际防护盾拦截了</h1>
      <p class="forbidden__desc">您没有访问此页面的权限，请联系管理员获取授权</p>

      <div v-if="displayPath" class="forbidden__path">
        <code>{{ displayPath }}</code>
      </div>

      <div v-if="requiredPermission" class="forbidden__permission">
        <span>需要权限：</span>
        <code class="perm-key">{{ requiredPermission }}</code>
      </div>

      <div class="forbidden__actions">
        <n-button type="primary" @click="goHome">
          <template #icon>
            <Home :size="16" />
          </template>
          返回首页
        </n-button>
        <n-button v-if="canGoBack" quaternary @click="goBack">
          <template #icon>
            <ArrowLeft :size="16" />
          </template>
          返回上一页
        </n-button>
      </div>

      <p class="forbidden__countdown">
        <span>{{ countDown }}</span> 秒后自动返回首页
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ArrowLeft, Home, ShieldAlert } from 'lucide-vue-next'
import { useTabsBarStore } from '@/stores/tabs-bar.ts'

const route = useRoute()
const router = useRouter()
const tabsBarStore = useTabsBarStore()

const countDown = ref(10)
const canGoBack = ref(window.history.length > 1)

const displayPath = computed(() => {
  const path = route.query.path as string
  return path || ''
})

const requiredPermission = computed(() => {
  return (route.query.permission as string) || ''
})

const starStyle = (i: number) => {
  const seed = i * 7919
  const x = (seed * 13) % 100
  const y = (seed * 17) % 100
  const size = 1 + (seed % 3)
  const delay = (seed % 4000) / 1000
  const duration = 2 + (seed % 3000) / 1000
  return {
    left: `${x}%`,
    top: `${y}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}

let timer: number | null = null
const clearTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const goHome = () => {
  clearTimer()
  tabsBarStore.delVisitedRoute(route)
  router.push({ path: '/' })
}

const goBack = () => {
  clearTimer()
  tabsBarStore.delVisitedRoute(route)
  router.back()
}

onMounted(() => {
  timer = setInterval(() => {
    countDown.value--
    if (countDown.value === 0) {
      goHome()
    }
  }, 1000)
})

onUnmounted(() => {
  clearTimer()
})
</script>

<style lang="scss" scoped>
.forbidden {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 56px);
  overflow: hidden;
  user-select: none;
}

// 星空
.forbidden__stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.star {
  position: absolute;
  border-radius: 50%;
  background: var(--strix-text-primary);
  opacity: 0;
  animation: twinkle ease-in-out infinite alternate;
}

@keyframes twinkle {
  from {
    opacity: 0.1;
  }
  to {
    opacity: 0.7;
  }
}

// 盾牌
.forbidden__shield {
  position: absolute;
  top: 15%;
  right: 18%;
  width: 80px;
  height: 80px;
  animation: shield-float 5s ease-in-out infinite;

  @media (max-width: 768px) {
    top: 8%;
    right: 10%;
    width: 56px;
    height: 56px;
  }
}

.shield-body {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--strix-color-error, #e88080);
  filter: drop-shadow(0 0 20px rgba(232, 128, 128, 0.25));

  [data-theme='light'] & {
    filter: drop-shadow(0 0 20px rgba(208, 48, 80, 0.2));
  }
}

.shield-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 140%;
  height: 140%;
  transform: translate(-50%, -50%);
  border: 2px solid rgba(232, 128, 128, 0.15);
  border-radius: 50%;
  animation: pulse-ring 3s ease-out infinite;

  &--delayed {
    animation-delay: 1.5s;
  }

  [data-theme='light'] & {
    border-color: rgba(208, 48, 80, 0.15);
  }
}

@keyframes shield-float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-8px) rotate(3deg);
  }
}

@keyframes pulse-ring {
  0% {
    width: 100%;
    height: 100%;
    opacity: 0.4;
  }
  100% {
    width: 200%;
    height: 200%;
    opacity: 0;
  }
}

// 主内容
.forbidden__content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 20px;
}

.forbidden__code {
  font-family: 'Outfit', 'Geist Mono', monospace;
  font-size: 120px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -4px;
  background: linear-gradient(180deg, var(--strix-color-error, #e88080) 0%, rgba(232, 128, 128, 0.4) 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 16px;

  [data-theme='light'] & {
    background: linear-gradient(180deg, var(--strix-color-error) 0%, rgba(208, 48, 80, 0.4) 100%);
    background-clip: text;
    -webkit-background-clip: text;
  }

  @media (max-width: 768px) {
    font-size: 80px;
  }
}

.forbidden__title {
  font-family: var(--strix-font-display, 'Outfit', sans-serif);
  font-size: 24px;
  font-weight: 600;
  color: var(--strix-text-primary);
  margin: 0 0 8px;

  @media (max-width: 768px) {
    font-size: 20px;
  }
}

.forbidden__desc {
  font-size: 14px;
  color: var(--strix-text-secondary);
  margin: 0 0 16px;
}

.forbidden__path {
  margin-bottom: 16px;

  code {
    display: inline-block;
    padding: 4px 12px;
    font-family: 'Geist Mono', 'Fira Code', monospace;
    font-size: 13px;
    color: var(--strix-text-tertiary);
    background: var(--strix-bg-surface);
    border: 1px solid var(--strix-border-subtle);
    border-radius: 6px;
    max-width: 400px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.forbidden__permission {
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  color: var(--strix-text-tertiary);

  .perm-key {
    padding: 2px 8px;
    font-family: 'Geist Mono', 'Fira Code', monospace;
    font-size: 12px;
    color: var(--strix-color-error, #e88080);
    background: rgba(232, 128, 128, 0.1);
    border: 1px solid rgba(232, 128, 128, 0.2);
    border-radius: 4px;
  }
}

.forbidden__actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
}

.forbidden__countdown {
  font-size: 13px;
  color: var(--strix-text-tertiary);
  margin: 0;

  span {
    display: inline-block;
    min-width: 1em;
    font-weight: 600;
    color: var(--strix-color-accent, #63e2b7);
  }
}
</style>
