<template>
  <div>
    <n-grid x-gap="24" :cols="2">
      <n-gi>CacheList</n-gi>
    </n-grid>
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
  name: 'SystemMonitorCacheList'
}
</script>
<style lang="scss" scoped></style>