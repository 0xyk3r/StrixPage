import { controlStrixLoadingBar } from '@/utils/strix-loading-bar'
import { createRouter, createWebHistory } from 'vue-router'

const Redirect = () => import('@/components/StrixRedirect.vue')

const customRoutes = []

const routes = [
  {
    path: '/login',
    name: 'LoginIndex',
    component: () => import('@/views/System/Login.vue')
  },
  {
    path: '',
    name: 'HomeIndex',
    component: () => import('@/views/System/Home.vue'),
    redirect: '/index',
    meta: {
      title: 'Strix管理系统'
    },
    children: [
      {
        path: 'index',
        name: 'IndexIndex',
        component: () => import('@/views/System/Index.vue'),
        meta: {
          title: '首页',
          icon: 'fa fa-home',
          fixed: true,
          fixedIndex: 0
        }
      },
      {
        path: '/redirect',
        name: 'StrixRedirect',
        component: Redirect,
        meta: {
          ignore: true,
          isRedirect: true
        },
        children: [
          {
            path: ':pathMatch(.*)*',
            component: Redirect
          }
        ]
      },
      ...customRoutes,
      {
        path: '/system/manager',
        name: 'SystemManagerIndex',
        component: () => import('@/views/System/SystemManager/Index.vue'),
        meta: {
          title: '系统人员管理'
        }
      },
      {
        path: '/system/role',
        name: 'SystemRoleIndex',
        component: () => import('@/views/System/SystemRole/Index.vue'),
        meta: {
          title: '系统角色管理'
        }
      },
      {
        path: '/system/menu',
        name: 'SystemMenuIndex',
        component: () => import('@/views/System/SystemMenu/Index.vue'),
        meta: {
          title: '系统菜单管理'
        }
      },
      {
        path: 'system/user',
        name: 'SystemUserIndex',
        component: () => import('@/views/System/SystemUser/Index.vue'),
        meta: {
          title: '系统用户管理'
        }
      },
      {
        path: 'system/region',
        name: 'SystemRegionIndex',
        component: () => import('@/views/System/SystemRegion/Index.vue'),
        meta: {
          title: '系统地区管理'
        }
      },
      {
        path: 'system/dict',
        name: 'SystemDictIndex',
        component: () => import('@/views/System/SystemDict/Index.vue'),
        meta: {
          title: '系统字典管理'
        }
      },
      {
        path: 'system/dict/:dictKey',
        name: 'SystemDictData',
        component: () => import('@/views/System/SystemDict/Data.vue'),
        meta: {
          title: '字典数据管理',
          empty: false,
          titleTemplate: '字典数据管理 / {dictKey}'
        }
      },
      {
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
            component: () => import('@/views/System/SystemMonitor/Server/Index.vue'),
            meta: {
              title: '系统运行信息',
              empty: false
            }
          },
          {
            path: 'cache',
            name: 'SystemMonitorCacheIndex',
            component: () => import('@/views/System/SystemMonitor/Cache/Index.vue'),
            meta: {
              title: '系统缓存信息',
              empty: false
            }
          },
          {
            path: 'cache/list',
            name: 'SystemMonitorCacheList',
            component: () => import('@/views/System/SystemMonitor/Cache/List.vue'),
            meta: {
              title: '系统缓存列表',
              empty: false
            }
          },
          {
            path: 'log',
            name: 'SystemMonitorLogIndex',
            component: () => import('@/views/System/SystemMonitor/Log/Index.vue'),
            meta: {
              title: '系统日志列表',
              empty: false
            }
          }
        ]
      },
      {
        path: 'system/module',
        name: 'SystemModule',
        meta: {
          title: '系统功能配置',
          empty: true
        },
        children: [
          {
            path: 'job',
            name: 'SystemModuleJobIndex',
            component: () => import('@/views/System/SystemModule/Job/Index.vue'),
            meta: {
              title: '定时任务列表',
              empty: false
            }
          },
          {
            path: 'log',
            name: 'SystemModuleJobLog',
            component: () => import('@/views/System/SystemModule/Job/Index.vue'),
            meta: {
              title: '定时任务日志',
              empty: false
            }
          },
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
                component: () => import('@/views/System/SystemModule/Sms/Index.vue'),
                meta: {
                  title: '短信服务列表',
                  empty: false
                }
              },
              {
                path: 'log',
                name: 'SystemModuleSmsLog',
                component: () => import('@/views/System/SystemModule/Sms/Log.vue'),
                meta: {
                  title: '短信日志列表',
                  empty: false
                }
              },
              {
                path: 'sign',
                name: 'SystemModuleSmsSign',
                component: () => import('@/views/System/SystemModule/Sms/Sign.vue'),
                meta: {
                  title: '短信签名列表',
                  empty: false
                }
              },
              {
                path: 'template',
                name: 'SystemModuleSmsTemplate',
                component: () => import('@/views/System/SystemModule/Sms/Template.vue'),
                meta: {
                  title: '短信模板列表',
                  empty: false
                }
              }
            ]
          },
          {
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
                component: () => import('@/views/System/SystemModule/Oss/Index.vue'),
                meta: {
                  title: '存储服务列表',
                  empty: false
                }
              },
              {
                path: 'bucket',
                name: 'SystemModuleOssBucket',
                component: () => import('@/views/System/SystemModule/Oss/Bucket.vue'),
                meta: {
                  title: '存储空间管理',
                  empty: false
                }
              },
              {
                path: 'filegroup',
                name: 'SystemModuleOssFileGroup',
                component: () => import('@/views/System/SystemModule/Oss/FileGroup.vue'),
                meta: {
                  title: '文件分组管理',
                  empty: false
                }
              },
              {
                path: 'file',
                name: 'SystemModuleOssFile',
                component: () => import('@/views/System/SystemModule/Oss/File.vue'),
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

  // 处理动态面包屑导航标题
  if (to.meta.titleTemplate && to.params) {
    for (const param in to.params) {
      to.meta.title = to.meta.titleTemplate.replace(`{${param}}`, to.params[param])
    }
  }

  // 设置网页标题
  to.meta.title ? (document.title = to.meta.title + ' - Strix') : (document.title = 'Strix')
  if (to.path === '/login') {
    return next()
  }
  const loginToken = window.localStorage.getItem('strix_login_token')
  if (!loginToken) {
    return next('/login?to=' + to.fullPath)
  }
  return next()
})

// 后置路由导航守卫
router.afterEach(() => {
  controlStrixLoadingBar('finish')
})

export default router
