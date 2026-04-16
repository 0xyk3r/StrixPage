<template>
  <div class="dict-group-tree">
    <n-space vertical :size="8">
      <n-space justify="space-between" align="center">
        <n-text strong style="font-size: 14px">字典分组</n-text>
        <n-button v-auth="'system:dict:update'" quaternary size="small" @click="handleAdd">
          <template #icon><strix-icon icon="plus" :size="14" /></template>
        </n-button>
      </n-space>

      <n-spin :show="loading">
        <n-menu
          :value="selectedKey"
          :options="menuOptions"
          :root-indent="12"
          @update:value="handleSelect"
        />
      </n-spin>
    </n-space>

    <!-- 分组编辑弹窗 -->
    <n-modal v-model:show="showEditModal" preset="card" :title="editForm.id ? '编辑分组' : '新增分组'" style="width: 400px">
      <n-form ref="formRef" :model="editForm" :rules="formRules" label-placement="left" label-width="60">
        <n-form-item label="名称" path="name">
          <n-input v-model:value="editForm.name" maxlength="32" placeholder="分组名称" />
        </n-form-item>
        <n-form-item label="图标" path="icon">
          <n-input v-model:value="editForm.icon" placeholder="图标名称（可选）" />
        </n-form-item>
        <n-form-item label="排序" path="sortValue">
          <n-input-number v-model:value="editForm.sortValue" :min="0" :max="999" style="width: 100%" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-flex justify="end">
          <n-button @click="showEditModal = false">取消</n-button>
          <n-button type="primary" :loading="saving" @click="handleSave">保存</n-button>
        </n-flex>
      </template>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import { dictGroupApi } from '@/api/dict-group'
import type { DictGroupItem } from '@/api/dict-group'
import { textField } from '@/utils/form-rules'
import type { FormInst, MenuOption } from 'naive-ui'

const props = defineProps<{
  selectedGroupId: string | null
}>()

const emit = defineEmits<{
  'update:selectedGroupId': [value: string | null]
}>()

const dialog = useDialog()

const loading = ref(false)
const groups = ref<DictGroupItem[]>([])
const showEditModal = ref(false)
const saving = ref(false)
const formRef = ref<FormInst | null>(null)

const editForm = ref({
  id: '' as string,
  name: '',
  icon: '',
  sortValue: 0
})

const formRules = {
  name: textField('分组名称')
}

const selectedKey = computed(() => {
  if (props.selectedGroupId === null) return '__all__'
  if (props.selectedGroupId === '') return '__ungrouped__'
  return props.selectedGroupId
})

const menuOptions = computed<MenuOption[]>(() => {
  const items: MenuOption[] = [
    { key: '__all__', label: '全部字典' }
  ]

  for (const g of groups.value) {
    items.push({
      key: g.id,
      label: g.name + (g.dictCount > 0 ? ` (${g.dictCount})` : ''),
      extra: g.id
    })
  }

  items.push({ key: '__ungrouped__', label: '未分组' })

  return items
})

function handleSelect(key: string) {
  if (key === '__all__') emit('update:selectedGroupId', null)
  else if (key === '__ungrouped__') emit('update:selectedGroupId', '')
  else emit('update:selectedGroupId', key)
}

async function loadGroups() {
  try {
    loading.value = true
    const { data: res } = await dictGroupApi.list()
    groups.value = res.data?.items ?? []
  } catch (e) {
    console.error('加载字典分组失败', e)
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  editForm.value = { id: '', name: '', icon: '', sortValue: 0 }
  showEditModal.value = true
}

function handleEdit(group: DictGroupItem) {
  editForm.value = {
    id: group.id,
    name: group.name,
    icon: group.icon ?? '',
    sortValue: group.sortValue
  }
  showEditModal.value = true
}

function handleDelete(group: DictGroupItem) {
  dialog.warning({
    title: '删除确认',
    content: `确定删除分组「${group.name}」吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      await dictGroupApi.remove(group.id)
      await loadGroups()
      if (props.selectedGroupId === group.id) {
        emit('update:selectedGroupId', null)
      }
    }
  })
}

async function handleSave() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  try {
    saving.value = true
    const data = { name: editForm.value.name, icon: editForm.value.icon || undefined, sortValue: editForm.value.sortValue }
    if (editForm.value.id) {
      await dictGroupApi.update(editForm.value.id, data)
    } else {
      await dictGroupApi.add(data)
    }
    showEditModal.value = false
    await loadGroups()
  } finally {
    saving.value = false
  }
}

defineExpose({ loadGroups, handleEdit, handleDelete })

onMounted(() => loadGroups())
</script>

<style lang="scss" scoped>
.dict-group-tree {
  padding: 8px;
}
</style>
