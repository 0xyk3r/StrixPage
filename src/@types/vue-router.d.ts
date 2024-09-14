import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /**
     * 路由标题
     */
    title?: string

    /**
     * 路由标题模板，用于动态生成标题
     */
    titleTemplate?: string

    /**
     * 路由图标
     */
    icon?: string

    /**
     * 是否固定在导航栏中
     */
    fixed?: boolean

    /**
     * 固定路由的索引，用于排序
     */
    fixedIndex?: number

    /**
     * 是否为空路由, 通常用于空的中继节点
     */
    empty?: boolean

    /**
     * 是否为重定向路由
     */
    isRedirect?: boolean

    /**
     * 是否禁用缓存
     */
    noKeepAlive?: boolean

    /**
     * 父路由名称, 用于面包屑导航
     */
    parentRouteName?: string

    /**
     * 是否为动态包装器路由
     */
    isDynamicWrapper?: boolean

    /**
     * 动态组件加载函数
     */
    dynamicComponent?: () => Promise<any>

    /**
     * 动态组件名称模板
     */
    dynamieComponentNameTemplate?: string
  }
}
