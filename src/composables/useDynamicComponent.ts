import { replaceDynamicName } from '@/utils/dynamic-component-util'
import type { Component } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

/**
 * 动态组件包装 Composable
 * 为 DynamicWrapper 路由创建动态命名的包装组件
 * 确保 keep-alive 可以区分不同参数的动态路由
 */
export function useDynamicComponent() {
  // 缓存动态包装组件，确保同一路由使用相同的组件定义（引用稳定）
  const componentCache = new Map<string, Component>()

  /**
   * 为动态路由创建或获取包装组件
   * @param BaseComponent 原始组件
   * @param route 当前路由
   * @returns 包装后的组件或原始组件
   */
  const wrapDynamicComponent = (BaseComponent: Component, route: RouteLocationNormalizedLoaded): Component => {
    // 非 DynamicWrapper 路由直接返回原组件
    if (!route.meta.isDynamicWrapper) {
      return BaseComponent
    }

    // 生成动态组件名称
    const dynamicComponentName = replaceDynamicName(route.meta.dynamicComponentNameTemplate as string, route.params)

    // 从缓存中获取或创建包装组件
    if (!componentCache.has(dynamicComponentName)) {
      componentCache.set(
        dynamicComponentName,
        defineComponent({
          name: dynamicComponentName,
          setup() {
            return () => h(BaseComponent)
          }
        })
      )
    }

    return componentCache.get(dynamicComponentName)!
  }

  /**
   * 清除指定组件缓存
   * @param componentName 组件名称
   */
  const clearComponentCache = (componentName: string) => {
    componentCache.delete(componentName)
  }

  /**
   * 清除所有组件缓存
   */
  const clearAllComponentCache = () => {
    componentCache.clear()
  }

  return {
    wrapDynamicComponent,
    clearComponentCache,
    clearAllComponentCache
  }
}
