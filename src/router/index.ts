import { useLoginInfoStore } from '@/stores/login-info'
import { replaceDynamicName } from '@/utils/dynamic-component-util'
import { controlStrixLoadingBar } from '@/utils/strix-loading-bar'
import { storeToRefs } from 'pinia'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const Redirect = () => import('@/components/view/StrixRedirect.vue')
const NotFound = () => import('@/components/common/StrixNotFound.vue')
const Forbidden = () => import('@/components/common/StrixForbidden.vue')

const customRoutes: RouteRecordRaw[] = []

const developmentRoutes = []
if (import.meta.env.MODE === 'development') {
  developmentRoutes.push({
    path: '/debug',
    name: 'DebugPage',
    component: () => import('@/views/System/DebugPage.vue'),
    meta: {
      title: 'Debug'
    }
  })
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'LoginPage',
    component: () => import('@/views/System/LoginPage.vue')
  },
  {
    path: '',
    name: 'HomePage',
    component: () => import('@/views/System/HomePage.vue'),
    redirect: '/index',
    meta: {
      icon: 'house',
      title: ''
    },
    children: [
      {
        path: 'index',
        name: 'IndexPage',
        component: () => import('@/views/IndexPage.vue'),
        meta: {
          title: '首页',
          fixed: true,
          fixedIndex: 0
        }
      },
      {
        path: '/redirect',
        name: 'StrixRedirect',
        component: Redirect,
        meta: {
          empty: true,
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
      ...developmentRoutes,
      {
        path: '/system/manager',
        name: 'SystemManagerIndex',
        component: () => import('@/views/System/SystemManager/SystemManagerIndex.vue'),
        meta: {
          title: '系统人员管理',
          permission: 'system:manager'
        }
      },
      {
        path: '/system/role',
        name: 'SystemRoleIndex',
        component: () => import('@/views/System/SystemRole/SystemRoleIndex.vue'),
        meta: {
          title: '系统角色管理',
          permission: 'system:role'
        }
      },
      {
        path: '/system/menu',
        name: 'SystemMenuIndex',
        component: () => import('@/views/System/SystemMenu/SystemMenuIndex.vue'),
        meta: {
          title: '系统菜单管理',
          permission: 'system:menu'
        }
      },
      {
        path: 'system/user',
        name: 'SystemUserIndex',
        component: () => import('@/views/System/SystemUser/SystemUserIndex.vue'),
        meta: {
          title: '系统用户管理',
          permission: 'system:user'
        }
      },
      {
        path: 'system/region',
        name: 'SystemRegionIndex',
        component: () => import('@/views/System/SystemRegion/SystemRegionIndex.vue'),
        meta: {
          title: '系统地区管理',
          permission: 'system:region'
        }
      },
      {
        path: 'system/dict',
        name: 'SystemDictIndex',
        component: () => import('@/views/System/SystemDict/SystemDictIndex.vue'),
        meta: {
          title: '系统字典管理',
          permission: 'system:dict'
        }
      },
      {
        path: 'system/dict/:dictKey',
        name: 'SystemDictDynamicWrapper',
        component: () => import('@/views/System/SystemDict/SystemDictData.vue'),
        meta: {
          title: '字典数据',
          titleTemplate: ' 字典数据 - {dictKey}',
          parentRouteName: 'SystemDictIndex',
          isDynamicWrapper: true,
          dynamicComponentNameTemplate: 'SystemDictData-{dictKey}',
          permission: 'system:dict:data'
        }
      },
      {
        path: 'system/config',
        name: 'SystemConfigIndex',
        component: () => import('@/views/System/SystemConfig/SystemConfigIndex.vue'),
        meta: {
          title: '系统配置',
          permission: 'system:config'
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
            path: 'dashboard',
            name: 'SystemMonitorDashboardIndex',
            component: () => import('@/views/System/SystemMonitor/Dashboard/SystemMonitorDashboardIndex.vue'),
            meta: {
              title: '活动仪表板',
              empty: false,
              permission: 'system:monitor'
            }
          },
          {
            path: 'session',
            name: 'SystemMonitorSessionIndex',
            component: () => import('@/views/System/SystemMonitor/Session/SystemMonitorSessionIndex.vue'),
            meta: {
              title: '在线会话管理',
              empty: false,
              permission: 'system:monitor:session'
            }
          },
          {
            path: 'user-session',
            name: 'SystemMonitorUserSessionIndex',
            component: () => import('@/views/System/SystemMonitor/UserSession/SystemMonitorUserSessionIndex.vue'),
            meta: {
              title: '用户会话管理',
              empty: false,
              permission: 'system:monitor:user-session'
            }
          },
          {
            path: 'notification-manage',
            name: 'SystemMonitorNotificationManageIndex',
            component: () =>
              import('@/views/System/SystemMonitor/NotificationManage/SystemMonitorNotificationManageIndex.vue'),
            meta: {
              title: '通知管理',
              empty: false,
              permission: 'system:monitor:notification'
            }
          },
          {
            path: 'announcement',
            name: 'SystemMonitorAnnouncementIndex',
            component: () => import('@/views/System/SystemMonitor/Announcement/SystemMonitorAnnouncementIndex.vue'),
            meta: {
              title: '系统公告',
              empty: false,
              permission: 'system:monitor:announcement'
            }
          },
          {
            path: 'server',
            name: 'SystemMonitorServerIndex',
            component: () => import('@/views/System/SystemMonitor/Server/SystemMonitorServerIndex.vue'),
            meta: {
              title: '系统运行信息',
              empty: false,
              permission: 'system:monitor'
            }
          },
          {
            path: 'cache',
            name: 'SystemMonitorCacheIndex',
            component: () => import('@/views/System/SystemMonitor/Cache/SystemMonitorCacheIndex.vue'),
            meta: {
              title: '系统缓存信息',
              empty: false,
              permission: 'system:monitor:cache'
            }
          },
          {
            path: 'log',
            name: 'SystemMonitorLogIndex',
            component: () => import('@/views/System/SystemMonitor/Log/SystemMonitorLogIndex.vue'),
            meta: {
              title: '系统日志列表',
              empty: false,
              permission: 'system:monitor:log'
            }
          }
        ]
      },
      {
        path: 'system/tool',
        name: 'SystemTool',
        meta: {
          title: '系统工具管理',
          permission: 'system:tool'
        },
        children: [
          {
            path: '',
            name: 'SystemToolIndex',
            component: () => import('@/views/System/SystemTool/SystemToolIndex.vue')
          },
          {
            path: 'popularity',
            name: 'SystemToolPopularity',
            component: () => import('@/views/System/SystemTool/SystemToolPopularity.vue'),
            meta: {
              title: '热度工具',
              permission: 'system:tool'
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
            component: () => import('@/views/System/SystemModule/Job/SystemModuleJobIndex.vue'),
            meta: {
              title: '定时任务列表',
              empty: false,
              permission: 'system:module:job'
            }
          },
          {
            path: 'log',
            name: 'SystemModuleJobLog',
            component: () => import('@/views/System/SystemModule/Job/SystemModuleJobIndex.vue'),
            meta: {
              title: '定时任务日志',
              parentRouteName: 'SystemModuleJobIndex',
              empty: false,
              permission: 'system:module:job'
            }
          },
          {
            path: 'sms',
            name: 'SystemModuleSms',
            meta: {
              title: '短信服务配置',
              empty: true
            },
            children: [
              {
                path: 'config',
                name: 'SystemModuleSmsIndex',
                component: () => import('@/views/System/SystemModule/Sms/SystemModuleSmsIndex.vue'),
                meta: {
                  title: '短信服务列表',
                  empty: false,
                  permission: 'system:module:sms:config'
                }
              },
              {
                path: 'log',
                name: 'SystemModuleSmsLog',
                component: () => import('@/views/System/SystemModule/Sms/SystemModuleSmsLog.vue'),
                meta: {
                  title: '短信日志列表',
                  empty: false,
                  permission: 'system:module:sms:log'
                }
              },
              {
                path: 'sign',
                name: 'SystemModuleSmsSign',
                component: () => import('@/views/System/SystemModule/Sms/SystemModuleSmsSign.vue'),
                meta: {
                  title: '短信签名列表',
                  empty: false,
                  permission: 'system:module:sms:sign'
                }
              },
              {
                path: 'template',
                name: 'SystemModuleSmsTemplate',
                component: () => import('@/views/System/SystemModule/Sms/SystemModuleSmsTemplate.vue'),
                meta: {
                  title: '短信模板列表',
                  empty: false,
                  permission: 'system:module:sms:template'
                }
              }
            ]
          },
          {
            path: 'oss',
            name: 'SystemModuleOss',
            meta: {
              title: '存储服务配置',
              empty: true
            },
            children: [
              {
                path: 'config',
                name: 'SystemModuleOssIndex',
                component: () => import('@/views/System/SystemModule/Oss/SystemModuleOssIndex.vue'),
                meta: {
                  title: '存储服务列表',
                  empty: false,
                  permission: 'system:module:oss:config'
                }
              },
              {
                path: 'bucket',
                name: 'SystemModuleOssBucket',
                component: () => import('@/views/System/SystemModule/Oss/SystemModuleOssBucket.vue'),
                meta: {
                  title: '存储空间管理',
                  empty: false,
                  permission: 'system:module:oss:bucket'
                }
              },
              {
                path: 'filegroup',
                name: 'SystemModuleOssFileGroup',
                component: () => import('@/views/System/SystemModule/Oss/SystemModuleOssFileGroup.vue'),
                meta: {
                  title: '文件分组管理',
                  empty: false,
                  permission: 'system:module:oss:filegroup'
                }
              },
              {
                path: 'file',
                name: 'SystemModuleOssFile',
                component: () => import('@/views/System/SystemModule/Oss/SystemModuleOssFileBrowser.vue'),
                meta: {
                  title: '存储文件列表',
                  empty: false,
                  fullPage: true,
                  permission: 'system:module:oss:file'
                }
              }
            ]
          }
        ]
      },
      {
        path: 'system/ai',
        name: 'SystemAi',
        meta: { title: 'AI 能力', empty: true },
        children: [
          {
            path: 'chat',
            name: 'SystemAiChat',
            component: () => import('@/views/System/SystemAi/AiChat/AiChatPage.vue'),
            meta: { title: 'AI 对话', permission: 'system:ai:chat' }
          },
          {
            path: 'workshop',
            name: 'SystemAiWorkshop',
            component: () => import('@/views/System/SystemAi/AiWorkshop/AiWorkshopPage.vue'),
            meta: { title: 'AI 工坊', permission: 'system:ai:workshop' }
          },
          {
            path: 'fim',
            name: 'SystemAiFim',
            component: () => import('@/views/System/SystemAi/AiFim/AiFimPage.vue'),
            meta: { title: 'AI 续写', permission: 'system:ai:fim' }
          },
          {
            path: 'model-config',
            name: 'SystemAiModelConfig',
            component: () => import('@/views/System/SystemAi/AiModelConfig/AiModelConfigPage.vue'),
            meta: { title: '模型配置', permission: 'system:ai:model-config' }
          }
        ]
      },
      {
        path: '/403',
        name: 'Forbidden',
        component: Forbidden,
        meta: { ignore: true }
      },
      { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound, meta: { ignore: true } }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 前置路由导航守卫
router.beforeEach((to, from) => {
  const loginInfoStore = useLoginInfoStore()
  const { loginToken } = storeToRefs(loginInfoStore)

  // 处理相同路由跳转问题（允许仅查询参数变化的导航，用于筛选条件 URL 同步）
  if (!to.meta.isRedirect && to.name === from.name && to.fullPath === from.fullPath) return `/redirect${to.path}`

  // 加载条
  controlStrixLoadingBar('start')

  // 计算动态参数路由
  if (to.meta.titleTemplate && to.params) {
    to.meta.title = replaceDynamicName(to.meta.titleTemplate as string, to.params)
  }
  // 设置网页标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - Strix`
  } else {
    document.title = 'Strix'
  }

  if (to.path === '/login') return
  if (!loginToken.value) return '/login?to=' + to.fullPath

  // 权限路由守卫：检查当前路由或其匹配的父路由链中是否有 permission 要求
  const requiredPermission = to.matched
    .map((record) => record.meta.permission as string | undefined)
    .filter(Boolean)
    .pop()

  if (requiredPermission) {
    const permissions = loginInfoStore.loginInfo.permissionKeys || []
    if (!permissions.includes('*:*:*') && !permissions.includes(requiredPermission)) {
      return { path: '/403', query: { path: to.fullPath, permission: requiredPermission }, replace: true }
    }
  }
})

// 后置路由导航守卫
router.afterEach((to, from, failure) => {
  if (failure && failure.type !== 16) {
    return controlStrixLoadingBar('error')
  }
  controlStrixLoadingBar('finish')
})

export default router
