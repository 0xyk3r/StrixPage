<template>
  <div class="ai-chat-page">
    <!-- 侧边栏：会话列表 -->
    <div class="ai-chat-page__sidebar">
      <ai-chat-session-list
        :sessions="chatStore.sessions"
        :active-id="chatStore.activeSessionId"
        :loading="chatStore.sessionLoading"
        @new="showNewSession = true"
        @select="chatStore.selectSession"
        @delete="chatStore.removeSession"
      />
    </div>

    <!-- 主区域 -->
    <div class="ai-chat-page__main">
      <template v-if="chatStore.activeSessionId">
        <!-- 标题栏 -->
        <div class="ai-chat-page__topbar">
          <div class="ai-chat-page__session-name">{{ activeSession?.title }}</div>
          <n-select
            :value="activeSession?.modelConfigId"
            :options="modelOptions"
            :loading="loadingModels"
            :disabled="chatStore.streaming"
            placeholder="选择模型"
            size="small"
            style="width: 240px"
            @update:value="handleSwitchModel"
          />
          <div style="flex: 1" />
          <n-button
            quaternary
            size="small"
            title="清空消息"
            :disabled="chatStore.streaming"
            @click="confirmClearMessages"
          >
            <template #icon>
              <n-icon :size="15">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </n-icon>
            </template>
          </n-button>
          <n-button quaternary size="small" title="对话设置" @click="showSettings = true">
            <template #icon>
              <n-icon :size="15">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3" />
                  <path
                    d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
                  />
                </svg>
              </n-icon>
            </template>
          </n-button>
        </div>

        <!-- 消息区 -->
        <ai-chat-messages
          :messages="chatStore.messages"
          :loading="chatStore.messageLoading"
          :streaming="chatStore.streaming"
          @edit-resend="handleEditResend"
          @regenerate="handleRegenerate"
        />

        <!-- 输入框 -->
        <ai-chat-input
          ref="inputRef"
          :disabled="chatStore.messageLoading"
          :streaming="chatStore.streaming"
          :supported-modalities="currentModalities"
          @send="handleSend"
          @abort="chatStore.abortStream"
        />
      </template>

      <!-- 空状态：未选择会话 -->
      <div v-else class="ai-chat-page__empty">
        <div class="ai-chat-page__empty-icon">✦</div>
        <p>选择一个对话或新建对话开始</p>
        <n-button type="primary" @click="showNewSession = true">新建对话</n-button>
      </div>
    </div>

    <!-- 新建会话 modal -->
    <n-modal
      v-model:show="showNewSession"
      preset="card"
      title="新建对话"
      style="max-width: 480px"
      class="strix-form-modal"
    >
      <n-form label-placement="left" label-width="80px">
        <n-form-item label="模型">
          <n-select v-model:value="newSessionModelId" :options="modelOptions" placeholder="选择模型" filterable />
        </n-form-item>
        <n-form-item label="标题">
          <n-input v-model:value="newSessionTitle" clearable placeholder="对话标题（可选）" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showNewSession = false">取消</n-button>
          <n-button type="primary" :loading="creating" :disabled="!newSessionModelId" @click="createSession">
            创建
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 设置抽屉 -->
    <n-drawer v-model:show="showSettings" :width="320" placement="right">
      <n-drawer-content title="对话设置" :native-scrollbar="false">
        <template v-if="activeModelConfig">
          <n-descriptions label-placement="left" :column="1" size="small">
            <n-descriptions-item label="模型">{{ activeModelConfig.name }}</n-descriptions-item>
            <n-descriptions-item label="模型标识">{{ activeModelConfig.modelName }}</n-descriptions-item>
            <n-descriptions-item label="温度">{{ activeModelConfig.temperature }}</n-descriptions-item>
            <n-descriptions-item label="最大输出">
              {{ activeModelConfig.maxCompletionTokens ?? activeModelConfig.maxTokens ?? '—' }} tokens
            </n-descriptions-item>
            <n-descriptions-item label="系统提示">
              <span style="white-space: pre-wrap; font-size: 12px; opacity: 0.7">{{
                activeModelConfig.systemPrompt || '（未设置）'
              }}</span>
            </n-descriptions-item>
          </n-descriptions>
        </template>
        <n-empty v-else description="暂无配置信息" />
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script lang="ts" setup>
import { useAiChatStore } from '@/stores/ai-chat'
import type { AiAttachment, AiAttachmentResp, AiModelConfigResp } from '@/api/ai'
import { aiApi } from '@/api/ai'
import AiChatSessionList from './AiChatSessionList.vue'
import AiChatMessages from './AiChatMessages.vue'
import AiChatInput from './AiChatInput.vue'

const chatStore = useAiChatStore()
const message = useMessage()
const dialog = useDialog()

const showNewSession = ref(false)
const showSettings = ref(false)
const newSessionModelId = ref<string | null>(null)
const newSessionTitle = ref('')
const creating = ref(false)
const inputRef = ref()
const modelConfigs = ref<AiModelConfigResp[]>([])
const loadingModels = ref(false)

const modelOptions = computed(() =>
  modelConfigs.value
    .filter((m) => m.status === 1 && (m.type === 1 || m.type === 2))
    .map((m) => ({ label: `${m.name} (${m.modelName})`, value: m.id }))
)

const activeSession = computed(() => chatStore.sessions.find((s) => s.id === chatStore.activeSessionId))

const activeModelConfig = computed(() => modelConfigs.value.find((m) => m.id === activeSession.value?.modelConfigId))

const currentModalities = computed(() => {
  const config = modelConfigs.value.find((m) => m.id === activeSession.value?.modelConfigId)
  if (!config?.supportedModalities) return []
  try {
    return JSON.parse(config.supportedModalities) as string[]
  } catch {
    return []
  }
})

async function loadModelConfigs() {
  loadingModels.value = true
  try {
    const res = await aiApi.modelConfigList()
    modelConfigs.value = (res.data?.data ?? []) as AiModelConfigResp[]
  } finally {
    loadingModels.value = false
  }
}

async function handleSwitchModel(modelConfigId: string) {
  if (!chatStore.activeSessionId || chatStore.streaming) return
  try {
    await chatStore.switchModel(chatStore.activeSessionId, modelConfigId)
    message.success('模型已切换')
  } catch {
    message.error('模型切换失败')
  }
}

async function createSession() {
  if (!newSessionModelId.value) return
  creating.value = true
  try {
    const title = newSessionTitle.value.trim() || '新对话'
    const session = await chatStore.createSession(newSessionModelId.value, title)
    if (session) {
      showNewSession.value = false
      newSessionTitle.value = ''
      newSessionModelId.value = ''
      await chatStore.selectSession(session.id)
    }
  } finally {
    creating.value = false
  }
}

async function handleSend(content: string, attachments: (AiAttachment & { localPreview?: string })[]) {
  await chatStore.sendMessage(content, attachments)
  // 流式完成后（store.streaming 变为 false），后端 previewUrl 已就绪，可安全释放 ObjectURL
  const stopWatch = watch(
    () => chatStore.streaming,
    (streaming) => {
      if (!streaming) {
        inputRef.value?.revokeLocalPreviews()
        stopWatch()
      }
    }
  )
}

async function handleEditResend(payload: { id: string; content: string; attachments: AiAttachmentResp[] }) {
  await chatStore.truncateFrom(payload.id)
  inputRef.value?.prefill(payload.content, payload.attachments)
}

async function handleRegenerate() {
  await chatStore.regenerate()
}

function confirmClearMessages() {
  dialog.warning({
    title: '清空消息',
    content: '确定要清空该对话的所有消息吗？此操作不可恢复。',
    positiveText: '清空',
    negativeText: '取消',
    onPositiveClick: async () => {
      await chatStore.clearMessages()
      message.success('消息已清空')
    }
  })
}

onMounted(async () => {
  await Promise.all([chatStore.loadSessions(), loadModelConfigs()])
})

onUnmounted(() => {
  // 离开页面时中止进行中的 SSE 流，避免 store 单例残留 streaming 状态与后台孤儿 fetch
  chatStore.abortStream()
})
</script>

<style lang="scss" scoped>
.ai-chat-page {
  display: flex;
  height: calc(100vh - 100px);
  background: #0a0a12;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);

  &__sidebar {
    width: 220px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__topbar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(255, 255, 255, 0.02);
  }

  &__session-name {
    font-weight: 600;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.85);
  }

  &__empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: rgba(255, 255, 255, 0.35);
    font-size: 14px;
  }

  &__empty-icon {
    font-size: 48px;
    opacity: 0.3;
    line-height: 1;
  }
}
</style>
