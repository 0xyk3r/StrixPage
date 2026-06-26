<template>
  <div class="fim-page">
    <!-- ══ 顶部标题栏 ═══════════════════════════════════════════════ -->
    <div class="fim-header">
      <div class="brand">
        <div class="brand-dots">
          <span class="dot dot-1" />
          <span class="dot dot-2" />
          <span class="dot dot-3" />
        </div>
        <h1 class="brand-name">AI 续写台</h1>
        <span class="brand-badge">BETA</span>
      </div>
      <div class="mode-btns">
        <button class="mode-btn" :class="{ 'mode-btn--active': mode === 'chat_prefix' }" @click="mode = 'chat_prefix'">
          <svg viewBox="0 0 16 16" fill="none" width="13" height="13" aria-hidden="true">
            <rect x="1.5" y="2.5" width="13" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2" />
            <path
              d="M4.5 14l-2-3.5h9L11 14"
              stroke="currentColor"
              stroke-width="1.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          对话前缀续写
        </button>
        <button class="mode-btn" :class="{ 'mode-btn--active': mode === 'fim' }" @click="mode = 'fim'">
          <svg viewBox="0 0 16 16" fill="none" width="13" height="13" aria-hidden="true">
            <path
              d="M1.5 8h4.5M10 8h4.5M6.5 3.5v9M9.5 3.5v9"
              stroke="currentColor"
              stroke-width="1.3"
              stroke-linecap="round"
            />
          </svg>
          FIM 填充
        </button>
      </div>
    </div>

    <!-- ══ 参数行 ════════════════════════════════════════════════════ -->
    <div class="config-bar">
      <div class="config-item">
        <span class="config-label">模型</span>
        <n-select
          v-model:value="modelKey"
          :options="modelOptions"
          :loading="loadingModels"
          placeholder="选择 DeepSeek 模型"
          style="width: 220px"
          filterable
          clearable
          size="small"
        />
      </div>
      <span class="config-divider" />
      <div class="config-item">
        <span class="config-label">TOKEN 上限</span>
        <n-input-number
          v-model:value="maxTokens"
          :min="64"
          :max="4096"
          :step="256"
          style="width: 116px"
          placeholder="1024"
          clearable
          size="small"
        />
      </div>
      <span class="config-divider" />
      <div class="config-item">
        <span class="config-label">温度</span>
        <n-input-number
          v-model:value="temperature"
          :min="0"
          :max="2"
          :step="0.1"
          style="width: 116px"
          placeholder="默认"
          clearable
          size="small"
        />
      </div>
      <div class="config-spacer" />
      <div class="config-actions">
        <button class="btn-clear" :disabled="loading" @click="clearAll">清空</button>
        <button v-if="loading" class="btn-stop" @click="stopGeneration">
          <svg viewBox="0 0 10 10" fill="currentColor" width="9" height="9">
            <rect width="10" height="10" rx="1.5" />
          </svg>
          中止
        </button>
        <button
          class="btn-generate"
          :class="{ 'btn-generate--loading': loading }"
          :disabled="!modelKey || !prompt.trim() || loading"
          @click="generate"
        >
          <template v-if="loading"><span class="spinner" />生成中</template>
          <template v-else>
            <svg viewBox="0 0 10 12" fill="currentColor" width="10" height="10">
              <path d="M0 0l10 6L0 12V0z" />
            </svg>
            生成续写
          </template>
        </button>
      </div>
    </div>

    <!-- ══ 工作区 ════════════════════════════════════════════════════ -->
    <div class="workspace">
      <!-- 左侧输入面板 -->
      <div class="panel input-panel">
        <div class="panel-head">
          <span class="panel-ruler">INPUT</span>
          <span class="panel-hint">{{ modeHint }}</span>
        </div>
        <div class="panel-body">
          <!-- 对话前缀续写模式 -->
          <template v-if="mode === 'chat_prefix'">
            <div class="field">
              <div class="field-meta">
                <span class="field-name">系统提示词</span>
                <span class="field-tag field-tag--opt">可选</span>
              </div>
              <textarea
                v-model="systemPrompt"
                class="textarea"
                :disabled="loading"
                placeholder="设置 AI 角色，如：你是一位精通现代文学的写作助手…"
              />
            </div>
            <div class="field-sep" />
            <div class="field">
              <div class="field-meta">
                <span class="field-name">用户消息</span>
                <span class="field-tag field-tag--opt">可选</span>
              </div>
              <textarea
                v-model="userContent"
                class="textarea"
                :disabled="loading"
                placeholder="提供写作背景或要求，如：请续写以下这篇科幻小说的片段…"
              />
            </div>
            <div class="field-sep" />
            <div class="field field--grow">
              <div class="field-meta">
                <span class="field-name">Assistant 前缀</span>
                <span class="field-tag field-tag--req">必填</span>
                <span class="char-count">{{ prompt.length }} 字符</span>
              </div>
              <textarea
                v-model="prompt"
                class="textarea textarea--grow"
                :disabled="loading"
                placeholder="AI 将从此处开始续写…"
              />
            </div>
          </template>

          <!-- FIM 填充模式 -->
          <template v-else>
            <div class="field field--grow">
              <div class="field-meta">
                <span class="field-name">前缀文本</span>
                <span class="field-tag field-tag--req">必填</span>
                <span class="char-count">{{ prompt.length }} 字符</span>
              </div>
              <textarea
                v-model="prompt"
                class="textarea textarea--grow"
                :disabled="loading"
                placeholder="AI 将在此文本后方补全内容…"
              />
            </div>
            <div class="field-sep" />
            <div class="field">
              <div class="field-meta">
                <span class="field-name">后缀文本</span>
                <span class="field-tag field-tag--opt">可选 · 提供后进入 FIM 填充</span>
              </div>
              <textarea
                v-model="suffix"
                class="textarea"
                :disabled="loading"
                placeholder="AI 生成内容将插入前缀与后缀之间…"
              />
            </div>
          </template>
        </div>
      </div>

      <!-- 流向指示器 -->
      <div class="flow" :class="{ 'flow--active': loading }">
        <div class="flow-line" />
        <div class="flow-icon">
          <svg viewBox="0 0 14 14" fill="none" width="14" height="14">
            <path
              d="M2.5 7h9M7.5 3.5L11 7l-3.5 3.5"
              stroke="currentColor"
              stroke-width="1.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <div class="flow-line" />
      </div>

      <!-- 右侧输出面板 -->
      <div class="panel output-panel" :class="{ 'output-panel--active': loading }">
        <div class="panel-head output-head">
          <span class="panel-ruler">OUTPUT</span>
          <div class="output-meta">
            <transition name="fade-slide">
              <div v-if="tokenStats" class="token-stat">
                <span>↑{{ tokenStats.prompt }}</span>
                <span class="stat-sep">·</span>
                <span class="stat-out">↓{{ tokenStats.completion }}</span>
              </div>
            </transition>
            <span v-if="hitTokenLimit" class="limit-tag">LIMIT</span>
            <button v-if="streamedText" class="copy-btn" :class="{ 'copy-btn--done': justCopied }" @click="copyResult">
              <svg v-if="!justCopied" viewBox="0 0 14 14" fill="none" width="11" height="11">
                <rect x="4.5" y="4.5" width="8" height="8" rx="1.2" stroke="currentColor" stroke-width="1.2" />
                <path
                  d="M3 9.5H2.5a1 1 0 01-1-1V2.5a1 1 0 011-1H9a1 1 0 011 1V3"
                  stroke="currentColor"
                  stroke-width="1.2"
                />
              </svg>
              <svg v-else viewBox="0 0 14 14" fill="none" width="11" height="11">
                <path
                  d="M2 7l3.5 3.5 6.5-6.5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              {{ justCopied ? '已复制' : '复制全文' }}
            </button>
          </div>
        </div>

        <div ref="outputRef" class="panel-body output-body">
          <!-- 空态 -->
          <div v-if="!hasOutput && !loading" class="empty-state">
            <div class="empty-icon">
              <svg viewBox="0 0 40 40" fill="none" width="26" height="26">
                <circle cx="20" cy="20" r="15" stroke="currentColor" stroke-width="1.2" stroke-dasharray="4 3" />
                <path d="M13 20h14M20 13v14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </div>
            <p class="empty-text">续写结果将在此处流式呈现</p>
            <p class="empty-sub">支持 Markdown 格式渲染</p>
          </div>

          <!-- 对话前缀续写：带上下文块 -->
          <div v-else-if="mode === 'chat_prefix'" class="ctx-wrap">
            <div v-if="lastSystemPrompt" class="ctx-block ctx-sys">
              <span class="ctx-role">SYSTEM</span>
              <span class="ctx-text">{{ lastSystemPrompt }}</span>
            </div>
            <div v-if="lastUserContent" class="ctx-block ctx-user">
              <span class="ctx-role">USER</span>
              <span class="ctx-text">{{ lastUserContent }}</span>
            </div>
            <div class="ctx-block ctx-asst">
              <span class="ctx-role">ASSISTANT</span>
              <div class="ctx-content">
                <span class="seg-prefix">{{ lastPrompt }}</span
                ><!--
                --><span class="seg-gen md-output" v-html="renderedText" /><span v-if="loading" class="cursor" />
              </div>
            </div>
          </div>

          <!-- FIM 模式：连续文本 -->
          <div v-else-if="hasOutput || loading" class="fim-output">
            <span class="seg-prefix">{{ lastPrompt }}</span
            ><!--
            --><span class="seg-gen md-output" v-html="renderedText" /><span v-if="loading" class="cursor" /><!--
            --><span v-if="lastSuffix" class="seg-suffix">{{ lastSuffix }}</span>
          </div>

          <!-- 生成进度条 -->
          <div v-if="loading" class="progress-bar">
            <div class="progress-fill" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import { streamFimRequest } from '@/composables/useAiStream'
import type { AiModelConfigResp } from '@/api/ai'
import { aiApi } from '@/api/ai'

type FimMode = 'chat_prefix' | 'fim'

const message = useMessage()

// ── 配置 ──────────────────────────────────────────────────────────
const mode = ref<FimMode>('chat_prefix')
const modelKey = ref<string | null>(null)
const maxTokens = ref<number | null>(null)
const temperature = ref<number | null>(null)

// ── 输入 ──────────────────────────────────────────────────────────
const prompt = ref('')
const suffix = ref('')
const systemPrompt = ref('')
const userContent = ref('')

// ── 输出状态 ──────────────────────────────────────────────────────
const loading = ref(false)
const streamedText = ref('')
const lastPrompt = ref('')
const lastSuffix = ref('')
const lastSystemPrompt = ref('')
const lastUserContent = ref('')
const tokenStats = ref<{ prompt: number; completion: number } | null>(null)
const hitTokenLimit = ref(false)
const justCopied = ref(false)
const outputRef = ref<HTMLElement | null>(null)

let abortController: AbortController | null = null

// ── Markdown 渲染 ──────────────────────────────────────────────────
const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${
          hljs.highlight(str, {
            language: lang,
            ignoreIllegals: true
          }).value
        }</code></pre>`
      } catch {
        /* ignore */
      }
    }
    return `<pre class="hljs"><code>${MarkdownIt().utils.escapeHtml(str)}</code></pre>`
  }
})

const renderedText = computed(() => md.render(streamedText.value || ''))

// ── 派生状态 ──────────────────────────────────────────────────────
const hasOutput = computed(() => !!(lastPrompt.value || streamedText.value))

const modeHint = computed(() =>
  mode.value === 'chat_prefix' ? '系统提示词 → 用户消息 → Assistant 前缀续写' : '前缀文本 + 可选后缀文本（FIM 填充）'
)

// ── 模型列表 ──────────────────────────────────────────────────────
const loadingModels = ref(false)
const modelConfigs = ref<AiModelConfigResp[]>([])

const modelOptions = computed(() =>
  modelConfigs.value
    .filter((c) => c.type === 1 && c.providerType === 2 && c.status === 1)
    .map((c) => ({ label: c.name, value: c.key }))
)

async function loadModelConfigs() {
  loadingModels.value = true
  try {
    const res = await aiApi.modelConfigList()
    if (res.data?.code === 200 && res.data.data) modelConfigs.value = res.data.data
  } catch {
    message.error('加载模型列表失败')
  } finally {
    loadingModels.value = false
  }
}

// 自动滚动到底部
watch(streamedText, () => {
  nextTick(() => {
    if (outputRef.value) outputRef.value.scrollTop = outputRef.value.scrollHeight
  })
})

// ── 生成 ──────────────────────────────────────────────────────────
async function generate() {
  if (!modelKey.value || !prompt.value.trim() || loading.value) return
  loading.value = true
  streamedText.value = ''
  tokenStats.value = null
  hitTokenLimit.value = false
  lastPrompt.value = prompt.value
  lastSuffix.value = mode.value === 'fim' ? suffix.value : ''
  lastSystemPrompt.value = mode.value === 'chat_prefix' ? systemPrompt.value : ''
  lastUserContent.value = mode.value === 'chat_prefix' ? userContent.value : ''
  abortController = new AbortController()

  await streamFimRequest(
    {
      modelKey: modelKey.value,
      prompt: prompt.value,
      suffix: mode.value === 'fim' && suffix.value.trim() ? suffix.value : undefined,
      systemPrompt: mode.value === 'chat_prefix' && systemPrompt.value.trim() ? systemPrompt.value : undefined,
      userContent: mode.value === 'chat_prefix' && userContent.value.trim() ? userContent.value : undefined,
      chatPrefix: mode.value === 'chat_prefix',
      maxTokens: maxTokens.value ?? undefined,
      temperature: temperature.value ?? undefined
    },
    (event) => {
      if (event.type === 'content' && event.content) {
        streamedText.value += event.content
      } else if (event.type === 'done') {
        if (event.promptTokens != null && event.completionTokens != null) {
          tokenStats.value = { prompt: event.promptTokens, completion: event.completionTokens }
        }
        loading.value = false
      } else if (event.type === 'error') {
        message.error(event.message ?? '生成失败')
        loading.value = false
      }
    },
    abortController.signal
  )
  loading.value = false
}

function stopGeneration() {
  abortController?.abort()
  loading.value = false
}

function clearAll() {
  prompt.value = ''
  suffix.value = ''
  systemPrompt.value = ''
  userContent.value = ''
  streamedText.value = ''
  lastPrompt.value = ''
  lastSuffix.value = ''
  lastSystemPrompt.value = ''
  lastUserContent.value = ''
  tokenStats.value = null
  hitTokenLimit.value = false
}

async function copyResult() {
  const full = lastPrompt.value + streamedText.value + (mode.value === 'fim' ? lastSuffix.value : '')
  if (!full) return
  try {
    await navigator.clipboard.writeText(full)
    justCopied.value = true
    setTimeout(() => {
      justCopied.value = false
    }, 2000)
  } catch {
    message.error('复制失败')
  }
}

onMounted(loadModelConfigs)
onUnmounted(() => abortController?.abort())
</script>

<style lang="scss" scoped>
// ── 基础颜色（使用 Naive UI CSS 变量） ──────────────────────────────
$fg: var(--n-text-color-1);
$fg2: var(--n-text-color-2);
$fg3: var(--n-text-color-3);
$bg: var(--n-color);
$bg2: var(--n-color-modal);
$bd: var(--n-border-color);
$ac: var(--primary-color, #2db48c);

// 硬编码 accent 的 rgba 版本（确保兼容性）
$ac-color: #2db48c;

.fim-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 110px);
  min-height: 540px;
  color: $fg;
}

// ══ 标题栏 ════════════════════════════════════════════════════════
.fim-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 20px 9px;
  background: $bg;
  border-bottom: 1px solid $bd;
  flex-shrink: 0;
  gap: 12px;
  flex-wrap: wrap;
}

.brand {
  display: flex;
  align-items: center;
  gap: 9px;
}

.brand-dots {
  display: flex;
  align-items: center;
  gap: 3px;
}

.dot {
  display: inline-block;
  border-radius: 50%;
  background: $ac;
}

.dot-1 {
  width: 8px;
  height: 8px;
}

.dot-2 {
  width: 5px;
  height: 5px;
  opacity: 0.48;
}

.dot-3 {
  width: 3.5px;
  height: 3.5px;
  opacity: 0.2;
}

.brand-name {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: $fg;
  margin: 0;
}

.brand-badge {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.11em;
  padding: 2px 5px;
  border-radius: 3px;
  background: rgba($ac-color, 0.12);
  color: $ac;
  border: 1px solid rgba($ac-color, 0.2);
}

// ── 模式按钮 ──────────────────────────────────────────────────────
.mode-btns {
  display: flex;
  gap: 6px;
}

.mode-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid $bd;
  border-radius: 6px;
  background: transparent;
  font-size: 12.5px;
  font-weight: 500;
  color: $fg3;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s,
    box-shadow 0.15s;
  line-height: 1;

  &:hover:not(.mode-btn--active) {
    border-color: $ac;
    color: $ac;
    background: rgba($ac-color, 0.06);
  }
}

.mode-btn--active {
  background: $ac;
  border-color: $ac;
  color: #fff;
  box-shadow: 0 2px 10px rgba($ac-color, 0.25);
}

// ══ 配置行 ════════════════════════════════════════════════════════
.config-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 20px;
  background: $bg2;
  border-bottom: 1px solid $bd;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.config-item {
  display: flex;
  align-items: center;
  gap: 7px;
}

.config-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: $fg3;
  white-space: nowrap;
}

.config-divider {
  display: inline-block;
  width: 1px;
  height: 16px;
  background: $bd;
  margin: 0 2px;
}

.config-spacer {
  flex: 1;
}

.config-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

// ── 操作按钮 ──────────────────────────────────────────────────────
.btn-clear {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border: 1px solid $bd;
  border-radius: 5px;
  background: transparent;
  font-size: 12.5px;
  font-weight: 500;
  color: $fg3;
  cursor: pointer;
  transition:
    color 0.15s,
    background 0.15s;

  &:hover:not(:disabled) {
    color: $fg2;
    background: $bg2;
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
}

.btn-stop {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border: 1px solid rgba(220, 53, 69, 0.35);
  border-radius: 5px;
  background: transparent;
  font-size: 12.5px;
  font-weight: 500;
  color: #dc3545;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: rgba(220, 53, 69, 0.07);
  }
}

.btn-generate {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 5px 16px;
  min-width: 96px;
  border: 1px solid $ac;
  border-radius: 5px;
  background: $ac;
  font-size: 12.5px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  transition:
    filter 0.15s,
    transform 0.15s,
    box-shadow 0.15s;

  &:hover:not(:disabled):not(.btn-generate--loading) {
    filter: brightness(1.08);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba($ac-color, 0.3);
  }

  &:disabled:not(.btn-generate--loading) {
    opacity: 0.38;
    cursor: not-allowed;
  }
}

.btn-generate--loading {
  background: $bg2;
  border-color: $bd;
  color: $fg3;
  box-shadow: none;
  transform: none;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 11px;
  height: 11px;
  border: 1.8px solid rgba(0, 0, 0, 0.12);
  border-top-color: $fg3;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// ══ 工作区 ════════════════════════════════════════════════════════
.workspace {
  flex: 1;
  display: flex;
  min-height: 0;
  background: $bg;
}

// ── 面板通用 ──────────────────────────────────────────────────────
.panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 16px;
  border-bottom: 1px solid $bd;
  background: $bg2;
  flex-shrink: 0;
}

.panel-ruler {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: $fg3;
}

.panel-hint {
  font-size: 10px;
  color: $fg3;
  opacity: 0.6;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 280px;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
}

// ── 输入面板 ──────────────────────────────────────────────────────
.input-panel {
  border-right: 1px solid $bd;
}

.input-panel .panel-body {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &.field--grow {
    flex: 1;
    min-height: 0;
  }
}

.field-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.field-name {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: $fg2;
}

.field-tag {
  font-size: 10px;
  border-radius: 3px;
  padding: 1px 5px;
  font-weight: 500;
}

.field-tag--opt {
  background: $bg2;
  color: $fg3;
  border: 1px solid $bd;
}

.field-tag--req {
  background: rgba($ac-color, 0.1);
  color: $ac;
  border: 1px solid rgba($ac-color, 0.2);
}

.char-count {
  font-size: 10px;
  color: $fg3;
  margin-left: auto;
  font-variant-numeric: tabular-nums;
}

.field-sep {
  height: 1px;
  background: $bd;
  margin: 10px 0;
  flex-shrink: 0;
}

.textarea {
  width: 100%;
  min-height: 72px;
  padding: 10px 12px;
  background: $bg2;
  border: 1px solid $bd;
  border-radius: 6px;
  font-size: 13.5px;
  line-height: 1.7;
  color: $fg;
  resize: none;
  outline: none;
  box-sizing: border-box;
  font-family: ui-monospace, 'Cascadia Code', 'JetBrains Mono', 'Fira Code', monospace;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;

  &:focus {
    border-color: $ac;
    box-shadow: 0 0 0 2.5px rgba($ac-color, 0.15);
  }

  &::placeholder {
    color: $fg3;
    opacity: 0.55;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.textarea--grow {
  flex: 1;
  min-height: 120px;
}

// ── 流向指示器 ────────────────────────────────────────────────────
.flow {
  width: 36px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 0;
  gap: 6px;
  background: $bg2;
  border-left: 1px solid $bd;
  border-right: 1px solid $bd;
}

.flow-line {
  flex: 1;
  width: 1px;
  background: $bd;
}

.flow-icon {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg;
  border: 1px solid $bd;
  color: $fg3;
  flex-shrink: 0;
  transition:
    color 0.25s,
    border-color 0.25s,
    box-shadow 0.25s;

  .flow--active & {
    color: $ac;
    border-color: $ac;
    box-shadow: 0 0 0 5px rgba($ac-color, 0.12);
    animation: pulse 1.3s ease-in-out infinite;
  }
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 0 5px rgba($ac-color, 0.12);
  }
  50% {
    box-shadow: 0 0 0 9px rgba($ac-color, 0.04);
  }
}

// ── 输出面板 ──────────────────────────────────────────────────────
.output-panel {
  border-left: 1px solid $bd;
  transition: border-left-color 0.2s;

  &.output-panel--active {
    border-left-color: $ac;
  }
}

.output-head {
  border-top: none;
}

.output-meta {
  display: flex;
  align-items: center;
  gap: 7px;
}

.token-stat {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  font-variant-numeric: tabular-nums;
  padding: 2px 8px;
  border-radius: 10px;
  background: $bg;
  border: 1px solid $bd;
  color: $fg3;
}

.stat-sep {
  opacity: 0.4;
}

.stat-out {
  color: $ac;
  font-weight: 600;
}

.limit-tag {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 2px 6px;
  border-radius: 3px;
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 9px;
  border: 1px solid $bd;
  border-radius: 4px;
  background: transparent;
  font-size: 10.5px;
  font-weight: 500;
  color: $fg3;
  cursor: pointer;
  transition:
    color 0.15s,
    border-color 0.15s,
    background 0.15s;

  &:hover {
    border-color: $ac;
    color: $ac;
  }
}

.copy-btn--done {
  border-color: $ac;
  color: $ac;
  background: rgba($ac-color, 0.08);
}

// ── 输出区内容 ────────────────────────────────────────────────────
.output-body {
  padding: 14px 16px;
  position: relative;
}

.empty-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  pointer-events: none;
}

.empty-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: $bg2;
  border: 1px solid $bd;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $fg3;
}

.empty-text {
  font-size: 12.5px;
  color: $fg3;
  margin: 0;
}

.empty-sub {
  font-size: 11px;
  color: $fg3;
  opacity: 0.55;
  margin: 0;
}

.seg-prefix {
  color: $fg3;
  font-family: ui-monospace, 'Cascadia Code', 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13.5px;
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;
}

.seg-gen {
  color: $ac;

  // Markdown 渲染样式
  &:deep(p) {
    margin: 0 0 8px;

    &:last-child {
      margin: 0;
    }
  }

  &:deep(pre.hljs) {
    border-radius: 6px;
    padding: 12px 14px;
    overflow-x: auto;
    margin: 8px 0;
    background: rgba(0, 0, 0, 0.08);
    font-size: 13px;
  }

  &:deep(code:not(.hljs)) {
    background: rgba($ac-color, 0.1);
    padding: 2px 5px;
    border-radius: 3px;
    font-size: 13px;
    color: $ac;
  }

  &:deep(h1, h2, h3, h4, h5, h6) {
    margin: 12px 0 6px;
    font-weight: 600;
    color: $fg;
  }

  &:deep(a) {
    color: $ac;
    text-decoration: underline;
  }

  &:deep(ul, ol) {
    padding-left: 20px;
    margin: 6px 0;
    color: $fg;
  }

  &:deep(li) {
    margin: 3px 0;
  }

  &:deep(blockquote) {
    border-left: 3px solid rgba($ac-color, 0.4);
    padding-left: 12px;
    margin: 8px 0;
    color: $fg3;
  }

  &:deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 8px 0;
  }

  &:deep(th, td) {
    border: 1px solid $bd;
    padding: 6px 10px;
    color: $fg;
  }

  &:deep(th) {
    background: $bg2;
  }

  &:deep(hr) {
    border: none;
    border-top: 1px solid $bd;
    margin: 12px 0;
  }
}

.seg-suffix {
  color: $fg3;
  font-family: ui-monospace, 'Cascadia Code', 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13.5px;
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;
}

.fim-output {
  font-size: 13.5px;
  line-height: 1.75;
}

// ── 对话上下文块 ──────────────────────────────────────────────────
.ctx-wrap {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.ctx-block {
  display: flex;
  gap: 10px;
  padding: 10px 0;

  & + .ctx-block {
    border-top: 1px dashed $bd;
  }
}

.ctx-role {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 3px 6px;
  border-radius: 3px;
  flex-shrink: 0;
  height: fit-content;
  margin-top: 2px;
}

.ctx-sys .ctx-role {
  background: rgba(168, 85, 247, 0.1);
  color: #9333ea;
  border: 1px solid rgba(168, 85, 247, 0.2);
}

.ctx-user .ctx-role {
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.ctx-asst .ctx-role {
  background: rgba($ac-color, 0.1);
  color: $ac;
  border: 1px solid rgba($ac-color, 0.2);
}

.ctx-text {
  font-family: ui-monospace, 'Cascadia Code', 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13.5px;
  line-height: 1.7;
  color: $fg2;
  white-space: pre-wrap;
  word-break: break-word;
  flex: 1;
}

.ctx-content {
  flex: 1;
  font-size: 13.5px;
  line-height: 1.75;
}

// ── 流式光标 ──────────────────────────────────────────────────────
.cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: $ac;
  vertical-align: text-bottom;
  margin-left: 1px;
  border-radius: 1px;
  animation: blink 0.85s step-end infinite;
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

// ── 进度条 ────────────────────────────────────────────────────────
.progress-bar {
  height: 2px;
  background: $bg2;
  border-radius: 1px;
  overflow: hidden;
  margin-top: 14px;
}

.progress-fill {
  height: 100%;
  width: 35%;
  background: $ac;
  border-radius: 1px;
  animation: slide 1.1s ease-in-out infinite;
}

@keyframes slide {
  0% {
    transform: translateX(-150%);
  }
  100% {
    transform: translateX(400%);
  }
}

// ══ 过渡动画 ══════════════════════════════════════════════════════
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.25s,
    transform 0.25s;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
