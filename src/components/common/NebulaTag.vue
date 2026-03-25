<template>
  <span :class="tagClasses">
    <slot />
    <button v-if="closable" class="nebula-tag__close" @click.stop="$emit('close')">
      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <path d="M3 3l6 6M9 3l-6 6" />
      </svg>
    </button>
  </span>
</template>

<script lang="ts" setup>
const props = defineProps({
  type: { type: String, default: 'default' },
  closable: { type: Boolean, default: false },
  bordered: { type: Boolean, default: true },
  size: { type: String, default: 'medium' }
})

defineEmits<{ close: [] }>()

const tagClasses = computed(() => [
  'nebula-tag',
  `nebula-tag--${props.type}`,
  `nebula-tag--${props.size}`,
  { 'nebula-tag--borderless': !props.bordered }
])
</script>

<style lang="scss">
@use '@/assets/style/tokens' as *;

// ============================================================
// NebulaTag — Pill-style tag component
// ============================================================
.nebula-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 9999px;
  font-family: $font-body;
  font-weight: 500;
  letter-spacing: 0.3px;
  border: 1px solid;
  white-space: nowrap;
  transition: all 0.2s ease;

  // ---- Sizes ----
  &--tiny {
    padding: 0 6px;
    font-size: 10px;
    line-height: 1.6;
  }

  &--small {
    padding: 1px 8px;
    font-size: 11px;
    line-height: 1.6;
  }

  &--medium {
    padding: 2px 10px;
    font-size: 12px;
    line-height: 1.6;
  }

  &--large {
    padding: 4px 14px;
    font-size: 14px;
    line-height: 1.5;
  }

  // ---- Borderless ----
  &--borderless {
    border-color: transparent !important;
  }

  // ---- Type variants (dark theme default) ----
  &--default {
    background: var(--strix-bg-surface);
    color: var(--strix-text-secondary);
    border-color: var(--strix-border-default);
  }

  &--success {
    background: rgba($color-success, 0.08);
    color: $color-success;
    border-color: rgba($color-success, 0.2);
  }

  &--warning {
    background: rgba($color-warning, 0.08);
    color: $color-warning;
    border-color: rgba($color-warning, 0.2);
  }

  &--error {
    background: rgba($color-error, 0.08);
    color: $color-error;
    border-color: rgba($color-error, 0.2);
  }

  &--info {
    background: rgba($color-info, 0.08);
    color: $color-info;
    border-color: rgba($color-info, 0.2);
  }

  &--primary {
    background: rgba($color-accent-green, 0.08);
    color: $color-accent-green;
    border-color: rgba($color-accent-green, 0.2);
  }

  // ---- Close button ----
  &__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    padding: 0;
    margin-left: 2px;
    background: none;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    color: currentColor;
    opacity: 0.5;
    transition: all 0.15s ease;

    svg {
      width: 10px;
      height: 10px;
    }

    &:hover {
      opacity: 1;
      background: rgba(128, 128, 128, 0.15);
    }
  }
}

// ---- Light theme adjustments ----
[data-theme='light'] {
  .nebula-tag {
    &--default {
      background: rgba(0, 0, 0, 0.04);
      border-color: rgba(0, 0, 0, 0.12);
      color: rgba(0, 0, 0, 0.65);
    }

    &--success {
      background: rgba(22, 163, 74, 0.08);
      color: #15803d;
      border-color: rgba(22, 163, 74, 0.25);
    }

    &--warning {
      background: rgba(234, 138, 0, 0.08);
      color: #b45309;
      border-color: rgba(234, 138, 0, 0.25);
    }

    &--error {
      background: rgba(220, 38, 38, 0.08);
      color: #b91c1c;
      border-color: rgba(220, 38, 38, 0.25);
    }

    &--info {
      background: rgba(14, 116, 209, 0.08);
      color: #0369a1;
      border-color: rgba(14, 116, 209, 0.25);
    }

    &--primary {
      background: rgba(22, 163, 74, 0.08);
      color: #15803d;
      border-color: rgba(22, 163, 74, 0.25);
    }
  }
}
</style>
