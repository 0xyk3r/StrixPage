<template>
  <n-modal
    v-model:show="show"
    class="strix-form-modal"
    preset="card"
    size="huge"
    title="系统角色选择"
    @after-leave="closeModal"
  >
    <n-transfer
      :default-value="value"
      :options="data"
      source-filterable
      target-filterable
      @update:value="handleUpdate"
    />
    <template #footer>
      <n-flex justify="end">
        <n-button @click="closeModal">取消</n-button>
        <n-button type="primary" @click="handleComplete"> 确定</n-button>
      </n-flex>
    </template>
  </n-modal>
</template>

<script lang="ts" setup>
import { http } from '@/plugins/axios.ts'

const show = defineModel('show', { type: Boolean, default: false })

const { value } = defineProps({
  value: { type: Array<string | number>, default: () => [] }
})

const emit = defineEmits<{
  (e: 'complete', data: Array<string | number>): void
  (e: 'close'): void
}>()

const data = ref([])
const dataLoading = ref(true)
const selectedData = ref<Array<string | number>>([])

// 每次打开弹窗时，将传入的值赋值给 selectedData
watch(
  () => show.value,
  (newVal) => {
    if (newVal) {
      selectedData.value = value
    }
  }
)

onMounted(() => {
  http
    .get('system/role/transfer', {
      meta: { operate: '加载系统角色穿梭框数据' }
    })
    .then(({ data: res }) => {
      dataLoading.value = false
      data.value = res.data.transferData
      console.log(data.value)
    })
})

// 更新穿梭框选中的数据
const handleUpdate = (value: Array<string | number>) => {
  selectedData.value = value
}

// 确定选择，触发 complete 事件后关闭模态框
const handleComplete = () => {
  emit('complete', selectedData.value)
  closeModal()
}

const closeModal = () => {
  show.value = false
  emit('close')
}
</script>

<style lang="scss" scoped></style>
