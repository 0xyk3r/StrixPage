<template>
  <div class="breadcrumb-container">
    <n-breadcrumb separator="/">
      <n-breadcrumb-item v-for="item in breadcrumbList" :key="item.path" :clickable="!item.meta.empty"
        @click="jumpPage(item)">
        {{ item.meta.title }}
      </n-breadcrumb-item>
    </n-breadcrumb>
  </div>
</template>

<script>
import { defineComponent, ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGlobalSettingsStore } from '@/stores/global-settings'

export default defineComponent({
  name: 'StrixBreadcrumb',
  setup() {
    const $route = useRoute()
    const $router = useRouter()

    const globalSettingsStore = useGlobalSettingsStore()
    const isSmallWindow = computed(() => globalSettingsStore.isSmallWindow)
    watch(isSmallWindow, () => {
      getBreadcrumbList()
    })

    const breadcrumbList = ref([])

    const getBreadcrumbList = () => {
      const blist = $route.matched.filter((item) => item.name && item.meta.title)
      if (isSmallWindow.value) {
        breadcrumbList.value = [blist[blist.length - 1]]
      } else {
        breadcrumbList.value = blist
      }
    }

    watch(() => $router.currentRoute.value.path, () => {
      getBreadcrumbList()
    }, {
      immediate: true,
      deep: true
    })

    const jumpPage = (item) => {
      if (!item.meta.empty && item.path) {
        $router.push(item.path)
      }
    }

    return {
      isSmallWindow,
      breadcrumbList,
      jumpPage
    }
  }
})
</script>

<style lang="scss" scoped>
.breadcrumb-container {
  height: 60px;
  display: flex;
  align-items: center;

  .n-breadcrumb {
    line-height: 25px;
  }
}
</style>
