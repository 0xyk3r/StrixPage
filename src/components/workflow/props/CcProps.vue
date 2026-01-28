<template>
  <div>
    <n-form :model="cacheProps">
      <n-form-item label="抄送对象类型">
        <n-radio-group v-model:value="cacheProps.assign.type">
          <n-flex>
            <n-radio v-for="item in assignTypes" :key="item.value" :value="item.value">
              {{ item.label }}
            </n-radio>
          </n-flex>
        </n-radio-group>
      </n-form-item>
      <n-form-item v-if="cacheProps.assign.type === 'USER' || cacheProps.assign.type === 'ROLE'" label="抄送对象选择">
        <n-button v-if="cacheProps.assign.type === 'USER'" type="primary" @click="openUserSelector">
          选择人员
        </n-button>
        <n-button v-if="cacheProps.assign.type === 'ROLE'" type="primary" @click="openRoleSelector">
          选择角色
        </n-button>
      </n-form-item>
      <n-form-item label="允许发起人添加抄送对象">
        <n-radio-group v-model:value="cacheProps.allowAdd">
          <n-flex>
            <n-radio v-for="(item, index) in ccAllowAddItems" :key="index" :value="item.value">
              {{ item.label }}
            </n-radio>
          </n-flex>
        </n-radio-group>
      </n-form-item>
    </n-form>
    <strix-manager-selector
      v-model:show="showUserSelector"
      :value="cacheProps.assign.id"
      @complete="handleSelectUserComplete"
    />
    <strix-role-selector
      v-model:show="showRoleSelector"
      :value="cacheProps.assign.id"
      @complete="handleSelectRoleComplete"
    />
    {{ cacheProps }}
  </div>
</template>
<script lang="ts" setup>
import StrixManagerSelector from '@/components/data/StrixManagerSelector.vue'
import StrixRoleSelector from '@/components/data/StrixRoleSelector.vue'

const $props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

// const $emit = defineEmits(['updateModelValue'])

const cacheProps = ref($props.modelValue)

const assignTypes = [
  { label: '指定人员', value: 'USER' },
  { label: '指定角色', value: 'ROLE' }
]
const ccAllowAddItems = [
  { label: '允许', value: true },
  { label: '不允许', value: false }
]

// 监听抄送对象类型变化 清空选择的人员或角色
watch(
  () => cacheProps.value.assign.type,
  () => {
    cacheProps.value.assign.id = []
  }
)

// 选择人员
const showUserSelector = ref(false)
const openUserSelector = () => {
  showUserSelector.value = true
}
const handleSelectUserComplete = (data: Array<string | number>) => {
  cacheProps.value.assign.id = data
  showUserSelector.value = false
}

// 选择角色
const showRoleSelector = ref(false)
const openRoleSelector = () => {
  showRoleSelector.value = true
}
const handleSelectRoleComplete = (data: Array<string | number>) => {
  cacheProps.value.assign.id = data
  showRoleSelector.value = false
}
</script>
<style lang="scss" scoped></style>
