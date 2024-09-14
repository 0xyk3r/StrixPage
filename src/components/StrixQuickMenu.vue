<template>
  <transition name="quick-menus-show">
    <n-el
      v-if="quickMenus && quickMenus.length > 0"
      tag="ul"
      class="strix-quick-menu"
      :class="autoActive ? 'auto-active' : ''"
    >
      <transition-group name="quick-menu-list">
        <li v-for="item in quickMenus" :key="item.id" :class="'color-' + item.color">
          <n-tooltip
            class="item"
            trigger="hover"
            :delay="300"
            placement="left"
            style="max-width: 220px"
          >
            <template #trigger>
              <a @click="item.callback">
                <Icon v-if="item.icon" :icon="item.icon" :width="18" />
                <p>{{ item.name }}</p>
              </a>
            </template>
            {{ item.tips }}
          </n-tooltip>
        </li>
      </transition-group>
    </n-el>
  </transition>
</template>

<script setup lang="ts">
import { useQuickMenuStore } from '@/stores/quick-menu'
import { Icon } from '@iconify/vue'
import { storeToRefs } from 'pinia'

const quickMenuStore = useQuickMenuStore()
const { quickMenus } = storeToRefs(quickMenuStore)

const autoActive = ref(false)
let autoActiveTimer: number | null = null
const clearAutoActiveTimer = () => {
  if (autoActiveTimer !== null) {
    clearTimeout(autoActiveTimer)
    autoActiveTimer = null
  }
}

watch(
  quickMenus,
  () => {
    clearAutoActiveTimer()
    autoActive.value = true
    autoActiveTimer = setTimeout(() => {
      autoActive.value = false
    }, 1000)
  },
  { immediate: true }
)
</script>

<style lang="less" scoped>
.strix-quick-menu {
  position: fixed;
  top: 33%;
  right: -55px;
  z-index: 2000;
  padding: 10px 8px 0 8px;
  margin: 0;
  text-align: center;
  background: var(--tag-color);
  border: 1px solid var(--border-color);
  border-top-left-radius: 5.5px;
  border-bottom-left-radius: 5.5px;
  box-shadow: var(--box-shadow-1);
  box-sizing: border-box;
  width: 78px;
  opacity: 0.5;
  transition: all 0.25s cubic-bezier(0.645, 0.045, 0.355, 1);
}

.strix-quick-menu:hover,
.strix-quick-menu.auto-active {
  right: 0;
  opacity: 1;
}

.strix-quick-menu > li {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0 0 10px 0;
  list-style: none;
  cursor: pointer;
}

.strix-quick-menu > li a {
  color: var(--text-color-base);
  opacity: 0.75;
  display: inline-block;
  width: 60px;
  height: 60px;
  padding-top: 10px;
  text-align: center;
  border-radius: 5.5px;
  box-sizing: border-box;
  transition:
    color 0.15s ease,
    background-color 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.strix-quick-menu > li.color-primary a {
  background: var(--primary-color-suppl);
}

.strix-quick-menu > li.color-primary a:hover {
  background: var(--primary-color-pressed);
}

.strix-quick-menu > li.color-info a {
  background: var(--info-color-suppl);
}

.strix-quick-menu > li.color-info a:hover {
  background: var(--info-color-pressed);
}

.strix-quick-menu > li.color-success a {
  background: var(--success-color-suppl);
}

.strix-quick-menu > li.color-success a:hover {
  background: var(--success-color-pressed);
}

.strix-quick-menu > li.color-warning a {
  background: var(--warning-color-suppl);
}

.strix-quick-menu > li.color-warning a:hover {
  background: var(--warning-color-pressed);
}

.strix-quick-menu > li.color-error a {
  background: var(--error-color-suppl);
}

.strix-quick-menu > li.color-error a:hover {
  background: var(--error-color-pressed);
}

.strix-quick-menu > li a p {
  padding: 0;
  margin: 0;
  overflow: hidden;
  font-size: 12px;
  line-height: 25px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-menus-show {
  &-enter-active {
    transition: opacity 0.5s ease;
  }

  &-enter-from {
    opacity: 0;
  }

  &-leave-active {
    transition: opacity 0.5s ease;
  }

  &-leave-to {
    opacity: 0;
  }
}

.quick-menu-list {
  &-enter-active {
    transition: all 1s ease;
  }

  &-enter-from {
    opacity: 0;
  }

  &-leave-active {
    transition: all 1s ease;
    height: 60px;
    margin-bottom: 10px !important;
  }

  &-leave-to {
    opacity: 0;
    height: 0;
    margin-bottom: 0 !important;
    transform: translateX(20px);
  }
}
</style>
