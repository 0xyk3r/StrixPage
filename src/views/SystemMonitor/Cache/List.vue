<template>
  <div>
    <n-grid x-gap="24" :cols="2">
      <n-gi>CacheList</n-gi>
    </n-grid>
  </div>
</template>
<script setup>
import { useDictsStore } from '@/stores/dicts';
import { onMounted } from 'vue';

// const { proxy } = getCurrentInstance()
const dictsStore = useDictsStore()

onMounted(() => {
  dictsStore.getDictData('test1').then(res => {
    console.log(res)
  })
})

</script>
<script>
export default {
  name: 'SystemMonitorCacheList'
}
</script>
<style lang="scss" scoped></style>