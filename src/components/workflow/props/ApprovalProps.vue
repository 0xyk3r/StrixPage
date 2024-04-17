<template>
  <n-form :model="cacheProps">
    <n-form-item label="审批对象类型">
      <n-radio-group v-model:value="cacheProps.assign.type">
        <n-space>
          <n-radio v-for="item in assignTypes" :key="item.value" :value="item.value">
            {{ item.label }}
          </n-radio>
        </n-space>
      </n-radio-group>
    </n-form-item>
    <n-form-item v-if="cacheProps.assign.type === 'USER' || cacheProps.assign.type === 'ROLE'" label="审批对象选择">
      <n-button v-if="cacheProps.assign.type === 'USER'" type="primary" @click="openSelectUser"> 选择人员 </n-button>
      <n-button v-if="cacheProps.assign.type === 'ROLE'" type="primary" @click="openSelectRole"> 选择角色 </n-button>
    </n-form-item>
    <n-form-item v-if="cacheProps.assign.type === 'USER' || cacheProps.assign.type === 'ROLE'" label="审批模式">
      <n-radio-group v-model:value="cacheProps.assign.mode">
        <n-space vertical>
          <n-radio v-for="item in assignModes" :key="item.value" :value="item.value">
            {{ item.label }}
          </n-radio>
        </n-space>
      </n-radio-group>
    </n-form-item>
    <n-form-item v-if="cacheProps.assign.type !== 'AUTOREJECT'" label="审批期限 (0则不限时)">
      <n-input-group>
        <n-input-number v-model:value="cacheProps.timeLimit.value" :min="0" :style="{ width: '75%' }" clearable />
        <n-select v-model:value="cacheProps.timeLimit.unit" :style="{ width: '25%' }" :options="timeUnits" />
      </n-input-group>
    </n-form-item>
    <n-form-item
      v-if="cacheProps.assign.type !== 'AUTOREJECT' && cacheProps.timeLimit.value > 0"
      label="审批超时自动操作"
    >
      <n-radio-group v-model:value="cacheProps.timeLimit.handler">
        <n-space vertical>
          <n-radio v-for="item in timeLimitHandler" :key="item.value" :value="item.value">
            {{ item.label }}
          </n-radio>
        </n-space>
      </n-radio-group>
    </n-form-item>
    <n-form-item label="审批驳回自动操作">
      <n-radio-group v-model:value="cacheProps.reject.type">
        <n-space vertical>
          <n-radio v-for="item in rejectTypes" :key="item.value" :value="item.value">
            {{ item.label }}
          </n-radio>
        </n-space>
      </n-radio-group>
    </n-form-item>
    <n-form-item v-if="cacheProps.reject.type === 'NODE'" label="审批驳回回退节点">
      <n-select />
    </n-form-item>
  </n-form>
</template>
<script setup>
import { ref } from 'vue'

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
  { label: '指定角色', value: 'ROLE' },
  { label: '发起人自选', value: 'SELECT' },
  { label: '发起人自己', value: 'SELF' },
  { label: '系统自动拒绝', value: 'AUTOREJECT' }
]
const assignModes = [
  { label: '或签 (任意一人同意即可)', value: 'ANY' },
  { label: '会签 (允许同时审批, 所有人都需要同意)', value: 'ALL' },
  { label: '会签 (按选择顺序审批, 所有人都需要同意)', value: 'SEQ' }
]
const timeUnits = [
  { label: '分钟', value: 'MINUTE' },
  { label: '小时', value: 'HOUR' },
  { label: '天', value: 'DAY' }
]
const timeLimitHandler = [
  { label: '发送通知', value: 'NOTIFY' },
  { label: '自动通过', value: 'AUTOPASS' },
  { label: '自动驳回', value: 'AUTOREJECT' }
]
const rejectTypes = [
  { label: '结束流程', value: 'END' },
  { label: '返回上一节点', value: 'BACK' },
  { label: '返回指定节点', value: 'NODE' }
]
const openSelectUser = () => {
  console.log('openSelectUser')
}
const openSelectRole = () => {
  console.log('openSelectRole')
}
</script>
<style lang="scss" scoped></style>
