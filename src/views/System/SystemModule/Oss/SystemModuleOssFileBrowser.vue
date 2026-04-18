<script lang="ts" setup>
import { ossBrowseApi } from '@/api/oss-browse'
import type { BrowseResp, BrowseFileItem, DirectoryItem } from '@/api/oss-browse'
import FileBrowserSidebar from '@/components/file-browser/FileBrowserSidebar.vue'
import FileBrowserToolbar from '@/components/file-browser/FileBrowserToolbar.vue'
import FileBrowserGrid from '@/components/file-browser/FileBrowserGrid.vue'
import FileBrowserList from '@/components/file-browser/FileBrowserList.vue'
import FileBrowserContextMenu from '@/components/file-browser/FileBrowserContextMenu.vue'
import FileBrowserUploadZone from '@/components/file-browser/FileBrowserUploadZone.vue'
import StrixFilePreview from '@/components/file-preview/StrixFilePreview.vue'
import { formatFileSize } from '@/utils/strix-file-util'

// ======================== State ========================

const loading = ref(false)
const browseData = ref<BrowseResp | null>(null)

// Navigation
const currentGroupKey = ref('')
const currentGroupName = ref('')
const currentPrefix = ref('')
const navigationHistory = ref<string[]>([])
const historyIndex = ref(-1)

// View preferences (persisted to localStorage)
const viewMode = ref<'grid' | 'list'>(
  (localStorage.getItem('strix-file-browser-viewMode') as 'grid' | 'list') || 'grid'
)
const sortBy = ref(localStorage.getItem('strix-file-browser-sortBy') || 'name')
const sortOrder = ref(localStorage.getItem('strix-file-browser-sortOrder') || 'asc')

watch(viewMode, (v) => localStorage.setItem('strix-file-browser-viewMode', v))
watch(sortBy, (v) => localStorage.setItem('strix-file-browser-sortBy', v))
watch(sortOrder, (v) => localStorage.setItem('strix-file-browser-sortOrder', v))

// Selection
const selectedFiles = ref<Set<string>>(new Set())

// Preview
const previewVisible = ref(false)
const previewFiles = ref<BrowseFileItem[]>([])
const previewIndex = ref(0)

// Context menu
const contextMenuVisible = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuTarget = ref<BrowseFileItem | DirectoryItem | null>(null)
const contextMenuType = ref<'file' | 'directory' | 'blank' | 'multi'>('blank')

// ======================== Data Loading ========================

async function loadBrowseData(keyword?: string) {
  if (!currentGroupKey.value) return
  loading.value = true
  try {
    const { data } = await ossBrowseApi.browse({
      groupKey: currentGroupKey.value,
      prefix: currentPrefix.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      keyword
    })
    if (data.code === 200) {
      browseData.value = data.data
    }
  } finally {
    loading.value = false
    selectedFiles.value.clear()
  }
}

// ======================== Navigation ========================

function navigateToGroup(groupKey: string, groupName: string) {
  currentGroupKey.value = groupKey
  currentGroupName.value = groupName
  currentPrefix.value = ''
  navigationHistory.value = ['']
  historyIndex.value = 0
  loadBrowseData()
}

function navigateToPrefix(prefix: string) {
  currentPrefix.value = prefix
  // Trim navigation history after current index and push new entry
  navigationHistory.value = navigationHistory.value.slice(0, historyIndex.value + 1)
  navigationHistory.value.push(prefix)
  historyIndex.value = navigationHistory.value.length - 1
  loadBrowseData()
}

function navigateBack() {
  if (historyIndex.value > 0) {
    historyIndex.value--
    currentPrefix.value = navigationHistory.value[historyIndex.value] ?? ''
    loadBrowseData()
  }
}

function navigateForward() {
  if (historyIndex.value < navigationHistory.value.length - 1) {
    historyIndex.value++
    currentPrefix.value = navigationHistory.value[historyIndex.value] ?? ''
    loadBrowseData()
  }
}

function navigateToBreadcrumb(index: number) {
  if (!browseData.value) return
  const segments = browseData.value.breadcrumb.slice(0, index + 1)
  const prefix = segments.length > 0 ? segments.join('/') + '/' : ''
  navigateToPrefix(prefix)
}

// ======================== Item Actions ========================

function handleItemDoubleClick(item: BrowseFileItem | DirectoryItem) {
  if ('id' in item) {
    // File: open preview
    const files = browseData.value?.files ?? []
    previewFiles.value = files
    previewIndex.value = files.findIndex((f) => f.id === item.id)
    previewVisible.value = true
  } else {
    // Directory: navigate into
    navigateToPrefix(item.path)
  }
}

function handleContextMenu(
  event: MouseEvent,
  target: BrowseFileItem | DirectoryItem | null,
  type: 'file' | 'directory' | 'blank' | 'multi'
) {
  event.preventDefault()
  contextMenuX.value = event.clientX
  contextMenuY.value = event.clientY
  contextMenuTarget.value = target
  contextMenuType.value = type
  contextMenuVisible.value = true
}

// ======================== Sort ========================

function handleSortChange(newSortBy: string, newSortOrder: string) {
  sortBy.value = newSortBy
  sortOrder.value = newSortOrder
  loadBrowseData()
}

// ======================== Computed ========================

const directories = computed(() => browseData.value?.directories ?? [])
const files = computed(() => browseData.value?.files ?? [])
const breadcrumb = computed(() => browseData.value?.breadcrumb ?? [])

const canGoBack = computed(() => historyIndex.value > 0)
const canGoForward = computed(() => historyIndex.value < navigationHistory.value.length - 1)

const statusText = computed(() => {
  const sel = selectedFiles.value.size
  const total = files.value.length + directories.value.length
  const totalSize = files.value.reduce((sum, f) => sum + (f.size || 0), 0)
  const parts: string[] = []
  if (sel > 0) parts.push(`已选 ${sel} 项`)
  parts.push(`共 ${total} 项`)
  parts.push(formatFileSize(totalSize))
  return parts.join(' · ')
})
</script>

<template>
  <div class="file-browser">
    <div class="file-browser__sidebar">
      <FileBrowserSidebar
        :current-group-key="currentGroupKey"
        @select-group="navigateToGroup"
      />
    </div>

    <div class="file-browser__main">
      <FileBrowserToolbar
        :group-name="currentGroupName"
        :breadcrumb="breadcrumb"
        :view-mode="viewMode"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        :can-go-back="canGoBack"
        :can-go-forward="canGoForward"
        :current-group-key="currentGroupKey"
        :current-prefix="currentPrefix"
        @navigate-back="navigateBack"
        @navigate-forward="navigateForward"
        @breadcrumb-click="navigateToBreadcrumb"
        @update:view-mode="viewMode = $event"
        @sort-change="handleSortChange"
        @search="loadBrowseData($event)"
        @mkdir="loadBrowseData()"
        @upload-complete="loadBrowseData()"
      />

      <FileBrowserUploadZone
        :group-key="currentGroupKey"
        :current-prefix="currentPrefix"
        @upload-complete="loadBrowseData()"
      >
        <div v-if="!currentGroupKey" class="file-browser__empty">
          <n-empty description="请从左侧选择一个文件组" />
        </div>

        <FileBrowserGrid
          v-else-if="viewMode === 'grid'"
          :directories="directories"
          :files="files"
          :selected-files="selectedFiles"
          :loading="loading"
          @item-double-click="handleItemDoubleClick"
          @context-menu="handleContextMenu"
          @update:selected-files="selectedFiles = $event"
        />

        <FileBrowserList
          v-else
          :directories="directories"
          :files="files"
          :selected-files="selectedFiles"
          :loading="loading"
          @item-double-click="handleItemDoubleClick"
          @context-menu="handleContextMenu"
          @update:selected-files="selectedFiles = $event"
        />
      </FileBrowserUploadZone>

      <div class="file-browser__status">
        {{ statusText }}
      </div>
    </div>

    <FileBrowserContextMenu
      v-model:visible="contextMenuVisible"
      :x="contextMenuX"
      :y="contextMenuY"
      :target="contextMenuTarget"
      :type="contextMenuType"
      :selected-files="selectedFiles"
      :current-group-key="currentGroupKey"
      :current-prefix="currentPrefix"
      :files="files"
      @refresh="loadBrowseData()"
      @preview="(file: BrowseFileItem) => {
        previewFiles = files
        previewIndex = files.findIndex(f => f.id === file.id)
        previewVisible = true
      }"
    />

    <StrixFilePreview
      v-model:visible="previewVisible"
      :files="previewFiles"
      :initial-index="previewIndex"
    />
  </div>
</template>

<style lang="scss" scoped>
.file-browser {
  display: flex;
  height: 100%;
  overflow: hidden;

  &__sidebar {
    width: 220px;
    flex-shrink: 0;
    border-right: 1px solid var(--n-border-color);
    overflow-y: auto;
  }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__status {
    height: 32px;
    padding: 0 16px;
    display: flex;
    align-items: center;
    font-size: 12px;
    color: var(--n-text-color-3);
    border-top: 1px solid var(--n-border-color);
    flex-shrink: 0;
  }
}
</style>
