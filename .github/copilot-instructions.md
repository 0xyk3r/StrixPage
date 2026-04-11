# StrixPage Frontend

## Commands

```bash
pnpm dev          # Dev server (0.0.0.0:19889) — must access via Nginx: http://localhost:13232/
pnpm build        # Type-check (vue-tsc) + Vite build in parallel
pnpm lint         # oxlint + eslint --fix
pnpm format       # Prettier formatting on src/
pnpm type-check   # vue-tsc type checking only
```

Node: `^20.19.0 || >=22.12.0`. Package manager: **pnpm**. No test framework configured.

## Architecture

Vue 3.5 + TypeScript ~6.0 + Vite 8 + Naive UI 2.44 + Pinia 3. All UI text in **Chinese**.
Path alias: `@/` → `./src/`. API docs: `http://localhost:13232/api/v3/api-docs/swagger-config`.

### Source Structure

- `api/` — Typed API modules per domain (auth, manager, role, menu, dict, monitor, job, sms, oss, etc.)
- `components/common/` — Reusable `Strix*` components (`StrixBlock`, `StrixTag`, `StrixImage`, `StrixEmpty`, etc.)
- `components/data/` — Data pickers (Manager/Role selectors, NameFetcher)
- `components/system/` — Layout components (TabBar, Toolbar, Breadcrumb, CommandPalette)
- `composables/` — `use*` composition utilities (`useCrud`, `useDict`, `usePagination`, `useTableColumns`,
  `useFormDraft`, etc.)
- `directives/auth.ts` — `v-auth` permission directive
- `plugins/axios.ts` — Axios with SM2/SM4 encryption + SM3 signing
- `stores/` — Pinia stores with localStorage persistence (login-info, dict, strix-settings, tabs-bar)
- `utils/` — Helpers: `form-rules` (validation), `date-util`, `file-util`, `table-tool`, `dialog`, `message`
- `views/System/` — System management pages (LoginPage, HomePage, User, Role, Menu, Dict, etc.)
- `assets/style/` — SCSS: `tokens/` (variables), `mixins/`, `nebula.scss` (baseline), `rewrite.scss` (Naive UI
  overrides)

## API Module Pattern

Define API modules as exported objects with typed methods:

```typescript
import http from '@/plugins/axios'
import type { RetResult } from '@/api/types'

const urls = { list: '/api/system/user', detail: '/api/system/user/' }

export const systemUserApi = {
  list: (params: SystemUserListReq) =>
    http.get<RetResult<SystemUserListResp>>(urls.list, {
      params, meta: { operate: '查询用户列表' },
    }),
  add: (data: SystemUserUpdateReq) =>
    http.post<RetResult<object>>(urls.list + '/update', data, {
      meta: { operate: '新增用户', notify: true },
    }),
  update: (id: string, data: SystemUserUpdateReq) =>
    http.post<RetResult<object>>(urls.detail + id, data, {
      meta: { operate: '修改用户', notify: true },
    }),
}
```

- `meta.operate` — Chinese label for operation logging
- `meta.notify` — show success toast on completion
- `meta.requestGroup` — request cancellation group key
- `RetResult<T>` = `{ code: number, msg: string, data: T }`

## View Component Pattern (useCrud)

All list views follow: **StrixBlock** (search) → **n-data-table** (remote data) → **n-modal** (add/edit form).

`useCrud` is the core composable for CRUD pages:

```typescript
const crud = useCrud({
  api: systemUserApi,
  columns: () => [...],
  formRules: () => ({
    nickname: textField('昵称'),
    status: selectField('状态'),
  }),
  hooks: {
    beforeShowAdd: () => { /* reset form defaults */
    },
    afterEdit: (row) => { /* transform row data for edit form */
    },
    transformAdd: (data) => { /* transform data before API call */
    },
  },
})
```

`useCrud` provides: `list()`, `showAdd()`, `showEdit(row)`, `handleDelete(row)`, reactive `formModel`, `formRules`,
`columns`, `loading`, and draft auto-save via `useFormDraft`.

Use `usePagination` for reactive pagination state synced with list params.
Use `useDict(key)` for dictionary data — returns `shallowRef<any[]>` with store-level caching and request deduplication.

## Column Rendering

Use `h()` render functions in column definitions:

```typescript
{
  title: '状态',
    key
:
  'status',
    render
:
  (row) => h(StrixTag, { value: row.status, dictName: 'SystemUserStatus' }),
}
```

- `StrixTag` with `dictName` prop — renders dictionary-backed tags with correct color/label
- Use `handleOperate()` utility for action column buttons

## Form Rules

Compose form validation rules with utilities from `@/utils/form-rules`:

```typescript
import { textField, selectField, remarkField, numberField } from '@/utils/form-rules'

const rules = {
  name: textField('名称'),           // required text input
  type: selectField('类型'),          // required select
  remark: remarkField(),              // optional textarea
  sort: numberField('排序'),          // required number
}
```

## Permission System

- Format: `module:resource:action` — stored in `loginInfo.permissionKeys`
- `v-auth="'system:user:update'"` — single permission
- `v-auth="['perm1', 'perm2']"` — OR logic (default)
- `v-auth.and="['perm1', 'perm2']"` — AND logic
- Super permission: `*:*:*`

## HTTP Encryption (`plugins/axios.ts`)

All requests are encrypted:

1. Random SM4 key → encrypt with server SM2 public key (C1C3C2)
2. Request body encrypted with SM4/CBC → send `sign`, `data`, `iv` fields
3. SM3 hash in `sign` header for request signing
4. Response decrypted via client SM2 private key + SM4/CBC

Crypto keys: `VITE_APP_SERVER_SM2_PUBLIC_KEY`, `VITE_APP_CLIENT_SM2_PRIVATE_KEY`.
Error handling: 401 → clear auth & redirect to login; 429 → rate limit with retry-after.

## Auto-imports (no manual import needed)

- **Vue APIs**: `ref`, `computed`, `watch`, `onMounted`, etc.
- **Vue Router**: `useRouter`, `useRoute`
- **Naive UI**: `useDialog`, `useMessage`, `useNotification`, `useLoadingBar`
- **Naive UI components**: All registered via `unplugin-vue-components`

## Code Style & Naming

- **SFC format**: `<script lang="ts" setup>` + `<style lang="scss" scoped>`
- **Prettier**: no semicolons, single quotes, 120 char width, no trailing commas
- **Linting**: oxlint (correctness) + eslint (Vue/TS rules)
- **SCSS**: use `@use` not `@import`. Global styles in `src/assets/style/`
- **Components**: PascalCase, shared ones prefixed `Strix*`
- **Composables**: `use*` prefix. **Stores**: `use*Store` pattern
- **Constants**: UPPER_SNAKE_CASE

## Theming & State

- Dark/light mode with OS detection, switchable via mitt event bus
- Theme overrides in `App.vue` — primary: `#2db48c` (light) / `#63e2b7` (dark)
- Pinia stores persist to localStorage via `pinia-plugin-persistedstate`
- Dictionary data cached with version-based invalidation and request deduplication