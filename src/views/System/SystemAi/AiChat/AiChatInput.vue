<template>
  <div class="ai-chat-input">
    <!-- 附件预览 -->
    <div v-if="attachments.length" class="ai-chat-input__attachments">
      <div v-for="(att, i) in attachments" :key="i" class="ai-chat-input__att-chip">
        <n-icon :size="12">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 9h6M9 12h6M9 15h4" />
          </svg>
        </n-icon>
        <span>{{ att.name }}</span>
        <n-button quaternary circle size="tiny" @click="removeAttachment(i)">
          <template #icon>
            <n-icon :size="10">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </n-icon>
          </template>
        </n-button>
      </div>
    </div>

    <!-- 输入卡片 -->
    <div class="ai-chat-input__card" :class="{ 'ai-chat-input__card--focused': focused }">
      <n-input
        ref="inputRef"
        v-model:value="text"
        type="textarea"
        :autosize="{ minRows: 1, maxRows: 6 }"
        placeholder="输入消息…"
        class="ai-chat-input__textarea"
        :disabled="disabled"
        @keydown="handleKeydown"
        @focus="focused = true"
        @blur="focused = false"
      />

      <!-- 隐藏文件输入 -->
      <input
        v-if="showImageUpload"
        ref="fileInputRef"
        type="file"
        accept="image/*"
        multiple
        style="display: none"
        @change="handleFileChange"
      />

      <!-- 工具栏 -->
      <div class="ai-chat-input__toolbar">
        <span class="ai-chat-input__hint">Enter 发送&nbsp;&nbsp;Shift+Enter 换行&nbsp;&nbsp;Esc 中断</span>
        <div class="ai-chat-input__toolbar-right">
          <n-button
            v-if="showImageUpload"
            quaternary
            circle
            size="small"
            :disabled="disabled"
            title="上传图片"
            @click="fileInputRef?.click()"
          >
            <template #icon>
              <n-icon :size="16">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </n-icon>
            </template>
          </n-button>

          <n-button
            v-if="streaming"
            type="error"
            size="small"
            circle
            title="停止生成"
            @click="emit('abort')"
          >
            <template #icon>
              <n-icon :size="16">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </n-icon>
            </template>
          </n-button>

          <n-button
            v-else
            type="primary"
            size="small"
            circle
            :disabled="disabled || !text.trim()"
            title="发送 (Enter)"
            @click="handleSend"
          >
            <template #icon>
              <n-icon :size="16">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </n-icon>
            </template>
          </n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { AiMessageAttachment } from '@/api/ai'

interface Props {
  disabled?: boolean
  streaming?: boolean
  showImageUpload?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  streaming: false,
  showImageUpload: false
})

const emit = defineEmits<{
  (e: 'send', content: string, attachments: AiMessageAttachment[]): void
  (e: 'abort'): void
}>()

const text = ref('')
const attachments = ref<AiMessageAttachment[]>([])
const inputRef = ref()
const fileInputRef = ref<HTMLInputElement>()
const focused = ref(false)

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
    // Enter 单独按下时发送消息
    e.preventDefault()
    handleSend()
  } else if (e.key === 'Escape') {
    emit('abort')
  }
  // Shift+Enter 自然换行，不需要特殊处理
}

function handleSend() {
  if (!text.value.trim() || props.disabled) return
  emit('send', text.value.trim(), attachments.value)
  text.value = ''
  attachments.value = []
}

function removeAttachment(i: number) {
  attachments.value.splice(i, 1)
}

function handleFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files) return
  Array.from(files).forEach((file) => {
    const reader = new FileReader()
    reader.onload = () => {
      attachments.value.push({
        type: 'image',
        url: reader.result as string,
        name: file.name
      })
    }
    reader.readAsDataURL(file)
  })
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function focus() {
  inputRef.value?.focus()
}

function prefill(content: string) {
  text.value = content
  nextTick(() => inputRef.value?.focus())
}

defineExpose({ focus, prefill })
</script>

<style lang="scss" scoped>
.ai-chat-input {
  padding: 10px 16px 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(15, 15, 25, 0.6);

  &__attachments {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
  }

  &__att-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 12px;
    background: rgba(99, 102, 241, 0.2);
    border: 1px solid rgba(99, 102, 241, 0.3);
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
  }

  &__card {
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.03);
    transition: border-color 0.2s;
    overflow: hidden;

    &--focused {
      border-color: rgba(99, 102, 241, 0.5);
    }
  }

  &__textarea {
    :deep(.n-input__border),
    :deep(.n-input__state-border) {
      display: none !important;
    }

    :deep(.n-input-wrapper) {
      padding: 10px 14px 4px;
    }
  }

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 10px 6px;
  }

  &__hint {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.2);
    user-select: none;
  }

  &__toolbar-right {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}
</style>
