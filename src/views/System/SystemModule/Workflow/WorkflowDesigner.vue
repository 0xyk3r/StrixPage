<template>
  <div class="wf-designer">
    <!-- Toolbar -->
    <div class="wf-designer__toolbar">
      <div class="wf-designer__toolbar-left">
        <n-button quaternary @click="router.back()">
          <template #icon><ArrowLeft :size="16" /></template>
          返回
        </n-button>
        <n-divider vertical />
        <span class="wf-designer__title">{{ store.currentDefinition?.name || '流程设计器' }}</span>
        <n-tag v-if="store.isDirty" size="small" type="warning">未保存</n-tag>
      </div>
      <div class="wf-designer__toolbar-right">
        <n-button quaternary :disabled="!store.canUndo" @click="store.undo()">
          <template #icon><Undo :size="16" /></template>
          撤销
        </n-button>
        <n-button quaternary :disabled="!store.canRedo" @click="store.redo()">
          <template #icon><Redo :size="16" /></template>
          重做
        </n-button>
        <n-divider vertical />
        <n-button type="primary" ghost @click="handleSave">
          <template #icon><Save :size="16" /></template>
          保存
        </n-button>
        <n-button type="primary" @click="handlePublish">
          <template #icon><Upload :size="16" /></template>
          发布
        </n-button>
      </div>
    </div>

    <!-- Main content -->
    <div class="wf-designer__content">
      <designer-canvas :readonly="false" />
      <node-config-drawer />
    </div>

    <!-- Save dialog -->
    <n-modal v-model:show="showSaveDialog" preset="dialog" title="保存版本">
      <n-form-item label="变更说明">
        <n-input v-model:value="changeLog" type="textarea" :rows="3" placeholder="请输入变更说明（可选）" />
      </n-form-item>
      <template #action>
        <n-button @click="showSaveDialog = false">取消</n-button>
        <n-button type="primary" :loading="saving" @click="confirmSave">确定</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWorkflowStore } from '@/stores/workflow'
import { useMessage, useDialog } from 'naive-ui'
import DesignerCanvas from './components/designer/DesignerCanvas.vue'
import NodeConfigDrawer from './components/config/NodeConfigDrawer.vue'
import { ArrowLeft, Undo, Redo, Save, Upload } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const store = useWorkflowStore()
const message = useMessage()
const dialog = useDialog()

const showSaveDialog = ref(false)
const changeLog = ref('')
const saving = ref(false)

onMounted(async () => {
  const definitionId = route.params.definitionId as string
  if (definitionId) {
    await store.loadDefinition(definitionId)
  }
})

onBeforeUnmount(() => {
  store.resetDesigner()
})

function handleSave() {
  showSaveDialog.value = true
  changeLog.value = ''
}

async function confirmSave() {
  saving.value = true
  try {
    await store.saveVersion(changeLog.value || undefined)
    message.success('保存成功')
    showSaveDialog.value = false
  } catch (e: any) {
    message.error('保存失败: ' + (e.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

async function handlePublish() {
  if (store.isDirty) {
    message.warning('请先保存当前更改')
    return
  }
  dialog.warning({
    title: '确认发布',
    content: '发布后新发起的流程将使用此版本，是否继续？',
    positiveText: '发布',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await store.publishVersion()
        message.success('发布成功')
      } catch (e: any) {
        message.error('发布失败: ' + (e.message || '未知错误'))
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.wf-designer {
  display: flex;
  flex-direction: column;
  height: 100%;

  &__toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background: #fff;
    border-bottom: 1px solid #e4e7ed;
    flex-shrink: 0;

    &-left, &-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
  }

  &__content {
    flex: 1;
    overflow: auto;
    display: flex;
    justify-content: center;
    padding: 20px;
    background: #f7f8fa;
  }
}
</style>
