import { useTabsBarStore } from '@/stores/tabs-bar'
import { replaceDynamicName } from '@/utils/dynamic-component-util'
import type { Component } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

/**
 * 动态组件包装 Composable
 * 为动态路由创建命名的包装组件，确保 keep-alive 可以区分不同参数的动态路由
 * Vue Router 的 lazy loading 负责在导航完成前解析组件，避免过渡动画中的空白闪烁
 */
export function useDynamicComponent() {
  const componentCache = new Map<string, Component>()

  /**
   * 为动态路由创建或获取包装组件
   * @param BaseComponent 原始组件（由 Vue Router 在导航前已解析完成）
   * @param route 当前路由
   * @returns 包装后的组件或原始组件
   */
  const wrapDynamicComponent = (BaseComponent: Component, route: RouteLocationNormalizedLoaded): Component => {
    if (!route.meta.isDynamicWrapper) {
      return BaseComponent
    }

    const dynamicComponentName = replaceDynamicName(route.meta.dynamicComponentNameTemplate as string, route.params)

    if (!componentCache.has(dynamicComponentName)) {
      // 注册动态组件名称，用于 tab 关闭时清理 keep-alive 缓存
      const tabsBarStore = useTabsBarStore()
      if (!tabsBarStore.cacheDynamicComponents.includes(dynamicComponentName)) {
        tabsBarStore.cacheDynamicComponents.push(dynamicComponentName)
      }

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
