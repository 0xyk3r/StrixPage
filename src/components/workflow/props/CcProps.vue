<template>
  <n-form :model="cacheProps">
    <n-form-item label="抄送对象类型">
      <n-radio-group v-model:value="cacheProps.assign.type">
        <n-space>
          <n-radio v-for="item in assignTypes" :key="item.value" :value="item.value">
            {{ item.label }}
          </n-radio>
        </n-space>
      </n-radio-group>
    </n-form-item>
    <n-form-item
      v-if="cacheProps.assign.type === 'USER' || cacheProps.assign.type === 'ROLE'"
      label="抄送对象选择"
    >
      <n-button v-if="cacheProps.assign.type === 'USER'" type="primary" @click="openSelectUser">
        选择人员
      </n-button>
      <n-button v-if="cacheProps.assign.type === 'ROLE'" type="primary" @click="openSelectRole">
        选择角色
      </n-button>
    </n-form-item>
    <n-form-item label="允许发起人添加抄送对象">
      <n-radio-group v-model:value="cacheProps.allowAdd">
        <n-space>
          <n-radio v-for="(item, index) in ccAllowAddItems" :key="index" :value="item.value">
            {{ item.label }}
          </n-radio>
        </n-space>
      </n-radio-group>
    </n-form-item>
  </n-form>
</template>
<script setup lang="ts">
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
const openSelectUser = () => {
  console.log('openSelectUser')
}
const openSelectRole = () => {
  console.log('openSelectRole')
}
</script>
<style lang="scss" scoped></style>
