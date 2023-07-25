import { defineStore } from 'pinia'

export const useTabsBarStore = defineStore('tabsBar', {
  state: () => ({
    visitedRoutes: [],
    refreshRoutes: []
  }),
  getters: {
  },
  actions: {
    // 添加路由
    addVisitedRoute(route) {
      const target = this.visitedRoutes.find((item) => item.path === route.path)
      if (target) {
        if (route.fullPath !== target.fullPath) Object.assign(target, route)
        return
      }
      let isRefresh = false
      this.refreshRoutes.forEach((rr, index) => {
        if (rr.fullPath === route.path) {
          this.visitedRoutes.splice(rr.oldIndex, 0, rr)
          isRefresh = true
          this.refreshRoutes.splice(index, 1)
        }
      })
      if (!isRefresh && !route.meta.ignore) {
        this.visitedRoutes.push(Object.assign({}, route))
      }
    },
    // 删除指定路由
    delVisitedRoute(route) {
      this.visitedRoutes.forEach((item, index) => {
        if (item.path === route.path) {
          this.visitedRoutes.splice(index, 1)
        }
      })
    },
    // 删除其他路由
    delOthersVisitedRoute(route) {
      const fixedRoutes = this.visitedRoutes.filter((item) => item.meta.fixed)
      const index = this.visitedRoutes.findIndex(item => item.path === route.path)
      if (index !== -1) {
        this.visitedRoutes.splice(index + 1, this.visitedRoutes.length)
        this.visitedRoutes.splice(0, index, ...fixedRoutes)
      }
    },
    // 删除左侧路由
    delLeftVisitedRoute(route) {
      this.visitedRoutes.forEach((item, index) => {
        if (item.path === route.path) {
          this.visitedRoutes.splice(0, index, ...this.visitedRoutes.filter((item) => item.meta.fixed))
        }
      })
    },
    // 删除右侧路由
    delRightVisitedRoute(route) {
      this.visitedRoutes.forEach((item, index) => {
        if (item.path === route.path) {
          this.visitedRoutes.splice(index + 1, this.visitedRoutes.length)
        }
      })
    },
    // 删除所有路由
    delAllVisitedRoutes() {
      const fixedRoutes = this.visitedRoutes.filter((item) => item.meta.fixed)
      this.visitedRoutes.splice(0, this.visitedRoutes.length, ...fixedRoutes)
    },
    addRefreshRoutes(route) {
      const target = this.refreshRoutes.find((item) => item.path === route.path)
      if (target) {
        if (route.fullPath !== target.fullPath) Object.assign(target, route)
        return
      }
      this.refreshRoutes.push(Object.assign({}, route))
    }
  }
})
