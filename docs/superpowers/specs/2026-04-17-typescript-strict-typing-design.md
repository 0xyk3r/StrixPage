# Frontend TypeScript Strict Typing — Design Spec

**Date:** 2026-04-17
**Scope:** StrixPage frontend — eliminate ~135 `any` type usages across 49 files
**Goal:** Better developer experience through type-safe composables and view components. Not enforced by lint (no `no-explicit-any` rule).

---

## Problem

The frontend codebase has ~135 explicit `any` types spread across:

| Category | Count | Location |
|----------|-------|----------|
| Table render `(row: any)` | ~40 | 15+ view pages |
| Composable internals | ~25 | useCrud, useTableColumns, useFilterState |
| Dict data refs `(d: any)` | ~15 | useDict, view pages |
| handleOperate utility | ~10 | strix-table-tool + all action columns |
| StrixTabBar route refs | ~12 | StrixTabBar.vue |
| Export/Import utils | ~10 | useTableExport, useTableImport |
| Miscellaneous | ~23 | catch blocks, event handlers, edge cases |

API modules are well-typed (only 1 stray `any`). The problem is composable generics — `useCrud` doesn't propagate row types to column render functions, forcing every page to use `render(row: any)`.

## Approach

**Layer-by-layer refactoring:** Fix composables first so type improvements cascade automatically to consuming pages. Then address each page to specify its row type and clean up remaining `any` usages.

## Phase 1: Core Composable Generic Typing

### 1.1 `useCrud<TRow>` (src/composables/useCrud.ts)

Add a generic type parameter `TRow` to `useCrud`:

```typescript
export function useCrud<TRow extends Record<string, unknown> = Record<string, unknown>>(
  config: UseCrudConfig<TRow>
): UseCrudReturn<TRow>
```

**Interfaces to parameterize:**

- `CrudApi<TRow>` — `detail` returns `RetResult<TRow>`, `create`/`update` stay `Record<string, unknown>`
- `UseCrudHooks<TRow>` — `afterShowEdit(detail: TRow)`, `beforeShowEdit(row: TRow)`, etc.
- `UseCrudConfig<TRow>` — `columns: () => DataTableColumns<TRow>`, hooks typed
- `useCrud()` return — `selectedRows: Ref<TRow[]>`, `currentRow: Ref<TRow | null>`, etc.

**What stays untyped:**
- `addForm` / `editForm` — remain `Record<string, any>` (forms often differ from row shape)
- `formRules` — Naive UI's `FormRules` type is already adequate

**Cascade effect:** Every page calling `useCrud<SystemRoleItem>({...})` will get typed `render(row: SystemRoleItem)` in column definitions for free via Naive UI's `DataTableColumns<T>`.

### 1.2 `useDict` (src/composables/useDict.ts)

Change return type from `shallowRef<any[]>` to `shallowRef<DictItem[]>`:

```typescript
import type { DictItem } from '@/stores/dict'

export function useDict(dictName: string): ShallowRef<DictItem[]>
```

The `DictItem` interface already exists in `stores/dict.ts` (lines 6-15) with `label`, `value`, `sort`, `remark`, `dictName`, `colorType`, `disabled`.

**Cascade effect:** All `(d: any) => ({ label: d.label, value: d.value })` in views become type-safe.

### 1.3 `useTableColumns` (src/composables/useTableColumns.ts)

Replace `col as any` casts with type guards:

```typescript
// Before
const key = (col as any).key

// After
function isBaseColumn(col: DataTableColumn): col is DataTableBaseColumn {
  return 'key' in col && col.type === undefined
}
// Then: if (isBaseColumn(col)) { col.key ... }
```

This addresses ~7 `any` casts inside the composable.

### 1.4 `useFilterState` (src/composables/useFilterState.ts)

Define typed interfaces:

```typescript
interface FilterOption {
  label: string
  value: string | number
}

interface FilterDefinition {
  key: string
  label: string
  type: 'select' | 'input' | 'date-range'
  options?: Ref<FilterOption[]> | FilterOption[]
  // ...
}

interface ActiveFilter {
  key: string
  label: string
  value: unknown  // genuinely polymorphic — changed from `any`
  displayValue: string
  transform?: (value: unknown) => string
}
```

## Phase 2: Utility Function Typing

### 2.1 `handleOperate` (src/utils/strix-table-tool.ts)

Define `OperateButton` interface:

```typescript
export interface OperateButton {
  type?: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'
  label: string
  icon?: string
  disabled?: boolean | (() => boolean)
  onClick: () => void | Promise<void>
  popconfirm?: boolean
  popconfirmMessage?: string
  auth?: string
  show?: boolean
}

export function handleOperate(buttons: OperateButton[], size?: string): VNodeChild
```

### 2.2 `useTableExport` (src/composables/useTableExport.ts)

Same `DataTableColumn` union type issue as `useTableColumns`. Apply the same `isBaseColumn` type guard. Also type `extractExportableColumns` return and `exportData` row parameter.

### 2.3 `useTableImport` (src/composables/useTableImport.ts)

Define `ImportFieldConfig.dictOptions` item type:

```typescript
interface ImportDictOption {
  label: string
  value: string | number
}

interface ImportFieldConfig {
  key: string
  label: string
  required?: boolean
  dictOptions?: ImportDictOption[]
  // ...
}
```

## Phase 3: Page Component Migration

Each page using `useCrud` specifies its row type:

```typescript
// Before
const crud = useCrud({ api: systemRoleApi, columns: () => [...] })

// After
const crud = useCrud<SystemRoleItem>({ api: systemRoleApi, columns: () => [...] })
```

**Pages to migrate (15 total, 3 batches):**

**Batch 1 — Simple pages (5):**
- SystemRoleIndex.vue (15 `any` → 0)
- SystemDictIndex.vue (10 `any` → 0)
- SystemManagerIndex.vue (9 `any` → 0)
- SystemUserIndex.vue (4 `any` → 0)
- SystemMenuIndex.vue

**Batch 2 — Medium pages (5):**
- SystemDictDataIndex.vue
- SystemJobIndex.vue
- SystemMonitorOssIndex.vue
- SystemMonitorSmsIndex.vue
- SystemMonitorCacheIndex.vue

**Batch 3 — Remaining pages (5):**
- SystemMonitorLogIndex.vue
- SystemMonitorNotificationManageIndex.vue
- SystemMonitorSchedulerIndex.vue
- SystemMonitorSessionIndex.vue
- Any remaining useCrud consumers

**Per-page changes:**
1. Add `<RowType>` generic to `useCrud<RowType>({...})`
2. Remove explicit `(row: any)` annotations from render functions (now inferred)
3. Fix any remaining `any` in the file (dict refs, etc.)

## Phase 4: Miscellaneous Cleanup

### 4.1 StrixTabBar Route Typing

Replace `(r: any)` with Vue Router's `RouteLocationNormalized`:

```typescript
import type { RouteLocationNormalized } from 'vue-router'

// Before: visitedRoutes.value.filter((r: any) => ...)
// After: visitedRoutes.value.filter((r: RouteLocationNormalized) => ...)
```

12 occurrences in `StrixTabBar.vue`.

### 4.2 Catch Blocks and Event Handlers

- `catch (e: any)` → `catch (e: unknown)` (TypeScript best practice)
- Event handler params typed where feasible
- Some `any` may remain where third-party types are genuinely `any` — document these

## Non-Goals

- **No lint rule changes** — no `@typescript-eslint/no-explicit-any`
- **No form typing** — `addForm`/`editForm` stay `Record<string, any>`
- **No API module changes** — already well-typed
- **No OpenAPI codegen** — evaluated and rejected (low ROI)

## Verification

After each phase:
1. `pnpm type-check` — zero errors
2. `pnpm build` — successful production build
3. `pnpm lint` — no new lint errors
4. Manual spot-check: hover over `row` in render functions → should show specific type, not `any`

Final count target: reduce `any` from ~135 to under 15 (justified remainders in form data and genuine polymorphism).

## Risk Mitigation

- **Breaking change risk:** Minimal — generics default to `Record<string, unknown>`, so pages not yet migrated continue to compile
- **Naive UI compatibility:** `DataTableColumns<T>` generic is stable since Naive UI 2.30+
- **Incremental rollout:** Each phase independently compilable and committable
