<template>
  <n-modal v-model:show="show" preset="card" title="克隆字典" style="width: 440px">
    <n-form ref="formRef" :model="form" :rules="rules" label-placement="left" label-width="80">
      <n-form-item label="源字典">
        <n-text>{{ sourceDictKey }}</n-text>
      </n-form-item>
      <n-form-item label="新键名" path="newKey">
        <n-input v-model:value="form.newKey" maxlength="64" placeholder="字典键名（英文标识）" />
      </n-form-item>
      <n-form-item label="新名称" path="newName">
        <n-input v-model:value="form.newName" maxlength="64" placeholder="字典名称（中文描述）" />
      </n-form-item>
    </n-form>
    <template #footer>
      <n-flex justify="end">
        <n-button @click="show = false">取消</n-button>
        <n-button type="primary" :loading="saving" @click="handleClone">克隆</n-button>
      </n-flex>
    </template>
  </n-modal>
</template>

<script lang="ts" setup>
import { dictApi } from '@/api/dict'
import { textField } from '@/utils/form-rules'
import type { FormInst } from 'naive-ui'

const props = defineProps<{ sourceDictKey: string }>()
const show = defineModel<boolean>('show', { default: false })
const emit = defineEmits<{ success: [] }>()

const formRef = ref<FormInst | null>(null)
const saving = ref(false)
const form = ref({ newKey: '', newName: '' })

const rules = {
  newKey: textField('新键名'),
  newName: textField('新名称')
}

async function handleClone() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  try {
    saving.value = true
    await dictApi.clone(props.sourceDictKey, form.value)
    show.value = false
    emit('success')
  } finally {
    saving.value = false
  }
}

watch(show, (val) => {
  if (val) {
    form.value = { newKey: '', newName: '' }
  }
})
</script>
