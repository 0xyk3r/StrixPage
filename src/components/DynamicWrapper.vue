<template>
  <div v-if="!isDestroyed && proxyComponent">
    <keep-alive :include="cacheDynamicComponents">
      <component :is="proxyComponent" />
    </keep-alive>
  </div>
</template>
<script setup lang="ts">
import { useTabsBarStore } from '@/stores/tabs-bar'
import { replaceDynamicName } from '@/utils/dynamic-component-util'
import { storeToRefs } from 'pinia'
import { type Component } from 'vue'

const route = useRoute()
const tabsBarStore = useTabsBarStore()
const { cacheDynamicComponents } = storeToRefs(tabsBarStore)

const isDestroyed = ref(false)
const dynamicComponent = route.meta.dynamicComponent as (() => Promise<Component>) | null
const proxyComponent = shallowRef<Component | null>(null)

const dynamicComponentName = replaceDynamicName(
  route.meta.dynamieComponentNameTemplate as string,
  route.params
)

/**
 * 加载动态组件
 */
const loadComponent = async () => {
  try {
    const component: any = await dynamicComponent?.()
    const loadedComponent = component?.default
    proxyComponent.value = defineComponent({
      name: dynamicComponentName,
      setup() {
        return () => h(loadedComponent)
      }
    })
    cacheDynamicComponents.value.push(dynamicComponentName)
  } catch (error) {
    console.error('Failed to load component:', error)
  }
}
onMounted(loadComponent)

/**
 * 激活时重新加载组件
 */
const reloadComponentIfNeeded = async () => {
  // 判断是否存在cacheDynamicComponents中 如果不存在则重新加载组件
  if (proxyComponent.value && !cacheDynamicComponents.value.includes(dynamicComponentName)) {
    isDestroyed.value = true
    await nextTick()
    isDestroyed.value = false
    cacheDynamicComponents.value.push(dynamicComponentName)
  }
}
onActivated(reloadComponentIfNeeded)
</script>
<style lang="scss" scoped></style>
