<script lang="ts" setup>
import { ossBrowseApi } from '@/api/oss-browse'

const props = defineProps<{
  groupName: string
  breadcrumb: string[]
  viewMode: 'grid' | 'list'
  sortBy: string
  sortOrder: string
  canGoBack: boolean
  canGoForward: boolean
  currentGroupKey: string
  currentPrefix: string
}>()

const emit = defineEmits<{
  navigateBack: []
  navigateForward: []
  breadcrumbClick: [index: number]
  'update:viewMode': [mode: 'grid' | 'list']
  sortChange: [sortBy: string, sortOrder: string]
  search: [keyword: string]
  mkdir: []
  uploadComplete: []
}>()

const searchKeyword = ref('')
const mkdirVisible = ref(false)
const mkdirName = ref('')
const mkdirLoading = ref(false)
const fileInputRef = ref<HTMLInputElement>()

const sortOptions = [
  { label: '名称', value: 'name' },
  { label: '大小', value: 'size' },
  { label: '时间', value: 'time' },
  { label: '类型', value: 'type' }
]

function handleSearch() {
  emit('search', searchKeyword.value || '')
}

function clearSearch() {
  searchKeyword.value = ''
  emit('search', '')
}

function handleSortSelect(value: string) {
  if (value === props.sortBy) {
    emit('sortChange', value, props.sortOrder === 'asc' ? 'desc' : 'asc')
  } else {
    emit('sortChange', value, 'asc')
  }
}

async function handleMkdir() {
  if (!mkdirName.value.trim()) return
  mkdirLoading.value = true
  try {
    const { data } = await ossBrowseApi.mkdir({
      groupKey: props.currentGroupKey,
      parentPrefix: props.currentPrefix,
      dirName: mkdirName.value.trim()
    })
    if (data.code === 200) {
      mkdirVisible.value = false
      mkdirName.value = ''
      emit('mkdir')
    }
  } finally {
    mkdirLoading.value = false
  }
}

function handleUploadClick() {
  fileInputRef.value?.click()
}

function onFileInputChange() {
  const input = fileInputRef.value
  if (input?.files?.length) {
    uploadFiles(Array.from(input.files))
    input.value = ''
  }
}

async function uploadFiles(fileList: File[]) {
  const { commonApi } = await import('@/api/common')
  for (const file of fileList) {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const { data } = await commonApi.fileUpload(props.currentGroupKey, formData)
      if (data.code === 200 && props.currentPrefix) {
        await ossBrowseApi.move({
          fileIds: [data.data.fileId],
          targetGroupKey: props.currentGroupKey,
          targetPrefix: props.currentPrefix
        })
      }
    } catch {
      // upload errors are silently skipped; notify is handled by axios meta
    }
  }
  emit('uploadComplete')
}
</script>

<template>
  <div class="toolbar">
    <div class="toolbar__nav">
      <n-button quaternary size="small" :disabled="!canGoBack" @click="emit('navigateBack')">
        <template #icon>
          <n-icon>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </n-icon>
        </template>
      </n-button>
      <n-button quaternary size="small" :disabled="!canGoForward" @click="emit('navigateForward')">
        <template #icon>
          <n-icon>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          </n-icon>
        </template>
      </n-button>
    </div>

    <n-breadcrumb class="toolbar__breadcrumb">
      <n-breadcrumb-item @click="emit('breadcrumbClick', -1)">
        {{ groupName || '根目录' }}
      </n-breadcrumb-item>
      <n-breadcrumb-item
        v-for="(segment, idx) in breadcrumb"
        :key="idx"
        @click="emit('breadcrumbClick', idx)"
      >
        {{ segment }}
      </n-breadcrumb-item>
    </n-breadcrumb>

    <div class="toolbar__spacer" />

    <n-button-group size="small">
      <n-button
        :type="viewMode === 'list' ? 'primary' : 'default'"
        quaternary
        @click="emit('update:viewMode', 'list')"
      >
        ☰
      </n-button>
      <n-button
        :type="viewMode === 'grid' ? 'primary' : 'default'"
        quaternary
        @click="emit('update:viewMode', 'grid')"
      >
        ⊞
      </n-button>
    </n-button-group>

    <n-dropdown
      trigger="click"
      :options="sortOptions.map(o => ({
        label: o.label + (sortBy === o.value ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : ''),
        key: o.value
      }))"
      @select="handleSortSelect"
    >
      <n-button size="small">排序</n-button>
    </n-dropdown>

    <n-input
      v-model:value="searchKeyword"
      size="small"
      placeholder="搜索文件..."
      clearable
      style="width: 160px"
      @keyup.enter="handleSearch"
      @clear="clearSearch"
    />

    <n-button
      size="small"
      :disabled="!currentGroupKey"
      @click="mkdirVisible = true"
    >
      新建文件夹
    </n-button>

    <n-button
      type="primary"
      size="small"
      :disabled="!currentGroupKey"
      @click="handleUploadClick"
    >
      上传
    </n-button>

    <n-modal
      v-model:show="mkdirVisible"
      preset="dialog"
      title="新建文件夹"
      positive-text="创建"
      negative-text="取消"
      :loading="mkdirLoading"
      @positive-click="handleMkdir"
    >
      <n-input
        v-model:value="mkdirName"
        placeholder="请输入文件夹名称"
        @keyup.enter="handleMkdir"
      />
    </n-modal>

    <!-- hidden file input for upload -->
    <input
      ref="fileInputRef"
      type="file"
      multiple
      style="display: none"
      @change="onFileInputChange"
    />
  </div>
</template>

<style lang="scss" scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--n-border-color);
  flex-shrink: 0;

  &__nav {
    display: flex;
    gap: 2px;
  }

  &__breadcrumb {
    flex-shrink: 1;
    overflow: hidden;
  }

  &__spacer {
    flex: 1;
  }
}
</style>
