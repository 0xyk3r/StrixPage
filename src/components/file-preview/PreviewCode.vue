<script lang="ts" setup>
import type { BrowseFileItem } from '@/api/oss-browse'
import hljs from 'highlight.js'
import MarkdownIt from 'markdown-it'
import 'highlight.js/styles/github-dark.css'

const props = defineProps<{
  url: string
  file: BrowseFileItem
}>()

const content = ref('')
const loading = ref(true)
const error = ref('')
const truncated = ref(false)

const MAX_SIZE = 1024 * 1024 // 1MB

const isMarkdown = computed(() => {
  const ext = props.file.ext?.toLowerCase() || ''
  return ['.md', '.markdown'].includes(ext)
})

const language = computed(() => {
  const ext = props.file.ext?.toLowerCase().replace('.', '') || ''
  const langMap: Record<string, string> = {
    js: 'javascript', ts: 'typescript', py: 'python', rb: 'ruby',
    yml: 'yaml', sh: 'bash', bat: 'dos', ps1: 'powershell',
    vue: 'xml', jsx: 'javascript', tsx: 'typescript',
    htm: 'html', scss: 'scss', sass: 'sass', less: 'less',
    kt: 'kotlin', rs: 'rust', cs: 'csharp'
  }
  return langMap[ext] || ext
})

const renderedHtml = computed(() => {
  if (isMarkdown.value) {
    const md = new MarkdownIt({
      highlight: (str, lang) => {
        if (lang && hljs.getLanguage(lang)) {
          return hljs.highlight(str, { language: lang }).value
        }
        return ''
      }
    })
    return md.render(content.value)
  }

  if (language.value && hljs.getLanguage(language.value)) {
    const highlighted = hljs.highlight(content.value, { language: language.value }).value
    return `<pre class="hljs"><code>${highlighted}</code></pre>`
  }

  const escaped = content.value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return `<pre class="hljs"><code>${escaped}</code></pre>`
})

async function loadContent() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(props.url)
    const text = await res.text()
    if (text.length > MAX_SIZE) {
      content.value = text.slice(0, MAX_SIZE)
      truncated.value = true
    } else {
      content.value = text
    }
  } catch {
    error.value = '文件内容加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => loadContent())
</script>

<template>
  <div class="preview-code">
    <n-spin v-if="loading" :show="true" />
    <div v-else-if="error" class="preview-code__error">{{ error }}</div>
    <template v-else>
      <div v-if="truncated" class="preview-code__truncated">
        ⚠ 文件过大（>1MB），仅显示前 1MB 内容
      </div>
      <div
        class="preview-code__content"
        :class="{ 'preview-code__content--markdown': isMarkdown }"
        v-html="renderedHtml"
      />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.preview-code {
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: 16px;

  &__error {
    color: rgba(255, 255, 255, 0.7);
    text-align: center;
    padding: 40px;
  }

  &__truncated {
    color: #f0a020;
    font-size: 13px;
    padding: 8px 12px;
    background: rgba(240, 160, 32, 0.1);
    border-radius: 4px;
    margin-bottom: 12px;
  }

  &__content {
    :deep(pre.hljs) {
      background: rgba(0, 0, 0, 0.3);
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 13px;
      line-height: 1.6;
    }

    &--markdown {
      color: rgba(255, 255, 255, 0.9);
      line-height: 1.8;

      :deep(h1), :deep(h2), :deep(h3) {
        color: #fff;
        margin: 16px 0 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 4px;
      }

      :deep(a) {
        color: #63e2b7;
      }

      :deep(code) {
        background: rgba(0, 0, 0, 0.3);
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 13px;
      }

      :deep(blockquote) {
        border-left: 3px solid rgba(255, 255, 255, 0.2);
        padding-left: 12px;
        margin-left: 0;
        opacity: 0.8;
      }
    }
  }
}
</style>
