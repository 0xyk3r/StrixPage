<template>
  <div
    :class="['strix-block', { expanded: isExpanded, hovering }]"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
  >
    <!-- 主内容区 -->
    <div class="strix-block__body">
      <slot name="body" />
    </div>

    <!-- 可展开高级区域 -->
    <div v-if="cleanable || $slots.default" ref="moreRef" class="strix-block__more">
      <div v-if="$slots.default" ref="moreBodyRef" class="strix-block__more-inner">
        <slot />
      </div>
    </div>

    <!-- 控制栏 -->
    <div v-if="cleanable || $slots.default" :class="['strix-block__control', { 'is-fixed': isExpanded }]">
      <!-- 清除按钮 -->
      <button v-if="cleanable" class="strix-block__clear" @click.stop="$emit('clear')">
        <StrixIcon icon="x-circle" :size="13" />
        <span>{{ isSmallWindow ? '清除' : '清除搜索条件' }}</span>
      </button>

      <!-- 展开/折叠触发器 -->
      <button v-if="$slots.default" class="strix-block__toggle" @click="switchExpand">
        <span class="strix-block__toggle-text">{{ isExpanded ? '收起筛选' : '展开筛选' }}</span>
        <span :class="['strix-block__toggle-icon', { flipped: isExpanded }]">
          <StrixIcon icon="chevron-down" :size="14" />
        </span>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useStrixSettingsStore } from '@/stores/strix-settings.ts'
import { storeToRefs } from 'pinia'

defineProps({
  cleanable: { type: Boolean, default: false }
})
defineEmits(['clear'])
const slots = useSlots()

const globalSettingsStore = useStrixSettingsStore()
const { isSmallWindow } = storeToRefs(globalSettingsStore)

const moreRef = ref<HTMLElement>()
const moreBodyRef = ref<HTMLElement>()
const hovering = ref(false)

const isExpanded = ref(false)
const switchExpand = () => {
  if (slots.default) {
    isExpanded.value = !isExpanded.value
  }
}

watch(isExpanded, (val) => {
  if (!moreRef.value || !moreBodyRef.value) return
  const contentHeight = moreBodyRef.value.scrollHeight
  moreRef.value.style.height = val ? `${contentHeight}px` : '0'
})
</script>
<style lang="scss" scoped>
.strix-block {
  position: relative;
  margin-bottom: $space-4;
  border-radius: $radius-lg;
  background: var(--strix-bg-surface);
  border: 1px solid var(--strix-border-subtle);
  transition:
    border-color $duration-normal $ease-out-smooth,
    box-shadow $duration-normal $ease-out-smooth;

  &.hovering {
    border-color: var(--strix-border-default);
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
  }

  &.expanded {
    border-color: var(--strix-border-accent);
    box-shadow:
      0 0 0 1px var(--strix-border-accent),
      0 4px 20px rgba(0, 0, 0, 0.06);
  }
}

// ---- 主体内容 ----
.strix-block__body {
  padding: $space-4;
}

// ---- 可展开区域 ----
.strix-block__more {
  height: 0;
  overflow: hidden;
  transition: height $duration-normal $ease-out-smooth;
}

.strix-block__more-inner {
  padding: 0 $space-4 $space-3;
  opacity: 0;
  transform: translateY(-4px);
  transition:
    opacity $duration-normal $ease-out-smooth,
    transform $duration-normal $ease-out-smooth;

  .expanded & {
    opacity: 1;
    transform: translateY(0);
  }
}

// ---- 控制栏 ----
.strix-block__control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
  padding: 0 $space-3;
  border-top: 1px solid var(--strix-border-subtle);
  border-radius: 0 0 $radius-lg $radius-lg;
  background: var(--strix-bg-surface);
  gap: $space-2;

  &.is-fixed {
    position: sticky;
    bottom: 0;
    z-index: 1;
  }
}

// ---- 清除按钮 ----
.strix-block__clear {
  display: flex;
  align-items: center;
  gap: $space-1;
  padding: 4px $space-2;
  border-radius: $radius-sm;
  border: none;
  background: transparent;
  color: var(--strix-color-error);
  font-size: $text-xs;
  cursor: pointer;
  transition: all $duration-fast;
  opacity: 0.7;

  &:hover {
    opacity: 1;
    background: rgba($color-error, 0.08);
  }
}

// ---- 展开/折叠按钮 ----
.strix-block__toggle {
  display: flex;
  align-items: center;
  gap: $space-1;
  padding: 4px $space-3;
  border-radius: $radius-pill;
  border: none;
  background: transparent;
  color: var(--strix-text-muted);
  font-size: $text-xs;
  cursor: pointer;
  transition: all $duration-fast;
  margin-left: auto;

  &:hover {
    color: var(--strix-text-accent);
    background: var(--strix-bg-surface-hover);
  }
}

.strix-block__toggle-text {
  transition: opacity $duration-fast;
}

.strix-block__toggle-icon {
  display: flex;
  align-items: center;
  transition: transform $duration-normal $ease-out-smooth;

  &.flipped {
    transform: rotate(180deg);
  }
}
</style>
