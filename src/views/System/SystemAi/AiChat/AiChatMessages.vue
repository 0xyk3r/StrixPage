<template>
  <n-scrollbar ref="scrollRef" class="message-list" @scroll="handleScroll">
    <div class="message-list__inner">
      <n-empty v-if="!loading && messages.length === 0" description="暂无消息，开始对话吧" style="margin: 40px auto" />
      <n-spin v-if="loading" :show="true" style="display: flex; justify-content: center; padding: 40px 0" />

      <div
        v-for="(msg, idx) in messages"
        :key="msg.id"
        class="message"
        :class="msg.role === 'user' ? 'message--user' : 'message--assistant'"
      >
        <!-- 用户消息 -->
        <template v-if="msg.role === 'user'">
          <div class="message__bubble message__bubble--user">
            <div v-if="msg.attachments?.length" class="message__attachments">
              <template v-for="att in msg.attachments" :key="att.fileId">
                <img v-if="att.type === 'image'" :src="att.previewUrl" class="message__image" :alt="att.name" />
                <video v-else-if="att.type === 'video'" :src="att.previewUrl" controls class="message__video" />
                <audio v-else-if="att.type === 'audio'" :src="att.previewUrl" controls class="message__audio" />
              </template>
            </div>
            <div class="message__text">{{ msg.content }}</div>
          </div>
          <!-- 操作按钮 -->
          <div class="message__actions">
            <n-button quaternary size="tiny" title="复制" @click="copyText(msg.content)">
              <template #icon>
                <n-icon :size="13">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </n-icon>
              </template>
            </n-button>
            <n-button
              v-if="!streaming && msg.id && !msg.id.startsWith('tmp')"
              quaternary
              size="tiny"
              title="编辑并重发"
              @click="emit('edit-resend', { id: msg.id, content: msg.content, attachments: msg.attachments })"
            >
              <template #icon>
                <n-icon :size="13">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </n-icon>
              </template>
            </n-button>
          </div>
        </template>

        <!-- AI 消息 -->
        <template v-else>
          <ai-thinking-block
            v-if="msg.thinkingContent"
            v-model="msg.thinkingExpanded"
            :content="msg.thinkingContent"
            :done="msg.thinkingDone"
          />

          <div class="message__bubble message__bubble--assistant">
            <template v-if="msg.status === 0 && !msg.content">
              <!-- AI 正在生成（还没有内容时显示状态） -->
              <div v-if="!msg.thinkingContent" class="message__generating">
                <n-spin :show="true" size="small" />
                <span class="message__generating-text">AI 正在生成回复...</span>
              </div>
              <div v-else class="message__generating">
                <n-spin :show="true" size="small" />
                <span class="message__generating-text">正在根据思考结果生成回复...</span>
              </div>
            </template>
            <template v-else-if="msg.status === 2">
              <n-alert type="error" :title="msg.errorMsg || '生成失败'" style="background: transparent" />
            </template>
            <div v-else class="message__markdown" v-html="renderMarkdown(msg.content)" />
            <span v-if="msg.status === 0 && msg.content" class="message__cursor" />
          </div>

          <!-- Token/时间元数据 -->
          <div
            v-if="msg.status === 1 && (msg.modelConfigName || msg.inputTokens || msg.outputTokens || msg.durationMs)"
            class="message__meta"
          >
            <span v-if="msg.modelConfigName" class="message__model-tag" :title="msg.modelConfigName">
              {{ msg.modelConfigName }}
            </span>
            <span
              v-if="msg.inputTokens"
              :title="`输入 tokens${msg.cacheHitTokens ? '（含缓存命中 ' + msg.cacheHitTokens + '）' : ''}`"
            >
              ↑{{ msg.inputTokens
              }}<template v-if="msg.cacheHitTokens">
                <span class="message__meta-cache-hit">💾{{ msg.cacheHitTokens }}</span></template
              >
            </span>
            <span v-if="msg.cacheWriteTokens" title="缓存写入 tokens" class="message__meta-cache-write"
              >📝{{ msg.cacheWriteTokens }}</span
            >
            <span
              v-if="msg.outputTokens"
              :title="`输出 tokens${msg.reasoningTokens ? '（含思考链 ' + msg.reasoningTokens + '）' : ''}`"
            >
              ↓{{ msg.outputTokens
              }}<template v-if="msg.reasoningTokens">
                <span class="message__meta-reasoning">🧠{{ msg.reasoningTokens }}</span></template
              >
            </span>
            <span v-if="msg.durationMs" title="耗时">{{ (msg.durationMs / 1000).toFixed(1) }}s</span>
          </div>

          <!-- 操作按钮 -->
          <div class="message__actions">
            <n-button quaternary size="tiny" title="复制" @click="copyText(msg.content)">
              <template #icon>
                <n-icon :size="13">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </n-icon>
              </template>
            </n-button>
            <n-button
              v-if="!streaming && idx === lastAssistantIdx"
              quaternary
              size="tiny"
              title="重新生成"
              @click="emit('regenerate')"
            >
              <template #icon>
                <n-icon :size="13">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 .49-3" />
                  </svg>
                </n-icon>
              </template>
            </n-button>
          </div>
        </template>
      </div>
    </div>
  </n-scrollbar>
</template>

<script lang="ts" setup>
import type { Options } from 'markdown-it'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import type { UiMessage } from '@/stores/ai-chat'
import type { AiAttachmentResp } from '@/api/ai'
import AiThinkingBlock from './AiThinkingBlock.vue'

interface Props {
  messages: UiMessage[]
  loading?: boolean
  streaming?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (
    e: 'edit-resend',
    payload: {
      id: string
      content: string
      attachments: AiAttachmentResp[]
    }
  ): void
  (e: 'regenerate'): void
}>()

const scrollRef = ref()
const message = useMessage()

const lastAssistantIdx = computed(() => {
  for (let i = props.messages.length - 1; i >= 0; i--) {
    const msg = props.messages[i]
    if (msg && msg.role === 'assistant' && msg.status === 1) return i
  }
  return -1
})

function highlightFn(str: string, lang: string): string {
  if (lang && hljs.getLanguage(lang)) {
    try {
      return (
        `<pre class="hljs"><code>` +
        hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
        '</code></pre>'
      )
    } catch {
      // ignore
    }
  }
  return `<pre class="hljs"><code>${MarkdownIt().utils.escapeHtml(str)}</code></pre>`
}

const mdOptions: Options = {
  html: false,
  linkify: true,
  typographer: true,
  highlight: highlightFn
}

const md = new MarkdownIt(mdOptions)

function renderMarkdown(content: string): string {
  return md.render(content || '')
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    message.success('已复制')
  } catch {
    message.error('复制失败')
  }
}

async function scrollToBottom() {
  await nextTick()
  scrollRef.value?.scrollTo({ top: 999999 })
}

/** 用户是否贴近底部：贴近时才在流式增量更新中自动滚动，避免上滑查看历史时被强制拉回 */
const autoScroll = ref(true)

function handleScroll(e: Event) {
  const el = e.target as HTMLElement
  if (!el) return
  const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight
  autoScroll.value = distanceToBottom < 80
}

let lastMessageCount = props.messages.length

watch(
  () => {
    const last = props.messages[props.messages.length - 1]
    return [props.messages.length, last?.content, last?.thinkingContent]
  },
  () => {
    const count = props.messages.length
    if (count !== lastMessageCount) {
      // 新增消息（发送/接收新条目或切换会话）：总是滚动到底
      lastMessageCount = count
      autoScroll.value = true
      scrollToBottom()
    } else if (autoScroll.value) {
      // 同一条消息的流式增量：仅在用户贴近底部时滚动
      scrollToBottom()
    }
  }
)

onMounted(() => scrollToBottom())
</script>

<style lang="scss" scoped>
.message-list {
  flex: 1;
  overflow: hidden;

  &__inner {
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    min-height: 100%;
  }
}

.message {
  display: flex;
  flex-direction: column;
  max-width: 82%;

  &--user {
    align-self: flex-end;
    align-items: flex-end;
  }

  &--assistant {
    align-self: flex-start;
    align-items: flex-start;
  }

  &__bubble {
    border-radius: 12px;
    padding: 10px 14px;
    font-size: 14px;
    line-height: 1.65;
    word-break: break-word;

    &--user {
      background: rgba(99, 102, 241, 0.3);
      border: 1px solid rgba(99, 102, 241, 0.4);
      color: rgba(255, 255, 255, 0.9);
      border-radius: 12px 12px 4px 12px;
    }

    &--assistant {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.88);
      min-width: 120px;
      border-radius: 12px 12px 12px 4px;
    }
  }

  &__generating {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 0;

    &-text {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.5);
      font-style: italic;
    }
  }

  &__text {
    white-space: pre-wrap;
  }

  &__attachments {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 6px;
  }

  &__image {
    max-width: 220px;
    max-height: 180px;
    border-radius: 6px;
    object-fit: cover;
  }

  &__video {
    max-width: 280px;
    max-height: 200px;
    border-radius: 6px;
  }

  &__audio {
    max-width: 260px;
    height: 36px;
  }

  &__cursor {
    display: inline-block;
    width: 2px;
    height: 14px;
    background: rgba(99, 102, 241, 0.8);
    margin-left: 2px;
    vertical-align: middle;
    animation: blink 1s step-end infinite;
  }

  &__meta {
    display: flex;
    gap: 8px;
    margin-top: 4px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.25);
    flex-wrap: wrap;
    align-items: center;
  }

  &__meta-cache-hit {
    color: rgba(34, 197, 94, 0.7);
    font-size: 10px;
    margin-left: 6px;
  }

  &__meta-cache-write {
    color: rgba(250, 204, 21, 0.7);
    font-size: 10px;
  }

  &__meta-reasoning {
    color: rgba(147, 51, 234, 0.7);
    font-size: 10px;
    margin-left: 6px;
  }

  &__model-tag {
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.25);
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 10px;
    color: rgba(99, 102, 241, 0.9);
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__actions {
    display: flex;
    gap: 2px;
    margin-top: 2px;
    opacity: 0;
    transition: opacity 0.15s;
  }

  &:hover &__actions {
    opacity: 1;
  }

  :deep(.message__markdown) {
    p {
      margin: 0 0 8px;

      &:last-child {
        margin: 0;
      }
    }

    pre.hljs {
      border-radius: 6px;
      padding: 12px;
      overflow-x: auto;
      margin: 8px 0;
      background: rgba(0, 0, 0, 0.4);
    }

    code:not(.hljs) {
      background: rgba(0, 0, 0, 0.3);
      padding: 2px 5px;
      border-radius: 3px;
      font-size: 13px;
    }

    a {
      color: #818cf8;
    }

    ul,
    ol {
      padding-left: 20px;
      margin: 6px 0;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      margin: 8px 0;
    }

    th,
    td {
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 6px 10px;
    }

    blockquote {
      border-left: 3px solid #6366f1;
      padding-left: 12px;
      margin: 8px 0;
      opacity: 0.8;
    }
  }
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
</style>
