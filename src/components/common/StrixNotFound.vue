<template>
  <div class="not-found">
    <!-- 星空背景 -->
    <div class="not-found__stars">
      <div v-for="i in 60" :key="i" class="star" :style="starStyle(i)" />
    </div>

    <!-- 星球装饰 -->
    <div class="not-found__planet">
      <div class="planet-body" />
      <div class="planet-ring" />
      <!-- 轨道上的小卫星 -->
      <div class="orbit">
        <div class="satellite" />
      </div>
    </div>

    <!-- 主内容 -->
    <div class="not-found__content">
      <div class="not-found__code">404</div>
      <h1 class="not-found__title">页面去外太空旅行了</h1>
      <p class="not-found__desc">您访问的页面不存在或已被移除</p>

      <div v-if="displayPath" class="not-found__path">
        <code>{{ displayPath }}</code>
      </div>

      <div class="not-found__actions">
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

      <p class="not-found__countdown">
        <span>{{ countDown }}</span> 秒后自动返回首页
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ArrowLeft, Home } from 'lucide-vue-next'
import { useTabsBarStore } from '@/stores/tabs-bar.ts'

const route = useRoute()
const router = useRouter()
const tabsBarStore = useTabsBarStore()

const countDown = ref(10)
const canGoBack = ref(window.history.length > 1)

const displayPath = computed(() => {
  const path = route.fullPath
  return path && path !== '/' ? path : ''
})

// 星星随机样式
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
.not-found {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 56px);
  overflow: hidden;
  user-select: none;
}

// 星空
.not-found__stars {
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

// 星球
.not-found__planet {
  position: absolute;
  top: 15%;
  right: 18%;
  width: 80px;
  height: 80px;

  @media (max-width: 768px) {
    top: 8%;
    right: 10%;
    width: 56px;
    height: 56px;
  }
}

.planet-body {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #4a3f6b, #2d2548, #1a1530);
  box-shadow:
    inset -8px -6px 16px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(124, 106, 239, 0.15);
  animation: planet-float 6s ease-in-out infinite;
}

.planet-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 140%;
  height: 30%;
  border: 2px solid rgba(99, 226, 183, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%) rotateX(70deg);
}

.orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200%;
  height: 200%;
  transform: translate(-50%, -50%);
  animation: orbit-spin 8s linear infinite;
}

.satellite {
  position: absolute;
  top: 0;
  left: 50%;
  width: 6px;
  height: 6px;
  margin-left: -3px;
  border-radius: 50%;
  background: var(--strix-color-accent, #63e2b7);
  box-shadow: 0 0 8px var(--strix-color-accent, #63e2b7);
}

@keyframes planet-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@keyframes orbit-spin {
  from {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

// 主内容
.not-found__content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 20px;
}

.not-found__code {
  font-family: 'Outfit', 'Geist Mono', monospace;
  font-size: 120px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -4px;
  background: linear-gradient(180deg, var(--strix-text-primary) 0%, var(--strix-text-tertiary) 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    font-size: 80px;
  }
}

.not-found__title {
  font-family: var(--strix-font-display, 'Outfit', sans-serif);
  font-size: 24px;
  font-weight: 600;
  color: var(--strix-text-primary);
  margin: 0 0 8px;

  @media (max-width: 768px) {
    font-size: 20px;
  }
}

.not-found__desc {
  font-size: 14px;
  color: var(--strix-text-secondary);
  margin: 0 0 16px;
}

.not-found__path {
  margin-bottom: 24px;

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

.not-found__actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
}

.not-found__countdown {
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
