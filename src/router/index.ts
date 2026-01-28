import { useLoginInfoStore } from '@/stores/login-info'
import { replaceDynamicName } from '@/utils/dynamic-component-util'
import { controlStrixLoadingBar } from '@/utils/strix-loading-bar'
import { storeToRefs } from 'pinia'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const Redirect = () => import('@/components/StrixRedirect.vue')
const NotFound = () => import('@/components/StrixNotFound.vue')
const DynamicWrapper = () => import('@/components/DynamicWrapper.vue')

const customRoutes: any[] = []

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
          title: '系统人员管理'
        }
      },
      {
        path: '/system/role',
        name: 'SystemRoleIndex',
        component: () => import('@/views/System/SystemRole/SystemRoleIndex.vue'),
        meta: {
          title: '系统角色管理'
        }
      },
      {
        path: '/system/menu',
        name: 'SystemMenuIndex',
        component: () => import('@/views/System/SystemMenu/SystemMenuIndex.vue'),
        meta: {
          title: '系统菜单管理'
        }
      },
      {
        path: 'system/user',
        name: 'SystemUserIndex',
        component: () => import('@/views/System/SystemUser/SystemUserIndex.vue'),
        meta: {
          title: '系统用户管理'
        }
      },
      {
        path: 'system/region',
        name: 'SystemRegionIndex',
        component: () => import('@/views/System/SystemRegion/SystemRegionIndex.vue'),
        meta: {
          title: '系统地区管理'
        }
      },
      {
        path: 'system/dict',
        name: 'SystemDictIndex',
        component: () => import('@/views/System/SystemDict/SystemDictIndex.vue'),
        meta: {
          title: '系统字典管理'
        }
      },
      {
        path: 'system/dict/:dictKey',
        name: 'DynamicWrapper',
        component: DynamicWrapper,
        meta: {
          title: '字典数据',
          titleTemplate: ' 字典数据 - {dictKey}',
          parentRouteName: 'SystemDictIndex',
          isDynamicWrapper: true,
          dynamicComponent: () => import('@/views/System/SystemDict/SystemDictData.vue'),
          dynamicComponentNameTemplate: 'SystemDictData-{dictKey}'
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
            component: () => import('@/views/System/SystemMonitor/Server/SystemMonitorServerIndex.vue'),
            meta: {
              title: '系统运行信息',
              empty: false
            }
          },
          {
            path: 'cache',
            name: 'SystemMonitorCacheIndex',
            component: () => import('@/views/System/SystemMonitor/Cache/SystemMonitorCacheIndex.vue'),
            meta: {
              title: '系统缓存信息',
              empty: false
            }
          },
          {
            path: 'log',
            name: 'SystemMonitorLogIndex',
            component: () => import('@/views/System/SystemMonitor/Log/SystemMonitorLogIndex.vue'),
            meta: {
              title: '系统日志列表',
              empty: false
            }
          }
        ]
      },
      {
        path: 'system/tool',
        name: 'SystemTool',
        meta: {
          title: '系统工具管理'
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
              title: '热度工具'
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
              empty: false
            }
          },
          {
            path: 'log',
            name: 'SystemModuleJobLog',
            component: () => import('@/views/System/SystemModule/Job/SystemModuleJobIndex.vue'),
            meta: {
              title: '定时任务日志',
              parentRouteName: 'SystemModuleJobIndex',
              empty: false
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
                  empty: false
                }
              },
              {
                path: 'log',
                name: 'SystemModuleSmsLog',
                component: () => import('@/views/System/SystemModule/Sms/SystemModuleSmsLog.vue'),
                meta: {
                  title: '短信日志列表',
                  empty: false
                }
              },
              {
                path: 'sign',
                name: 'SystemModuleSmsSign',
                component: () => import('@/views/System/SystemModule/Sms/SystemModuleSmsSign.vue'),
                meta: {
                  title: '短信签名列表',
                  empty: false
                }
              },
              {
                path: 'template',
                name: 'SystemModuleSmsTemplate',
                component: () => import('@/views/System/SystemModule/Sms/SystemModuleSmsTemplate.vue'),
                meta: {
                  title: '短信模板列表',
                  empty: false
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
                  empty: false
                }
              },
              {
                path: 'bucket',
                name: 'SystemModuleOssBucket',
                component: () => import('@/views/System/SystemModule/Oss/SystemModuleOssBucket.vue'),
                meta: {
                  title: '存储空间管理',
                  empty: false
                }
              },
              {
                path: 'filegroup',
                name: 'SystemModuleOssFileGroup',
                component: () => import('@/views/System/SystemModule/Oss/SystemModuleOssFileGroup.vue'),
                meta: {
                  title: '文件分组管理',
                  empty: false
                }
              },
              {
                path: 'file',
                name: 'SystemModuleOssFile',
                component: () => import('@/views/System/SystemModule/Oss/SystemModuleOssFile.vue'),
                meta: {
                  title: '存储文件列表',
                  empty: false
                }
              }
            ]
          }
        ]
      },
      {
        path: 'system/workflow',
        name: 'SystemWorkflow',
        meta: {
          title: '工作流程管理',
          empty: true
        },
        children: [
          {
            path: 'config',
            name: 'SystemWorkflowConfigIndex',
            component: () => import('@/views/System/Workflow/Config/SystemWorkflowConfigIndex.vue'),
            meta: {
              title: '流程引擎列表',
              empty: false
            }
          },
          {
            path: 'editor/:workflowId/:configId',
            name: 'SystemWorkflowConfigEditor',
            component: () => import('@/views/System/Workflow/Config/SystemWorkflowConfigEditor.vue'),
            meta: {
              title: '流程绘制工具',
              empty: false,
              parentRouteName: 'SystemModuleWorkflowIndex',
              titleTemplate: '流程绘制工具 - {configId}'
            }
          },
          {
            path: 'submit',
            name: 'SystemWorkflowSubmitList',
            component: () => import('@/views/System/Workflow/SystemWorkflowSubmitList.vue'),
            meta: {
              title: '发起审批',
              empty: false
            }
          },
          {
            path: 'submit/:workflowId',
            name: 'SystemWorkflowSubmit',
            component: () => import('@/views/System/Workflow/SystemWorkflowSubmit.vue'),
            meta: {
              title: '发起审批表单',
              empty: false
            }
          },
          {
            path: 'unfinished',
            name: 'SystemWorkflowTaskUnfinished',
            component: () => import('@/views/System/Workflow/List/SystemWorkflowTaskUnfinished.vue'),
            meta: {
              title: '待我处理',
              empty: false
            }
          },
          {
            path: 'finished',
            name: 'SystemWorkflowTaskFinished',
            component: () => import('@/views/System/Workflow/List/SystemWorkflowTaskFinished.vue'),
            meta: {
              title: '已处理的',
              empty: false
            }
          },
          {
            path: 'initiated',
            name: 'SystemWorkflowTaskInitiated',
            component: () => import('@/views/System/Workflow/List/SystemWorkflowTaskInitiated.vue'),
            meta: {
              title: '我发起的',
              empty: false
            }
          },
          {
            path: 'cc',
            name: 'SystemWorkflowTaskCC',
            component: () => import('@/views/System/Workflow/List/SystemWorkflowTaskCC.vue'),
            meta: {
              title: '抄送我的',
              empty: false
            }
          }
        ]
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
router.beforeEach((to, form, next) => {
  const loginInfoStore = useLoginInfoStore()
  const { loginToken } = storeToRefs(loginInfoStore)

  // 处理相同路由跳转问题
  if (!to.meta.isRedirect && to.name === form.name) return next(`/redirect${to.path}`)

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

  if (to.path === '/login') return next()
  if (!loginToken.value) return next('/login?to=' + to.fullPath)

  return next()
})

// 后置路由导航守卫
router.afterEach((to, from, failure) => {
  if (failure && failure.type !== 16) {
    return controlStrixLoadingBar('error')
  }
  controlStrixLoadingBar('finish')
})

export default router
