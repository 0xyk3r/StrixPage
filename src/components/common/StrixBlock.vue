<template>
  <div
    :class="['strix-block', { expanded: isExpanded, hovering }]"
    :style="{ '--strix-search-field-min': searchFieldMin, '--strix-filter-field-min': filterFieldMin }"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
  >
    <!-- 工具栏：搜索区 + 操作区（响应式 flex，按容器自身宽度自适应换行） -->
    <div v-if="$slots.search || $slots.actions" class="strix-block__toolbar">
      <div v-if="$slots.search" class="strix-block__toolbar-search">
        <slot name="search" />
      </div>
      <div v-if="$slots.actions" class="strix-block__toolbar-actions">
        <slot name="actions" />
      </div>
    </div>

    <!-- 主内容区（额外内容，如提示 alert；与工具栏可并存） -->
    <div
      v-if="$slots.body"
      class="strix-block__body"
      :class="{ 'strix-block__body__no_top': $slots.search || $slots.actions }"
    >
      <slot name="body" />
    </div>

    <!-- 活跃筛选条件标签 -->
    <div v-if="activeFilters.length > 0" class="strix-block__chips">
      <n-tag
        v-for="filter in activeFilters"
        :key="filter.key"
        size="small"
        closable
        round
        :bordered="false"
        @close="$emit('clear-filter', filter.key)"
      >
        <template #icon>
          <strix-icon icon="filter" :size="12" />
        </template>
        {{ filter.label }}: {{ filter.displayValue }}
      </n-tag>
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
        <span class="strix-block__toggle-text">
          {{ isExpanded ? '收起筛选' : '展开筛选' }}
        </span>
        <n-badge
          v-if="activeFilterCount > 0 && !isExpanded"
          :value="activeFilterCount"
          :max="99"
          type="info"
          class="strix-block__toggle-badge"
        />
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
import type { ActiveFilter } from '@/composables/useFilterState'

defineProps({
  cleanable: { type: Boolean, default: false },
  activeFilters: { type: Array as PropType<ActiveFilter[]>, default: () => [] },
  activeFilterCount: { type: Number, default: 0 },
  // 搜索区每个字段的最小宽度（低于此宽度则换行），可按页面需要覆盖
  searchFieldMin: { type: String, default: '220px' },
  // 展开筛选区每列的最小宽度（决定自适应列数）
  filterFieldMin: { type: String, default: '260px' }
})
defineEmits(['clear', 'clear-filter'])
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

  &__no_top {
    padding-top: 0;
  }
}

// ---- 工具栏：搜索区 + 操作区 ----
.strix-block__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: $space-3;
  padding: $space-4;
}

// 搜索区：弹性占据剩余空间，内部字段按容器宽度自适应换行（不依赖断点）
.strix-block__toolbar-search {
  flex: 1 1 320px;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-2 $space-3;

  // 每个搜索字段（n-input / n-select / n-input-group 等）：有空间则并排，窄则换行
  > :deep(*) {
    flex: 1 1 var(--strix-search-field-min);
    min-width: 0;
  }
}

// 操作区：内容自适应宽度，靠右对齐；一行放不下时整体作为紧凑块换行
.strix-block__toolbar-actions {
  flex: 0 0 auto;
  margin-left: auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: $space-2;
}

// ---- 活跃筛选标签 ----
.strix-block__chips {
  display: flex;
  flex-wrap: wrap;
  gap: $space-1;
  padding: 0 $space-4 $space-2;
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

  // 展开筛选区：表单项按容器宽度自适应分列（auto-fill，不依赖断点）
  :deep(.n-form) {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--strix-filter-field-min), 1fr));
    gap: $space-1 $space-5;
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

.strix-block__toggle-badge {
  margin: 0 $space-1;
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
