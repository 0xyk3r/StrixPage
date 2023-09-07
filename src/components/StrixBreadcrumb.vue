<template>
  <div class="breadcrumb-container">
    <n-breadcrumb separator="/">
      <n-breadcrumb-item
        v-for="item in breadcrumbList"
        :key="item.path"
        :clickable="!item.meta.empty"
        @click="jumpPage(item)"
      >
        {{ item.meta._title || item.meta.title }}
      </n-breadcrumb-item>
    </n-breadcrumb>
  </div>
</template>

<script setup>
import { useStrixSettingsStore } from '@/stores/strix-settings'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const $route = useRoute()
const $router = useRouter()

const globalSettingsStore = useStrixSettingsStore()
const isSmallWindow = computed(() => globalSettingsStore.isSmallWindow)
watch(isSmallWindow, () => {
  getBreadcrumbList()
})

const breadcrumbList = ref([])

const getBreadcrumbList = () => {
  const blist = $route.matched.filter((item) => item.name && item.meta.title)

  // 处理动态标题
  blist.forEach((item) => {
    if (item.meta.titleTemplate) {
      // 使用正则表达式提取出所有item.meta.titleTemplate中的{xxx}，并替换为对应的$route.params[xxx]
      const reg = /(?<=\{)(.+?)(?=\})/g
      const params = item.meta.titleTemplate.match(reg)
      params?.forEach((param) => {
        // 不要直接修改路由原有参数，这会直接影响到路由的配置
        item.meta._title = item.meta.titleTemplate.replace(`{${param}}`, $route.params[param])
        item.meta._path = item.path.replace(`:${param}`, $route.params[param])
      })
    }
  })

  if (isSmallWindow.value) {
    breadcrumbList.value = [blist[blist.length - 1]]
  } else {
    breadcrumbList.value = blist
  }
}

watch(
  () => $router.currentRoute.value.path,
  () => {
    getBreadcrumbList()
  },
  {
    immediate: true,
    deep: true
  }
)

const jumpPage = (item) => {
  if (!item.meta.empty && item.path) {
    $router.push(item.meta._path || item.path)
  }
}
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
