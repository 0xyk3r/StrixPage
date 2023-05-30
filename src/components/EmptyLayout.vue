<template>
  <router-view v-slot="{ Component, route }">
    <keep-alive :include="cachedRoutes">
      <component :is="Component" :key="route.fullPath" />
    </keep-alive>
  </router-view>
</template>
<script>
import { useTabsBarStore } from '@/stores/tabs-bar'
import { computed, defineComponent } from 'vue'

export default defineComponent({
  name: 'EmptyLayout',
  setup() {
    const tabsBarStore = useTabsBarStore()
    const visitedRoutes = computed(() => tabsBarStore.visitedRoutes)
    const cachedRoutes = computed(() => {
      const cachedRoutesArr = ['EmptyLayout']
      visitedRoutes.value.forEach((item) => {
        if (!item.meta.noKeepAlive) {
          cachedRoutesArr.push(item.name)
        }
      })
      return cachedRoutesArr
    })

    return {
      cachedRoutes
    }
  }
})
</script>
<style lang="less" scoped></style>
