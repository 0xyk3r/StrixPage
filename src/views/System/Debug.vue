<template>
  <div>
    <n-h3 prefix="bar" align-text type="success">
      <n-text type="success">Debug</n-text>
    </n-h3>
    {{ dictStatus }}
  </div>
</template>
<script setup>
import { useDictsStore } from '@/stores/dicts';
import { onMounted, ref } from 'vue';

// const { proxy } = getCurrentInstance()
const dictsStore = useDictsStore()

const dictStatus = ref([])
onMounted(() => {
  setTimeout(() => {
    dictsStore.getDictData('DictStatus', dictStatus)
  }, 2000)
})

</script>
<script>
export default {
  name: 'DebugPage'
}
</script>
<style lang="scss" scoped></style>