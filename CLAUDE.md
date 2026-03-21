# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StrixPage is a Vue 3 admin dashboard for the ProjectAn Strix business platform. It uses TypeScript, Vite, Naive UI
component library, and Pinia for state management. All UI text is in Chinese.

## Commands

```bash
pnpm dev          # Start dev server (0.0.0.0:19889)
pnpm build        # Type-check (vue-tsc) + Vite build in parallel
pnpm preview      # Preview production build
pnpm lint         # Run oxlint + eslint --fix
pnpm format       # Prettier formatting
pnpm type-check   # vue-tsc type checking only
```

Node requirement: ^20.19.0 or >=22.12.0

## Architecture

### Key Technologies

- **Vue 3.5** with Composition API (`<script setup>`)
- **Vite 7** with auto-import (Vue/Vue Router APIs) and auto-component registration (Naive UI)
- **Pinia 3** with `pinia-plugin-persistedstate` (localStorage)
- **Naive UI** as the sole component library
- **Axios** with encryption for API communication
- **ECharts 6** for data visualization
- **lucide-vue-next** for icons
- **SCSS** for styling

### Path Alias

`@/` maps to `./src/`

### Source Structure

- `src/components/common/` — Reusable components (`StrixBlock`, `StrixTag`, `StrixImage`, etc.)
- `src/components/data/` — Data selection components (Manager/Role pickers, NameFetcher)
- `src/composables/` — Composition utilities (`usePage`, `useDict`, `usePagination`, `useBaseUrl`, `useTokenRenewal`)
- `src/directives/auth.ts` — `v-auth` directive for permission-based element visibility
- `src/plugins/axios.ts` — Axios instance with SM2/SM4 encryption and SM3 request signing
- `src/stores/` — Pinia stores (login-info, dict, strix-settings, tabs-bar, http-canceler, etc.)
- `src/utils/` — Utility functions (table tools, date/file/region utils, dialog/message helpers)
- `src/views/System/` — All system management views (User, Role, Menu, Dict, Monitor, etc.)

### HTTP Communication (`plugins/axios.ts`)

All API requests go through `/api/` and are encrypted/signed:

- **Request encryption:** SM4 encrypts body (random key per request), SM2 encrypts the SM4 key with server's public key
- **Request signing:** SM3 hash of `(params/body + url + timestamp)`
- **Response decryption:** Reverse SM2+SM4 decryption
- **Config meta:** `meta.operate` (logging label), `meta.notify` (success toast), `meta.requestGroup` (cancellation
  group)
- **Error handling:** 401 → clear auth & redirect to login; 429 → rate limit with retry-after

### Permission System

- Permissions stored as `loginInfo.permissionKeys` in format `module:resource:action`
- `v-auth="'system:user:update'"` — single permission check
- `v-auth="['perm1', 'perm2']"` — OR logic (default), use `.and` modifier for AND
- Super permission: `*:*:*`

### View Component Pattern

List views follow a consistent structure:

1. `StrixBlock` with search/filter controls (cleanable)
2. `n-data-table` with remote pagination via `usePage` composable
3. Add/Edit modals with `n-form` validation

### Auto-imports (no manual import needed)

- Vue Composition API: `ref`, `computed`, `watch`, `onMounted`, etc.
- Vue Router: `useRouter`, `useRoute`, etc.
- Naive UI: `useDialog`, `useMessage`, `useNotification`, `useLoadingBar`

### Theming

- Dark/Light mode with OS detection, switchable via event bus
- Theme overrides configured in `App.vue`

### PWA Support
The app supports PWA via `vite-plugin-pwa` with prompt-based updates. Service worker registration is handled
automatically.

## Code Style

- **Formatting:** Prettier — no semicolons, single quotes, 120 char width, no trailing commas
- **Linting:** ESLint + OXLint; `@typescript-eslint/no-explicit-any` is disabled
- **SCSS:** Global styles in `src/assets/style/`, component styles use `<style lang="scss" scoped>`
