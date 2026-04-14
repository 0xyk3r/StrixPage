<template>
  <Transition name="strix-batch-bar">
    <div v-if="count > 0" class="strix-batch-bar">
      <div class="strix-batch-bar__count">
        <TransitionGroup name="strix-batch-count" tag="span" class="strix-batch-bar__count-inner">
          <span :key="count" class="strix-batch-bar__count-num">{{ count }}</span>
        </TransitionGroup>
        <span class="strix-batch-bar__count-label">项已选</span>
      </div>
      <div class="strix-batch-bar__divider" />
      <div class="strix-batch-bar__actions">
        <slot />
      </div>
      <div class="strix-batch-bar__divider" />
      <button class="strix-batch-bar__clear" @click="$emit('clear')">
        <StrixIcon icon="x" :size="14" />
        <span>取消选择</span>
      </button>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import StrixIcon from '@/components/icon/StrixIcon.vue'

defineProps<{
  count: number
}>()

defineEmits<{
  clear: []
}>()
</script>

<style lang="scss" scoped>
.strix-batch-bar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: $z-fab;

  display: flex;
  align-items: center;
  gap: $space-1;
  padding: $space-1 $space-3;
  height: 44px;

  background: var(--strix-bg-elevated);
  border: 1px solid var(--strix-border-accent);
  border-radius: $radius-pill;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18),
  0 0 0 1px var(--strix-border-accent);

  font-size: $text-xs;
  color: var(--strix-text-primary);
  user-select: none;
  white-space: nowrap;
}

.strix-batch-bar__count {
  display: flex;
  align-items: center;
  gap: $space-1;
  padding: 0 $space-2;
  font-weight: $weight-semibold;
}

.strix-batch-bar__count-inner {
  position: relative;
  display: inline-flex;
  overflow: hidden;
  min-width: 1.2em;
  justify-content: center;
}

.strix-batch-bar__count-num {
  display: inline-block;
  color: var(--strix-text-accent);
  font-size: $text-sm;
  font-weight: $weight-bold;
  font-family: $font-mono;
}

.strix-batch-bar__count-label {
  color: var(--strix-text-secondary);
}

.strix-batch-bar__divider {
  width: 1px;
  height: 20px;
  background: var(--strix-border-subtle);
  flex-shrink: 0;
}

.strix-batch-bar__actions {
  display: flex;
  align-items: center;
  gap: $space-1;
}

.strix-batch-bar__clear {
  display: flex;
  align-items: center;
  gap: $space-1;
  padding: 4px $space-2;
  border: none;
  border-radius: $radius-sm;
  background: transparent;
  color: var(--strix-text-muted);
  font-size: $text-xs;
  cursor: pointer;
  transition: all $duration-fast;

  &:hover {
    color: var(--strix-text-primary);
    background: var(--strix-bg-surface-hover);
  }
}

// 批量栏出入动画
.strix-batch-bar-enter-active {
  transition: transform $duration-page $ease-spring,
  opacity $duration-normal $ease-out-smooth;
}

.strix-batch-bar-leave-active {
  transition: transform $duration-fast ease-in,
  opacity $duration-fast ease-in;
}

.strix-batch-bar-enter-from {
  transform: translateX(-50%) translateY(24px);
  opacity: 0;
}

.strix-batch-bar-leave-to {
  transform: translateX(-50%) translateY(16px);
  opacity: 0;
}

// 计数切换动画
.strix-batch-count-enter-active {
  transition: all $duration-fast $ease-spring;
}

.strix-batch-count-leave-active {
  transition: all $duration-instant ease-in;
  position: absolute;
}

.strix-batch-count-enter-from {
  transform: translateY(8px) scale(0.8);
  opacity: 0;
}

.strix-batch-count-leave-to {
  transform: translateY(-8px) scale(0.8);
  opacity: 0;
}
</style>
