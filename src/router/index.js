import { createRouter, createWebHistory } from 'vue-router'
import { controlStrixLoadingBar } from '@/utils/strix-loading-bar'

const Login = () => import('@/views/Login.vue')
const Home = () => import('@/views/Home.vue')
const Welcome = () => import('@/views/Welcome.vue')
const EmptyLayout = () => import('@/components/EmptyLayout.vue')

const SystemManagerIndex = () => import('@/views/SystemManager/Index.vue')
const SystemMenuIndex = () => import('@/views/SystemMenu/Index.vue')
const SystemPermissionIndex = () => import('@/views/SystemPermission/Index.vue')
const SystemRegionIndex = () => import('@/views/SystemRegion/Index.vue')
const SystemRoleIndex = () => import('@/views/SystemRole/Index.vue')
const SystemUserIndex = () => import('@/views/SystemUser/Index.vue')

const routes = [
  {
    path: '/login',
    name: 'LoginIndex',
    component: Login
  },
  {
    path: '/',
    name: 'HomeIndex',
    component: Home,
    redirect: '/welcome',
    meta: {
      title: 'Strix管理系统'
    },
    children: [
      {
        path: '/empty',
        name: 'EmptyLayout',
        component: EmptyLayout,
        meta: {
          ignore: true
        }
      },
      {
        path: '/welcome',
        name: 'WelcomeIndex',
        component: Welcome,
        meta: {
          title: '欢迎页',
          icon: 'fa fa-home',
          fixed: true,
          fixedIndex: 0
        }
      }, {
        path: '/system/manager',
        name: 'SystemManagerIndex',
        component: SystemManagerIndex,
        meta: {
          title: '系统人员管理'
        }
      }, {
        path: '/system/menu',
        name: 'SystemMenuIndex',
        component: SystemMenuIndex,
        meta: {
          title: '系统菜单管理'
        }
      }, {
        path: 'system/authorization',
        name: 'SystemAuthorization',
        component: EmptyLayout,
        meta: {
          title: '系统权限控制',
          empty: true
        },
        children: [
          {
            path: 'permission',
            name: 'SystemPermissionIndex',
            component: SystemPermissionIndex,
            meta: {
              title: '系统权限列表',
              empty: false
            }
          }, {
            path: 'role',
            name: 'SystemRoleIndex',
            component: SystemRoleIndex,
            meta: {
              title: '系统角色管理',
              empty: false
            }
          }
        ]
      }, {
        path: '/system/user',
        name: 'SystemUserIndex',
        component: SystemUserIndex,
        meta: {
          title: '系统用户管理'
        }
      }, {
        path: '/system/region',
        name: 'SystemRegionIndex',
        component: SystemRegionIndex,
        meta: {
          title: '系统地区管理'
        }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 前置路由导航守卫
router.beforeEach((to, form, next) => {
  // next() 放行    next('/login') 强制跳转
  controlStrixLoadingBar('start')
  if (to.path === '/login') { return next() }
  const loginToken = window.localStorage.getItem('strix_login_token')
  if (!loginToken) { return next('/login?to=' + to.fullPath) }
  return next()
})
// 后置路由导航守卫
router.afterEach(() => {
  controlStrixLoadingBar('finish')
})

export default router
