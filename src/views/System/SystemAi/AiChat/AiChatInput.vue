<template>
  <div class="ai-chat-input">
    <!-- 附件预览 -->
    <div v-if="attachments.length" class="ai-chat-input__attachments">
      <div
        v-for="(att, i) in attachments"
        :key="i"
        class="ai-chat-input__att-card"
        :class="{
          'ai-chat-input__att-card--uploading': att.uploading,
          'ai-chat-input__att-card--image': att.type === 'image'
        }"
      >
        <!-- Image thumbnail -->
        <template v-if="att.type === 'image'">
          <img v-if="att.localPreview" :src="att.localPreview" class="ai-chat-input__att-thumb" />
          <div v-else class="ai-chat-input__att-icon ai-chat-input__att-icon--video">
            <n-icon :size="16">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </n-icon>
          </div>
        </template>
        <!-- Video icon -->
        <div v-else-if="att.type === 'video'" class="ai-chat-input__att-icon ai-chat-input__att-icon--video">
          <n-icon :size="16">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" />
            </svg>
          </n-icon>
        </div>
        <!-- Audio icon -->
        <div v-else class="ai-chat-input__att-icon ai-chat-input__att-icon--audio">
          <n-icon :size="16">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </n-icon>
        </div>

        <!-- File info (not shown for image-only thumbnails) -->
        <div v-if="att.type !== 'image' || !att.localPreview" class="ai-chat-input__att-info">
          <div class="ai-chat-input__att-name">{{ att.name }}</div>
          <div class="ai-chat-input__att-meta">
            {{ att.type === 'video' ? '视频' : att.type === 'audio' ? '音频' : '图片' }}
          </div>
        </div>

        <!-- Upload spinner or remove button -->
        <n-spin v-if="att.uploading" :show="true" :size="14" />
        <div v-else class="ai-chat-input__att-remove" @click="removeAttachment(i)">×</div>
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
        ref="imageInputRef"
        type="file"
        accept="image/*"
        multiple
        style="display: none"
        @change="handleImageSelect"
      />
      <input ref="videoInputRef" type="file" accept="video/*" style="display: none" @change="handleVideoSelect" />
      <input ref="audioInputRef" type="file" accept="audio/*" style="display: none" @change="handleAudioSelect" />

      <!-- 工具栏 -->
      <div class="ai-chat-input__toolbar">
        <span class="ai-chat-input__hint">Enter 发送&nbsp;&nbsp;Shift+Enter 换行&nbsp;&nbsp;Esc 中断</span>
        <div class="ai-chat-input__toolbar-right">
          <!-- 图片上传 -->
          <n-tooltip v-if="supportsImage" trigger="hover">
            <template #trigger>
              <n-button quaternary circle size="small" :disabled="disabled" @click="imageInputRef?.click()">
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
            </template>
            上传图片
          </n-tooltip>

          <!-- 视频上传 -->
          <n-tooltip v-if="supportsVideo" trigger="hover">
            <template #trigger>
              <n-button quaternary circle size="small" :disabled="disabled" @click="videoInputRef?.click()">
                <template #icon>
                  <n-icon :size="16">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" />
                    </svg>
                  </n-icon>
                </template>
              </n-button>
            </template>
            上传视频
          </n-tooltip>

          <!-- 音频上传 -->
          <n-tooltip v-if="supportsAudio" trigger="hover">
            <template #trigger>
              <n-button quaternary circle size="small" :disabled="disabled" @click="audioInputRef?.click()">
                <template #icon>
                  <n-icon :size="16">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                  </n-icon>
                </template>
              </n-button>
            </template>
            上传音频
          </n-tooltip>

          <!-- 录音 -->
          <n-tooltip v-if="supportsAudio" trigger="hover">
            <template #trigger>
              <div :class="['ai-chat-input__rec-btn', { 'ai-chat-input__rec-btn--active': isRecording }]">
                <n-button
                  quaternary
                  circle
                  size="small"
                  :disabled="disabled || hasUploading"
                  :type="isRecording ? 'error' : 'default'"
                  @click="toggleRecording"
                >
                  <template #icon>
                    <n-icon :size="16">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                      </svg>
                    </n-icon>
                  </template>
                </n-button>
              </div>
            </template>
            {{ isRecording ? `录音中 ${recDuration}s` : '录音' }}
          </n-tooltip>

          <!-- 录音时长指示 -->
          <span v-if="isRecording" class="ai-chat-input__rec-badge">{{ recDuration }}s</span>

          <div class="ai-chat-input__toolbar-divider" />

          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button v-if="streaming" type="error" size="small" circle @click="emit('abort')">
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
                :disabled="disabled || (!text.trim() && !attachments.filter((a) => !a.uploading && a.fileId).length)"
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
            </template>
            {{ streaming ? '停止生成' : '发送 (Enter)' }}
          </n-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { AiAttachment, AiAttachmentResp } from '@/api/ai'
import { http } from '@/plugins/axios'
import { useAudioRecorder } from '@/composables/useAudioRecorder'

interface LocalAttachment {
  fileId: string
  type: 'image' | 'video' | 'audio'
  mimeType: string
  name: string
  localPreview?: string
  uploading: boolean
}

interface Props {
  disabled?: boolean
  streaming?: boolean
  supportedModalities?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  streaming: false,
  supportedModalities: () => []
})

const emit = defineEmits<{
  (e: 'send', content: string, attachments: (AiAttachment & { localPreview?: string })[]): void
  (e: 'abort'): void
}>()

const text = ref('')
const attachments = ref<LocalAttachment[]>([])
const inputRef = ref()
const imageInputRef = ref<HTMLInputElement>()
const videoInputRef = ref<HTMLInputElement>()
const audioInputRef = ref<HTMLInputElement>()
const focused = ref(false)

/**
 * 待 revoke 的 ObjectURL 集合。
 * 不能在 handleSend 内立即 revoke，因为 localPreview URL 会被 store 存入消息的 previewUrl
 * 继续用于 UI 渲染。在组件卸载时统一清理，或在流式完成后由外部调用 revokeLocalPreviews()。
 */
const pendingRevokes = new Set<string>()

const supportsImage = computed(() => props.supportedModalities?.includes('image'))
const supportsVideo = computed(() => props.supportedModalities?.includes('video'))
const supportsAudio = computed(() => props.supportedModalities?.includes('audio'))

/** 是否有附件正在上传中（上传进行中时禁用录音，防止并发竞争） */
const hasUploading = computed(() => attachments.value.some((a) => a.uploading))

const { isRecording, duration: recDuration, start: startRec, stop: stopRec } = useAudioRecorder()

const msg = useMessage()

async function uploadFile(file: File, type: 'image' | 'video' | 'audio') {
  const limits = { image: 20 * 1024 * 1024, video: 100 * 1024 * 1024, audio: 50 * 1024 * 1024 }
  if (file.size > limits[type]) {
    msg.error(`文件过大 (上限 ${limits[type] / 1024 / 1024}MB)`)
    return
  }
  const localPreview = type === 'image' ? URL.createObjectURL(file) : undefined
  if (localPreview) pendingRevokes.add(localPreview)
  const att: LocalAttachment = { fileId: '', type, mimeType: file.type, name: file.name, localPreview, uploading: true }
  attachments.value.push(att)
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await http.post<any>('system/common/file/ai-chat/upload', formData, {
      meta: { operate: '上传附件' }
    })
    att.fileId = res.data.data.fileId
    att.uploading = false
  } catch {
    const i = attachments.value.indexOf(att)
    if (i !== -1) attachments.value.splice(i, 1)
    if (localPreview) {
      URL.revokeObjectURL(localPreview)
      pendingRevokes.delete(localPreview)
    }
    msg.error('文件上传失败')
  }
}

function handleImageSelect(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files) Array.from(files).forEach((f) => uploadFile(f, 'image'))
  ;(e.target as HTMLInputElement).value = ''
}

function handleVideoSelect(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files?.[0]) uploadFile(files[0], 'video')
  ;(e.target as HTMLInputElement).value = ''
}

function handleAudioSelect(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files?.[0]) uploadFile(files[0], 'audio')
  ;(e.target as HTMLInputElement).value = ''
}

async function toggleRecording() {
  if (isRecording.value) {
    const blob = await stopRec()
    if (blob) await uploadFile(new File([blob], `recording-${Date.now()}.webm`, { type: blob.type }), 'audio')
  } else {
    await startRec()
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
    e.preventDefault()
    handleSend()
  } else if (e.key === 'Escape') {
    emit('abort')
  }
}

function handleSend() {
  const content = text.value.trim()
  const ready = attachments.value.filter((a) => !a.uploading && a.fileId)
  if (!content && !ready.length) return
  if (props.disabled) return
  emit(
    'send',
    content,
    ready.map(({ fileId, type, mimeType, name, localPreview }) => ({
      fileId,
      type,
      mimeType,
      name,
      localPreview
    }))
  )
  text.value = ''
  // 注意：不在此处立即 revoke localPreview ObjectURL。
  // 发送后 localPreview 会被 store 存入消息的 previewUrl 用于 UI 渲染，
  // 立即 revoke 会导致已发送消息的图片预览失效。
  // ObjectURL 在组件卸载时由 onUnmounted 统一清理（见下方），
  // 或在父组件收到后端 previewUrl 后调用 revokeLocalPreviews() 提前回收。
  attachments.value = []
}

function removeAttachment(i: number) {
  const att = attachments.value[i]
  if (att?.localPreview) {
    URL.revokeObjectURL(att.localPreview)
    pendingRevokes.delete(att.localPreview)
  }
  attachments.value.splice(i, 1)
}

/** 释放所有待 revoke 的 ObjectURL（供父组件在后端 previewUrl 就绪后调用） */
function revokeLocalPreviews() {
  pendingRevokes.forEach((url) => URL.revokeObjectURL(url))
  pendingRevokes.clear()
}

onUnmounted(() => {
  // 组件卸载时释放所有未 revoke 的 ObjectURL
  revokeLocalPreviews()
})

function focus() {
  inputRef.value?.focus()
}

function prefill(content: string, prefillAttachments?: AiAttachmentResp[]) {
  text.value = content
  if (prefillAttachments?.length) {
    // 回填附件：从历史消息中恢复（previewUrl 作为临时预览，fileId 保持原值）
    attachments.value = prefillAttachments.map((a) => ({
      fileId: a.fileId,
      type: a.type,
      mimeType: a.mimeType,
      name: a.name,
      // 使用 previewUrl 作为图片缩略图预览（来自后端签名 URL）
      localPreview: a.type === 'image' ? a.previewUrl : undefined,
      uploading: false
    }))
  } else {
    attachments.value = []
  }
  nextTick(() => inputRef.value?.focus())
}

defineExpose({ focus, prefill, revokeLocalPreviews })
</script>

<style lang="scss" scoped>
.ai-chat-input {
  padding: 10px 16px 14px;
  border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.06));
  background: rgba(15, 15, 25, 0.6);

  &__attachments {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 10px;
  }

  &__att-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 8px;
    background: var(--att-bg, rgba(255, 255, 255, 0.05));
    border: 1px solid var(--att-border, rgba(255, 255, 255, 0.08));
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    transition: all 0.2s ease;
    max-width: 200px;

    &:hover {
      background: var(--att-bg-hover, rgba(255, 255, 255, 0.08));
      border-color: rgba(255, 255, 255, 0.15);
    }

    &--uploading {
      animation: att-pulse 1.5s ease-in-out infinite;
    }

    &--image {
      padding: 4px;
    }
  }

  &__att-thumb {
    width: 48px;
    height: 48px;
    border-radius: 6px;
    object-fit: cover;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    flex-shrink: 0;
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.05);
    }
  }

  &__att-icon {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &--video {
      background: rgba(59, 130, 246, 0.15);
      color: rgba(96, 165, 250, 0.9);
    }

    &--audio {
      background: rgba(245, 158, 11, 0.15);
      color: rgba(251, 191, 36, 0.9);
    }
  }

  &__att-info {
    overflow: hidden;
    flex: 1;
    min-width: 0;
  }

  &__att-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 12px;
    line-height: 1.3;
  }

  &__att-meta {
    font-size: 10px;
    opacity: 0.5;
    margin-top: 1px;
  }

  &__att-remove {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: rgba(239, 68, 68, 0.9);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.15s;
    font-size: 10px;

    .ai-chat-input__att-card:hover & {
      opacity: 1;
    }
  }

  &__card {
    border-radius: 10px;
    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
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
    gap: 2px;
  }

  &__toolbar-divider {
    width: 1px;
    height: 14px;
    background: rgba(255, 255, 255, 0.1);
    margin: 0 4px;
  }

  &__rec-btn {
    position: relative;
    display: inline-flex;

    &--active::before {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 50%;
      border: 2px solid rgba(239, 68, 68, 0.6);
      animation: rec-pulse 1.2s ease-in-out infinite;
    }
  }

  &__rec-badge {
    font-size: 11px;
    color: #ef4444;
    font-variant-numeric: tabular-nums;
    padding: 1px 6px;
    border-radius: 8px;
    background: rgba(239, 68, 68, 0.1);
  }
}

@keyframes att-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

@keyframes rec-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.15);
    opacity: 0;
  }
}
</style>
