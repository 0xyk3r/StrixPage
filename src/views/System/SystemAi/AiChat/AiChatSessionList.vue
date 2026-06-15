<template>
  <div class="session-list">
    <div class="session-list__header">
      <span class="session-list__title">对话列表</span>
      <n-button quaternary circle size="small" title="新建对话" @click="emit('new')">
        <template #icon>
          <n-icon :size="16">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </n-icon>
        </template>
      </n-button>
    </div>

    <div class="session-list__search">
      <n-input v-model:value="searchText" size="small" clearable placeholder="搜索对话...">
        <template #prefix>
          <n-icon :size="13" style="color:rgba(255,255,255,0.3)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </n-icon>
        </template>
      </n-input>
    </div>

    <!-- 模型过滤 chips -->
    <div v-if="modelChips.length > 1" class="session-list__chips">
      <span
        v-for="chip in modelChips"
        :key="chip"
        class="session-list__chip"
        :class="{ 'session-list__chip--active': activeChip === chip }"
        @click="activeChip = chip"
      >{{ chip }}</span>
    </div>

    <n-scrollbar class="session-list__scroll">
      <n-spin :show="loading" size="small">
        <!-- 固定区 -->
        <template v-if="pinnedSessions.length">
          <div class="session-list__group-label">📌 已固定</div>
          <div
            v-for="session in pinnedSessions"
            :key="session.id"
            class="session-item"
            :class="{ 'session-item--active': activeId === session.id }"
            @click="emit('select', session.id)"
          >
            <div class="session-item__body">
              <div class="session-item__title">{{ session.title }}</div>
              <div class="session-item__meta">{{ session.modelConfigName }}</div>
            </div>
            <n-dropdown
              :options="menuOptions(session.id, true)"
              trigger="click"
              placement="bottom-end"
              @select="handleMenuSelect($event, session)"
            >
              <n-button quaternary circle size="tiny" class="session-item__more" @click.stop>
                <template #icon>
                  <n-icon :size="12">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="5" cy="12" r="2" />
                      <circle cx="12" cy="12" r="2" />
                      <circle cx="19" cy="12" r="2" />
                    </svg>
                  </n-icon>
                </template>
              </n-button>
            </n-dropdown>
          </div>
        </template>

        <!-- 普通区 -->
        <template v-if="unpinnedSessions.length">
          <div v-if="pinnedSessions.length" class="session-list__group-label">全部对话</div>
          <div
            v-for="session in unpinnedSessions"
            :key="session.id"
            class="session-item"
            :class="{ 'session-item--active': activeId === session.id }"
            @click="emit('select', session.id)"
          >
            <div class="session-item__body">
              <div class="session-item__title">{{ session.title }}</div>
              <div class="session-item__meta">{{ session.modelConfigName }}</div>
            </div>
            <n-dropdown
              :options="menuOptions(session.id, false)"
              trigger="click"
              placement="bottom-end"
              @select="handleMenuSelect($event, session)"
            >
              <n-button quaternary circle size="tiny" class="session-item__more" @click.stop>
                <template #icon>
                  <n-icon :size="12">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="5" cy="12" r="2" />
                      <circle cx="12" cy="12" r="2" />
                      <circle cx="19" cy="12" r="2" />
                    </svg>
                  </n-icon>
                </template>
              </n-button>
            </n-dropdown>
          </div>
        </template>

        <div v-if="!loading && filteredSessions.length === 0" class="session-list__empty">
          暂无对话
        </div>
      </n-spin>
    </n-scrollbar>

    <!-- 重命名弹窗 -->
    <n-modal
      v-model:show="renameVisible"
      preset="card"
      title="重命名对话"
      style="max-width: 360px"
      class="strix-form-modal"
    >
      <n-input
        v-model:value="renameTitle"
        placeholder="新标题"
        maxlength="100"
        show-count
        @keydown.enter="doRename"
      />
      <template #footer>
        <n-space justify="end">
          <n-button @click="renameVisible = false">取消</n-button>
          <n-button type="primary" :disabled="!renameTitle.trim()" @click="doRename">确认</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import type { AiSessionResp } from '@/api/ai'
import { useAiChatStore } from '@/stores/ai-chat'

interface Props {
  sessions: AiSessionResp[]
  activeId: string
  loading?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'new'): void
  (e: 'select', id: string): void
  (e: 'delete', id: string): void
}>()

const chatStore = useAiChatStore()
const dialog = useDialog()

const searchText = ref('')
const activeChip = ref('全部')
const renameVisible = ref(false)
const renameTitle = ref('')
let renameTargetId = ''

// 模型过滤 chips
const modelChips = computed(() => {
  const models = new Set(props.sessions.map((s) => s.modelConfigName).filter(Boolean))
  return ['全部', ...Array.from(models)]
})

const filteredSessions = computed(() => {
  let list = props.sessions
  // 搜索过滤
  if (searchText.value.trim()) {
    const q = searchText.value.trim().toLowerCase()
    list = list.filter((s) => s.title.toLowerCase().includes(q))
  }
  // 模型过滤
  if (activeChip.value !== '全部') {
    list = list.filter((s) => s.modelConfigName === activeChip.value)
  }
  return list
})

const pinnedSessions = computed(() =>
  filteredSessions.value.filter((s) => chatStore.pinnedIds.includes(s.id))
)

const unpinnedSessions = computed(() =>
  filteredSessions.value.filter((s) => !chatStore.pinnedIds.includes(s.id))
)

function menuOptions(sessionId: string, isPinned: boolean) {
  return [
    {
      label: isPinned ? '取消固定' : '固定到顶部',
      key: 'pin',
      icon: () =>
        h('span', { style: 'font-size:14px' }, isPinned ? '📌' : '📍')
    },
    {
      label: '重命名',
      key: 'rename'
    },
    { type: 'divider', key: 'divider' },
    {
      label: '删除',
      key: 'delete',
      props: { style: 'color: #f87171' }
    }
  ]
}

function handleMenuSelect(key: string, session: AiSessionResp) {
  if (key === 'pin') {
    chatStore.togglePin(session.id)
  } else if (key === 'rename') {
    renameTargetId = session.id
    renameTitle.value = session.title
    renameVisible.value = true
  } else if (key === 'delete') {
    confirmDelete(session)
  }
}

async function doRename() {
  if (!renameTitle.value.trim() || !renameTargetId) return
  await chatStore.renameSession(renameTargetId, renameTitle.value.trim())
  renameVisible.value = false
}

function confirmDelete(session: AiSessionResp) {
  dialog.warning({
    title: '确认删除',
    content: `确认删除对话「${session.title}」？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => emit('delete', session.id)
  })
}
</script>

<style lang="scss" scoped>
.session-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(10, 10, 18, 0.7);
  border-right: 1px solid rgba(255, 255, 255, 0.06);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  &__search {
    padding: 8px 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 8px 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  }

  &__chip {
    font-size: 11px;
    padding: 3px 10px;
    border-radius: 12px;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.45);
    transition: all 0.15s;
    white-space: nowrap;
    user-select: none;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.7);
    }

    &--active {
      background: rgba(99, 102, 241, 0.2);
      border-color: rgba(99, 102, 241, 0.4);
      color: rgba(99, 102, 241, 0.95);
      font-weight: 600;
    }
  }

  &__scroll {
    flex: 1;
  }

  &__group-label {
    padding: 8px 14px 4px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.3);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  &__empty {
    padding: 24px 16px;
    text-align: center;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.3);
  }
}

.session-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 9px 10px 9px 14px;
  cursor: pointer;
  border-radius: 6px;
  margin: 2px 6px;
  transition: background 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);

    .session-item__more {
      opacity: 1;
    }
  }

  &--active {
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.25);

    .session-item__more {
      opacity: 1;
    }
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.85);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__meta {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.3);
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__more {
    flex-shrink: 0;
    opacity: 0;
    transition: opacity 0.15s;
  }
}
</style>
