<template>
  <n-drawer
    v-model:show="showModel"
    :width="480"
    placement="right"
    :trap-focus="false"
    class="strix-comment-drawer"
  >
    <n-drawer-content closable :body-content-style="{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }">
      <template #header>
        <div class="comment-header">
          <StrixIcon icon="message-square" :size="18" />
          <span>评论</span>
          <span v-if="entityLabel" class="comment-header-label">· {{ entityLabel }}</span>
          <n-badge v-if="comments.length" :value="comments.length" :max="99" type="info" />
        </div>
      </template>

      <!-- 搜索栏 -->
      <div class="comment-search">
        <n-input
          v-model:value="keyword"
          placeholder="搜索评论内容..."
          clearable
          size="small"
          @update:value="debouncedLoad"
        >
          <template #prefix>
            <StrixIcon icon="search" :size="14" />
          </template>
        </n-input>
      </div>

      <!-- 评论列表 -->
      <div ref="commentListRef" class="comment-list">
        <n-spin :show="loading" size="small">
          <n-empty v-if="!loading && !comments.length" description="暂无评论" />

          <div
            v-for="item in comments"
            :key="item.id"
            class="comment-item"
            :class="{ 'comment-pinned': item.pinned === 1 }"
          >
            <!-- 置顶标记 -->
            <div v-if="item.pinned === 1" class="comment-pin-badge">
              <StrixIcon icon="pin" :size="12" />
              <span>已置顶</span>
            </div>

            <!-- 评论头部 -->
            <div class="comment-item-header">
              <n-tag size="tiny" :bordered="false" type="info">
                {{ item.authorName }}
              </n-tag>
              <span class="comment-time">{{ formatTime(item.createdTime) }}</span>
              <span v-if="item.updatedTime !== item.createdTime" class="comment-edited">(已编辑)</span>
            </div>

            <!-- 评论内容 (Markdown 渲染) -->
            <div class="comment-content markdown-body" v-html="renderMarkdown(item.content)" />

            <!-- 附件预览 -->
            <div v-if="item.attachmentIds?.length" class="comment-attachments">
              <div v-for="fileId in item.attachmentIds" :key="fileId" class="comment-attachment">
                <StrixImage :value="fileId" :width="120" :height="90" />
              </div>
            </div>

            <!-- 反应 & 操作 -->
            <div class="comment-footer">
              <div class="comment-reactions">
                <n-button
                  v-for="(users, emoji) in item.reactions"
                  :key="emoji"
                  size="tiny"
                  :type="isMyReaction(users) ? 'primary' : 'default'"
                  :secondary="!isMyReaction(users)"
                  :tertiary="isMyReaction(users)"
                  class="reaction-btn"
                  @click="handleToggleReaction(item.id, emoji)"
                >
                  {{ EMOJI_MAP[emoji] || emoji }} {{ users.length }}
                </n-button>
                <n-popover trigger="click" placement="bottom-start">
                  <template #trigger>
                    <n-button size="tiny" quaternary circle class="reaction-add-btn">
                      <template #icon><StrixIcon icon="smile-plus" :size="14" /></template>
                    </n-button>
                  </template>
                  <div class="emoji-picker">
                    <span
                      v-for="(display, code) in EMOJI_MAP"
                      :key="code"
                      class="emoji-option"
                      @click="handleToggleReaction(item.id, code)"
                    >
                      {{ display }}
                    </span>
                  </div>
                </n-popover>
              </div>
              <div class="comment-actions">
                <n-button text size="tiny" @click="handleQuote(item)">引用</n-button>
                <n-button v-if="item.editable" text size="tiny" @click="handleEdit(item)">编辑</n-button>
                <n-popconfirm v-if="item.mine || isSuperManager" @positive-click="handleDelete(item.id)">
                  <template #trigger>
                    <n-button text size="tiny" type="error">删除</n-button>
                  </template>
                  确认删除此评论？
                </n-popconfirm>
                <n-button v-if="canPin" text size="tiny" @click="handleTogglePin(item.id)">
                  {{ item.pinned === 1 ? '取消置顶' : '置顶' }}
                </n-button>
              </div>
            </div>
          </div>
        </n-spin>
      </div>

      <!-- 输入区域 -->
      <div class="comment-input-area">
        <!-- 附件预览区 -->
        <div v-if="pendingAttachments.length" class="pending-attachments">
          <div v-for="(att, idx) in pendingAttachments" :key="att.fileId" class="pending-attachment">
            <StrixImage :value="att.fileId" :width="60" :height="45" />
            <n-button circle size="tiny" class="remove-attachment" @click="pendingAttachments.splice(idx, 1)">
              <template #icon><StrixIcon icon="x" :size="10" /></template>
            </n-button>
          </div>
        </div>

        <div class="input-row">
          <n-input
            ref="inputRef"
            v-model:value="inputContent"
            type="textarea"
            placeholder="输入评论... 使用 @ 提及管理员"
            :autosize="{ minRows: 2, maxRows: 6 }"
            @keydown="handleInputKeydown"
          />
        </div>

        <div class="input-toolbar">
          <div class="toolbar-left">
            <n-popover trigger="click" placement="top-start" :show="showMentionPopover">
              <template #trigger>
                <n-button size="tiny" quaternary @click="triggerMention">
                  <template #icon><StrixIcon icon="at-sign" :size="14" /></template>
                  提及
                </n-button>
              </template>
              <div class="mention-picker">
                <n-input
                  v-model:value="mentionSearch"
                  placeholder="搜索管理员..."
                  size="small"
                  clearable
                  @update:value="searchManagers"
                />
                <div class="mention-list">
                  <div
                    v-for="mgr in filteredManagers"
                    :key="mgr.id"
                    class="mention-item"
                    @click="selectMention(mgr)"
                  >
                    {{ mgr.nickname }}
                  </div>
                  <div v-if="!filteredManagers.length" class="mention-empty">无匹配结果</div>
                </div>
              </div>
            </n-popover>

            <n-upload
              :show-file-list="false"
              :custom-request="handleUpload"
              accept="image/*"
            >
              <n-button size="tiny" quaternary>
                <template #icon><StrixIcon icon="image" :size="14" /></template>
                图片
              </n-button>
            </n-upload>
          </div>

          <n-button
            type="primary"
            size="small"
            :loading="submitting"
            :disabled="!inputContent.trim() && !pendingAttachments.length"
            @click="handleSubmit"
          >
            {{ editingId ? '保存' : '发送' }}
          </n-button>
        </div>
      </div>
    </n-drawer-content>
  </n-drawer>
</template>

<script lang="ts" setup>
import StrixIcon from '@/components/icon/StrixIcon.vue'
import StrixImage from '@/components/common/StrixImage.vue'
import type { CommentItem } from '@/api/comment'
import { commentApi } from '@/api/comment'
import { managerApi, type SystemManagerItem } from '@/api/manager'
import { commonApi } from '@/api/common'
import { useLoginInfoStore } from '@/stores/login-info'
import MarkdownIt from 'markdown-it'
import type { UploadCustomRequestOptions } from 'naive-ui'

const props = defineProps<{
  show: boolean
  bizType: string
  bizId: string
  entityLabel?: string
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
}>()

const showModel = computed({
  get: () => props.show,
  set: (v) => emit('update:show', v)
})

const loginInfo = useLoginInfoStore()
const isSuperManager = computed(() => loginInfo.loginInfo.type === 1)
const canPin = computed(() => loginInfo.loginInfo.permissionKeys?.includes('system:comment:pin') || isSuperManager.value)

// Markdown 渲染器
const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true
})

const EMOJI_MAP: Record<string, string> = {
  thumbsup: '👍',
  heart: '❤️',
  check: '✅',
  smile: '😄',
  tada: '🎉',
  eyes: '👀',
  rocket: '🚀',
  confused: '😕'
}

const FILE_GROUP_ID = 'comment-attachments'

// 状态
const loading = ref(false)
const submitting = ref(false)
const comments = ref<CommentItem[]>([])
const keyword = ref('')
const inputContent = ref('')
const editingId = ref<string | null>(null)
const commentListRef = ref<HTMLElement>()
const inputRef = ref()

// @提及
const showMentionPopover = ref(false)
const mentionSearch = ref('')
const managers = ref<SystemManagerItem[]>([])
const selectedMentions = ref<{ id: string; name: string }[]>([])

const filteredManagers = computed(() => {
  if (!mentionSearch.value) return managers.value.slice(0, 20)
  const q = mentionSearch.value.toLowerCase()
  return managers.value.filter(
    (m) => m.nickname.toLowerCase().includes(q) || m.loginName.toLowerCase().includes(q)
  ).slice(0, 20)
})

// 附件
const pendingAttachments = ref<{ fileId: string }[]>([])

// 加载评论
async function loadComments(scrollToBottom = false) {
  if (!props.bizType || !props.bizId) return
  loading.value = true
  try {
    const { data } = await commentApi.list({
      bizType: props.bizType,
      bizId: props.bizId,
      keyword: keyword.value || undefined
    })
    if (data?.data) {
      comments.value = data.data.items || []
    }
    if (scrollToBottom) {
      nextTick(() => {
        if (commentListRef.value) {
          commentListRef.value.scrollTop = commentListRef.value.scrollHeight
        }
      })
    }
  } finally {
    loading.value = false
  }
}

// 防抖搜索
let searchTimer: ReturnType<typeof setTimeout> | null = null
function debouncedLoad() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(loadComments, 300)
}

// 监听面板打开
watch(() => props.show, (val) => {
  if (val && props.bizId) {
    loadComments(true)
    loadManagers()
  } else {
    resetInput()
  }
})

watch(() => props.bizId, (val) => {
  if (val && props.show) {
    loadComments(true)
  }
})

// 加载管理员列表（用于 @提及）
async function loadManagers() {
  if (managers.value.length) return
  try {
    const { data } = await managerApi.list({ pageSize: 200, pageIndex: 1 })
    if (data?.data?.systemManagerList) {
      managers.value = data.data.systemManagerList
    }
  } catch {
    // 静默
  }
}

function searchManagers() {
  // filteredManagers 是 computed，会自动响应
}

function triggerMention() {
  showMentionPopover.value = !showMentionPopover.value
  mentionSearch.value = ''
}

function selectMention(mgr: SystemManagerItem) {
  if (!selectedMentions.value.find((m) => m.id === mgr.id)) {
    selectedMentions.value.push({ id: mgr.id, name: mgr.nickname })
  }
  inputContent.value += `@${mgr.nickname} `
  showMentionPopover.value = false
}

// 引用
function handleQuote(item: CommentItem) {
  // 剥离已有引用行，只取作者本人的首行有效内容
  const firstLine = item.content
    .split('\n')
    .filter((line) => !line.startsWith('> '))
    .map((line) => line.trim())
    .find(Boolean) || ''
  const excerpt = firstLine.length > 80 ? firstLine.substring(0, 80) + '...' : firstLine
  inputContent.value = `> ${item.authorName}: ${excerpt}\n\n${inputContent.value}`
  inputRef.value?.focus()
}

// 编辑
function handleEdit(item: CommentItem) {
  editingId.value = item.id
  inputContent.value = item.content
  pendingAttachments.value = (item.attachmentIds || []).map((id) => ({ fileId: id }))
  // 恢复 mentions
  selectedMentions.value = []
  inputRef.value?.focus()
}

// 提交
async function handleSubmit() {
  const content = inputContent.value.trim()
  if (!content && !pendingAttachments.value.length) return

  submitting.value = true
  try {
    const mentionedIds = selectedMentions.value.map((m) => m.id)
    const attachmentIds = pendingAttachments.value.map((a) => a.fileId)

    if (editingId.value) {
      await commentApi.update(editingId.value, {
        content,
        mentionedIds: mentionedIds.length ? mentionedIds : undefined,
        attachmentIds: attachmentIds.length ? attachmentIds : undefined
      })
    } else {
      await commentApi.add({
        bizType: props.bizType,
        bizId: props.bizId,
        content,
        mentionedIds: mentionedIds.length ? mentionedIds : undefined,
        attachmentIds: attachmentIds.length ? attachmentIds : undefined
      })
    }

    resetInput()
    await loadComments(true)
  } finally {
    submitting.value = false
  }
}

function resetInput() {
  inputContent.value = ''
  editingId.value = null
  selectedMentions.value = []
  pendingAttachments.value = []
}

// 删除
async function handleDelete(id: string) {
  await commentApi.remove(id)
  await loadComments()
}

// 置顶
async function handleTogglePin(id: string) {
  await commentApi.togglePin(id)
  await loadComments()
}

// Emoji 反应
async function handleToggleReaction(commentId: string, emoji: string) {
  await commentApi.toggleReaction(commentId, { emoji })
  await loadComments()
}

function isMyReaction(users: { operatorId: string }[]): boolean {
  return users.some((u) => u.operatorId === loginInfo.loginInfo.id)
}

// 附件上传
async function handleUpload({ file }: UploadCustomRequestOptions) {
  if (!file.file) return
  const formData = new FormData()
  formData.append('file', file.file)
  try {
    const { data } = await commonApi.fileUpload(FILE_GROUP_ID, formData)
    if (data?.data?.fileId) {
      pendingAttachments.value.push({ fileId: data.data.fileId })
    }
  } catch {
    // upload error handled by axios interceptor
  }
}

// 键盘快捷键
function handleInputKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    handleSubmit()
  }
}

// Markdown 渲染
function renderMarkdown(content: string): string {
  if (!content) return ''
  // 先渲染 Markdown（html: false 会转义所有 HTML）
  const rendered = md.render(content)
  // 再在 HTML 文本节点中高亮 @提及（避免修改标签属性）
  return rendered.replace(/>([^<]*)</g, (match, text: string) => {
    if (!text.includes('@')) return match
    return '>' + text.replace(/(^|\s)@(\S+)/g, '$1<span class="mention-highlight">@$2</span>') + '<'
  })
}

// 时间格式化
function formatTime(time: string): string {
  if (!time) return ''
  const d = new Date(time)
  const now = new Date()
  const diff = now.getTime() - d.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')

  if (year === now.getFullYear()) {
    return `${month}-${day} ${hour}:${min}`
  }
  return `${year}-${month}-${day} ${hour}:${min}`
}
</script>

<style lang="scss" scoped>
@use '@/assets/style/mixins/responsive' as r;
.comment-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;

  .comment-header-label {
    color: var(--strix-text-tertiary);
    font-weight: 400;
    font-size: 13px;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.comment-search {
  flex-shrink: 0;
  padding: 0 0 12px;
}

.comment-list {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 12px;
  min-height: 200px;

  @include r.thin-scrollbar;
}

.comment-item {
  padding: 10px 12px;
  border-radius: 8px;
  margin-bottom: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--strix-bg-surface-hover);
  }

  &.comment-pinned {
    background-color: var(--strix-bg-surface);
    border-left: 3px solid var(--strix-color-info);
  }
}

.comment-pin-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--strix-color-info);
  margin-bottom: 4px;
}

.comment-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;

  .comment-time {
    font-size: 12px;
    color: var(--strix-text-tertiary);
  }

  .comment-edited {
    font-size: 11px;
    color: var(--strix-text-tertiary);
    font-style: italic;
  }
}

.comment-content {
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;

  :deep(blockquote) {
    border-left: 3px solid var(--strix-border-default);
    padding: 4px 12px;
    margin: 4px 0;
    color: var(--strix-text-tertiary);
    font-size: 13px;
    background-color: var(--strix-bg-surface);
    border-radius: 0 4px 4px 0;
  }

  :deep(code) {
    background-color: var(--strix-bg-surface);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
  }

  :deep(pre) {
    background-color: var(--strix-bg-surface);
    padding: 12px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 8px 0;

    code {
      background: none;
      padding: 0;
    }
  }

  :deep(.mention-highlight) {
    color: var(--strix-color-accent);
    font-weight: 500;
  }

  :deep(p) {
    margin: 4px 0;
  }

  :deep(a) {
    color: var(--strix-color-accent);
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}

.comment-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.comment-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  min-height: 24px;
}

.comment-reactions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;

  .reaction-btn {
    font-size: 12px;
    padding: 0 8px;
    height: 24px;
  }

  .reaction-add-btn {
    width: 24px;
    height: 24px;
    opacity: 0;
    transition: opacity 0.2s;
  }
}

.comment-item:hover .reaction-add-btn {
  opacity: 1;
}

.emoji-picker {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;

  .emoji-option {
    font-size: 20px;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    text-align: center;
    transition: background-color 0.2s;

    &:hover {
      background-color: var(--strix-bg-surface-hover);
    }
  }
}

.comment-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.comment-item:hover .comment-actions {
  opacity: 1;
}

.comment-input-area {
  flex-shrink: 0;
  border-top: 1px solid var(--strix-border-default);
  padding-top: 12px;
}

.pending-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;

  .pending-attachment {
    position: relative;

    .remove-attachment {
      position: absolute;
      top: -6px;
      right: -6px;
      z-index: 1;
    }
  }
}

.input-row {
  margin-bottom: 8px;
}

.input-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.mention-picker {
  width: 240px;

  .mention-list {
    max-height: 200px;
    overflow-y: auto;
    margin-top: 8px;
  }

  .mention-item {
    padding: 6px 8px;
    cursor: pointer;
    border-radius: 4px;
    font-size: 13px;

    &:hover {
      background-color: var(--strix-bg-surface-hover);
    }
  }

  .mention-empty {
    padding: 8px;
    text-align: center;
    color: var(--strix-text-tertiary);
    font-size: 13px;
  }
}
</style>
