<template>
  <n-form label-placement="left" label-width="auto">
    <n-form-item label="节点名称">
      <n-input v-model:value="localName" @update:value="emitUpdate" />
    </n-form-item>

    <n-form-item label="逻辑关系">
      <n-radio-group v-model:value="logicOperator" @update:value="emitUpdate">
        <n-radio-button value="AND">全部满足 (AND)</n-radio-button>
        <n-radio-button value="OR">任一满足 (OR)</n-radio-button>
      </n-radio-group>
    </n-form-item>

    <n-divider>条件规则</n-divider>

    <div v-for="(rule, idx) in rules" :key="idx" class="condition-rule">
      <n-grid :cols="12" :x-gap="8">
        <n-gi :span="4">
          <n-input v-model:value="rule.field" placeholder="字段" @update:value="emitUpdate" />
        </n-gi>
        <n-gi :span="3">
          <n-select
            v-model:value="rule.operator"
            :options="operatorOptions"
            placeholder="运算符"
            @update:value="emitUpdate"
          />
        </n-gi>
        <n-gi :span="4">
          <n-input v-model:value="rule.value" placeholder="值" @update:value="emitUpdate" />
        </n-gi>
        <n-gi :span="1">
          <n-button text type="error" @click="removeRule(idx)">
            <template #icon><Trash2 :size="14" /></template>
          </n-button>
        </n-gi>
      </n-grid>
    </div>

    <n-button size="small" dashed block @click="addRule">+ 添加条件</n-button>
  </n-form>
</template>

<script lang="ts" setup>
import { ref, reactive, watch } from "vue";
import type { DesignerTreeNode } from "@/api/workflow";
import { Trash2 } from "lucide-vue-next";

const props = defineProps<{ node: DesignerTreeNode }>();
const emit = defineEmits<{ update: [config: Record<string, any>, name: string] }>();

const localName = ref(props.node.name);
const logicOperator = ref(props.node.config.logicOperator || "AND");
const rules = reactive<Array<{ field: string; operator: string; value: string }>>(
  props.node.config.rules || [],
);

const operatorOptions = [
  { label: "等于", value: "EQ" },
  { label: "不等于", value: "NEQ" },
  { label: "大于", value: "GT" },
  { label: "大于等于", value: "GTE" },
  { label: "小于", value: "LT" },
  { label: "小于等于", value: "LTE" },
  { label: "包含", value: "CONTAINS" },
  { label: "不包含", value: "NOT_CONTAINS" },
];

watch(
  () => props.node.id,
  () => {
    localName.value = props.node.name;
    logicOperator.value = props.node.config.logicOperator || "AND";
    rules.splice(0, rules.length, ...(props.node.config.rules || []));
  },
);

function addRule() {
  rules.push({ field: "", operator: "EQ", value: "" });
  emitUpdate();
}

function removeRule(idx: number) {
  rules.splice(idx, 1);
  emitUpdate();
}

function emitUpdate() {
  emit("update", { logicOperator: logicOperator.value, rules: [...rules] }, localName.value);
}
</script>

<style lang="scss" scoped>
.condition-rule {
  margin-bottom: 8px;
}
</style>
