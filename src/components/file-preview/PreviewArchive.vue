<script lang="ts" setup>
import type { BrowseFileItem, ArchiveEntry } from '@/api/oss-browse'
import { ossBrowseApi } from '@/api/oss-browse'
import type { TreeOption } from 'naive-ui'

const props = defineProps<{
  file: BrowseFileItem
}>()

const loading = ref(true)
const error = ref('')
const treeData = ref<TreeOption[]>([])

const MAX_SIZE = 100 * 1024 * 1024 // 100MB

async function loadArchive() {
  loading.value = true
  error.value = ''

  if (props.file.size > MAX_SIZE) {
    error.value = '文件过大（>100MB），不支持在线预览'
    loading.value = false
    return
  }

  try {
    const { data } = await ossBrowseApi.listArchive(props.file.id)
    if (data.code === 200) {
      treeData.value = buildTree(data.data.entries)
    } else {
      error.value = data.msg || '读取压缩包失败'
    }
  } catch {
    error.value = '读取压缩包失败'
  } finally {
    loading.value = false
  }
}

function buildTree(entries: ArchiveEntry[]): TreeOption[] {
  const root: TreeOption[] = []
  const map = new Map<string, TreeOption>()

  for (const entry of entries) {
    const parts = entry.path.split('/').filter(Boolean)
    let current = root
    let fullPath = ''

    for (let i = 0; i < parts.length; i++) {
      fullPath += (parts[i] ?? '') + '/'
      const isLast = i === parts.length - 1

      if (!map.has(fullPath)) {
        const node: TreeOption = {
          key: fullPath,
          label: parts[i],
          children: isLast && !entry.isDirectory ? undefined : [],
          prefix: () => h('span', isLast && !entry.isDirectory ? '📄' : '📁'),
          suffix: isLast && !entry.isDirectory
            ? () => h('span', { style: 'font-size: 11px; opacity: 0.5; margin-left: 8px' },
                entry.size > 0 ? formatSize(entry.size) : '')
            : undefined
        }
        map.set(fullPath, node)
        current.push(node)
      }

      const existing = map.get(fullPath)
      if (existing?.children) {
        current = existing.children as TreeOption[]
      }
    }
  }

  return root
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

onMounted(() => loadArchive())
</script>

<template>
  <div class="preview-archive">
    <n-spin v-if="loading" :show="true" />
    <div v-else-if="error" class="preview-archive__error">
      <div style="font-size: 48px; margin-bottom: 12px">📦</div>
      <div>{{ error }}</div>
    </div>
    <div v-else class="preview-archive__tree">
      <div class="preview-archive__header">
        📦 {{ file.originalName }}
      </div>
      <n-tree
        :data="treeData"
        block-line
        expand-on-click
        default-expand-all
        selectable
        class="preview-archive__n-tree"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.preview-archive {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  &__error {
    text-align: center;
    color: rgba(255, 255, 255, 0.7);
  }

  &__tree {
    width: 600px;
    max-width: 90vw;
    max-height: 90vh;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  &__header {
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 500;
    color: #fff;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  &__n-tree {
    flex: 1;
    overflow: auto;
    padding: 8px;

    :deep(.n-tree-node-content__text) {
      color: rgba(255, 255, 255, 0.85);
    }
  }
}
</style>
