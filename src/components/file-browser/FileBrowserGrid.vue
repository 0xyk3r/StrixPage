<script lang="ts" setup>
import type { BrowseFileItem, DirectoryItem } from '@/api/oss-browse'
import { formatFileSize } from '@/utils/strix-file-util'

const props = defineProps<{
  directories: DirectoryItem[]
  files: BrowseFileItem[]
  selectedFiles: Set<string>
  loading: boolean
}>()

const emit = defineEmits<{
  itemDoubleClick: [item: BrowseFileItem | DirectoryItem]
  contextMenu: [event: MouseEvent, target: BrowseFileItem | DirectoryItem | null, type: 'file' | 'directory' | 'blank' | 'multi']
  'update:selectedFiles': [selected: Set<string>]
}>()

function isSelected(fileId: string) {
  return props.selectedFiles.has(fileId)
}

function handleFileClick(event: MouseEvent, file: BrowseFileItem) {
  const newSet = new Set(props.selectedFiles)
  if (event.ctrlKey || event.metaKey) {
    if (newSet.has(file.id)) {
      newSet.delete(file.id)
    } else {
      newSet.add(file.id)
    }
  } else {
    newSet.clear()
    newSet.add(file.id)
  }
  emit('update:selectedFiles', newSet)
}

function handleBlankClick() {
  emit('update:selectedFiles', new Set())
}

function handleBlankContextMenu(event: MouseEvent) {
  emit('contextMenu', event, null, 'blank')
}

function handleFileContextMenu(event: MouseEvent, file: BrowseFileItem) {
  if (props.selectedFiles.size > 1 && props.selectedFiles.has(file.id)) {
    emit('contextMenu', event, file, 'multi')
  } else {
    const newSet = new Set<string>([file.id])
    emit('update:selectedFiles', newSet)
    emit('contextMenu', event, file, 'file')
  }
}

function handleDirContextMenu(event: MouseEvent, dir: DirectoryItem) {
  emit('contextMenu', event, dir, 'directory')
}

function getFileIcon(file: BrowseFileItem): string {
  const ct = file.contentType || ''
  if (ct.startsWith('image/')) return '🖼'
  if (ct.startsWith('video/')) return '🎬'
  if (ct.startsWith('audio/')) return '🎵'
  if (ct === 'application/pdf') return '📕'
  if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(file.ext)) return '📦'
  if (ct.startsWith('text/') || ['.json', '.xml', '.yaml', '.yml'].includes(file.ext)) return '📝'
  return '📄'
}
</script>

<template>
  <n-spin :show="loading" class="grid-container">
    <div
      class="grid-view"
      @click.self="handleBlankClick"
      @contextmenu.self="handleBlankContextMenu"
    >
      <!-- Directories -->
      <div
        v-for="dir in directories"
        :key="'dir-' + dir.name"
        class="grid-item grid-item--dir"
        @dblclick="emit('itemDoubleClick', dir)"
        @contextmenu.prevent="handleDirContextMenu($event, dir)"
      >
        <div class="grid-item__icon">📁</div>
        <div class="grid-item__name" :title="dir.name">{{ dir.name }}</div>
        <div class="grid-item__meta">{{ dir.fileCount }} 个文件</div>
      </div>

      <!-- Files -->
      <div
        v-for="file in files"
        :key="file.id"
        class="grid-item"
        :class="{ 'grid-item--selected': isSelected(file.id) }"
        @click="handleFileClick($event, file)"
        @dblclick="emit('itemDoubleClick', file)"
        @contextmenu.prevent="handleFileContextMenu($event, file)"
      >
        <div class="grid-item__icon">{{ getFileIcon(file) }}</div>
        <div class="grid-item__name" :title="file.originalName">
          {{ file.originalName || '未命名' }}
        </div>
        <div class="grid-item__meta">{{ formatFileSize(file.size) }}</div>
      </div>

      <!-- Empty state -->
      <div v-if="directories.length === 0 && files.length === 0 && !loading" class="grid-view__empty">
        <n-empty description="此目录为空" />
      </div>
    </div>
  </n-spin>
</template>

<style lang="scss" scoped>
.grid-container {
  flex: 1;
  overflow: auto;
}

.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
  padding: 12px;
  min-height: 100%;

  &__empty {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
  }
}

.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s;
  user-select: none;

  &:hover {
    background: var(--n-color-hover);
  }

  &--selected {
    background: var(--n-color-target);
    outline: 2px solid var(--n-color-primary);
    outline-offset: -2px;
  }

  &--dir {
    cursor: pointer;
  }

  &__icon {
    font-size: 40px;
    line-height: 1;
  }

  &__name {
    font-size: 12px;
    text-align: center;
    word-break: break-all;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    max-width: 100%;
  }

  &__meta {
    font-size: 11px;
    color: var(--n-text-color-3);
  }
}
</style>
