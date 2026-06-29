<script lang="ts" setup>
/**
 * StrixStreamMarkdown —— 流式 Markdown 渲染器（节流 + 新段落淡入）
 *
 * 针对「流式逐 token 追加内容」场景优化，解决三个问题：
 *  1. 节流渲染：流式中对 md.render 做节流（leading + trailing），将「每 chunk 全量重渲染」
 *     降为「每帧级渲染」，消除 O(n²) 开销；streaming 转 false 时执行一次最终精确渲染。
 *  2. 单例 MarkdownIt：模块级共享实例，转义 fallback 也复用，避免反复 new。
 *  3. highlight.js 按需注册：使用 lib/core 仅注册常用语言，减小打包体积。
 *
 * 顶层块 diff：手动管理内容容器 DOM，节流 flush 时按序比较顶层子节点 outerHTML，
 * 稳定段落跳过（不重渲染、不重新高亮、不闪烁），流式中持续生长的最后一块原地更新，
 * 真正「新增」的块以 opacity + translateY 淡入。
 */
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import java from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import markdown from 'highlight.js/lib/languages/markdown'
import plaintext from 'highlight.js/lib/languages/plaintext'
import python from 'highlight.js/lib/languages/python'
import shell from 'highlight.js/lib/languages/shell'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'
import 'highlight.js/styles/github-dark.css'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

// ── highlight.js 按需注册（文档分析场景常用语言）──
const HLJS_LANGUAGES: Record<string, any> = {
  bash,
  java,
  javascript,
  json,
  markdown,
  plaintext,
  python,
  shell,
  sql,
  typescript,
  xml,
  yaml
}
for (const [name, lang] of Object.entries(HLJS_LANGUAGES)) {
  if (!hljs.getLanguage(name)) hljs.registerLanguage(name, lang)
}

// ── 单例 MarkdownIt ──
function highlightFn(str: string, lang: string): string {
  if (lang && hljs.getLanguage(lang)) {
    try {
      return `<pre class="hljs"><code>${hljs.highlight(str, {
        language: lang,
        ignoreIllegals: true
      }).value}</code></pre>`
    } catch {
      /* fall through to escape */
    }
  }
  return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
}

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  highlight: highlightFn
})

const props = withDefaults(
  defineProps<{
    /** Markdown 源文本 */
    content: string
    /** 是否处于流式输出中（true 时节流渲染，false 时最终精确渲染） */
    streaming?: boolean
    /** 主题变体：default 绿色 / result 蓝色（综合结果） */
    variant?: 'default' | 'result'
    /** 节流间隔（毫秒） */
    throttle?: number
  }>(),
  {
    streaming: false,
    variant: 'default',
    throttle: 90
  }
)

const contentRef = ref<HTMLElement | null>(null)

let throttleTimer: ReturnType<typeof setTimeout> | null = null
let lastFlush = 0
/** 已渲染到 DOM 的顶层块 outerHTML 快照，用于 diff */
let renderedSnapshot: string[] = []

function clearThrottle() {
  if (throttleTimer) {
    clearTimeout(throttleTimer)
    throttleTimer = null
  }
}

/**
 * 将最新内容渲染进容器：解析为顶层块，按序与现有 DOM diff。
 * @param animate 是否对新增块播放淡入（流式时 true；最终渲染/首帧重置时 false）
 */
function flush(animate: boolean) {
  const container = contentRef.value
  if (!container) return

  const html = md.render(props.content || '')
  // 用临时容器解析出顶层块
  const tpl = document.createElement('div')
  tpl.innerHTML = html
  const newNodes = Array.from(tpl.children) as HTMLElement[]
  const newSnapshot = newNodes.map((n) => n.outerHTML)

  // 截断：移除多于新内容的旧节点（极少见，content 变短时）
  while (container.children.length > newNodes.length) {
    container.lastElementChild?.remove()
  }

  for (let i = 0; i < newNodes.length; i++) {
    const existing = container.children[i] as HTMLElement | undefined
    if (!existing) {
      // 新增块
      const node = newNodes[i]!
      container.appendChild(node)
      if (animate) playEnter(node)
    } else if (renderedSnapshot[i] !== newSnapshot[i]) {
      // 内容变化：原地替换（流式中最后一块持续生长，不触发淡入）
      existing.replaceWith(newNodes[i]!)
    }
    // 相同则跳过，保持稳定段落不动
  }

  renderedSnapshot = newSnapshot
  lastFlush = Date.now()
}

function playEnter(node: HTMLElement) {
  if (typeof node.animate !== 'function') return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  node.animate(
    [
      { opacity: 0, transform: 'translateY(4px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ],
    { duration: 200, easing: 'ease-out' }
  )
}

/** 全量重置（content 被清空或大幅缩短时），不做淡入 */
function reset() {
  clearThrottle()
  renderedSnapshot = []
  if (contentRef.value) contentRef.value.innerHTML = ''
  flush(false)
}

function scheduleRender() {
  // 非流式：立即精确渲染
  if (!props.streaming) {
    clearThrottle()
    flush(false)
    return
  }
  // 流式：节流（leading + trailing）
  const elapsed = Date.now() - lastFlush
  if (elapsed >= props.throttle) {
    clearThrottle()
    flush(true)
  } else if (!throttleTimer) {
    throttleTimer = setTimeout(() => {
      throttleTimer = null
      flush(true)
    }, props.throttle - elapsed)
  }
}

watch(
  () => props.content,
  (val, old) => {
    // 内容被清空或非追加式变化（如切换数据源）→ 重置
    if (!val) {
      reset()
      return
    }
    if (old && !val.startsWith(old)) {
      reset()
      return
    }
    scheduleRender()
  }
)

// streaming 收尾：做一次最终精确渲染
watch(
  () => props.streaming,
  (val) => {
    if (!val) {
      clearThrottle()
      flush(false)
    }
  }
)

onMounted(() => {
  if (props.content) flush(false)
})

onBeforeUnmount(clearThrottle)
</script>

<template>
  <div ref="contentRef" class="strix-md" :class="{ 'strix-md--result': variant === 'result' }" />
</template>

<style lang="scss" scoped>
@use '@/assets/style/tokens' as *;

.strix-md {
  font-size: 13px;
  line-height: $leading-relaxed;
  color: var(--strix-text-primary);

  :deep(p) {
    margin: 0 0 10px;
  }

  :deep(p:last-child) {
    margin: 0;
  }

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4) {
    font-family: $font-display;
    font-weight: $weight-semibold;
    line-height: $leading-tight;
    margin: 14px 0 7px;
    color: var(--strix-text-primary);

    &:first-child {
      margin-top: 0;
    }
  }

  :deep(h1) {
    font-size: $text-lg;
    color: var(--strix-text-accent);
  }

  :deep(h2) {
    font-size: $text-base;
    border-bottom: 1px solid var(--strix-border-subtle);
    padding-bottom: 4px;
  }

  :deep(h3) {
    font-size: $text-sm;
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 20px;
    margin: 7px 0;
  }

  :deep(li) {
    margin: 3px 0;
  }

  :deep(code) {
    font-family: $font-mono;
    font-size: 11px;
    padding: 1px 5px;
    background: rgba(99, 226, 183, 0.07);
    border: 1px solid rgba(99, 226, 183, 0.12);
    border-radius: 3px;
    color: var(--strix-text-accent);
  }

  :deep(pre) {
    margin: 10px 0;
    border-radius: 5px;
    overflow: hidden;

    code {
      background: none;
      border: none;
      padding: 0;
      color: inherit;
      font-size: 12px;
    }
  }

  :deep(pre.hljs) {
    padding: 12px 14px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid var(--strix-border-subtle);
    overflow-x: auto;
  }

  :deep(blockquote) {
    margin: 10px 0;
    padding: 8px 12px;
    border-left: 2px solid var(--strix-text-accent);
    background: rgba(99, 226, 183, 0.04);
    color: var(--strix-text-secondary);
    border-radius: 0 4px 4px 0;
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    font-size: 12px;
  }

  :deep(th) {
    background: rgba(99, 226, 183, 0.06);
    color: var(--strix-text-accent);
    font-family: $font-mono;
    font-size: 11px;
    padding: 7px 10px;
    border: 1px solid var(--strix-border-subtle);
    text-align: left;
  }

  :deep(td) {
    padding: 6px 10px;
    border: 1px solid var(--strix-border-subtle);
  }

  :deep(tr:nth-child(even) td) {
    background: rgba(255, 255, 255, 0.015);
  }

  :deep(strong) {
    font-weight: $weight-semibold;
  }

  :deep(a) {
    color: var(--strix-text-accent);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  :deep(hr) {
    border: none;
    border-top: 1px solid var(--strix-border-subtle);
    margin: 12px 0;
  }
}

// ── result 变体（蓝色综合结果主题）──
.strix-md--result {
  color: rgba(112, 192, 232, 0.85);

  :deep(h1) {
    color: $color-info;
    font-size: $text-xl;
  }

  :deep(h2) {
    font-size: $text-lg;
  }

  :deep(code) {
    color: $color-info;
    background: rgba(112, 192, 232, 0.07);
    border-color: rgba(112, 192, 232, 0.15);
  }

  :deep(blockquote) {
    border-left-color: $color-info;
    background: rgba(112, 192, 232, 0.04);
  }
}
</style>
