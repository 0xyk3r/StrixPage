# Copilot Instructions — StrixPage Frontend

## Commands

```bash
pnpm dev          # Dev server on 0.0.0.0:19889 — access via Nginx at http://localhost:13232/
pnpm build        # Type-check (vue-tsc) + Vite build in parallel
pnpm preview      # Preview production build
pnpm lint         # oxlint + eslint --fix
pnpm format       # Prettier formatting on src/
pnpm type-check   # vue-tsc type checking only
```

Node: `^20.19.0 || >=22.12.0`. Package manager: **pnpm**. No test framework is configured.

## Architecture

Vue 3.5 + TypeScript ~6.0 + Vite 8 + Naive UI 2.44 + Pinia 3 — admin dashboard for the Strix business platform.
All UI text is in **Chinese**. Path alias: `@/` → `./src/`.

### Source Structure

- `api/` — Typed API modules (auth, manager, role, menu, dict, monitor, job, sms, oss, etc.). All responses use
  `RetResult<T>`.
- `components/common/` — Reusable components prefixed `Strix*` (`StrixBlock`, `StrixTag`, `StrixImage`, `StrixEmpty`,
  etc.).
- `components/data/` — Data selection components (Manager/Role pickers, NameFetcher).
- `components/system/` — Layout components (TabBar, Toolbar, Breadcrumb, CommandPalette, etc.).
- `composables/` — Composition utilities prefixed `use*` (`useCrud`, `useDict`, `usePagination`, `useTableColumns`,
  `useTableExport`, `useTokenRenewal`, `useFormDraft`, etc.).
- `directives/auth.ts` — `v-auth` permission directive.
- `plugins/axios.ts` — Axios with SM2/SM4 encryption + SM3 request signing.
- `stores/` — Pinia stores with localStorage persistence (`login-info`, `dict`, `strix-settings`, `tabs-bar`,
  `http-canceler`, etc.).
- `utils/` — Helpers (form-rules, date-util, file-util, table-tool, dialog, message, loading-bar, etc.).
- `views/System/` — System management pages (LoginPage, HomePage layout, and module pages for User, Role, Menu, Dict,
  Monitor, Job, SMS, OSS, etc.).
- `assets/style/` — SCSS design system: `tokens/` (variables), `mixins/`, `nebula.scss` (baseline), `rewrite.scss` (
  Naive UI overrides).

### HTTP Communication (`plugins/axios.ts`)

All API requests go through `/api/` and are encrypted:

1. Generate random SM4 key → encrypt with server's SM2 public key (C1C3C2)
2. Encrypt request body with SM4/CBC → send `sign` (encrypted key), `data` (encrypted payload), `iv`
3. SM3 hash in `sign` header for request signature
4. Response decrypted via SM2 private key + SM4/CBC

**Request meta**: `meta.operate` (logging label), `meta.notify` (success toast), `meta.requestGroup` (cancellation
group).
**Error handling**: 401 → clear auth & redirect to login; 429 → rate limit with retry-after.

**Environment variables** for crypto keys:

- `VITE_APP_SERVER_SM2_PUBLIC_KEY`
- `VITE_APP_CLIENT_SM2_PRIVATE_KEY`

### Permission System

- Permissions stored as `loginInfo.permissionKeys` in format `module:resource:action`
- `v-auth="'system:user:update'"` — single permission
- `v-auth="['perm1', 'perm2']"` — OR logic (default)
- `v-auth.and="['perm1', 'perm2']"` — AND logic
- Super permission: `*:*:*`

### Auto-imports (no manual import needed)

- **Vue APIs**: `ref`, `computed`, `watch`, `onMounted`, etc.
- **Vue Router**: `useRouter`, `useRoute`, etc.
- **Naive UI**: `useDialog`, `useMessage`, `useNotification`, `useLoadingBar`
- **Naive UI components**: All registered automatically via `unplugin-vue-components`

## Key Conventions

### View Component Pattern

List views follow a consistent structure:

1. `StrixBlock` with search/filter controls
2. `n-data-table` with remote pagination via `usePagination` composable
3. Add/Edit modals with `n-form` validation

### Code Style

- **Formatting**: Prettier — no semicolons, single quotes, 120 char width, no trailing commas
- **Linting**: OXLint (correctness errors) + ESLint (Vue/TypeScript rules)
- **Components**: `<script lang="ts" setup>` + `<style lang="scss" scoped>`
- **SCSS**: Do not use deprecated Sass syntax (e.g. `@import` — use `@use` instead)

### Naming

- **Components**: PascalCase, prefixed `Strix*` for shared components
- **Composables**: camelCase, prefixed `use*`
- **Stores**: `use*Store` pattern (e.g. `useLoginInfoStore`)
- **Constants**: UPPER_SNAKE_CASE

### Theming

- Dark/light mode with OS detection, switchable via mitt event bus
- Theme overrides in `App.vue` — primary color: `#2db48c` (light) / `#63e2b7` (dark)
- Custom font stack: Manrope, Alimama FangYuanTi, PingFang SC, system fonts

### State Persistence

- Pinia stores persist to localStorage via `pinia-plugin-persistedstate`
- Dictionary data cached with version-based invalidation and request deduplication

### Development Environment

- Dev server must be accessed via Nginx reverse proxy at `http://localhost:13232/`
- API documentation: `http://localhost:13232/api/v3/api-docs/swagger-config`
- Backend API proxied to `http://localhost:13232/api/`
