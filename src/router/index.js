import { controlStrixLoadingBar } from '@/utils/strix-loading-bar'
import { createRouter, createWebHistory } from 'vue-router'

// const EmptyLayout = () => import('@/components/EmptyLayout.vue')
const Redirect = () => import('@/components/StrixRedirect.vue')

const routes = [
  {
    path: '/login',
    name: 'LoginIndex',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/',
    name: 'HomeIndex',
    component: () => import('@/views/Home.vue'),
    redirect: '/welcome',
    meta: {
      title: 'Strix管理系统'
    },
    children: [
      {
        path: '/redirect',
        name: 'StrixRedirect',
        component: Redirect,
        meta: {
          ignore: true,
          isRedirect: true
        },
        children: [{
          path: ':pathMatch(.*)*',
          component: Redirect
        }]
      }, {
        path: '/welcome',
        name: 'WelcomeIndex',
        component: () => import('@/views/Welcome.vue'),
        meta: {
          title: '欢迎页',
          icon: 'fa fa-home',
          fixed: true,
          fixedIndex: 0
        }
      }, {
        path: '/system/manager',
        name: 'SystemManagerIndex',
        component: () => import('@/views/SystemManager/Index.vue'),
        meta: {
          title: '系统人员管理'
        }
      }, {
        path: '/system/menu',
        name: 'SystemMenuIndex',
        component: () => import('@/views/SystemMenu/Index.vue'),
        meta: {
          title: '系统菜单管理'
        }
      }, {
        path: 'system/authorization',
        name: 'SystemAuthorization',
        meta: {
          title: '系统权限控制',
          empty: true
        },
        children: [
          {
            path: 'permission',
            name: 'SystemPermissionIndex',
            component: () => import('@/views/SystemPermission/Index.vue'),
            meta: {
              title: '系统权限列表',
              empty: false
            }
          }, {
            path: 'role',
            name: 'SystemRoleIndex',
            component: () => import('@/views/SystemRole/Index.vue'),
            meta: {
              title: '系统角色管理',
              empty: false
            }
          }
        ]
      }, {
        path: 'system/user',
        name: 'SystemUserIndex',
        component: () => import('@/views/SystemUser/Index.vue'),
        meta: {
          title: '系统用户管理'
        }
      }, {
        path: 'system/region',
        name: 'SystemRegionIndex',
        component: () => import('@/views/SystemRegion/Index.vue'),
        meta: {
          title: '系统地区管理'
        }
      }, {
        path: 'system/dict',
        name: 'SystemDictIndex',
        component: () => import('@/views/SystemDict/Index.vue'),
        meta: {
          title: '系统字典管理'
        }
      }, {
        path: 'system/dict/:dictKey',
        name: 'SystemDictDataIndex',
        component: () => import('@/views/SystemDict/Data.vue'),
        meta: {
          title: '字典数据管理',
          empty: false,
          titleTemplate: '字典数据管理 / {dictKey}'
        }
      }, {
        path: 'system/monitor',
        name: 'SystemMonitor',
        meta: {
          title: '系统信息管理',
          empty: true
        },
        children: [
          {
            path: 'server',
            name: 'SystemMonitorServerIndex',
            component: () => import('@/views/SystemMonitor/Server/Index.vue'),
            meta: {
              title: '系统运行信息',
              empty: false
            }
          }, {
            path: 'cache',
            name: 'SystemMonitorCacheIndex',
            component: () => import('@/views/SystemMonitor/Cache/Index.vue'),
            meta: {
              title: '系统缓存信息',
              empty: false
            }
          }, {
            path: 'cache/list',
            name: 'SystemMonitorCacheList',
            component: () => import('@/views/SystemMonitor/Cache/List.vue'),
            meta: {
              title: '系统缓存列表',
              empty: false
            }
          }
        ]
      }, {
        path: 'system/module',
        name: 'SystemModule',
        meta: {
          title: '系统功能配置',
          empty: true
        },
        children: [
          {
            path: 'sms',
            name: 'SystemModuleSmsIndex',
            meta: {
              title: '短信服务配置',
              empty: true
            },
            children: [
              {
                path: 'config',
                name: 'SystemModuleSmsIndex',
                component: () => import('@/views/SystemModule/Sms/Index.vue'),
                meta: {
                  title: '短信服务列表',
                  empty: false
                }
              }, {
                path: 'log',
                name: 'SystemModuleSmsLog',
                component: () => import('@/views/SystemModule/Sms/Log.vue'),
                meta: {
                  title: '短信日志列表',
                  empty: false
                }
              }, {
                path: 'sign',
                name: 'SystemModuleSmsSign',
                component: () => import('@/views/SystemModule/Sms/Sign.vue'),
                meta: {
                  title: '短信签名列表',
                  empty: false
                }
              }, {
                path: 'template',
                name: 'SystemModuleSmsTemplate',
                component: () => import('@/views/SystemModule/Sms/Template.vue'),
                meta: {
                  title: '短信模板列表',
                  empty: false
                }
              }
            ]
          }, {
            path: 'oss',
            name: 'SystemModuleOssIndex',
            meta: {
              title: '存储服务配置',
              empty: true
            },
            children: [
              {
                path: 'config',
                name: 'SystemModuleOssIndex',
                component: () => import('@/views/SystemModule/Oss/Index.vue'),
                meta: {
                  title: '存储服务列表',
                  empty: false
                }
              }, {
                path: 'bucket',
                name: 'SystemModuleOssBucket',
                component: () => import('@/views/SystemModule/Oss/Bucket.vue'),
                meta: {
                  title: '存储空间管理',
                  empty: false
                }
              }, {
                path: 'filegroup',
                name: 'SystemModuleOssFileGroup',
                component: () => import('@/views/SystemModule/Oss/FileGroup.vue'),
                meta: {
                  title: '文件分组管理',
                  empty: false
                }
              }, {
                path: 'file',
                name: 'SystemModuleOssFile',
                component: () => import('@/views/SystemModule/Oss/File.vue'),
                meta: {
                  title: '存储文件列表',
                  empty: false
                }
              }
            ]
          }
        ]
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
  // 处理相同路由跳转问题
  if (to.meta.title && !to.meta.isRedirect && to.name === form.name) {
    return next(`/redirect${to.path}`)
  }

  // 加载条
  controlStrixLoadingBar('start')

  // 处理动态标题
  if (to.meta.titleTemplate && to.params) {
    for (const param in to.params) {
      to.meta.title = to.meta.titleTemplate.replace(`{${param}}`, to.params[param])
    }
  }

  // 设置标题
  to.meta.title ? document.title = to.meta.title + ' - Strix' : document.title = 'Strix'
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
