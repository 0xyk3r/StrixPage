<template>
  <Teleport to="body">
    <Transition name="nebula-cmd">
      <div v-if="isOpen" class="nebula-cmd-overlay" @click.self="close">
        <div class="nebula-cmd-panel" @keydown="handleKeydown">
          <!-- 搜索输入框 -->
          <div class="nebula-cmd-input-wrap">
            <StrixIcon icon="search" :size="18" class="nebula-cmd-input-icon" />
            <input
              ref="inputRef"
              v-model="searchQuery"
              class="nebula-cmd-input"
              placeholder="搜索菜单或命令…"
              spellcheck="false"
              autocomplete="off"
            />
            <kbd class="nebula-cmd-esc">ESC</kbd>
          </div>

          <!-- 结果列表 -->
          <div v-if="filteredCommands.length" class="nebula-cmd-results">
            <div v-for="group in groupedResults" :key="group.label" class="nebula-cmd-group">
              <div class="nebula-cmd-group-label">{{ group.label }}</div>
              <div
                v-for="(item, idx) in group.items"
                :key="item.id"
                :class="[
                  'nebula-cmd-item',
                  { 'nebula-cmd-item--active': getGlobalIndex(group.label, idx) === activeIndex }
                ]"
                :ref="(el) => setItemRef(getGlobalIndex(group.label, idx), el)"
                @click="item.action()"
                @mouseenter="activeIndex = getGlobalIndex(group.label, idx)"
              >
                <span class="nebula-cmd-item__icon">
                  <StrixIcon :icon="item.icon || 'file'" :size="15" />
                </span>
                <span class="nebula-cmd-item__text">{{ item.label }}</span>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-else class="nebula-cmd-empty">没有找到匹配的命令或菜单</div>

          <!-- 底部提示 -->
          <div class="nebula-cmd-footer">
            <span><kbd>↑↓</kbd> 导航</span>
            <span><kbd>↵</kbd> 执行</span>
            <span><kbd>ESC</kbd> 关闭</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import StrixIcon from '@/components/icon/StrixIcon.vue'
import { useCommandPalette } from '@/composables/useCommandPalette'

const { isOpen, searchQuery, activeIndex, filteredCommands, groupedResults, close, handleKeydown } = useCommandPalette()

const inputRef = ref<HTMLInputElement>()
const itemRefs = ref<Map<number, HTMLElement>>(new Map())

const setItemRef = (index: number, el: any) => {
  if (el) {
    itemRefs.value.set(index, el as HTMLElement)
  }
}

// 计算全局索引
const getGlobalIndex = (groupLabel: string, localIdx: number): number => {
  let offset = 0
  for (const group of groupedResults.value) {
    if (group.label === groupLabel) return offset + localIdx
    offset += group.items.length
  }
  return localIdx
}

// 打开时自动聚焦输入框
watch(isOpen, (val) => {
  if (val) {
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})

// 滚动到活动项
watch(activeIndex, (idx) => {
  nextTick(() => {
    const el = itemRefs.value.get(idx)
    el?.scrollIntoView({ block: 'nearest' })
  })
})
</script>
