# API 服务层设计规范

## 概述

将 StrixPage 项目中散落在 20+ 个 Vue 组件和 3 个 Store 中的 107 个硬编码 API URL 字符串，
重构为集中管理的 API 服务层。通过 Swagger 文档 (`/api/v3/api-docs`) 全量核对，
为全部 124 个管理中心端点创建带 TypeScript 类型标注的 API 函数。

## 目标

1. **URL 集中管理** — 消除组件中的硬编码字符串
2. **类型安全** — 请求参数和响应均有 TypeScript 类型
3. **操作标签统一** — `meta.operate` 由 API 函数定义，组件不再手动写
4. **IDE 体验提升** — `xxxApi.` 自动补全所有可用操作
5. **全量覆盖** — 基于 Swagger 文档的 124 个端点，包括前端暂未使用的

## 文件结构

```
src/api/
├── types.ts              # 共享类型：RetResult<T>、分页参数/响应、通用请求类型
├── auth.ts               # [系统 - 认证] login, logout, renewToken, menus (4)
├── user.ts               # [系统 - 用户管理] CRUD + modify (5)
├── manager.ts            # [系统 - 管理员管理] CRUD + modify + transfer (6)
├── role.ts               # [系统 - 角色管理] CRUD + menu/permission 管理 + transfer + select (9)
├── menu.ts               # [系统 - 菜单管理] CRUD + tree + modify (6)
├── permission.ts         # [系统 - 权限管理] CRUD + transfer (6)
├── region.ts             # [系统 - 地区管理] CRUD + children + tree + cascader (8)
├── dict.ts               # [系统 - 字典管理] dict CRUD + dictData CRUD (10)
├── sms.ts                # [系统模块 - 短信管理] config CRUD + template/sign/log lists + select (11)
├── oss.ts                # [系统模块 - OSS] config CRUD + file + fileGroup CRUD + bucket CRUD + selects (17)
├── job.ts                # [系统模块 - 定时任务] CRUD + run (5)
├── workflow.ts           # [系统 - 工作流] config CRUD + 4 task lists + config select/detail (11)
├── monitor.ts            # [系统监控] log list + cache info + server info (3)
├── notification.ts       # [通用 - 通知] list + unread count + mark read (4)
├── common.ts             # [通用] dict + file download/upload + namefetcher + captcha (7)
└── popularity.ts         # [系统工具 - 热度管理] config CRUD + data CRUD (7)
```

共 17 个模块文件 + 1 个类型文件。

## 通用类型定义 (`src/api/types.ts`)

```typescript
/** 通用 API 响应包装 */
export interface RetResult<T = unknown> {
  code: number
  msg: string
  data: T
}

/** 分页请求参数 */
export interface PaginationParams {
  pageSize?: number
  pageIndex?: number
}

/** 关键词搜索 + 分页 */
export interface SearchPaginationParams extends PaginationParams {
  keyword?: string
}

/** 单字段修改请求 */
export interface SingleFieldModifyReq {
  field: string
  value: string
}

/** 通用下拉选项 */
export interface CommonSelectItem {
  label: string
  value: string
}

/** 通用下拉响应 */
export interface CommonSelectDataResp {
  options: CommonSelectItem[]
}

/** 通用穿梭框响应 */
export interface CommonTransferDataResp {
  options: CommonSelectItem[]
}

/** 通用树节点 */
export interface CommonTreeItem {
  label: string
  value: string
  children?: CommonTreeItem[]
}

/** 通用树形响应 */
export interface CommonTreeDataResp {
  tree: CommonTreeItem[]
}

/** 通用级联选择器响应 */
export interface CommonCascaderDataResp {
  options: CommonTreeItem[]
}
```

## 模块 API 文件规范

每个模块文件遵循统一结构：

```typescript
// 1. 导入
import type { RetResult, PaginationParams } from './types'
import { http } from '@/plugins/axios'

// 2. 请求类型
export interface XxxListParams extends PaginationParams { ... }
export interface XxxUpdateReq { ... }

// 3. 响应类型
export interface XxxListResp { total: number; xxxList: XxxItem[] }
export interface XxxItem { id: string; ... }

// 4. API 函数对象
export const xxxApi = {
  list: (params: XxxListParams) =>
    http.get<RetResult<XxxListResp>>('system/xxx', {
      params,
      meta: { operate: '加载XXX列表' }
    }),

  detail: (id: string) =>
    http.get<RetResult<XxxItem>>(`system/xxx/${id}`, {
      meta: { operate: '加载XXX信息' }
    }),

  create: (data: XxxUpdateReq) =>
    http.post<RetResult>('system/xxx/update', data, {
      meta: { operate: '新增XXX' }
    }),

  update: (id: string, data: XxxUpdateReq) =>
    http.post<RetResult>(`system/xxx/update/${id}`, data, {
      meta: { operate: '编辑XXX' }
    }),

  remove: (id: string) =>
    http.post<RetResult>(`system/xxx/remove/${id}`, null, {
      meta: { operate: '删除XXX' }
    }),
}
```

### 命名规范

| API 操作 | 函数名 | Swagger 路径模式 |
|----------|--------|------------------|
| 列表查询 | `list` | `GET /system/xxx` |
| 详情查询 | `detail` | `GET /system/xxx/{id}` |
| 新增 | `create` | `POST /system/xxx/update` |
| 编辑 | `update` | `POST /system/xxx/update/{id}` |
| 删除 | `remove` | `POST /system/xxx/remove/{id}` |
| 字段修改 | `modify` | `POST /system/xxx/modify/{id}` |
| 下拉列表 | `select` | `GET /system/xxx/select` |
| 穿梭框 | `transfer` | `GET /system/xxx/transfer` |

### `meta.operate` 规范

操作标签使用中文，格式为 `动词 + 资源名称`：

| 操作类型 | 标签格式 | 示例 |
|----------|----------|------|
| 列表 | `加载${资源名}列表` | `加载用户列表` |
| 详情 | `加载${资源名}信息` | `加载用户信息` |
| 新增 | `新增${资源名}` | `新增用户` |
| 编辑 | `编辑${资源名}` | `编辑用户` |
| 删除 | `删除${资源名}` | `删除用户` |
| 字段修改 | `修改${资源名}字段` | `修改用户字段` |

## Swagger 端点与 API 文件映射

### auth.ts (4 endpoints)

| 方法 | 路径 | 函数名 |
|------|------|--------|
| POST | `/system/login` | `authApi.login` |
| POST | `/system/logout` | `authApi.logout` |
| POST | `/system/renewToken` | `authApi.renewToken` |
| GET | `/system/menus` | `authApi.menus` |

### user.ts (5 endpoints)

| 方法 | 路径 | 函数名 |
|------|------|--------|
| GET | `/system/user` | `userApi.list` |
| GET | `/system/user/{userId}` | `userApi.detail` |
| POST | `/system/user/update` | `userApi.create` |
| POST | `/system/user/update/{userId}` | `userApi.update` |
| POST | `/system/user/remove/{userId}` | `userApi.remove` |
| POST | `/system/user/modify/{userId}` | `userApi.modify` |

### manager.ts (6 endpoints)

| 方法 | 路径 | 函数名 |
|------|------|--------|
| GET | `/system/manager` | `managerApi.list` |
| GET | `/system/manager/{managerId}` | `managerApi.detail` |
| POST | `/system/manager/update` | `managerApi.create` |
| POST | `/system/manager/update/{managerId}` | `managerApi.update` |
| POST | `/system/manager/remove/{managerId}` | `managerApi.remove` |
| POST | `/system/manager/modify/{managerId}` | `managerApi.modify` |
| GET | `/system/manager/transfer` | `managerApi.transfer` |

### role.ts (9 endpoints)

| 方法 | 路径 | 函数名 |
|------|------|--------|
| GET | `/system/role` | `roleApi.list` |
| GET | `/system/role/{roleId}` | `roleApi.detail` |
| POST | `/system/role/update` | `roleApi.create` |
| POST | `/system/role/update/{roleId}` | `roleApi.update` |
| POST | `/system/role/remove/{roleId}` | `roleApi.remove` |
| POST | `/system/role/update/{roleId}/menu` | `roleApi.updateMenu` |
| POST | `/system/role/remove/{roleId}/permission/{permissionId}` | `roleApi.removePermission` |
| POST | `/system/role/remove/{roleId}/menu/{menuId}` | `roleApi.removeMenu` |
| GET | `/system/role/select` | `roleApi.select` |
| GET | `/system/role/transfer` | `roleApi.transfer` |

### menu.ts (6 endpoints)

| 方法 | 路径 | 函数名 |
|------|------|--------|
| GET | `/system/menu` | `menuApi.list` |
| GET | `/system/menu/{menuId}` | `menuApi.detail` |
| POST | `/system/menu/update` | `menuApi.create` |
| POST | `/system/menu/update/{menuId}` | `menuApi.update` |
| POST | `/system/menu/remove/{menuId}` | `menuApi.remove` |
| POST | `/system/menu/modify/{menuId}` | `menuApi.modify` |
| GET | `/system/menu/tree` | `menuApi.tree` |

### permission.ts (6 endpoints)

| 方法 | 路径 | 函数名 |
|------|------|--------|
| GET | `/system/permission` | `permissionApi.list` |
| GET | `/system/permission/{permissionId}` | `permissionApi.detail` |
| POST | `/system/permission/update` | `permissionApi.create` |
| POST | `/system/permission/update/{permissionId}` | `permissionApi.update` |
| POST | `/system/permission/remove/{permissionId}` | `permissionApi.remove` |
| GET | `/system/permission/transfer` | `permissionApi.transfer` |

### region.ts (8 endpoints)

| 方法 | 路径 | 函数名 |
|------|------|--------|
| GET | `/system/region` | `regionApi.list` |
| GET | `/system/region/{id}` | `regionApi.detail` |
| POST | `/system/region/update` | `regionApi.create` |
| POST | `/system/region/update/{id}` | `regionApi.update` |
| POST | `/system/region/remove/{id}` | `regionApi.remove` |
| GET | `/system/region/{id}/children` | `regionApi.children` |
| GET | `/system/region/tree` | `regionApi.tree` |
| GET | `/system/region/cascader` | `regionApi.cascader` |

### dict.ts (10 endpoints)

| 方法 | 路径 | 函数名 |
|------|------|--------|
| GET | `/system/dict` | `dictApi.list` |
| GET | `/system/dict/{id}` | `dictApi.detail` |
| POST | `/system/dict/update` | `dictApi.create` |
| POST | `/system/dict/update/{id}` | `dictApi.update` |
| POST | `/system/dict/remove/{id}` | `dictApi.remove` |
| GET | `/system/dict/data/{key}` | `dictApi.dataList` |
| GET | `/system/dict/data/{key}/{id}` | `dictApi.dataDetail` |
| POST | `/system/dict/data/{key}/update` | `dictApi.dataCreate` |
| POST | `/system/dict/data/{key}/update/{id}` | `dictApi.dataUpdate` |
| POST | `/system/dict/data/{key}/remove/{id}` | `dictApi.dataRemove` |

### sms.ts (11 endpoints)

| 方法 | 路径 | 函数名 |
|------|------|--------|
| GET | `/system/sms` | `smsApi.list` |
| GET | `/system/sms/{id}` | `smsApi.detail` |
| POST | `/system/sms/update` | `smsApi.create` |
| POST | `/system/sms/update/{id}` | `smsApi.update` |
| POST | `/system/sms/remove/{id}` | `smsApi.remove` |
| GET | `/system/sms/template` | `smsApi.templateList` |
| GET | `/system/sms/sign` | `smsApi.signList` |
| GET | `/system/sms/log` | `smsApi.logList` |
| GET | `/system/sms/config/select` | `smsApi.configSelect` |

### oss.ts (17 endpoints)

| 方法 | 路径 | 函数名 |
|------|------|--------|
| GET | `/system/oss` | `ossApi.list` |
| GET | `/system/oss/{id}` | `ossApi.detail` |
| POST | `/system/oss/update` | `ossApi.create` |
| POST | `/system/oss/update/{id}` | `ossApi.update` |
| POST | `/system/oss/remove/{id}` | `ossApi.remove` |
| GET | `/system/oss/config/select` | `ossApi.configSelect` |
| GET | `/system/oss/file` | `ossApi.fileList` |
| POST | `/system/oss/file/remove/{id}` | `ossApi.fileRemove` |
| GET | `/system/oss/fileGroup` | `ossApi.fileGroupList` |
| GET | `/system/oss/fileGroup/{id}` | `ossApi.fileGroupDetail` |
| POST | `/system/oss/fileGroup/update` | `ossApi.fileGroupCreate` |
| POST | `/system/oss/fileGroup/update/{id}` | `ossApi.fileGroupUpdate` |
| POST | `/system/oss/fileGroup/remove/{id}` | `ossApi.fileGroupRemove` |
| GET | `/system/oss/fileGroup/select` | `ossApi.fileGroupSelect` |
| GET | `/system/oss/fileGroup/select/{configKey}` | `ossApi.fileGroupSelectByConfig` |
| GET | `/system/oss/bucket` | `ossApi.bucketList` |
| POST | `/system/oss/bucket/update` | `ossApi.bucketCreate` |
| POST | `/system/oss/bucket/update/{id}` | `ossApi.bucketUpdate` |
| POST | `/system/oss/bucket/remove/{id}` | `ossApi.bucketRemove` |

### job.ts (5 endpoints)

| 方法 | 路径 | 函数名 |
|------|------|--------|
| GET | `/system/job` | `jobApi.list` |
| GET | `/system/job/{id}` | `jobApi.detail` |
| POST | `/system/job/update` | `jobApi.create` |
| POST | `/system/job/update/{id}` | `jobApi.update` |
| POST | `/system/job/remove/{id}` | `jobApi.remove` |
| POST | `/system/job/run/{id}` | `jobApi.run` |

### workflow.ts (11 endpoints)

| 方法 | 路径 | 函数名 |
|------|------|--------|
| GET | `/system/workflow/config` | `workflowApi.configList` |
| GET | `/system/workflow/config/{id}` | `workflowApi.configDetail` |
| POST | `/system/workflow/config/update` | `workflowApi.configCreate` |
| POST | `/system/workflow/config/update/{id}` | `workflowApi.configUpdate` |
| POST | `/system/workflow/config/update/{id}/config` | `workflowApi.configUpdateContent` |
| POST | `/system/workflow/config/remove/{id}` | `workflowApi.configRemove` |
| GET | `/system/workflow/config/select` | `workflowApi.configSelect` |
| GET | `/system/workflow/config/config/{configId}` | `workflowApi.configGetConfig` |
| GET | `/system/workflow/unfinished` | `workflowApi.unfinishedList` |
| GET | `/system/workflow/finished` | `workflowApi.finishedList` |
| GET | `/system/workflow/initiated` | `workflowApi.initiatedList` |
| GET | `/system/workflow/cc` | `workflowApi.ccList` |

### monitor.ts (3 endpoints)

| 方法 | 路径 | 函数名 |
|------|------|--------|
| GET | `/system/monitor/log` | `monitorApi.logList` |
| GET | `/system/monitor/cache` | `monitorApi.cacheInfo` |
| GET | `/system/monitor/server` | `monitorApi.serverInfo` |

### notification.ts (4 endpoints)

| 方法 | 路径 | 函数名 |
|------|------|--------|
| POST | `/system/common/notification` | `notificationApi.list` |
| GET | `/system/common/notification/unread-count` | `notificationApi.unreadCount` |
| POST | `/system/common/notification/{notificationId}/read` | `notificationApi.markRead` |
| POST | `/system/common/notification/read-all` | `notificationApi.markAllRead` |

### common.ts (7 endpoints)

| 方法 | 路径 | 函数名 |
|------|------|--------|
| GET | `/system/common/dict/_version` | `commonApi.dictVersion` |
| GET | `/system/common/dict/{dictKey}` | `commonApi.dictData` |
| GET | `/system/common/file/{fileId}` | `commonApi.fileDownload` |
| POST | `/system/common/file/{groupId}/upload` | `commonApi.fileUpload` |
| GET | `/system/common/namefetcher` | `commonApi.nameFetcher` |
| POST | `/system/captcha/get` | `commonApi.captchaGet` |
| POST | `/system/captcha/check` | `commonApi.captchaCheck` |

### popularity.ts (7 endpoints)

| 方法 | 路径 | 函数名 |
|------|------|--------|
| GET | `/system/tool/popularity` | `popularityApi.list` |
| GET | `/system/tool/popularity/{id}` | `popularityApi.detail` |
| POST | `/system/tool/popularity/update` | `popularityApi.create` |
| POST | `/system/tool/popularity/update/{id}` | `popularityApi.update` |
| POST | `/system/tool/popularity/remove/{id}` | `popularityApi.remove` |
| GET | `/system/tool/popularity/{id}/data` | `popularityApi.dataList` |
| POST | `/system/tool/popularity/{id}/data/update/{dataId}` | `popularityApi.dataUpdate` |
| POST | `/system/tool/popularity/{id}/data/remove/{dataId}` | `popularityApi.dataRemove` |

## 组件改造规则

### 改造前

```typescript
import { http } from '@/plugins/axios'
const _baseName = '系统用户'

http.get('system/user', {
  params: getDataListParams.value,
  meta: { operate: `加载${_baseName}列表` }
}).then(({ data: res }) => {
  dataRef.value = res.data.systemUserList
  dataPagination.itemCount = res.data.total
})
```

### 改造后

```typescript
import { userApi } from '@/api/user'

userApi.list(getDataListParams.value).then(({ data: res }) => {
  dataRef.value = res.data.systemUserList
  dataPagination.itemCount = res.data.total
})
```

### 改造清单

需要改造的文件：

**视图文件 (20+)**
- `src/views/System/SystemUser/SystemUserIndex.vue`
- `src/views/System/SystemManager/SystemManagerIndex.vue`
- `src/views/System/SystemRole/SystemRoleIndex.vue`
- `src/views/System/SystemMenu/SystemMenuIndex.vue`
- `src/views/System/SystemRegion/SystemRegionIndex.vue`
- `src/views/System/SystemDict/SystemDictIndex.vue`
- `src/views/System/SystemDict/SystemDictData.vue`
- `src/views/System/SystemModule/Sms/SystemModuleSmsIndex.vue`
- `src/views/System/SystemModule/Sms/SystemModuleSmsTemplate.vue`
- `src/views/System/SystemModule/Sms/SystemModuleSmsSign.vue`
- `src/views/System/SystemModule/Sms/SystemModuleSmsLog.vue`
- `src/views/System/SystemModule/Oss/SystemModuleOssIndex.vue`
- `src/views/System/SystemModule/Oss/SystemModuleOssFile.vue`
- `src/views/System/SystemModule/Oss/SystemModuleOssFileGroup.vue`
- `src/views/System/SystemModule/Oss/SystemModuleOssBucket.vue`
- `src/views/System/SystemModule/Job/SystemModuleJobIndex.vue`
- `src/views/System/SystemMonitor/Log/SystemMonitorLogIndex.vue`
- `src/views/System/SystemMonitor/Cache/SystemMonitorCacheIndex.vue`
- `src/views/System/SystemMonitor/Server/SystemMonitorServerIndex.vue`
- `src/views/System/Workflow/Config/SystemWorkflowConfigIndex.vue`
- `src/views/System/Workflow/Config/SystemWorkflowConfigEditor.vue`
- `src/views/System/Workflow/List/SystemWorkflowTaskUnfinished.vue`
- `src/views/System/Workflow/List/SystemWorkflowTaskFinished.vue`

**Store 文件 (2)**
- `src/stores/dict.ts`
- `src/stores/notification.ts`

**组件文件 (1)**
- `src/components/system/StrixToolBar.vue`

**Composable 文件 (2+)**
- `src/composables/useTokenRenewal.ts`
- `src/composables/useHomeMenu.ts`
- 其他引用 `http` 的 composable

## 不变的部分

- `src/plugins/axios.ts` — HTTP 实例、拦截器、加密/解密不变
- `src/@types/axios.d.ts` — meta 类型定义不变
- 现有的 `{ data: res }` 解构模式不变
- 错误处理流程（全局拦截器）不变

## 约束

- 纯重构，零功能变更
- 类型标注基于 Swagger 文档，字段名与后端一致
- 响应类型使用泛型 `RetResult<T>` 提供类型提示
- 请求类型字段从 Swagger schemas 中提取
- 未使用的端点函数同样创建（基于 Swagger 文档完整性）
