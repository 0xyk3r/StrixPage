# API Service Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all 107+ hardcoded HTTP URL strings across 35 files with a typed API service layer covering all 124 Swagger endpoints.

**Architecture:** Create 17 module files + 1 types file in `src/api/`. Each module exports an API object (e.g., `userApi`) with typed functions for each endpoint, plus a `urls` object for `createPaginatedFetcher` integration. Components replace `http.get/post` calls with API function calls, eliminating hardcoded URLs and standardizing `meta.operate` labels.

**Tech Stack:** Vue 3, TypeScript, Axios (existing `http` instance from `@/plugins/axios`)

---

## Reference

- Design spec: `docs/superpowers/specs/2026-04-02-api-service-layer-design.md`
- This is a pure refactoring — zero functional changes

## Out of Scope

- `src/utils/strix-region-util.ts` — uses `zjjg/common/region` (different API prefix, not in Swagger docs)
- `src/composables/useTableExport.ts` — keeps its `http` import (generic pagination utility). Only the URL strings passed to `createPaginatedFetcher` from components change.
- `src/plugins/axios.ts` — HTTP infrastructure unchanged
- `src/@types/axios.d.ts` — meta type definition unchanged

## File Map

### New Files (18)

```
src/api/
├── types.ts              # Shared types: RetResult<T>, etc.
├── auth.ts               # Authentication (4 endpoints)
├── common.ts             # Common services (7 endpoints)
├── user.ts               # User management (6 endpoints)
├── manager.ts            # Manager management (7 endpoints)
├── role.ts               # Role management (10 endpoints)
├── menu.ts               # Menu management (7 endpoints)
├── permission.ts         # Permission management (6 endpoints)
├── region.ts             # Region management (8 endpoints)
├── dict.ts               # Dictionary management (10 endpoints)
├── sms.ts                # SMS module (9 endpoints)
├── oss.ts                # OSS module (17 endpoints)
├── job.ts                # Job scheduling (6 endpoints)
├── workflow.ts           # Workflow engine (11 endpoints)
├── monitor.ts            # System monitoring (3 endpoints)
├── notification.ts       # Notifications (4 endpoints)
└── popularity.ts         # Popularity tools (8 endpoints)
```

### Modified Files (30)

**View components (25):**
- `src/views/System/LoginPage.vue`
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
- `src/views/System/Workflow/List/SystemWorkflowTaskInitiated.vue`
- `src/views/System/Workflow/List/SystemWorkflowTaskCC.vue`
- `src/views/System/SystemTool/SystemToolPopularity.vue`

**Stores (2):**
- `src/stores/dict.ts`
- `src/stores/notification.ts`

**Components (1):**
- `src/components/system/StrixToolBar.vue`
- `src/components/captcha/components/CaptchaPuzzle.vue`

**Composables (2):**
- `src/composables/useTokenRenewal.ts`
- `src/composables/useHomeMenu.ts`

## Migration Pattern

All component migrations follow the same pattern:

**Before:**
```typescript
import { http } from '@/plugins/axios'
const _baseName = '资源名'

http
  .get('system/xxx', {
    params: getDataListParams.value,
    meta: { operate: `加载${_baseName}列表` }
  })
  .then(({ data: res }) => {
    dataRef.value = res.data.xxxList
    dataPagination.itemCount = res.data.total
  })
```

**After:**
```typescript
import { xxxApi } from '@/api/xxx'

xxxApi.list(getDataListParams.value).then(({ data: res }) => {
  dataRef.value = res.data.xxxList
  dataPagination.itemCount = res.data.total
})
```

**Rules:**
1. Remove `import { http } from '@/plugins/axios'` — add `import { xxxApi } from '@/api/xxx'`
2. Replace `http.get(url, { params, meta })` → `xxxApi.method(params)`
3. Replace `http.post(url, data, { meta })` → `xxxApi.method(args)`
4. Keep `.then(({ data: res }) => { ... })` callback IDENTICAL
5. Keep `_baseName` if used in dialog messages; remove only if solely used for `meta.operate`
6. Replace `createPaginatedFetcher('system/xxx', ...)` → `createPaginatedFetcher(xxxApi.urls.list, ...)`

---

## Phase 1: Create API Modules

### Task 1: Create Foundation Types

**Files:**
- Create: `src/api/types.ts`

- [ ] **Step 1: Create the `src/api/` directory and `types.ts`**

```typescript
/** 通用 API 响应包装 */
export interface RetResult<T = unknown> {
  code: number
  msg: string
  data: T
}
```

This is intentionally minimal. Each API module defines its own request/response interfaces.
`RetResult<T>` is the sole shared type — it wraps every API response after axios decryption.

- [ ] **Step 2: Verify it compiles**

Run: `pnpm exec vue-tsc --noEmit 2>&1 | Select-String 'src/api'`
Expected: No errors from `src/api/`

---

### Task 2: Create Auth + Common Modules

**Files:**
- Create: `src/api/auth.ts`
- Create: `src/api/common.ts`

- [ ] **Step 1: Create `src/api/auth.ts`**

```typescript
import type { RetResult } from './types'
import { http } from '@/plugins/axios'

export const authApi = {
  login: (data: Record<string, any>) =>
    http.post<RetResult>('system/login', data, {
      meta: { operate: '登录', notify: false },
    }),

  logout: () =>
    http.post<RetResult>('system/logout', null, {
      meta: { operate: '注销' },
    }),

  renewToken: () =>
    http.post<RetResult>('system/renewToken', null, {
      meta: { operate: '续签令牌', notify: false },
    }),

  menus: () =>
    http.get<RetResult>('system/menus', {
      meta: { operate: '加载系统菜单' },
    }),
}
```

- [ ] **Step 2: Create `src/api/common.ts`**

```typescript
import type { RetResult } from './types'
import { http } from '@/plugins/axios'

export interface CaptchaGetResp {
  uuid: string
  originalImageBase64: string
  jigsawImageBase64: string
  secretKey: string
}

export interface CaptchaCheckResp {
  result: boolean
  captchaVerification: string
}

export const commonApi = {
  dictVersion: () =>
    http.get<RetResult>('system/common/dict/_version', {
      meta: { operate: '加载字典版本', notify: false },
    }),

  dictData: (dictKey: string) =>
    http.get<RetResult>(`system/common/dict/${dictKey}`, {
      meta: { operate: '加载字典数据', notify: false },
    }),

  fileDownload: (fileId: string) =>
    http.get(`system/common/file/${fileId}`, {
      responseType: 'blob',
      meta: { operate: '下载文件' },
    }),

  fileUpload: (groupId: string, data: FormData) =>
    http.post<RetResult>(`system/common/file/${groupId}/upload`, data, {
      meta: { operate: '上传文件' },
    }),

  nameFetcher: (params: Record<string, any>) =>
    http.get<RetResult>('system/common/namefetcher', {
      params,
      meta: { operate: '获取名称', notify: false },
    }),

  captchaGet: (data: Record<string, any>) =>
    http.post<RetResult<CaptchaGetResp>>('system/captcha/get', data, {
      meta: { operate: '验证码获取', notify: false },
    }),

  captchaCheck: (data: Record<string, any>) =>
    http.post<RetResult<CaptchaCheckResp>>('system/captcha/check', data, {
      meta: { operate: '验证码校验', notify: false },
    }),
}
```

- [ ] **Step 3: Verify both compile**

Run: `pnpm exec vue-tsc --noEmit 2>&1 | Select-String 'src/api'`

---

### Task 3: Create User + Manager Modules

**Files:**
- Create: `src/api/user.ts`
- Create: `src/api/manager.ts`

- [ ] **Step 1: Create `src/api/user.ts`**

```typescript
import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const _n = '系统用户'
const BASE = 'system/user'

export interface UserListResp {
  systemUserList: any[]
  total: number
}

export const userApi = {
  urls: { list: BASE },

  list: (params: Record<string, any>) =>
    http.get<RetResult<UserListResp>>(BASE, { params, meta: { operate: `加载${_n}列表` } }),

  detail: (id: string) =>
    http.get<RetResult>(`${BASE}/${id}`, { meta: { operate: `加载${_n}信息` } }),

  create: (data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: `新增${_n}` } }),

  update: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, { meta: { operate: `编辑${_n}` } }),

  remove: (id: string) =>
    http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: `删除${_n}` } }),

  modify: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/modify/${id}`, data, { meta: { operate: `修改${_n}字段` } }),
}
```

- [ ] **Step 2: Create `src/api/manager.ts`**

```typescript
import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const _n = '系统人员'
const BASE = 'system/manager'

export interface ManagerListResp {
  systemManagerList: any[]
  total: number
}

export const managerApi = {
  urls: { list: BASE },

  list: (params: Record<string, any>) =>
    http.get<RetResult<ManagerListResp>>(BASE, { params, meta: { operate: `加载${_n}列表` } }),

  detail: (id: string) =>
    http.get<RetResult>(`${BASE}/${id}`, { meta: { operate: `加载${_n}信息` } }),

  create: (data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: `新增${_n}` } }),

  update: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, { meta: { operate: `编辑${_n}` } }),

  remove: (id: string) =>
    http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: `删除${_n}` } }),

  modify: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/modify/${id}`, data, { meta: { operate: `修改${_n}字段` } }),

  transfer: (params?: Record<string, any>) =>
    http.get<RetResult>(`${BASE}/transfer`, { params, meta: { operate: `加载${_n}穿梭框` } }),
}
```

- [ ] **Step 3: Verify both compile**

Run: `pnpm exec vue-tsc --noEmit 2>&1 | Select-String 'src/api'`

---

### Task 4: Create Role + Menu + Permission Modules

**Files:**
- Create: `src/api/role.ts`
- Create: `src/api/menu.ts`
- Create: `src/api/permission.ts`

- [ ] **Step 1: Create `src/api/role.ts`**

```typescript
import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const _n = '系统角色'
const BASE = 'system/role'

export interface RoleListResp {
  systemRoleList: any[]
  total: number
}

export const roleApi = {
  urls: { list: BASE },

  list: (params: Record<string, any>) =>
    http.get<RetResult<RoleListResp>>(BASE, { params, meta: { operate: `加载${_n}列表` } }),

  detail: (id: string) =>
    http.get<RetResult>(`${BASE}/${id}`, { meta: { operate: `加载${_n}信息` } }),

  create: (data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: `新增${_n}` } }),

  update: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, { meta: { operate: `编辑${_n}` } }),

  remove: (id: string) =>
    http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: `删除${_n}` } }),

  updateMenu: (roleId: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update/${roleId}/menu`, data, {
      meta: { operate: '编辑角色菜单' },
    }),

  removePermission: (roleId: string, permissionId: string) =>
    http.post<RetResult>(`${BASE}/remove/${roleId}/permission/${permissionId}`, null, {
      meta: { operate: '移除角色权限' },
    }),

  removeMenu: (roleId: string, menuId: string) =>
    http.post<RetResult>(`${BASE}/remove/${roleId}/menu/${menuId}`, null, {
      meta: { operate: '移除角色菜单' },
    }),

  select: (params?: Record<string, any>) =>
    http.get<RetResult>(`${BASE}/select`, { params, meta: { operate: `加载${_n}下拉列表` } }),

  transfer: (params?: Record<string, any>) =>
    http.get<RetResult>(`${BASE}/transfer`, { params, meta: { operate: `加载${_n}穿梭框` } }),
}
```

- [ ] **Step 2: Create `src/api/menu.ts`**

```typescript
import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const _n = '系统菜单'
const BASE = 'system/menu'

export interface MenuListResp {
  systemMenuList: any[]
}

export const menuApi = {
  urls: { list: BASE },

  list: (params?: Record<string, any>) =>
    http.get<RetResult<MenuListResp>>(BASE, { params, meta: { operate: `加载${_n}列表` } }),

  detail: (id: string) =>
    http.get<RetResult>(`${BASE}/${id}`, { meta: { operate: `加载${_n}信息` } }),

  create: (data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: `新增${_n}` } }),

  update: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, { meta: { operate: `编辑${_n}` } }),

  remove: (id: string) =>
    http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: `删除${_n}` } }),

  modify: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/modify/${id}`, data, { meta: { operate: `修改${_n}字段` } }),

  tree: () =>
    http.get<RetResult>(`${BASE}/tree`, { meta: { operate: `加载${_n}树` } }),
}
```

- [ ] **Step 3: Create `src/api/permission.ts`**

```typescript
import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const _n = '系统权限'
const BASE = 'system/permission'

export interface PermissionListResp {
  systemPermissionList: any[]
  total: number
}

export const permissionApi = {
  urls: { list: BASE },

  list: (params: Record<string, any>) =>
    http.get<RetResult<PermissionListResp>>(BASE, { params, meta: { operate: `加载${_n}列表` } }),

  detail: (id: string) =>
    http.get<RetResult>(`${BASE}/${id}`, { meta: { operate: `加载${_n}信息` } }),

  create: (data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: `新增${_n}` } }),

  update: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, { meta: { operate: `编辑${_n}` } }),

  remove: (id: string) =>
    http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: `删除${_n}` } }),

  transfer: (params?: Record<string, any>) =>
    http.get<RetResult>(`${BASE}/transfer`, { params, meta: { operate: `加载${_n}穿梭框` } }),
}
```

- [ ] **Step 4: Verify all three compile**

Run: `pnpm exec vue-tsc --noEmit 2>&1 | Select-String 'src/api'`

---

### Task 5: Create Region + Dict Modules

**Files:**
- Create: `src/api/region.ts`
- Create: `src/api/dict.ts`

- [ ] **Step 1: Create `src/api/region.ts`**

```typescript
import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const _n = '系统地区'
const BASE = 'system/region'

export interface RegionListResp {
  systemRegionList: any[]
  total: number
}

export const regionApi = {
  urls: { list: BASE },

  list: (params: Record<string, any>) =>
    http.get<RetResult<RegionListResp>>(BASE, { params, meta: { operate: `加载${_n}列表` } }),

  detail: (id: string) =>
    http.get<RetResult>(`${BASE}/${id}`, { meta: { operate: `加载${_n}信息` } }),

  create: (data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: `新增${_n}` } }),

  update: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, { meta: { operate: `编辑${_n}` } }),

  remove: (id: string) =>
    http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: `删除${_n}` } }),

  children: (id: string) =>
    http.get<RetResult>(`${BASE}/${id}/children`, { meta: { operate: '加载子地区' } }),

  tree: () =>
    http.get<RetResult>(`${BASE}/tree`, { meta: { operate: `加载${_n}树` } }),

  cascader: () =>
    http.get<RetResult>(`${BASE}/cascader`, { meta: { operate: `加载${_n}级联选择` } }),
}
```

- [ ] **Step 2: Create `src/api/dict.ts`**

Note: `urls.dataList` is a function because the URL includes a dynamic `key` parameter. This works with `createPaginatedFetcher` which accepts `string | (() => string)`.

```typescript
import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const _n = '系统字典'
const BASE = 'system/dict'

export interface DictListResp {
  items: any[]
  total: number
}

export interface DictDataListResp {
  items: any[]
  total: number
}

export const dictApi = {
  urls: {
    list: BASE,
    dataList: (key: string) => `${BASE}/data/${key}`,
  },

  list: (params: Record<string, any>) =>
    http.get<RetResult<DictListResp>>(BASE, { params, meta: { operate: `加载${_n}列表` } }),

  detail: (id: string) =>
    http.get<RetResult>(`${BASE}/${id}`, { meta: { operate: `加载${_n}信息` } }),

  create: (data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: `新增${_n}` } }),

  update: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, { meta: { operate: `编辑${_n}` } }),

  remove: (id: string) =>
    http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: `删除${_n}` } }),

  dataList: (key: string, params: Record<string, any>) =>
    http.get<RetResult<DictDataListResp>>(`${BASE}/data/${key}`, {
      params,
      meta: { operate: '加载字典数据列表' },
    }),

  dataDetail: (key: string, id: string) =>
    http.get<RetResult>(`${BASE}/data/${key}/${id}`, { meta: { operate: '加载字典数据信息' } }),

  dataCreate: (key: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/data/${key}/update`, data, { meta: { operate: '新增字典数据' } }),

  dataUpdate: (key: string, id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/data/${key}/update/${id}`, data, { meta: { operate: '编辑字典数据' } }),

  dataRemove: (key: string, id: string) =>
    http.post<RetResult>(`${BASE}/data/${key}/remove/${id}`, null, { meta: { operate: '删除字典数据' } }),
}
```

- [ ] **Step 3: Verify both compile**

Run: `pnpm exec vue-tsc --noEmit 2>&1 | Select-String 'src/api'`

---

### Task 6: Create SMS + OSS Modules

**Files:**
- Create: `src/api/sms.ts`
- Create: `src/api/oss.ts`

- [ ] **Step 1: Create `src/api/sms.ts`**

```typescript
import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const _n = '短信服务'
const BASE = 'system/sms'

export interface SmsListResp {
  configs: any[]
  total: number
}

export interface SmsTemplateListResp {
  templates: any[]
  total: number
}

export interface SmsSignListResp {
  signs: any[]
  total: number
}

export interface SmsLogListResp {
  logs: any[]
  total: number
}

export const smsApi = {
  urls: {
    list: BASE,
    templateList: `${BASE}/template`,
    signList: `${BASE}/sign`,
    logList: `${BASE}/log`,
  },

  list: (params: Record<string, any>) =>
    http.get<RetResult<SmsListResp>>(BASE, { params, meta: { operate: `加载${_n}列表` } }),

  detail: (id: string) =>
    http.get<RetResult>(`${BASE}/${id}`, { meta: { operate: `加载${_n}信息` } }),

  create: (data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: `新增${_n}` } }),

  update: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, { meta: { operate: `编辑${_n}` } }),

  remove: (id: string) =>
    http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: `删除${_n}` } }),

  templateList: (params: Record<string, any>) =>
    http.get<RetResult<SmsTemplateListResp>>(`${BASE}/template`, {
      params,
      meta: { operate: '加载短信模板列表' },
    }),

  signList: (params: Record<string, any>) =>
    http.get<RetResult<SmsSignListResp>>(`${BASE}/sign`, {
      params,
      meta: { operate: '加载短信签名列表' },
    }),

  logList: (params: Record<string, any>) =>
    http.get<RetResult<SmsLogListResp>>(`${BASE}/log`, {
      params,
      meta: { operate: '加载短信日志列表' },
    }),

  configSelect: () =>
    http.get<RetResult>(`${BASE}/config/select`, { meta: { operate: '加载短信配置下拉列表' } }),
}
```

- [ ] **Step 2: Create `src/api/oss.ts`**

```typescript
import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const _n = '存储服务'
const BASE = 'system/oss'

export interface OssListResp {
  configs: any[]
  total: number
}

export interface OssFileListResp {
  files: any[]
  total: number
}

export interface OssFileGroupListResp {
  fileGroups: any[]
  total: number
}

export interface OssBucketListResp {
  buckets: any[]
  total: number
}

export const ossApi = {
  urls: {
    list: BASE,
    fileList: `${BASE}/file`,
    fileGroupList: `${BASE}/fileGroup`,
    bucketList: `${BASE}/bucket`,
  },

  // Config CRUD
  list: (params: Record<string, any>) =>
    http.get<RetResult<OssListResp>>(BASE, { params, meta: { operate: `加载${_n}列表` } }),

  detail: (id: string) =>
    http.get<RetResult>(`${BASE}/${id}`, { meta: { operate: `加载${_n}信息` } }),

  create: (data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: `新增${_n}` } }),

  update: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, { meta: { operate: `编辑${_n}` } }),

  remove: (id: string) =>
    http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: `删除${_n}` } }),

  configSelect: () =>
    http.get<RetResult>(`${BASE}/config/select`, { meta: { operate: '加载存储配置下拉列表' } }),

  // File
  fileList: (params: Record<string, any>) =>
    http.get<RetResult<OssFileListResp>>(`${BASE}/file`, {
      params,
      meta: { operate: '加载存储文件列表' },
    }),

  fileRemove: (id: string) =>
    http.post<RetResult>(`${BASE}/file/remove/${id}`, null, { meta: { operate: '删除存储文件' } }),

  // File Group CRUD
  fileGroupList: (params: Record<string, any>) =>
    http.get<RetResult<OssFileGroupListResp>>(`${BASE}/fileGroup`, {
      params,
      meta: { operate: '加载文件分组列表' },
    }),

  fileGroupDetail: (id: string) =>
    http.get<RetResult>(`${BASE}/fileGroup/${id}`, { meta: { operate: '加载文件分组信息' } }),

  fileGroupCreate: (data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/fileGroup/update`, data, { meta: { operate: '新增文件分组' } }),

  fileGroupUpdate: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/fileGroup/update/${id}`, data, { meta: { operate: '编辑文件分组' } }),

  fileGroupRemove: (id: string) =>
    http.post<RetResult>(`${BASE}/fileGroup/remove/${id}`, null, { meta: { operate: '删除文件分组' } }),

  fileGroupSelect: () =>
    http.get<RetResult>(`${BASE}/fileGroup/select`, { meta: { operate: '加载文件分组下拉列表' } }),

  fileGroupSelectByConfig: (configKey: string) =>
    http.get<RetResult>(`${BASE}/fileGroup/select/${configKey}`, {
      meta: { operate: '加载指定配置的文件分组' },
    }),

  // Bucket CRUD
  bucketList: (params: Record<string, any>) =>
    http.get<RetResult<OssBucketListResp>>(`${BASE}/bucket`, {
      params,
      meta: { operate: '加载存储空间列表' },
    }),

  bucketCreate: (data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/bucket/update`, data, { meta: { operate: '新增存储空间' } }),

  bucketUpdate: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/bucket/update/${id}`, data, { meta: { operate: '编辑存储空间' } }),

  bucketRemove: (id: string) =>
    http.post<RetResult>(`${BASE}/bucket/remove/${id}`, null, { meta: { operate: '删除存储空间' } }),
}
```

- [ ] **Step 3: Verify both compile**

Run: `pnpm exec vue-tsc --noEmit 2>&1 | Select-String 'src/api'`

---

### Task 7: Create Remaining Modules

**Files:**
- Create: `src/api/job.ts`
- Create: `src/api/workflow.ts`
- Create: `src/api/monitor.ts`
- Create: `src/api/notification.ts`
- Create: `src/api/popularity.ts`

- [ ] **Step 1: Create `src/api/job.ts`**

```typescript
import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const _n = '定时任务'
const BASE = 'system/job'

export interface JobListResp {
  items: any[]
  total: number
}

export const jobApi = {
  urls: { list: BASE },

  list: (params: Record<string, any>) =>
    http.get<RetResult<JobListResp>>(BASE, { params, meta: { operate: `加载${_n}列表` } }),

  detail: (id: string) =>
    http.get<RetResult>(`${BASE}/${id}`, { meta: { operate: `加载${_n}信息` } }),

  create: (data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: `新增${_n}` } }),

  update: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, { meta: { operate: `编辑${_n}` } }),

  remove: (id: string) =>
    http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: `删除${_n}` } }),

  run: (id: string) =>
    http.post<RetResult>(`${BASE}/run/${id}`, null, { meta: { operate: `执行${_n}` } }),
}
```

- [ ] **Step 2: Create `src/api/workflow.ts`**

```typescript
import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const BASE = 'system/workflow'
const CONFIG_BASE = `${BASE}/config`

export interface WorkflowConfigListResp {
  items: any[]
  total: number
}

export interface WorkflowTaskListResp {
  items: any[]
  total: number
}

export const workflowApi = {
  urls: {
    configList: CONFIG_BASE,
    unfinishedList: `${BASE}/unfinished`,
    finishedList: `${BASE}/finished`,
    initiatedList: `${BASE}/initiated`,
    ccList: `${BASE}/cc`,
  },

  configList: (params: Record<string, any>) =>
    http.get<RetResult<WorkflowConfigListResp>>(CONFIG_BASE, {
      params,
      meta: { operate: '加载流程引擎列表' },
    }),

  configDetail: (id: string) =>
    http.get<RetResult>(`${CONFIG_BASE}/${id}`, { meta: { operate: '加载流程引擎信息' } }),

  configCreate: (data: Record<string, any>) =>
    http.post<RetResult>(`${CONFIG_BASE}/update`, data, { meta: { operate: '新增流程引擎' } }),

  configUpdate: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${CONFIG_BASE}/update/${id}`, data, { meta: { operate: '编辑流程引擎' } }),

  configUpdateContent: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${CONFIG_BASE}/update/${id}/config`, data, {
      meta: { operate: '保存流程绘制' },
    }),

  configRemove: (id: string) =>
    http.post<RetResult>(`${CONFIG_BASE}/remove/${id}`, null, { meta: { operate: '删除流程引擎' } }),

  configSelect: () =>
    http.get<RetResult>(`${CONFIG_BASE}/select`, { meta: { operate: '加载流程引擎下拉列表' } }),

  configGetConfig: (configId: string) =>
    http.get<RetResult>(`${CONFIG_BASE}/config/${configId}`, {
      meta: { operate: '加载流程绘制数据' },
    }),

  unfinishedList: (params: Record<string, any>) =>
    http.get<RetResult<WorkflowTaskListResp>>(`${BASE}/unfinished`, {
      params,
      meta: { operate: '加载待处理工作列表' },
    }),

  finishedList: (params: Record<string, any>) =>
    http.get<RetResult<WorkflowTaskListResp>>(`${BASE}/finished`, {
      params,
      meta: { operate: '加载已处理工作列表' },
    }),

  initiatedList: (params: Record<string, any>) =>
    http.get<RetResult>(`${BASE}/initiated`, {
      params,
      meta: { operate: '加载我发起的工作列表' },
    }),

  ccList: (params: Record<string, any>) =>
    http.get<RetResult>(`${BASE}/cc`, {
      params,
      meta: { operate: '加载抄送我的工作列表' },
    }),
}
```

- [ ] **Step 3: Create `src/api/monitor.ts`**

```typescript
import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const BASE = 'system/monitor'

export interface MonitorLogListResp {
  items: any[]
  total: number
}

export const monitorApi = {
  urls: { logList: `${BASE}/log` },

  logList: (params: Record<string, any>) =>
    http.get<RetResult<MonitorLogListResp>>(`${BASE}/log`, {
      params,
      meta: { operate: '加载系统日志列表' },
    }),

  cacheInfo: () =>
    http.get<RetResult>(`${BASE}/cache`, { meta: { operate: '加载缓存信息' } }),

  serverInfo: () =>
    http.get<RetResult>(`${BASE}/server`, { meta: { operate: '加载服务器信息' } }),
}
```

- [ ] **Step 4: Create `src/api/notification.ts`**

```typescript
import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const BASE = 'system/common/notification'

export const notificationApi = {
  list: (data: Record<string, any>) =>
    http.post<RetResult>(BASE, data, { meta: { operate: '加载通知列表' } }),

  unreadCount: () =>
    http.get<RetResult>(`${BASE}/unread-count`, {
      meta: { operate: '加载未读通知数量', notify: false },
    }),

  markRead: (notificationId: string) =>
    http.post<RetResult>(`${BASE}/${notificationId}/read`, null, {
      meta: { operate: '标记通知已读' },
    }),

  markAllRead: () =>
    http.post<RetResult>(`${BASE}/read-all`, null, { meta: { operate: '全部标记已读' } }),
}
```

- [ ] **Step 5: Create `src/api/popularity.ts`**

```typescript
import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const _n = '热度配置'
const BASE = 'system/tool/popularity'

export interface PopularityListResp {
  items: any[]
}

export interface PopularityDataListResp {
  items: any[]
  total: number
}

export const popularityApi = {
  urls: { list: BASE },

  list: () =>
    http.get<RetResult<PopularityListResp>>(BASE, { meta: { operate: `加载${_n}列表` } }),

  detail: (id: string) =>
    http.get<RetResult>(`${BASE}/${id}`, { meta: { operate: `加载${_n}信息` } }),

  create: (data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update`, data, { meta: { operate: `保存${_n}` } }),

  update: (id: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, { meta: { operate: `保存${_n}` } }),

  remove: (id: string) =>
    http.post<RetResult>(`${BASE}/remove/${id}`, null, { meta: { operate: `删除${_n}` } }),

  dataList: (id: string, params: Record<string, any>) =>
    http.get<RetResult<PopularityDataListResp>>(`${BASE}/${id}/data`, {
      params,
      meta: { operate: '加载热度数据列表' },
    }),

  dataUpdate: (id: string, dataId: string, data: Record<string, any>) =>
    http.post<RetResult>(`${BASE}/${id}/data/update/${dataId}`, data, {
      meta: { operate: '修改热度数据数值' },
    }),

  dataRemove: (id: string, dataId: string) =>
    http.post<RetResult>(`${BASE}/${id}/data/remove/${dataId}`, null, {
      meta: { operate: '删除热度数据' },
    }),
}
```

- [ ] **Step 6: Verify all five compile**

Run: `pnpm exec vue-tsc --noEmit 2>&1 | Select-String 'src/api'`

---

### Task 8: Verify All API Modules

**Files:** None (verification only)

- [ ] **Step 1: Run full type-check**

Run: `pnpm type-check`
Expected: PASS with zero errors

- [ ] **Step 2: Commit API module files**

```bash
git add src/api/
git commit -m "feat: create API service layer with 17 typed modules (124 endpoints)

Create src/api/ directory with centralized API functions for all
Swagger endpoints. Each module exports a typed API object with
meta.operate labels and URL constants for createPaginatedFetcher.

Modules: auth, common, user, manager, role, menu, permission,
region, dict, sms, oss, job, workflow, monitor, notification,
popularity + shared types.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Phase 2: Migrate Components

### Task 9: Migrate Auth Consumers

**Files:**
- Modify: `src/views/System/LoginPage.vue`
- Modify: `src/components/system/StrixToolBar.vue`
- Modify: `src/composables/useTokenRenewal.ts`
- Modify: `src/composables/useHomeMenu.ts`

- [ ] **Step 1: Migrate `LoginPage.vue`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { authApi } from '@/api/auth'`

Call replacement:
- `http.post('system/login', { ...form }, { meta: { operate: '登录', notify: false } })` → `authApi.login({ ...form })`

The `.then()` / `.catch()` / `.finally()` chain stays identical.

- [ ] **Step 2: Migrate `StrixToolBar.vue`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { authApi } from '@/api/auth'`

Call replacement:
- `http.post('system/logout', null, { meta: { operate: '注销' } })` → `authApi.logout()`

- [ ] **Step 3: Migrate `useTokenRenewal.ts`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { authApi } from '@/api/auth'`

Call replacement:
- `http.post('system/renewToken', null, { meta: { operate: '续签令牌', notify: false } })` → `authApi.renewToken()`

Keep `{ data: res }` destructuring and all subsequent logic.

- [ ] **Step 4: Migrate `useHomeMenu.ts`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { authApi } from '@/api/auth'`

Call replacement:
- `http.get('system/menus', { meta: { operate: '加载菜单' } })` → `authApi.menus()`

- [ ] **Step 5: Verify and commit**

Run: `pnpm type-check`

```bash
git add src/views/System/LoginPage.vue src/components/system/StrixToolBar.vue src/composables/useTokenRenewal.ts src/composables/useHomeMenu.ts
git commit -m "refactor: migrate auth consumers to authApi

Replace http.get/post calls with authApi functions in LoginPage,
StrixToolBar, useTokenRenewal, and useHomeMenu.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 10: Migrate User + Manager Views

**Files:**
- Modify: `src/views/System/SystemUser/SystemUserIndex.vue`
- Modify: `src/views/System/SystemManager/SystemManagerIndex.vue`

- [ ] **Step 1: Migrate `SystemUserIndex.vue`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { userApi } from '@/api/user'`

Call replacements (keep all `.then()` callbacks identical):
1. `http.get('system/user', { params: getDataListParams.value, meta: ... })` → `userApi.list(getDataListParams.value)`
2. `http.get(\`system/user/${id}\`, { meta: ... })` → `userApi.detail(id)` (use the variable that contains the id)
3. `http.post('system/user/update', addDataForm.value, { meta: ... })` → `userApi.create(addDataForm.value)` (if create call exists)
4. `http.post(\`system/user/update/${editDataId.value}\`, editDataForm.value, { meta: ... })` → `userApi.update(editDataId.value, editDataForm.value)`
5. `http.post(\`system/user/remove/${id}\`, null, { meta: ... })` → `userApi.remove(id)`

createPaginatedFetcher: `'system/user'` → `userApi.urls.list`

- [ ] **Step 2: Migrate `SystemManagerIndex.vue`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { managerApi } from '@/api/manager'`
- Add: `import { regionApi } from '@/api/region'`
- Add: `import { roleApi } from '@/api/role'`

Call replacements:
1. `http.get('system/manager', { params: ..., meta: ... })` → `managerApi.list(getDataListParams.value)`
2. `http.get(\`system/manager/${row.id}\`, { meta: ... })` → `managerApi.detail(row.id)` (for role details expansion)
3. `http.get('system/region/cascader', { meta: ... })` → `regionApi.cascader()`
4. `http.get('system/role/select', { meta: ... })` → `roleApi.select()`
5. `http.post(\`system/manager/modify/${systemManagerId}\`, ..., { meta: ... })` → `managerApi.modify(systemManagerId, data)`
6. `http.post('system/manager/update', addDataForm.value, { meta: ... })` → `managerApi.create(addDataForm.value)`
7. `http.get(\`system/manager/${id}\`, { meta: ... })` → `managerApi.detail(id)` (for edit form)
8. `http.post(\`system/manager/update/${editDataId.value}\`, ..., { meta: ... })` → `managerApi.update(editDataId.value, editDataForm.value)`
9. `http.post(\`system/manager/remove/${id}\`, null, { meta: ... })` → `managerApi.remove(id)`

createPaginatedFetcher: `'system/manager'` → `managerApi.urls.list`

- [ ] **Step 3: Verify and commit**

Run: `pnpm type-check`

```bash
git add src/views/System/SystemUser/ src/views/System/SystemManager/
git commit -m "refactor: migrate user + manager views to API service layer

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 11: Migrate Role + Menu Views

**Files:**
- Modify: `src/views/System/SystemRole/SystemRoleIndex.vue`
- Modify: `src/views/System/SystemMenu/SystemMenuIndex.vue`

- [ ] **Step 1: Migrate `SystemRoleIndex.vue`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { roleApi } from '@/api/role'`
- Add: `import { menuApi } from '@/api/menu'`

Call replacements:
1. `http.get('system/role', { params: ..., meta: ... })` → `roleApi.list(getDataListParams.value)`
2. `http.get(\`system/role/${row.id}\`, ...)` → `roleApi.detail(row.id)` (expand row)
3. `http.post('system/role/update', ..., { meta: ... })` → `roleApi.create(addDataForm.value)`
4. `http.get(\`system/role/${id}\`, ...)` → `roleApi.detail(id)` (edit form)
5. `http.post(\`system/role/update/${editDataId.value}\`, ..., { meta: ... })` → `roleApi.update(editDataId.value, editDataForm.value)`
6. `http.post(\`system/role/remove/${id}\`, null, { meta: ... })` → `roleApi.remove(id)`
7. `http.post(\`system/role/remove/${row.id}/menu/${menuId}\`, ...)` → `roleApi.removeMenu(row.id, menuId)`
8. `http.post(\`system/role/remove/${row.id}/permission/${permissionId}\`, ...)` → `roleApi.removePermission(row.id, permissionId)`
9. `http.get('system/menu', { meta: ... })` → `menuApi.list()` (for menu tree in role-menu modal)
10. `http.get(\`system/role/${roleRow.id}\`, ...)` → `roleApi.detail(roleRow.id)` (for menu editing)
11. `http.post(\`system/role/update/${editRoleMenusRoleId}/menu\`, ...)` → `roleApi.updateMenu(editRoleMenusRoleId, data)`

createPaginatedFetcher: `'system/role'` → `roleApi.urls.list`

- [ ] **Step 2: Migrate `SystemMenuIndex.vue`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { menuApi } from '@/api/menu'`
- Add: `import { permissionApi } from '@/api/permission'`

Call replacements:
1. `http.get('system/menu/tree', { meta: ... })` → `menuApi.tree()` (or `menuApi.list()` depending on actual usage)
2. `http.get(\`system/menu/${row.id}\`, ...)` → `menuApi.detail(row.id)`
3. `http.post('system/menu/update', ..., { meta: ... })` → `menuApi.create(addDataForm.value)`
4. `http.post(\`system/menu/update/${...}\`, ..., { meta: ... })` → `menuApi.update(id, data)`
5. `http.post(\`system/menu/remove/${id}\`, ...)` → `menuApi.remove(id)`
6. `http.get(\`system/permission/${row.id}\`, ...)` → `permissionApi.detail(row.id)`
7. `http.post(\`system/permission/remove/${id}\`, ...)` → `permissionApi.remove(id)`

createPaginatedFetcher: `'system/menu'` → `menuApi.urls.list`

- [ ] **Step 3: Verify and commit**

Run: `pnpm type-check`

```bash
git add src/views/System/SystemRole/ src/views/System/SystemMenu/
git commit -m "refactor: migrate role + menu views to API service layer

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 12: Migrate Region + Dict Views + Dict Store

**Files:**
- Modify: `src/views/System/SystemRegion/SystemRegionIndex.vue`
- Modify: `src/views/System/SystemDict/SystemDictIndex.vue`
- Modify: `src/views/System/SystemDict/SystemDictData.vue`
- Modify: `src/stores/dict.ts`

- [ ] **Step 1: Migrate `SystemRegionIndex.vue`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { regionApi } from '@/api/region'`

Call replacements:
1. `http.get('system/region', { params: ..., meta: ... })` → `regionApi.list(getDataListParams.value)`
2. `http.get(\`system/region/${row.id}/children\`, ...)` → `regionApi.children(row.id)`
3. `http.get('system/region/cascader', ...)` → `regionApi.cascader()`
4. `http.post('system/region/update', ..., { meta: ... })` → `regionApi.create(addDataForm.value)`
5. `http.get(\`system/region/${id}\`, ...)` → `regionApi.detail(id)`
6. `http.post(\`system/region/update/${editDataId.value}\`, ...)` → `regionApi.update(editDataId.value, editDataForm.value)`
7. `http.post(\`system/region/remove/${id}\`, ...)` → `regionApi.remove(id)`

createPaginatedFetcher: `'system/region'` → `regionApi.urls.list`

- [ ] **Step 2: Migrate `SystemDictIndex.vue`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { dictApi } from '@/api/dict'`

Call replacements:
1. `http.get('system/dict', { params: ..., meta: ... })` → `dictApi.list(getDataListParams.value)`
2. `http.post('system/dict/update', ..., { meta: ... })` → `dictApi.create(addDataForm.value)`
3. `http.get(\`system/dict/${id}\`, ...)` → `dictApi.detail(id)`
4. `http.post(\`system/dict/update/${editDataId.value}\`, ...)` → `dictApi.update(editDataId.value, editDataForm.value)`
5. `http.post(\`system/dict/remove/${id}\`, ...)` → `dictApi.remove(id)`

createPaginatedFetcher: `'system/dict'` → `dictApi.urls.list`

- [ ] **Step 3: Migrate `SystemDictData.vue`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { dictApi } from '@/api/dict'`

This view operates on dict data with a `dictKey` from the route. All URLs include `dictKey`.

Call replacements (where `dictKey` is the route param variable, e.g., `route.params.dictKey` or similar):
1. `http.get(\`system/dict/data/${dictKey}\`, { params: ..., meta: ... })` → `dictApi.dataList(dictKey, getDataListParams.value)`
2. `http.post(\`system/dict/data/${dictKey}/update\`, ..., { meta: ... })` → `dictApi.dataCreate(dictKey, addDataForm.value)`
3. `http.get(\`system/dict/data/${dictKey}/${id}\`, ...)` → `dictApi.dataDetail(dictKey, id)`
4. `http.post(\`system/dict/data/${dictKey}/update/${editDataId.value}\`, ...)` → `dictApi.dataUpdate(dictKey, editDataId.value, editDataForm.value)`
5. `http.post(\`system/dict/data/${dictKey}/remove/${id}\`, ...)` → `dictApi.dataRemove(dictKey, id)`

createPaginatedFetcher: The URL is dynamic — use function form:
`createPaginatedFetcher(\`system/dict/data/${dictKey}\`, ...)` → `createPaginatedFetcher(() => dictApi.urls.dataList(dictKey), ...)`

- [ ] **Step 4: Migrate `src/stores/dict.ts`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { commonApi } from '@/api/common'`

Call replacements (uses async/await):
1. `await http.get('system/common/dict/_version', { meta: ... })` → `await commonApi.dictVersion()`
2. `await http.get(\`system/common/dict/${key}\`, { meta: ... })` → `await commonApi.dictData(key)`

- [ ] **Step 5: Verify and commit**

Run: `pnpm type-check`

```bash
git add src/views/System/SystemRegion/ src/views/System/SystemDict/ src/stores/dict.ts
git commit -m "refactor: migrate region + dict views + dict store to API service layer

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 13: Migrate SMS Views

**Files:**
- Modify: `src/views/System/SystemModule/Sms/SystemModuleSmsIndex.vue`
- Modify: `src/views/System/SystemModule/Sms/SystemModuleSmsTemplate.vue`
- Modify: `src/views/System/SystemModule/Sms/SystemModuleSmsSign.vue`
- Modify: `src/views/System/SystemModule/Sms/SystemModuleSmsLog.vue`

- [ ] **Step 1: Migrate `SystemModuleSmsIndex.vue`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { smsApi } from '@/api/sms'`

Call replacements:
1. `http.get('system/sms', { params: ..., meta: ... })` → `smsApi.list(getDataListParams.value)`
2. `http.get(\`system/sms/${row.id}\`, ...)` → `smsApi.detail(row.id)` (expansion data)
3. `http.post('system/sms/update', ..., { meta: ... })` → `smsApi.create(addDataForm.value)`
4. `http.post(\`system/sms/update/${editDataId.value}\`, ...)` → `smsApi.update(editDataId.value, editDataForm.value)`
5. `http.post(\`system/sms/remove/${id}\`, ...)` → `smsApi.remove(id)`

createPaginatedFetcher: `'system/sms'` → `smsApi.urls.list`

- [ ] **Step 2: Migrate `SystemModuleSmsTemplate.vue`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { smsApi } from '@/api/sms'`

Call replacements:
1. `http.get('system/sms/template', { params: ..., meta: ... })` → `smsApi.templateList(getDataListParams.value)`
2. `http.get('system/sms/config/select', { meta: ... })` → `smsApi.configSelect()`

createPaginatedFetcher: `'system/sms/template'` → `smsApi.urls.templateList`

- [ ] **Step 3: Migrate `SystemModuleSmsSign.vue`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { smsApi } from '@/api/sms'`

Call replacements:
1. `http.get('system/sms/sign', { params: ..., meta: ... })` → `smsApi.signList(getDataListParams.value)`
2. `http.get('system/sms/config/select', { meta: ... })` → `smsApi.configSelect()`

createPaginatedFetcher: `'system/sms/sign'` → `smsApi.urls.signList`

- [ ] **Step 4: Migrate `SystemModuleSmsLog.vue`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { smsApi } from '@/api/sms'`

Call replacements:
1. `http.get('system/sms/log', { params: ..., meta: ... })` → `smsApi.logList(getDataListParams.value)`
2. `http.get('system/sms/config/select', { meta: ... })` → `smsApi.configSelect()`

createPaginatedFetcher: `'system/sms/log'` → `smsApi.urls.logList`

- [ ] **Step 5: Verify and commit**

Run: `pnpm type-check`

```bash
git add src/views/System/SystemModule/Sms/
git commit -m "refactor: migrate SMS views to API service layer

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 14: Migrate OSS Views

**Files:**
- Modify: `src/views/System/SystemModule/Oss/SystemModuleOssIndex.vue`
- Modify: `src/views/System/SystemModule/Oss/SystemModuleOssFile.vue`
- Modify: `src/views/System/SystemModule/Oss/SystemModuleOssFileGroup.vue`
- Modify: `src/views/System/SystemModule/Oss/SystemModuleOssBucket.vue`

- [ ] **Step 1: Migrate `SystemModuleOssIndex.vue`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { ossApi } from '@/api/oss'`

Call replacements:
1. `http.get('system/oss', { params: ..., meta: ... })` → `ossApi.list(getDataListParams.value)`
2. `http.get(\`system/oss/${row.id}\`, ...)` → `ossApi.detail(row.id)` (expansion data)
3. `http.post('system/oss/update', ..., { meta: ... })` → `ossApi.create(addDataForm.value)`
4. `http.post(\`system/oss/update/${editDataId.value}\`, ...)` → `ossApi.update(editDataId.value, editDataForm.value)`
5. `http.post(\`system/oss/remove/${id}\`, ...)` → `ossApi.remove(id)`

createPaginatedFetcher: `'system/oss'` → `ossApi.urls.list`

- [ ] **Step 2: Migrate `SystemModuleOssFile.vue`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { ossApi } from '@/api/oss'`
- Add: `import { commonApi } from '@/api/common'`

Call replacements:
1. `http.get('system/oss/file', { params: ..., meta: ... })` → `ossApi.fileList(getDataListParams.value)`
2. `http.get('system/oss/config/select', ...)` → `ossApi.configSelect()`
3. `http.get('system/oss/fileGroup/select', ...)` or `http.get(\`system/oss/fileGroup/select/${configKey}\`, ...)` → `ossApi.fileGroupSelect()` or `ossApi.fileGroupSelectByConfig(configKey)`
4. `http.post(\`system/oss/file/remove/${id}\`, ...)` → `ossApi.fileRemove(id)`
5. `http.get(\`system/common/file/${id}\`, { responseType: 'blob', ... })` → `commonApi.fileDownload(id)`

createPaginatedFetcher: `'system/oss/file'` → `ossApi.urls.fileList`

- [ ] **Step 3: Migrate `SystemModuleOssFileGroup.vue`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { ossApi } from '@/api/oss'`

Call replacements:
1. `http.get('system/oss/fileGroup', { params: ..., meta: ... })` → `ossApi.fileGroupList(getDataListParams.value)`
2. `http.get('system/oss/config/select', ...)` → `ossApi.configSelect()`
3. `http.get(\`system/oss/fileGroup/${id}\`, ...)` → `ossApi.fileGroupDetail(id)`
4. `http.post('system/oss/fileGroup/update', ..., { meta: ... })` → `ossApi.fileGroupCreate(addDataForm.value)`
5. `http.post(\`system/oss/fileGroup/update/${...}\`, ...)` → `ossApi.fileGroupUpdate(id, data)`
6. `http.post(\`system/oss/fileGroup/remove/${id}\`, ...)` → `ossApi.fileGroupRemove(id)`

createPaginatedFetcher: `'system/oss/fileGroup'` → `ossApi.urls.fileGroupList`

- [ ] **Step 4: Migrate `SystemModuleOssBucket.vue`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { ossApi } from '@/api/oss'`

Call replacements:
1. `http.get('system/oss/bucket', { params: ..., meta: ... })` → `ossApi.bucketList(getDataListParams.value)`
2. `http.get('system/oss/config/select', ...)` → `ossApi.configSelect()`
3. `http.post('system/oss/bucket/update', ..., { meta: ... })` → `ossApi.bucketCreate(addDataForm.value)`
4. `http.post(\`system/oss/bucket/update/${...}\`, ...)` → `ossApi.bucketUpdate(id, data)`
5. `http.post(\`system/oss/bucket/remove/${id}\`, ...)` → `ossApi.bucketRemove(id)`

createPaginatedFetcher: `'system/oss/bucket'` → `ossApi.urls.bucketList`

- [ ] **Step 5: Verify and commit**

Run: `pnpm type-check`

```bash
git add src/views/System/SystemModule/Oss/
git commit -m "refactor: migrate OSS views to API service layer

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 15: Migrate Job + Monitor Views

**Files:**
- Modify: `src/views/System/SystemModule/Job/SystemModuleJobIndex.vue`
- Modify: `src/views/System/SystemMonitor/Log/SystemMonitorLogIndex.vue`
- Modify: `src/views/System/SystemMonitor/Cache/SystemMonitorCacheIndex.vue`
- Modify: `src/views/System/SystemMonitor/Server/SystemMonitorServerIndex.vue`

- [ ] **Step 1: Migrate `SystemModuleJobIndex.vue`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { jobApi } from '@/api/job'`

Call replacements:
1. `http.get('system/job', { params: ..., meta: ... })` → `jobApi.list(getDataListParams.value)`
2. `http.get(\`system/job/${id}\`, ...)` → `jobApi.detail(id)`
3. `http.post('system/job/update', ..., { meta: ... })` → `jobApi.create(addDataForm.value)`
4. `http.post(\`system/job/update/${...}\`, ...)` → `jobApi.update(id, data)`
5. `http.post(\`system/job/remove/${id}\`, ...)` → `jobApi.remove(id)`
6. `http.post(\`system/job/run/${id}\`, ...)` → `jobApi.run(id)`

createPaginatedFetcher: `'system/job'` → `jobApi.urls.list`

- [ ] **Step 2: Migrate `SystemMonitorLogIndex.vue`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { monitorApi } from '@/api/monitor'`

Call replacements:
1. `http.get('system/monitor/log', { params: ..., meta: ... })` → `monitorApi.logList(getDataListParams.value)`

createPaginatedFetcher: `'system/monitor/log'` → `monitorApi.urls.logList`

- [ ] **Step 3: Migrate `SystemMonitorCacheIndex.vue`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { monitorApi } from '@/api/monitor'`

Call replacement:
1. `http.get('system/monitor/cache', { meta: ... })` → `monitorApi.cacheInfo()`

- [ ] **Step 4: Migrate `SystemMonitorServerIndex.vue`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { monitorApi } from '@/api/monitor'`

Call replacement:
1. `http.get('system/monitor/server', { meta: ... })` → `monitorApi.serverInfo()`

- [ ] **Step 5: Verify and commit**

Run: `pnpm type-check`

```bash
git add src/views/System/SystemModule/Job/ src/views/System/SystemMonitor/
git commit -m "refactor: migrate job + monitor views to API service layer

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 16: Migrate Workflow Views + Notification Store

**Files:**
- Modify: `src/views/System/Workflow/Config/SystemWorkflowConfigIndex.vue`
- Modify: `src/views/System/Workflow/Config/SystemWorkflowConfigEditor.vue`
- Modify: `src/views/System/Workflow/List/SystemWorkflowTaskUnfinished.vue`
- Modify: `src/views/System/Workflow/List/SystemWorkflowTaskFinished.vue`
- Modify: `src/views/System/Workflow/List/SystemWorkflowTaskInitiated.vue`
- Modify: `src/views/System/Workflow/List/SystemWorkflowTaskCC.vue`
- Modify: `src/stores/notification.ts`

- [ ] **Step 1: Migrate `SystemWorkflowConfigIndex.vue`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { workflowApi } from '@/api/workflow'`

This view uses `_baseApiPrefix = 'system/workflow/config'`. Remove `_baseApiPrefix` if only used for URL construction.

Call replacements:
1. List fetch (getDataList): `http.get(\`${_baseApiPrefix}\`, { params: ..., meta: ... })` → `workflowApi.configList(getDataListParams.value)`
2. `http.get(\`${_baseApiPrefix}/${id}\`, ...)` → `workflowApi.configDetail(id)`
3. `http.post(\`${_baseApiPrefix}/update\`, ...)` → `workflowApi.configCreate(addDataForm.value)`
4. `http.post(\`${_baseApiPrefix}/update/${...}\`, ...)` → `workflowApi.configUpdate(id, data)`
5. `http.post(\`${_baseApiPrefix}/remove/${id}\`, ...)` → `workflowApi.configRemove(id)`

createPaginatedFetcher: `_baseApiPrefix` or `'system/workflow/config'` → `workflowApi.urls.configList`

- [ ] **Step 2: Migrate `SystemWorkflowConfigEditor.vue`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { workflowApi } from '@/api/workflow'`

This view also uses `_baseApiPrefix = 'system/workflow/config'`. Remove it.

Call replacements:
1. `http.get(\`${_baseApiPrefix}/config/${configId}\`, ...)` → `workflowApi.configGetConfig(configId)`
2. `http.post(\`${_baseApiPrefix}/update/${workflowId}/config\`, ...)` → `workflowApi.configUpdateContent(workflowId, data)`

- [ ] **Step 3: Migrate `SystemWorkflowTaskUnfinished.vue`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { workflowApi } from '@/api/workflow'`
- Add: `import { commonApi } from '@/api/common'`

Call replacements:
1. `http.get(\`${_baseApiPrefix}/unfinished\`, { params: ..., meta: ... })` → `workflowApi.unfinishedList(getDataListParams.value)`
2. `http.get('system/common/namefetcher', { params: ..., meta: ... })` → `commonApi.nameFetcher(params)` (workflow name fetch)
3. `http.get('system/common/namefetcher', { params: ..., meta: ... })` → `commonApi.nameFetcher(params)` (manager name fetch)

createPaginatedFetcher: `'system/workflow/unfinished'` → `workflowApi.urls.unfinishedList`

- [ ] **Step 4: Migrate `SystemWorkflowTaskFinished.vue`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { workflowApi } from '@/api/workflow'`
- Add: `import { commonApi } from '@/api/common'`

Call replacements:
1. `http.get(\`${_baseApiPrefix}/finished\`, { params: ..., meta: ... })` → `workflowApi.finishedList(getDataListParams.value)`
2. `http.get('system/common/namefetcher', ...)` → `commonApi.nameFetcher(params)` (×2)

createPaginatedFetcher: `'system/workflow/finished'` → `workflowApi.urls.finishedList`

- [ ] **Step 5: Migrate `SystemWorkflowTaskInitiated.vue`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { workflowApi } from '@/api/workflow'`

Call replacement:
1. `http.get(\`${_baseApiPrefix}/initiated\`, { params: ..., meta: ... })` → `workflowApi.initiatedList(getDataListParams.value)`

createPaginatedFetcher: `'system/workflow/initiated'` → `workflowApi.urls.initiatedList`

**Note:** This view uses `res.data.systemUserList` as the list key (backend naming). The `.then()` callback stays identical.

- [ ] **Step 6: Migrate `SystemWorkflowTaskCC.vue`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { workflowApi } from '@/api/workflow'`

Call replacement:
1. `http.get(\`${_baseApiPrefix}/cc\`, { params: ..., meta: ... })` → `workflowApi.ccList(getDataListParams.value)`

createPaginatedFetcher: `'system/workflow/cc'` → `workflowApi.urls.ccList`

**Note:** Uses `res.data.systemUserList` as list key (same as initiated).

- [ ] **Step 7: Migrate `src/stores/notification.ts`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { notificationApi } from '@/api/notification'`

Call replacements (uses async/await with try/catch):
1. `await http.get('system/common/notification/unread-count', { meta: ... })` → `await notificationApi.unreadCount()`
2. `await http.post('system/common/notification', notificationListParams, { meta: ... })` → `await notificationApi.list(notificationListParams)`
3. `await http.post(\`system/common/notification/${notificationId}/read\`, null, { meta: ... })` → `await notificationApi.markRead(notificationId)`
4. `await http.post('system/common/notification/read-all', null, { meta: ... })` → `await notificationApi.markAllRead()`

- [ ] **Step 8: Verify and commit**

Run: `pnpm type-check`

```bash
git add src/views/System/Workflow/ src/stores/notification.ts
git commit -m "refactor: migrate workflow views + notification store to API service layer

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 17: Migrate CaptchaPuzzle + SystemToolPopularity

**Files:**
- Modify: `src/components/captcha/components/CaptchaPuzzle.vue`
- Modify: `src/views/System/SystemTool/SystemToolPopularity.vue`

- [ ] **Step 1: Migrate `CaptchaPuzzle.vue`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { commonApi } from '@/api/common'`
- Add: `import type { CaptchaGetResp, CaptchaCheckResp } from '@/api/common'`

The component currently defines local `ApiResponse<T>`, `CaptchaGetData`, and `CaptchaCheckData` interfaces. After migration:
- Remove `ApiResponse` interface (no longer needed)
- Remove `CaptchaGetData` — use imported `CaptchaGetResp` instead
- Remove `CaptchaCheckData` — use imported `CaptchaCheckResp` instead

Call replacements (uses async/await):
1. `await http.post<ApiResponse<CaptchaGetData>>('system/captcha/get', { captchaType: 'blockPuzzle' }, { meta: ... })` → `await commonApi.captchaGet({ captchaType: 'blockPuzzle' })`
2. `await http.post<ApiResponse<CaptchaCheckData>>('system/captcha/check', { captchaType: 'blockPuzzle', pointJson, uuid: uuid.value }, { meta: ... })` → `await commonApi.captchaCheck({ captchaType: 'blockPuzzle', pointJson, uuid: uuid.value })`

Update type references:
- `CaptchaGetData` → `CaptchaGetResp`
- `CaptchaCheckData` → `CaptchaCheckResp`

- [ ] **Step 2: Migrate `SystemToolPopularity.vue`**

Import change:
- Remove: `import { http } from '@/plugins/axios'`
- Add: `import { popularityApi } from '@/api/popularity'`

This view uses `_baseApiPrefix = 'system/tool/popularity'` for URL construction. Remove `_baseApiPrefix`.

Call replacements:
1. `http.get(\`${_baseApiPrefix}\`, { meta: ... })` → `popularityApi.list()`
2. `http.get(\`${_baseApiPrefix}/${editDataId.value}\`, ...)` → `popularityApi.detail(editDataId.value)`
3. Combined create/update: `http.post(\`${_baseApiPrefix}/update${editDataId.value ? '/' + editDataId.value : ''}\`, editDataForm.value, ...)` → split into:
   ```typescript
   const promise = editDataId.value
     ? popularityApi.update(editDataId.value, editDataForm.value)
     : popularityApi.create(editDataForm.value)
   promise.then(() => { ... })
   ```
4. `http.post(\`${_baseApiPrefix}/remove/${id}\`, ...)` → `popularityApi.remove(id)`
5. `http.get(\`${_baseApiPrefix}/${editDataId.value}/data\`, { params: ..., meta: ... })` → `popularityApi.dataList(editDataId.value, getPopularitDataListParams.value)`
6. `http.post(\`${_baseApiPrefix}/${editDataId.value}/data/update/${id}\`, { originalValue: value }, ...)` → `popularityApi.dataUpdate(editDataId.value, id, { originalValue: value })`
7. `http.post(\`${_baseApiPrefix}/${editDataId.value}/data/remove/${id}\`, ...)` → `popularityApi.dataRemove(editDataId.value, id)`

- [ ] **Step 3: Verify and commit**

Run: `pnpm type-check`

```bash
git add src/components/captcha/ src/views/System/SystemTool/
git commit -m "refactor: migrate captcha + popularity to API service layer

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Phase 3: Final Verification

### Task 18: Full Verification + Final Commit

**Files:** None (verification only)

- [ ] **Step 1: Run type-check**

Run: `pnpm type-check`
Expected: PASS

- [ ] **Step 2: Run build**

Run: `pnpm build`
Expected: PASS with zero errors

- [ ] **Step 3: Run lint**

Run: `pnpm lint`
Expected: PASS (or only pre-existing warnings)

- [ ] **Step 4: Verify no remaining hardcoded http imports in migrated files**

Run: `grep -r "from '@/plugins/axios'" src/views/ src/stores/ src/components/ src/composables/ --include="*.vue" --include="*.ts" | grep -v "useTableExport" | grep -v "strix-region-util"`

Expected output: Empty (no files should still import http directly, except the two excluded files).

- [ ] **Step 5: Squash-merge or amend commits if desired**

All Phase 1 + Phase 2 commits can be squashed into a single commit if preferred:

```bash
git log --oneline -20  # Review commit history
# Optionally squash
```

---

## Appendix: Response Data Key Reference

| Component | List Key | Total Key |
|-----------|----------|-----------|
| SystemUserIndex | `systemUserList` | `total` |
| SystemManagerIndex | `systemManagerList` | `total` |
| SystemRoleIndex | `systemRoleList` | `total` |
| SystemMenuIndex | `systemMenuList` | — |
| SystemRegionIndex | `systemRegionList` | `total` |
| SystemDictIndex | `items` | `total` |
| SystemDictData | `items` | `total` |
| SystemModuleSmsIndex | `configs` | `total` |
| SystemModuleSmsTemplate | `templates` | `total` |
| SystemModuleSmsSign | `signs` | `total` |
| SystemModuleSmsLog | `logs` | `total` |
| SystemModuleOssIndex | `configs` | `total` |
| SystemModuleOssFile | `files` | `total` |
| SystemModuleOssFileGroup | `fileGroups` | `total` |
| SystemModuleOssBucket | `buckets` | `total` |
| SystemModuleJobIndex | `items` | `total` |
| SystemMonitorLogIndex | `items` | `total` |
| SystemWorkflowConfigIndex | `items` | `total` |
| WorkflowTaskUnfinished | `items` | `total` |
| WorkflowTaskFinished | `items` | `total` |
| WorkflowTaskInitiated | `systemUserList` | `total` |
| WorkflowTaskCC | `systemUserList` | `total` |
| SystemToolPopularity | `items` | — |
| PopularityData | `items` | `total` |

## Appendix: createPaginatedFetcher URL Mapping

| Component | Before (URL string) | After (API urls) |
|-----------|---------------------|------------------|
| SystemUserIndex | `'system/user'` | `userApi.urls.list` |
| SystemManagerIndex | `'system/manager'` | `managerApi.urls.list` |
| SystemRoleIndex | `'system/role'` | `roleApi.urls.list` |
| SystemMenuIndex | `'system/menu'` | `menuApi.urls.list` |
| SystemRegionIndex | `'system/region'` | `regionApi.urls.list` |
| SystemDictIndex | `'system/dict'` | `dictApi.urls.list` |
| SystemDictData | `` `system/dict/data/${key}` `` | `() => dictApi.urls.dataList(key)` |
| SystemModuleSmsIndex | `'system/sms'` | `smsApi.urls.list` |
| SystemModuleSmsTemplate | `'system/sms/template'` | `smsApi.urls.templateList` |
| SystemModuleSmsSign | `'system/sms/sign'` | `smsApi.urls.signList` |
| SystemModuleSmsLog | `'system/sms/log'` | `smsApi.urls.logList` |
| SystemModuleOssIndex | `'system/oss'` | `ossApi.urls.list` |
| SystemModuleOssFile | `'system/oss/file'` | `ossApi.urls.fileList` |
| SystemModuleOssFileGroup | `'system/oss/fileGroup'` | `ossApi.urls.fileGroupList` |
| SystemModuleOssBucket | `'system/oss/bucket'` | `ossApi.urls.bucketList` |
| SystemModuleJobIndex | `'system/job'` | `jobApi.urls.list` |
| SystemMonitorLogIndex | `'system/monitor/log'` | `monitorApi.urls.logList` |
| SystemWorkflowConfigIndex | `'system/workflow/config'` | `workflowApi.urls.configList` |
| WorkflowTaskUnfinished | `'system/workflow/unfinished'` | `workflowApi.urls.unfinishedList` |
| WorkflowTaskFinished | `'system/workflow/finished'` | `workflowApi.urls.finishedList` |
| WorkflowTaskInitiated | `'system/workflow/initiated'` | `workflowApi.urls.initiatedList` |
| WorkflowTaskCC | `'system/workflow/cc'` | `workflowApi.urls.ccList` |
