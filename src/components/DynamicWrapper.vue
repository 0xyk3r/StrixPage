<script lang="ts">
import { useTabsBarStore } from '@/stores/tabs-bar'
import { replaceDynamicName } from '@/utils/dynamic-component-util'
import { type Component, defineComponent, h, onMounted, shallowRef } from 'vue'
import { useRoute } from 'vue-router'

export default defineComponent({
  name: 'DynamicWrapper',
  setup() {
    const route = useRoute()
    const tabsBarStore = useTabsBarStore()

    const dynamicComponent = route.meta.dynamicComponent as (() => Promise<Component>) | null
    const loadedComponent = shallowRef<Component | null>(null)

    const dynamicComponentName = replaceDynamicName(route.meta.dynamicComponentNameTemplate as string, route.params)

    // 在 setup 中创建组件定义（只创建一次，保持引用稳定）
    // 这样 keep-alive 可以正确识别和缓存组件
    const DynamicComponent = defineComponent({
      name: dynamicComponentName,
      setup() {
        // 包装在 div 中，确保有单一根元素（避免 Transition 警告）
        return () => {
          if (!loadedComponent.value) return null
          return h('div', { class: 'dynamic-wrapper-container' }, [h(loadedComponent.value as Component)])
        }
      }
    })

    onMounted(() => {
      loadComponent()
    })

    /**
     * 加载动态组件
     */
    const loadComponent = async () => {
      try {
        const component: any = await dynamicComponent?.()
        loadedComponent.value = component?.default
        // 记录该组件名称以便在关闭标签时清理
        if (!tabsBarStore.cacheDynamicComponents.includes(dynamicComponentName)) {
          tabsBarStore.cacheDynamicComponents.push(dynamicComponentName)
        }
      } catch (error) {
        console.error('Failed to load component:', error)
      }
    }

    // render 函数：直接返回稳定的组件定义
    return () => h(DynamicComponent)
  }
})
</script>

<style lang="scss" scoped>
.dynamic-wrapper-container {
  // 容器不影响布局
  display: contents;
}
</style>
