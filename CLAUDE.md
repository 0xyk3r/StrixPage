# StrixPage 前端

本文件为 Claude Code 提供 StrixPage 前端项目的详细技术指导。

> **注意**：本文件是 `StrixProjects/CLAUDE.md` 的补充文档。在根目录工作时会自动加载此文件。

## 项目信息

- **版本**：3.0.0
- **框架**：Vue 3.5 + TypeScript 6.0 + Vite 8
- **UI 库**：Naive UI 2.44
- **包管理器**：pnpm
- **Node.js 要求**：^20.19.0 或 >=22.12.0
- **开发端口**：19889（通过 Nginx 反向代理到 13232）

## 命令

```bash
# 在 StrixPage/ 目录执行
pnpm install          # 安装依赖
pnpm dev              # 启动开发服务器（访问 http://localhost:13232/）
pnpm build            # 生产构建（类型检查 + 构建并行执行）
pnpm preview          # 预览生产构建
pnpm lint             # 代码检查（oxlint + eslint）
pnpm format           # 代码格式化（oxfmt）
pnpm type-check       # 仅类型检查
pnpm dict:types       # 从数据库同步字典类型
```

**重要**：开发环境必须通过 Nginx 反向代理访问（`http://localhost:13232/`），直接访问 19889 端口会导致跨域问题。

## 架构概览

### 技术栈

- **Vue 3.5**：Composition API (`<script setup>`)
- **TypeScript 6.0**：严格类型检查
- **Vite 8**：快速构建和热更新
- **Naive UI 2.44**：唯一 UI 组件库（不混用其他库）
- **Pinia 3**：状态管理 + localStorage 持久化
- **Vue Router 5**：路由管理
- **Axios**：HTTP 客户端（内置 SM2/SM4 加密）
- **ECharts 6**：数据可视化
- **@lucide/vue**：图标库
- **SCSS**：样式预处理器

### 自动导入

无需手动 import，以下 API 自动可用：

**Vue Composition API**：

- `ref`, `reactive`, `computed`, `watch`, `watchEffect`
- `onMounted`, `onUnmounted`, `nextTick`
- `toRef`, `toRefs`, `unref`

**Vue Router**：

- `useRouter`, `useRoute`

**Naive UI**：

- `useDialog`, `useMessage`, `useNotification`, `useLoadingBar`

**组件自动注册**：

- Naive UI 组件（`n-button`, `n-input` 等）
- 项目组件需手动注册或按需导入

### 路径别名

```typescript
import { xxx } from '@/xxx' // @ = ./src/
```

## 目录结构

```
src/
├── api/                      # API 模块（按业务域划分）
│   ├── types.ts                     # 通用类型定义
│   ├── auth.ts                      # 认证相关
│   ├── manager.ts                   # 管理员
│   ├── user.ts                      # 普通用户
│   └── ...
├── assets/                   # 静态资源
│   ├── style/                       # 全局样式
│   │   ├── tokens/                  # CSS 变量
│   │   ├── mixins/                  # SCSS Mixins
│   │   ├── nebula.scss              # 基线样式重置
│   │   └── rewrite.scss             # Naive UI 样式覆盖
│   └── images/
├── components/               # 组件
│   ├── common/                      # 通用组件（StrixBlock, StrixTag, StrixImage 等）
│   ├── data/                        # 数据选择组件（ManagerPicker, RolePicker, NameFetcher）
│   └── system/                      # 系统组件（TabBar, Toolbar, Breadcrumb）
├── composables/              # 组合式函数
│   ├── useCrud.ts                   # CRUD 核心逻辑
│   ├── useDict.ts                   # 字典数据
│   ├── usePagination.ts             # 分页管理
│   ├── useTableColumns.ts           # 表格列配置
│   ├── useFormDraft.ts              # 表单草稿自动保存
│   └── ...
├── directives/               # 自定义指令
│   └── auth.ts                      # v-auth 权限指令
├── plugins/                  # 插件
│   └── axios.ts                     # Axios 实例（加密配置）
├── router/                   # 路由
│   └── index.ts
├── stores/                   # Pinia 状态管理
│   ├── login-info.ts                # 登录信息（用户、权限、菜单）
│   ├── dict.ts                      # 字典缓存
│   ├── strix-settings.ts            # 系统设置（主题、布局）
│   ├── tabs-bar.ts                  # 标签页管理
│   └── http-canceler.ts             # HTTP 请求取消
├── utils/                    # 工具函数
│   ├── form-rules.ts                # 表单验证规则
│   ├── table-tool.ts                # 表格工具
│   ├── date-util.ts                 # 日期处理
│   ├── file-util.ts                 # 文件处理
│   ├── dialog.ts                    # 对话框封装
│   └── message.ts                   # 消息提示封装
└── views/                    # 页面视图
    ├── System/                      # 系统管理
    │   ├── LoginPage.vue
    │   ├── HomePage.vue
    │   ├── SystemUser/              # 用户管理
    │   ├── SystemRole/              # 角色管理
    │   ├── SystemMenu/              # 菜单管理
    │   └── ...
    └── ...
```

## API 模块模式

### 定义 API 模块

```typescript
// src/api/manager.ts
import type { RetResult } from './types'
import { http } from '@/plugins/axios'

const _n = '系统人员' // 业务名称（用于日志）
const BASE = 'system/manager'

/** 列表项类型 */
export interface SystemManagerItem {
  id: string
  nickname: string
  loginName: string
  status: number
  createdTime: string
}

/** 列表响应 */
export interface ManagerListResp {
  systemManagerList: SystemManagerItem[]
  total: number
}

/** 更新请求 */
export interface SystemManagerUpdateReq {
  nickname: string
  loginName: string
  loginPassword?: string
  status: number
}

export const managerApi = {
  urls: { list: BASE }, // 暴露 URL（用于 useCrud）

  /** 列表查询 */
  list: (params: Record<string, any>) =>
    http.get<RetResult<ManagerListResp>>(BASE, {
      params,
      meta: { operate: `加载${_n}列表` }
    }),

  /** 详情查询 */
  detail: (id: string) =>
    http.get<RetResult<SystemManagerResp>>(`${BASE}/${id}`, {
      meta: { operate: `加载${_n}信息` }
    }),

  /** 新增 */
  create: (data: SystemManagerUpdateReq) =>
    http.post<RetResult>(`${BASE}/update`, data, {
      meta: { operate: `新增${_n}`, notify: true } // notify: true 显示成功提示
    }),

  /** 编辑 */
  update: (id: string, data: SystemManagerUpdateReq) =>
    http.post<RetResult>(`${BASE}/update/${id}`, data, {
      meta: { operate: `编辑${_n}`, notify: true }
    }),

  /** 删除 */
  remove: (id: string) =>
    http.post<RetResult>(`${BASE}/remove/${id}`, null, {
      meta: { operate: `删除${_n}`, notify: true }
    }),

  /** 批量删除 */
  batchRemove: (ids: string[]) =>
    http.post<RetResult>(
      `${BASE}/batch/remove`,
      { ids },
      {
        meta: { operate: `批量删除${_n}`, notify: true }
      }
    )
}
```

### Meta 配置说明

```typescript
meta: {
  operate: '操作名称',      // 显示在 loading 提示中，记录到审计日志
  notify: true,            // 成功后显示 toast 提示
  requestGroup: 'group1'   // 请求分组（同组请求可批量取消）
}
```

## 视图组件模式（useCrud）

### 标准 CRUD 页面结构

```
StrixBlock（搜索区）
  ↓
n-data-table（数据列表，远程分页）
  ↓
n-modal（新增/编辑表单）
```

### 完整示例

```vue
<script setup lang="ts">
import { managerApi } from '@/api/manager'
import { useCrud } from '@/composables/useCrud'
import { textField, selectField } from '@/utils/form-rules'
import { h } from 'vue'
import StrixTag from '@/components/common/StrixTag.vue'

// CRUD 核心逻辑
const crud = useCrud({
  api: managerApi,

  // 表格列定义
  columns: () => [
    { type: 'selection' },
    { title: 'ID', key: 'id', width: 200 },
    { title: '昵称', key: 'nickname', width: 150 },
    { title: '登录名', key: 'loginName', width: 150 },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (row) => h(StrixTag, { value: row.status, dictName: 'SystemManagerStatus' })
    },
    { title: '创建时间', key: 'createdTime', width: 180 },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (row) =>
        h('div', { class: 'table-actions' }, [
          h('a', { onClick: () => crud.showEdit(row) }, '编辑'),
          h('a', { onClick: () => crud.handleDelete(row) }, '删除')
        ])
    }
  ],

  // 表单验证规则
  formRules: () => ({
    nickname: textField('昵称', 2, 16),
    loginName: textField('登录名', 4, 20),
    loginPassword: textField('密码', 6, 32, crud.isEdit.value), // 编辑时可选
    status: selectField('状态')
  }),

  // 生命周期钩子
  hooks: {
    beforeShowAdd: () => {
      // 重置表单默认值
      crud.formModel.value.status = 1
    },
    afterEdit: (row) => {
      // 编辑时数据转换
      crud.formModel.value.loginPassword = '' // 编辑时密码留空
    },
    transformAdd: (data) => {
      // 新增前数据处理
      return { ...data, someExtraField: 'value' }
    },
    transformUpdate: (data) => {
      // 更新前数据处理（过滤空密码）
      if (!data.loginPassword) delete data.loginPassword
      return data
    }
  }
})

// 搜索参数
const searchParams = reactive({
  keyword: '',
  status: null
})

// 初始化加载
onMounted(() => {
  crud.list(searchParams)
})
</script>

<template>
  <div class="page-container">
    <!-- 搜索区 -->
    <StrixBlock title="搜索条件">
      <n-form inline label-width="80">
        <n-form-item label="关键词">
          <n-input v-model:value="searchParams.keyword" placeholder="昵称/登录名" />
        </n-form-item>
        <n-form-item label="状态">
          <n-select v-model:value="searchParams.status" :options="useDict('SystemManagerStatus')" clearable />
        </n-form-item>
        <n-form-item>
          <n-button type="primary" @click="crud.list(searchParams)">查询</n-button>
          <n-button
            @click="
              searchParams = {}
              crud.list()
            "
          >重置
          </n-button
          >
        </n-form-item>
      </n-form>
    </StrixBlock>

    <!-- 操作栏 -->
    <StrixBlock>
      <n-button type="primary" @click="crud.showAdd()" v-auth="'system:manager:add'"> 新增</n-button>
      <n-button @click="crud.batchRemove()" v-auth="'system:manager:remove'"> 批量删除</n-button>
    </StrixBlock>

    <!-- 数据表格 -->
    <StrixBlock>
      <n-data-table
        remote
        :columns="crud.columns"
        :data="crud.data"
        :loading="crud.loading"
        :pagination="crud.pagination"
        :row-key="(row) => row.id"
        @update:checked-row-keys="crud.handleCheck"
      />
    </StrixBlock>

    <!-- 新增/编辑弹窗 -->
    <n-modal v-model:show="crud.modalVisible" :title="crud.modalTitle">
      <n-form ref="formRef" :model="crud.formModel" :rules="crud.formRules">
        <n-form-item label="昵称" path="nickname">
          <n-input v-model:value="crud.formModel.nickname" />
        </n-form-item>
        <n-form-item label="登录名" path="loginName">
          <n-input v-model:value="crud.formModel.loginName" />
        </n-form-item>
        <n-form-item label="密码" path="loginPassword">
          <n-input v-model:value="crud.formModel.loginPassword" type="password" />
        </n-form-item>
        <n-form-item label="状态" path="status">
          <n-select v-model:value="crud.formModel.status" :options="useDict('SystemManagerStatus')" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-button @click="crud.modalVisible = false">取消</n-button>
        <n-button type="primary" @click="crud.handleSave()">保存</n-button>
      </template>
    </n-modal>
  </div>
</template>
```

### useCrud 提供的响应式状态

```typescript
const crud = useCrud({
  /* ... */
})

// 自动管理的状态
crud.data // 列表数据
crud.loading // 加载状态
crud.pagination // 分页配置
crud.modalVisible // 弹窗显示状态
crud.modalTitle // 弹窗标题
crud.formModel // 表单数据
crud.formRules // 表单验证规则
crud.isEdit // 是否编辑模式
crud.checkedRowKeys // 选中的行

// 方法
crud.list(params) // 加载列表
crud.showAdd() // 显示新增弹窗
crud.showEdit(row) // 显示编辑弹窗
crud.handleSave() // 保存（新增/编辑）
crud.handleDelete(row) // 删除单条
crud.batchRemove() // 批量删除
crud.handleCheck(keys) // 处理行选中
```

## 表单验证规则

使用预定义的规则函数：

```typescript
import {
  textField, // 文本字段
  selectField, // 选择字段
  remarkField, // 备注字段
  numberField, // 数字字段
  emailField, // 邮箱字段
  phoneField, // 手机号字段
  urlField // URL 字段
} from '@/utils/form-rules'

const rules = {
  nickname: textField('昵称', 2, 16), // 必填，2-16字符
  email: emailField('邮箱'), // 必填，邮箱格式
  phone: phoneField('手机号', false), // 选填，手机号格式
  age: numberField('年龄', 1, 150), // 必填，1-150
  remark: remarkField(), // 选填，最多500字符
  status: selectField('状态') // 必填，下拉选择
}
```

## 组件渲染

### 字典标签渲染

```typescript
{
  title: '状态',
  key: 'status',
    render
:
  (row) => h(StrixTag, {
    value: row.status,
    dictName: 'SystemUserStatus'  // 自动从字典获取颜色和标签
  })
}
```

### 操作列渲染

```typescript
{
  title: '操作',
  key: 'actions',
  render: (row) => h('div', { class: 'table-actions' }, [
    h('a', { onClick: () => handleEdit(row) }, '编辑'),
    h('a', { onClick: () => handleDelete(row) }, '删除')
  ])
}
```

## 权限控制

### v-auth 指令

```vue
<!-- 单个权限 -->
<n-button v-auth="'system:user:add'">新增</n-button>

<!-- 多个权限（OR 逻辑） -->
<n-button v-auth="['system:user:add', 'system:user:update']">操作</n-button>

<!-- 多个权限（AND 逻辑） -->
<n-button v-auth.and="['system:user:add', 'system:user:update']">操作</n-button>
```

### 编程式权限检查

```typescript
import { useLoginInfoStore } from '@/stores/login-info'

const loginInfo = useLoginInfoStore()

if (loginInfo.hasPermission('system:user:add')) {
  // 有权限
}

if (loginInfo.hasSuperPermission()) {
  // 超级管理员（*:*:*）
}
```

## 字典数据

### 使用字典

```typescript
import { useDict } from '@/composables/useDict'

// 获取字典数据（自动缓存）
const statusOptions = useDict('SystemUserStatus')

// 在模板中使用
<n-select :options="useDict('SystemUserStatus')" />
```

### 字典数据格式

```typescript
interface DictOption {
  label: string // 显示文本
  value: number // 值
  color?: string // 颜色（用于 StrixTag）
}
```

### 从数据库同步字典类型

```bash
pnpm dict:types
# 生成 src/types/dict.d.ts 提供类型提示
```

## HTTP 加密通信

`src/utils/crypto.ts` 提供统一的 SM2/SM4 加密实现，`src/plugins/axios.ts` 自动调用：

1. **请求加密**：
    - 生成随机 SM4 密钥
    - 使用服务器 SM2 公钥加密 SM4 密钥
    - 使用 SM4 加密请求体
    - 使用 SM3 签名请求

2. **响应解密**：
    - 使用客户端 SM2 私钥解密 SM4 密钥
    - 使用 SM4 解密响应体

3. **密钥配置**：
    - `.env` 文件中配置公私钥
    - 不提交到 Git

4. **错误处理**：
    - HTTP 200 响应在成功拦截器中处理
    - HTTP 4xx/5xx 响应在错误拦截器中解密并抛出 `StrixError`（`src/utils/strix-error.ts`）
    - `StrixError` 保留后端返回的 `code`、`detail`、`operate` 信息

## 主题与样式

### 主题切换

```typescript
import { useStrixSettingsStore } from '@/stores/strix-settings'

const settings = useStrixSettingsStore()

// 切换主题
settings.toggleTheme() // 切换 dark/light

// 获取当前主题
const isDark = settings.isDark
```

### SCSS 使用

```vue
<style lang="scss" scoped>
@use '@/assets/style/mixins' as *;

.container {
  @include flex-center;

  .item {
    color: var(--primary-color);
  }
}
</style>
```

**重要**：不要使用 `@import`（已废弃），使用 `@use` 代替。

## 代码风格

### Prettier 规则

- **无分号**
- **单引号**
- **120 字符宽度**
- **无尾随逗号**

### ESLint 规则

- Vue 3 推荐规则
- TypeScript 严格模式
- 配合 OXLint 进行快速检查

### 命名规范

- **组件**：PascalCase（`SystemUserIndex.vue`）
- **组合式函数**：use 前缀（`useCrud.ts`）
- **Store**：use 后缀（`useLoginInfoStore`）
- **常量**：UPPER_SNAKE_CASE（`API_BASE_URL`）
- **变量/函数**：camelCase（`handleSubmit`）

## 性能优化

### 路由懒加载

```typescript
{
  path: '/system/user',
  component: () => import('@/views/System/SystemUser/SystemUserIndex.vue')
}
```

### 组件懒加载

```typescript
const StrixImage = defineAsyncComponent(() => import('@/components/common/StrixImage.vue'))
```

### useDict 缓存

字典数据自动缓存到 Pinia store + localStorage，避免重复请求。

### 请求取消

使用 `http-canceler` store 管理请求取消：

```typescript
// 切换路由时自动取消所有未完成的请求
// 相同 requestGroup 的请求会相互取消
```

## API 文档访问

开发环境 API 文档：

- Swagger UI：`http://localhost:13232/api/v3/api-docs/swagger-config`
- OpenAPI JSON：`http://localhost:13232/api/v3/api-docs/default`

## 调试技巧

### Vue DevTools

安装 Vue DevTools 浏览器扩展，可以查看：

- 组件树
- Pinia 状态
- 路由信息
- 性能分析

### 网络调试

打开浏览器开发工具 → Network 标签页：

- 查看请求/响应（已解密）
- 检查请求头（包含 SM3 签名）
- 查看响应时间

### 控制台日志

开发模式下，Axios 拦截器会输出：

- 请求详情
- 响应详情
- 错误信息

## 常见问题

### Q: 跨域问题？

A: 必须通过 Nginx 反向代理（`http://localhost:13232/`）访问，不要直接访问 19889 端口。

### Q: 自动导入失效？

A: 检查 `vite.config.ts` 中的 `unplugin-auto-import` 和 `unplugin-vue-components` 配置。

### Q: 字典数据不显示？

A: 运行 `pnpm dict:types` 同步字典，确保后端字典表有数据。

### Q: 样式不生效？

A: 检查是否使用了 `<style lang="scss" scoped>`，确认没有使用废弃的 `@import`。

---

**提示**：本文档是前端实现细节，更高层次的项目架构和工作流请参考根目录的 `CLAUDE.md`。
