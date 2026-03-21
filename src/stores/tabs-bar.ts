import { replaceDynamicName } from '@/utils/dynamic-component-util'
import { defineStore } from 'pinia'
import type { HistoryState, RouteLocationNormalizedGeneric } from 'vue-router'

// Vue Router 内部使用的 history.state 键，需要过滤掉
const VUE_ROUTER_STATE_KEYS = new Set(['back', 'current', 'forward', 'position', 'replaced', 'scroll'])

/**
 * 从 window.history.state 中提取用户自定义的 state（排除 Vue Router 内部键）
 */
function extractUserState(): HistoryState | undefined {
  const fullState = window.history.state
  if (!fullState) return undefined
  const userState: HistoryState = {}
  let hasUserState = false
  for (const key of Object.keys(fullState)) {
    if (!VUE_ROUTER_STATE_KEYS.has(key)) {
      userState[key] = fullState[key]
      hasUserState = true
    }
  }
  return hasUserState ? userState : undefined
}

export const useTabsBarStore = defineStore('tabsBar', () => {
  const visitedRoutes = ref<any[]>([])
  const refreshRoutes = ref<any[]>([])
  const cacheDynamicComponents = ref<string[]>([])
  // 存储每个路由路径对应的用户自定义 history.state
  const routeHistoryStateMap = new Map<string, HistoryState>()

  const cachedRouteNames = computed(() => {
    return visitedRoutes.value
      .filter((route) => !route.meta.noKeepAlive)
      .map((route) => {
        // 对于 DynamicWrapper 路由，返回动态生成的组件名称
        if (route.meta.isDynamicWrapper && route.meta.dynamicComponentNameTemplate) {
          return replaceDynamicName(route.meta.dynamicComponentNameTemplate as string, route.params)
        }
        // 普通路由返回路由名称
        return route.name
      })
  })

  /**
   * 添加路由
   * @param route 路由
   */
  function addVisitedRoute(route: RouteLocationNormalizedGeneric) {
    const target = visitedRoutes.value.find((item) => item.path === route.path)
    if (target) {
      if (route.fullPath !== target.fullPath) Object.assign(target, route)
      return
    }

    const refreshIndex = refreshRoutes.value.findIndex((rr: any) => rr.fullPath === route.path)
    if (refreshIndex !== -1) {
      const rr = refreshRoutes.value[refreshIndex]
      visitedRoutes.value.splice(rr.oldIndex, 0, rr)
      refreshRoutes.value.splice(refreshIndex, 1)
    } else if (!route.meta.empty) {
      visitedRoutes.value.push({ ...route })
    }
  }

  /**
   * 保存当前路由的用户自定义 history.state
   * 在每次路由变化后调用，确保 state 不会因标签页切换丢失
   */
  function saveRouteState(routePath: string) {
    const userState = extractUserState()
    if (userState) {
      routeHistoryStateMap.set(routePath, userState)
    }
  }

  /**
   * 获取指定路由路径存储的用户自定义 state
   */
  function getRouteState(routePath: string): HistoryState | undefined {
    return routeHistoryStateMap.get(routePath)
  }

  /**
   * 删除指定路由
   * @param route 路由
   */
  function delVisitedRoute(route: RouteLocationNormalizedGeneric) {
    visitedRoutes.value = visitedRoutes.value.filter((item) => item.path !== route.path)
    routeHistoryStateMap.delete(route.path)
  }

  /**
   * 删除其他路由
   * @param route 路由
   */
  function delOthersVisitedRoute(route: RouteLocationNormalizedGeneric) {
    visitedRoutes.value.forEach((item) => {
      if (item.path !== route.path && !item.meta.fixed) {
        routeHistoryStateMap.delete(item.path)
      }
    })
    visitedRoutes.value = visitedRoutes.value.filter((item) => item.path === route.path || item.meta.fixed)
  }

  /**
   * 删除左侧路由
   * @param route 路由
   */
  function delLeftVisitedRoute(route: RouteLocationNormalizedGeneric) {
    const index = visitedRoutes.value.findIndex((item) => item.path === route.path)
    if (index !== -1) {
      visitedRoutes.value.forEach((item, i) => {
        if (i < index && !item.meta.fixed) {
          routeHistoryStateMap.delete(item.path)
        }
      })
      visitedRoutes.value = visitedRoutes.value.filter((item, i) => i >= index || item.meta.fixed)
    }
  }

  /**
   * 删除右侧路由
   * @param route 路由
   */
  function delRightVisitedRoute(route: RouteLocationNormalizedGeneric) {
    const index = visitedRoutes.value.findIndex((item) => item.path === route.path)
    if (index !== -1) {
      visitedRoutes.value.forEach((item, i) => {
        if (i > index && !item.meta.fixed) {
          routeHistoryStateMap.delete(item.path)
        }
      })
      visitedRoutes.value = visitedRoutes.value.filter((item, i) => i <= index || item.meta.fixed)
    }
  }

  /**
   * 删除所有路由
   */
  function delAllVisitedRoutes() {
    visitedRoutes.value.forEach((item) => {
      if (!item.meta.fixed) {
        routeHistoryStateMap.delete(item.path)
      }
    })
    visitedRoutes.value = visitedRoutes.value.filter((item) => item.meta.fixed)
  }

  /**
   * 添加刷新路由
   * @param route 路由
   */
  function addRefreshRoutes(route: RouteLocationNormalizedGeneric) {
    const target = refreshRoutes.value.find((item) => item.path === route.path)
    if (target) {
      if (route.fullPath !== target.fullPath) {
        target.fullPath = route.fullPath
      }
    } else {
      refreshRoutes.value.push({ ...route })
    }
  }

  /**
   * 更新指定路由的标题（用于动态加载数据后更新标签页名称）
   * @param fullPath 路由完整路径
   * @param newTitle 新标题
   */
  function updateVisitedRouteTitle(fullPath: string, newTitle: string) {
    const index = visitedRoutes.value.findIndex((item) => item.fullPath === fullPath)
    if (index !== -1 && visitedRoutes.value[index].meta) {
      const oldTitle = visitedRoutes.value[index].meta.title

      // 只替换被修改的路由对象（最小化重渲染范围）
      visitedRoutes.value[index] = {
        ...visitedRoutes.value[index],
        meta: {
          ...visitedRoutes.value[index].meta,
          title: newTitle
        }
      }

      // 返回旧标题
      return oldTitle
    }
    return null
  }

  // 监听动态组件代理 DynamicWrapper 的销毁
  watch(
    () => [...visitedRoutes.value],
    (newVal, oldVal) => {
      if (newVal && oldVal && newVal.length < oldVal.length) {
        oldVal.forEach((item) => {
          if (item.meta.isDynamicWrapper && !newVal.some((newItem) => newItem.fullPath === item.fullPath)) {
            const proxyComponentName = replaceDynamicName(item.meta.dynamicComponentNameTemplate as string, item.params)
            const index = cacheDynamicComponents.value.indexOf(proxyComponentName)
            if (index !== -1) {
              cacheDynamicComponents.value.splice(index, 1)
            }
          }
        })
      }
    }
  )

  return {
    visitedRoutes,
    refreshRoutes,
    cacheDynamicComponents,
    cachedRouteNames,
    addVisitedRoute,
    delVisitedRoute,
    delOthersVisitedRoute,
    delLeftVisitedRoute,
    delRightVisitedRoute,
    delAllVisitedRoutes,
    addRefreshRoutes,
    updateVisitedRouteTitle,
    saveRouteState,
    getRouteState
  }
})
