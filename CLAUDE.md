# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StrixPage is a Vue 3 admin dashboard for the ProjectAn Strix business platform. It uses Vue 3 + Vite + TypeScript with
Naive UI as the component library.

## Common Commands

```bash
# Install dependencies (uses pnpm)
pnpm install

# Development server (runs on port 19889)
pnpm dev

# Production build (runs type-check in parallel with build)
pnpm build

# Type checking only
pnpm type-check

# Linting (runs oxlint then eslint with auto-fix)
pnpm lint

# Format code with Prettier
pnpm format
```

## Architecture

### Core Stack

- **Vue 3** with Composition API (`<script setup>`)
- **Pinia** for state management with `pinia-plugin-persistedstate` for localStorage persistence
- **Vue Router** with route guards for authentication
- **Naive UI** as the UI component library (auto-imported via unplugin-vue-components)
- **Axios** with RSA/AES encryption for API communication
- **SCSS** for styling

### Directory Structure

- `src/components/` - Reusable components organized by category:
    - `common/` - Generic UI components (StrixBlock, StrixImage, StrixTag, etc.)
    - `system/` - Layout components (StrixBreadcrumb, StrixTabBar, StrixToolBar)
    - `icon/` - Icon components (StrixIcon) (dynamically load icon names using `lucide-vue-next`)
    - `data/` - Data fetching components (StrixNameFetcher, StrixManagerSelector, StrixRoleSelector)
- `src/stores/` - Pinia stores (login-info, dict, tabs-bar, notification, etc.)
- `src/composables/` - Vue composables (useDict, usePagination, usePage)
- `src/plugins/` - Axios setup and event bus
- `src/utils/` - Utility functions
- `src/directives/` - Custom Vue directives (v-auth for permissions)
- `src/views/System/` - Admin pages organized by feature module

### Key Patterns

**Auto-imports**: Vue APIs (ref, computed, watch, etc.) and Naive UI composables (useDialog, useMessage, etc.) are
auto-imported via `unplugin-auto-import`.

**Path alias**: `@` maps to `src/` directory.

**Permission directive**: Use `v-auth` for permission-based rendering:

```vue

<div v-auth="'system:user:update'">...</div>
<div v-auth="['perm1', 'perm2']">...</div>
<div v-auth.and="['perm1', 'perm2']">...</div>
```

**HTTP client**: Import from `@/plugins/axios`:

```typescript
import { http } from '@/plugins/axios'
// Requests are automatically encrypted/signed
const { data } = await http.get('endpoint', { meta: { operate: '操作名' } })
```

**Dictionary data**: Use the `useDict` composable for cached dictionary lookups:

```typescript
import { useDict } from '@/composables/useDict'

const dictData = useDict('dictKey')
```

**Pagination**: Use `usePagination` composable with Naive UI tables.

### API Communication

All HTTP requests go through `/api/` base URL with:

- RSA encryption for request body (POST)
- AES encryption for response data
- MD5 signing for request validation
- Automatic token injection from login store

Environment variables for encryption keys are in `.env`:

- `VITE_APP_CLIENT_PRIVATE_KEY`
- `VITE_APP_SERVER_PUBLIC_KEY`
- `VITE_APP_IV`

### State Management

Pinia stores use the setup function syntax with `persist` option:

```typescript
export const useExampleStore = defineStore('example', () => {
  // state and actions
}, { persist: { key: '$key', storage: localStorage } })
```

### PWA Support

The app supports PWA via `vite-plugin-pwa` with prompt-based updates. Service worker registration is handled
automatically.

## Development Notes

- Node.js requirement: `^20.19.0 || >=22.12.0`
- Dev server runs on `0.0.0.0:19889`
- Lucide icons are used via `lucide-vue-next`
