<script lang="ts" setup>
import { ossApi } from '@/api/oss'

const props = defineProps<{
  currentGroupKey: string
}>()

const emit = defineEmits<{
  selectGroup: [groupKey: string, groupName: string]
}>()

const fileGroups = ref<{ value: string; label: string }[]>([])
const configs = ref<{ value: string; label: string }[]>([])
const selectedConfigKey = ref('')

onMounted(async () => {
  const [groupRes, configRes] = await Promise.all([
    ossApi.fileGroupSelect(),
    ossApi.configSelect()
  ])
  if (groupRes.data.code === 200) {
    fileGroups.value = groupRes.data.data.options
  }
  if (configRes.data.code === 200) {
    configs.value = configRes.data.data.options
  }
  // Auto-select first group
  if (fileGroups.value.length > 0) {
    const first = fileGroups.value[0]
    if (first) emit('selectGroup', first.value, first.label)
  }
})

const filteredGroups = computed(() => fileGroups.value)

function handleGroupClick(group: { value: string; label: string }) {
  emit('selectGroup', group.value, group.label)
}

function handleConfigClick(configKey: string) {
  selectedConfigKey.value = selectedConfigKey.value === configKey ? '' : configKey
}
</script>

<template>
  <div class="sidebar">
    <div class="sidebar__section">
      <div class="sidebar__label">文件组</div>
      <div
        v-for="group in filteredGroups"
        :key="group.value"
        class="sidebar__item"
        :class="{ 'sidebar__item--active': group.value === props.currentGroupKey }"
        @click="handleGroupClick(group)"
      >
        <n-icon :size="16">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2Z" />
          </svg>
        </n-icon>
        <span class="sidebar__item-text">{{ group.label }}</span>
      </div>
      <n-empty v-if="filteredGroups.length === 0" description="暂无文件组" size="small" />
    </div>

    <n-divider style="margin: 8px 0" />

    <div class="sidebar__section">
      <div class="sidebar__label">存储配置</div>
      <div
        v-for="config in configs"
        :key="config.value"
        class="sidebar__item"
        :class="{ 'sidebar__item--active': config.value === selectedConfigKey }"
        @click="handleConfigClick(config.value)"
      >
        <n-icon :size="16">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 6H12L10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm-6 10H6v-2h8v2zm4-4H6v-2h12v2z" />
          </svg>
        </n-icon>
        <span class="sidebar__item-text">{{ config.label }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sidebar {
  padding: 8px;
  height: 100%;
  display: flex;
  flex-direction: column;

  &__section {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__label {
    font-size: 11px;
    font-weight: 600;
    color: var(--n-text-color-3);
    text-transform: uppercase;
    padding: 4px 8px;
    letter-spacing: 0.5px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.15s;
    font-size: 13px;

    &:hover {
      background: var(--n-color-hover);
    }

    &--active {
      background: var(--n-color-target);
      font-weight: 500;
    }
  }

  &__item-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
