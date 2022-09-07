import { defineStore } from 'pinia'

export const useTabsBarStore = defineStore('tabsBar', {
  state: () => ({
    visitedRoutes: [],
    refreshRoutes: []
  }),
  getters: {
  },
  actions: {
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
    delVisitedRoute(route) {
      this.visitedRoutes.forEach((item, index) => {
        if (item.path === route.path) {
          this.visitedRoutes.splice(index, 1)
        }
      })
    },
    delOthersVisitedRoute(route) {
      this.visitedRoutes = this.visitedRoutes.filter(
        (item) => item.meta.fixed || item.path === route.path
      )
    },
    delLeftVisitedRoute(route) {
      let index = this.visitedRoutes.length
      this.visitedRoutes = this.visitedRoutes.filter((item) => {
        if (item.name === route.name) index = this.visitedRoutes.indexOf(item)
        return item.meta.fixed || index <= this.visitedRoutes.indexOf(item)
      })
    },
    delRightVisitedRoute(route) {
      let index = this.visitedRoutes.length
      this.visitedRoutes = this.visitedRoutes.filter((item) => {
        if (item.name === route.name) index = this.visitedRoutes.indexOf(item)
        return item.meta.fixed || index >= this.visitedRoutes.indexOf(item)
      })
    },
    delAllVisitedRoutes() {
      this.visitedRoutes = this.visitedRoutes.filter((item) => item.meta.fixed)
    },
    updateVisitedRoute(route) {
      this.visitedRoutes.forEach((item) => {
        if (item.path === route.path) item = Object.assign(item, route)
      })
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
