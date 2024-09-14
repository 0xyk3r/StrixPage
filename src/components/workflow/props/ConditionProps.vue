<template>
  <n-form :model="cacheProps">
    <n-form-item label="条件组之间的关系">
      <n-switch
        v-model:value="cacheProps.type"
        :round="false"
        checked-value="AND"
        unchecked-value="OR"
      >
        <template #checked> 且 </template>
        <template #unchecked> 或 </template>
      </n-switch>
    </n-form-item>
    <n-space vertical>
      <n-button @click="addConditionGroup">添加条件组</n-button>
      <n-card
        v-for="(item, index) in cacheProps.groups"
        :key="index"
        :title="'条件组 - ' + (index + 1)"
      >
        <template #header-extra>
          <n-space :size="5">
            <n-switch
              v-model:value="item.type"
              :round="false"
              checked-value="AND"
              unchecked-value="OR"
            >
              <template #checked> 且 </template>
              <template #unchecked> 或 </template>
            </n-switch>
            <n-button type="info" size="tiny" @click="addCondition(item)">添加条件</n-button>
            <n-button type="error" size="tiny" @click="cacheProps.groups.splice(index, 1)"
              >删除条件组</n-button
            >
          </n-space>
        </template>
        <n-space vertical>
          <n-input-group v-for="(cItem, cIndex) in item.conditions" :key="cIndex">
            <n-input v-model:value="cItem.field" :style="{ width: '33%' }" placeholder="字段" />
            <n-select
              v-model:value="cItem.operator"
              :options="operatorOptions"
              :style="{ width: '33%' }"
            />
            <n-input v-model:value="cItem.value" :style="{ width: '33%' }" placeholder="值" />
          </n-input-group>
        </n-space>
      </n-card>
    </n-space>
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

const addConditionGroup = () => {
  cacheProps.value.groups.push({
    type: 'AND',
    conditions: []
  })
}
const addCondition = (group: any) => {
  console.log(group)
  group.conditions.push({
    field: '',
    operator: 'EQ',
    value: ''
  })
}
const operatorOptions = [
  { label: '等于', value: 'EQ' },
  { label: '不等于', value: 'NEQ' },
  { label: '大于', value: 'GT' },
  { label: '大于等于', value: 'GTE' },
  { label: '小于', value: 'LT' },
  { label: '小于等于', value: 'LTE' },
  { label: '包含', value: 'IN' },
  { label: '不包含', value: 'NIN' }
]
</script>
<style lang="scss" scoped></style>
