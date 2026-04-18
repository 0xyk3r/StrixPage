<script lang="ts" setup>
import type { BrowseFileItem, DirectoryItem } from '@/api/oss-browse'
import { ossBrowseApi } from '@/api/oss-browse'
import { commonApi } from '@/api/common'
import { downloadBlob } from '@/utils/strix-file-util'

const props = defineProps<{
  visible: boolean
  x: number
  y: number
  target: BrowseFileItem | DirectoryItem | null
  type: 'file' | 'directory' | 'blank' | 'multi'
  selectedFiles: Set<string>
  currentGroupKey: string
  currentPrefix: string
  files: BrowseFileItem[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  refresh: []
  preview: [file: BrowseFileItem]
}>()

const dialog = useDialog()
const renameVisible = ref(false)
const renameValue = ref('')
const moveVisible = ref(false)
const moveTargetPrefix = ref('')

const fileMenuOptions = computed(() => [
  { label: '预览', key: 'preview' },
  { label: '下载', key: 'download' },
  { type: 'divider', key: 'd1' },
  { label: '重命名', key: 'rename' },
  { label: '移动到...', key: 'move' },
  { label: '复制到...', key: 'copy' },
  { type: 'divider', key: 'd2' },
  { label: '删除', key: 'delete' }
])

const dirMenuOptions = computed(() => [
  { label: '打开', key: 'open' },
  { label: '重命名', key: 'rename-dir' },
  { type: 'divider', key: 'd1' },
  { label: '删除', key: 'delete-dir' }
])

const blankMenuOptions = computed(() => [
  { label: '新建文件夹', key: 'mkdir' },
  { label: '上传文件', key: 'upload' },
  { type: 'divider', key: 'd1' },
  { label: '刷新', key: 'refresh' }
])

const multiMenuOptions = computed(() => [
  { label: `批量移动 (${props.selectedFiles.size} 项)`, key: 'batch-move' },
  { label: `批量删除 (${props.selectedFiles.size} 项)`, key: 'batch-delete' }
])

const menuOptions = computed(() => {
  switch (props.type) {
    case 'file': return fileMenuOptions.value
    case 'directory': return dirMenuOptions.value
    case 'multi': return multiMenuOptions.value
    default: return blankMenuOptions.value
  }
})

function close() {
  emit('update:visible', false)
}

async function handleSelect(key: string) {
  close()
  const file = props.target && 'id' in props.target ? props.target as BrowseFileItem : null

  switch (key) {
    case 'preview':
      if (file) emit('preview', file)
      break

    case 'download':
      if (file) {
        const res = await commonApi.fileDownload(file.id)
        downloadBlob(res, file.originalName || 'file')
      }
      break

    case 'rename':
      if (file) {
        renameValue.value = file.originalName || ''
        renameVisible.value = true
      }
      break

    case 'move':
    case 'batch-move':
      moveTargetPrefix.value = ''
      moveVisible.value = true
      break

    case 'copy':
      if (file) {
        await ossBrowseApi.copy({
          fileIds: [file.id],
          targetGroupKey: props.currentGroupKey,
          targetPrefix: props.currentPrefix
        })
        emit('refresh')
      }
      break

    case 'delete':
      if (file) {
        dialog.warning({
          title: '确认删除',
          content: `确定要删除 "${file.originalName}" 吗？`,
          positiveText: '删除',
          negativeText: '取消',
          onPositiveClick: async () => {
            await ossBrowseApi.batchRemove({ fileIds: [file.id] })
            emit('refresh')
          }
        })
      }
      break

    case 'batch-delete':
      dialog.warning({
        title: '确认批量删除',
        content: `确定要删除选中的 ${props.selectedFiles.size} 个文件吗？`,
        positiveText: '删除',
        negativeText: '取消',
        onPositiveClick: async () => {
          await ossBrowseApi.batchRemove({ fileIds: Array.from(props.selectedFiles) })
          emit('refresh')
        }
      })
      break

    case 'refresh':
      emit('refresh')
      break
  }
}

async function handleRename() {
  const file = props.target as BrowseFileItem
  if (!file?.id || !renameValue.value.trim()) return
  await ossBrowseApi.rename({ fileId: file.id, newName: renameValue.value.trim() })
  renameVisible.value = false
  emit('refresh')
}

async function handleMove() {
  const ids = props.type === 'multi'
    ? Array.from(props.selectedFiles)
    : props.target && 'id' in props.target ? [(props.target as BrowseFileItem).id] : []
  if (ids.length === 0) return
  await ossBrowseApi.move({
    fileIds: ids,
    targetGroupKey: props.currentGroupKey,
    targetPrefix: moveTargetPrefix.value
  })
  moveVisible.value = false
  emit('refresh')
}
</script>

<template>
  <n-dropdown
    :show="visible"
    :x="x"
    :y="y"
    :options="menuOptions"
    trigger="manual"
    placement="bottom-start"
    @clickoutside="close"
    @select="handleSelect"
  />

  <n-modal v-model:show="renameVisible" preset="dialog" title="重命名" positive-text="确定" negative-text="取消" @positive-click="handleRename">
    <n-input v-model:value="renameValue" placeholder="请输入新名称" @keyup.enter="handleRename" />
  </n-modal>

  <n-modal v-model:show="moveVisible" preset="dialog" title="移动到" positive-text="移动" negative-text="取消" @positive-click="handleMove">
    <n-input v-model:value="moveTargetPrefix" placeholder="目标路径前缀 (如 2025/March/)" />
  </n-modal>
</template>
