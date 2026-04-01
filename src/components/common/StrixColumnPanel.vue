<template>
  <Teleport to="body">
    <Transition name="nebula-column-panel">
      <div v-if="show" class="nebula-column-panel">
        <!-- 顶部辉光线 -->
        <div class="nebula-column-panel__glow" />

        <!-- 头部 -->
        <div class="nebula-column-panel__header">
          <div class="nebula-column-panel__title">
            <StrixIcon icon="columns-3" :size="16" />
            <span>列配置</span>
          </div>
          <button class="nebula-column-panel__close" @click="show = false">
            <StrixIcon icon="x" :size="16" />
          </button>
        </div>

        <p class="nebula-column-panel__subtitle">拖拽排序 · 开关显隐 · 自动保存</p>

        <!-- 搜索 -->
        <div class="nebula-column-panel__search">
          <n-input v-model:value="searchQuery" clearable placeholder="搜索列…" size="small">
            <template #prefix><StrixIcon icon="search" :size="14" /></template>
          </n-input>
        </div>

        <!-- 可拖拽列表（无搜索时） -->
        <VueDraggable
          v-if="!isSearching"
          v-model="configs"
          :animation="200"
          handle=".nebula-column-panel__drag"
          ghost-class="nebula-column-panel__item--ghost"
          chosen-class="nebula-column-panel__item--chosen"
          drag-class="nebula-column-panel__item--drag"
          tag="div"
          class="nebula-column-panel__list"
        >
          <div
            v-for="item in configs"
            :key="item.key"
            :class="['nebula-column-panel__item', { 'is-hidden': !item.visible }]"
          >
            <span class="nebula-column-panel__drag">
              <StrixIcon icon="grip-vertical" :size="14" />
            </span>
            <span :class="['nebula-column-panel__name', { 'is-hidden-text': !item.visible }]">
              {{ item.title }}
            </span>
            <n-switch :value="item.visible" size="small" @update:value="toggleItem(item.key)" />
          </div>
        </VueDraggable>

        <!-- 搜索结果列表（不可拖拽） -->
        <div v-else class="nebula-column-panel__list">
          <div
            v-for="item in filteredConfigs"
            :key="item.key"
            :class="['nebula-column-panel__item', { 'is-hidden': !item.visible }]"
          >
            <span :class="['nebula-column-panel__name', 'no-drag', { 'is-hidden-text': !item.visible }]">
              {{ item.title }}
            </span>
            <n-switch :value="item.visible" size="small" @update:value="toggleItem(item.key)" />
          </div>
          <div v-if="filteredConfigs.length === 0" class="nebula-column-panel__empty">无匹配列</div>
        </div>

        <!-- 底部 -->
        <div class="nebula-column-panel__footer">
          <n-button size="small" quaternary @click="handleReset">
            <template #icon><StrixIcon icon="rotate-ccw" :size="14" /></template>
            重置
          </n-button>
          <n-button size="small" type="primary" quaternary @click="show = false">
            <template #icon><StrixIcon icon="check" :size="14" /></template>
            完成
          </n-button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import StrixIcon from '@/components/icon/StrixIcon.vue'
import { COLUMN_PANEL_KEY } from '@/composables/useTableColumns'
import { VueDraggable } from 'vue-draggable-plus'

const show = defineModel<boolean>('show', { default: false })
const { configs, reset } = inject(COLUMN_PANEL_KEY)!

const searchQuery = ref('')
const isSearching = computed(() => searchQuery.value.trim().length > 0)

const filteredConfigs = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return configs.value.filter((c) => c.title.toLowerCase().includes(q))
})

const toggleItem = (key: string) => {
  const item = configs.value.find((c) => c.key === key)
  if (!item) return
  if (item.visible && configs.value.filter((c) => c.visible).length <= 1) return
  item.visible = !item.visible
}

const handleReset = () => {
  reset()
  searchQuery.value = ''
}

// Escape 关闭面板
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && show.value) {
    e.stopPropagation()
    show.value = false
  }
}

onMounted(() => document.addEventListener('keydown', handleKeydown, true))
onUnmounted(() => document.removeEventListener('keydown', handleKeydown, true))
</script>
