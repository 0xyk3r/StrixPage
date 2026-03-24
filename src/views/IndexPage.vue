<template>
  <div class="nebula-index">
    <!-- Hero — asymmetric two-column -->
    <div class="nebula-index__hero">
      <div class="nebula-index__hero-left">
        <div class="nebula-index__session">
          <span class="nebula-index__session-dot"></span>
          SESSION_ACTIVE
        </div>
        <div class="nebula-index__greeting">Welcome back,</div>
        <div class="nebula-index__username">{{ nickname }}</div>
        <div class="nebula-index__role-row">
          <span class="nebula-index__role-badge">{{ roleName }}</span>
          <span class="nebula-index__role-line"></span>
        </div>
      </div>
      <div class="nebula-index__hero-right">
        <div class="nebula-index__hud-clock">
          <div class="nebula-index__hud-clock-label">SYSTEM_TIME</div>
          <div class="nebula-index__hud-clock-digits">
            <template v-for="(ch, i) in clockChars" :key="i">
              <span v-if="ch === ':'" class="nebula-index__hud-sep">:</span>
              <span v-else class="nebula-index__hud-digit">{{ ch }}</span>
            </template>
          </div>
          <div class="nebula-index__hud-clock-date">{{ dateStr }}</div>
          <!-- Corner HUD brackets -->
          <i class="nebula-index__hud-corner tl"></i>
          <i class="nebula-index__hud-corner tr"></i>
          <i class="nebula-index__hud-corner bl"></i>
          <i class="nebula-index__hud-corner br"></i>
        </div>
      </div>
    </div>

    <!-- Divider -->
    <div class="nebula-index__divider">
      <span class="nebula-index__divider-label">NAVIGATION_MODULES</span>
      <span class="nebula-index__divider-line"></span>
    </div>

    <!-- Module Grid -->
    <div class="nebula-index__modules">
      <div
        v-for="(mod, i) in modules"
        :key="mod.id"
        class="nebula-index__card"
        :style="{ '--d': `${0.35 + i * 0.06}s` }"
        @click="navigateToModule(mod)"
        @mouseenter="onCardEnter($event)"
      >
        <!-- Scan sweep on hover -->
        <span class="nebula-index__card-scan"></span>
        <div class="nebula-index__card-header">
          <div class="nebula-index__card-icon">
            <StrixIcon :icon="mod.iconName || 'box'" :size="20" />
          </div>
          <div class="nebula-index__card-info">
            <div class="nebula-index__card-title">{{ mod.name }}</div>
            <div v-if="mod.children?.length" class="nebula-index__card-count">
              {{ mod.children.length }} {{ mod.children.length === 1 ? 'module' : 'modules' }}
            </div>
          </div>
        </div>
        <div v-if="mod.children?.length" class="nebula-index__card-children">
          <span
            v-for="child in mod.children.slice(0, 5)"
            :key="child.id"
            class="nebula-index__card-child"
            :class="{ 'is-leaf': isLeaf(child) }"
            @click.stop="navigateToChild(child)"
          >
            {{ child.name }}
          </span>
          <span v-if="mod.children.length > 5" class="nebula-index__card-more"> +{{ mod.children.length - 5 }} </span>
        </div>
      </div>
    </div>

    <!-- Footer: project info + status -->
    <div class="nebula-index__footer">
      <div class="nebula-index__info">
        <span v-for="(item, i) in projectInfo" :key="item.key" class="nebula-index__info-item">
          <span v-if="i > 0" class="nebula-index__info-sep">·</span>
          <span class="nebula-index__info-key">{{ item.key }}</span>
          <span class="nebula-index__info-val">{{ item.val }}</span>
        </span>
      </div>
      <div class="nebula-index__status">
        <span>SYS.STRIX // v3.2</span>
        <span class="nebula-index__status-sep"></span>
        <span>NODE.ONLINE</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import StrixIcon from '@/components/icon/StrixIcon.vue'
import { useLoginInfoStore } from '@/stores/login-info'
import { useHomeMenu } from '@/composables/useHomeMenu'

const loginInfoStore = useLoginInfoStore()
const router = useRouter()

const nickname = computed(() => loginInfoStore.loginInfo?.nickname || 'Operator')
const roleName = computed(() => {
  const t = loginInfoStore.loginInfo?.type
  return t === 1 ? 'SUPER_ADMIN' : 'OPERATOR'
})

// Live clock — split into chars for individual digit styling
const clockChars = ref<string[]>([])
const dateStr = ref('')
let clockTimer: ReturnType<typeof setInterval> | null = null

const updateClock = () => {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false })
  clockChars.value = timeStr.split('')
  dateStr.value = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`
}

onMounted(() => {
  updateClock()
  clockTimer = setInterval(updateClock, 1000)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
})

// Menu data
const { menuList } = useHomeMenu()
const modules = computed(() => menuList.value || [])

const navigateToModule = (mod: any) => {
  if (mod.children?.length) {
    const leaf = findFirstLeaf(mod.children)
    if (leaf?.url) {
      router.push(leaf.url)
      return
    }
  }
  if (mod.url) router.push(mod.url)
}

const navigateToChild = (child: any) => {
  if (isLeaf(child) && child.url) {
    router.push(child.url)
    return
  }
  // If child has its own children, find first leaf descendant
  if (child.children?.length) {
    const leaf = findFirstLeaf(child.children)
    if (leaf?.url) {
      router.push(leaf.url)
      return
    }
  }
}

const isLeaf = (item: any): boolean => {
  return !item.children || item.children.length === 0
}

const findFirstLeaf = (items: any[]): any | null => {
  for (const item of items) {
    if (isLeaf(item) && item.url) return item
    if (item.children?.length) {
      const found = findFirstLeaf(item.children)
      if (found) return found
    }
  }
  return null
}

// Card hover scan trigger
const onCardEnter = (e: MouseEvent) => {
  const card = e.currentTarget as HTMLElement
  const scan = card.querySelector('.nebula-index__card-scan') as HTMLElement
  if (scan) {
    scan.classList.remove('is-active')
    void scan.offsetWidth
    scan.classList.add('is-active')
  }
}

// Project info
const projectInfo = [
  { key: 'FRAMEWORK', val: 'Vue 3.5 + Vite 7' },
  { key: 'UI', val: 'Nebula Design' },
  { key: 'STATE', val: 'Pinia 3' },
  { key: 'LANG', val: 'TypeScript 5' }
]
</script>

<style lang="scss" scoped></style>
