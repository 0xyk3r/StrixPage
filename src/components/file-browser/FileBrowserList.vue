<script lang="ts" setup>
import type { BrowseFileItem, DirectoryItem } from '@/api/oss-browse'
import { formatFileSize } from '@/utils/strix-file-util'
import type { DataTableColumns } from 'naive-ui'

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

type ListRow = {
  key: string
  isDirectory: boolean
  name: string
  size: number | null
  ext: string
  createdTime: string
  createdBy: string
  raw: BrowseFileItem | DirectoryItem
}

const rows = computed<ListRow[]>(() => {
  const dirRows: ListRow[] = props.directories.map((d) => ({
    key: 'dir-' + d.name,
    isDirectory: true,
    name: d.name,
    size: null,
    ext: '',
    createdTime: '',
    createdBy: '',
    raw: d
  }))
  const fileRows: ListRow[] = props.files.map((f) => ({
    key: f.id,
    isDirectory: false,
    name: f.originalName || '未命名',
    size: f.size,
    ext: f.ext,
    createdTime: f.createdTime,
    createdBy: f.createdBy,
    raw: f
  }))
  return [...dirRows, ...fileRows]
})

const checkedRowKeys = computed(() => Array.from(props.selectedFiles))

function handleCheck(keys: Array<string | number>) {
  emit('update:selectedFiles', new Set(keys.map(String).filter((k) => !k.startsWith('dir-'))))
}

const columns: DataTableColumns<ListRow> = [
  {
    type: 'selection',
    disabled: (row) => row.isDirectory
  },
  {
    title: '名称',
    key: 'name',
    render: (row) => {
      const icon = row.isDirectory ? '📁 ' : ''
      return h('span', { style: { cursor: 'pointer' } }, icon + row.name)
    }
  },
  {
    title: '大小',
    key: 'size',
    width: 100,
    render: (row) => (row.size != null ? formatFileSize(row.size) : '—')
  },
  {
    title: '类型',
    key: 'ext',
    width: 80,
    render: (row) => (row.isDirectory ? '文件夹' : row.ext || '—')
  },
  {
    title: '上传时间',
    key: 'createdTime',
    width: 170,
    render: (row) => row.createdTime || '—'
  }
]

function handleRowProps(row: ListRow) {
  return {
    style: 'cursor: pointer',
    onDblclick: () => emit('itemDoubleClick', row.raw),
    onContextmenu: (event: MouseEvent) => {
      event.preventDefault()
      if (row.isDirectory) {
        emit('contextMenu', event, row.raw, 'directory')
      } else if (props.selectedFiles.size > 1 && props.selectedFiles.has(row.key)) {
        emit('contextMenu', event, row.raw as BrowseFileItem, 'multi')
      } else {
        emit('update:selectedFiles', new Set([row.key]))
        emit('contextMenu', event, row.raw as BrowseFileItem, 'file')
      }
    }
  }
}
</script>

<template>
  <div class="list-container" @contextmenu.self.prevent="emit('contextMenu', $event, null, 'blank')">
    <n-data-table
      :columns="columns"
      :data="rows"
      :row-key="(row: ListRow) => row.key"
      :checked-row-keys="checkedRowKeys"
      :loading="loading"
      :row-props="handleRowProps"
      size="small"
      flex-height
      style="height: 100%"
      @update:checked-row-keys="handleCheck"
    />
  </div>
</template>

<style lang="scss" scoped>
.list-container {
  flex: 1;
  overflow: hidden;
  padding: 0 4px;
}
</style>
