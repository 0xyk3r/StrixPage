# TypeScript 严格类型改进 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate ~135 `any` types across 49 files by strengthening core composable generics and utility types, so type safety cascades automatically to all consuming pages.

**Architecture:** A bottom-up approach — fix the 4 core infrastructure files (`useCrud`, `handleOperate`, `useTableColumns`, `useDict`) first, then migrate pages in batches. Each page migration is a mechanical type annotation change, not a logic change.

**Tech Stack:** TypeScript ~6.0, Vue 3.5, Naive UI 2.44 (`DataTableColumns<T>` generic), Pinia 3

**Design Principle:** This is a developer experience improvement, not a strict enforcement change. The goal is better autocomplete and hover types, not banning `any` via lint rules. Some `any` types (e.g., `ActiveFilter.value`, catch blocks, third-party interop) are acceptable and will remain.

---

## File Structure

**Modified files (core — Phase 1):**
- `src/utils/strix-table-tool.ts` — Define `OperateButton` interface, type `handleOperate`
- `src/composables/useDict.ts` — Return `ShallowRef<DictItem[]>` instead of `ShallowRef<any[]>`
- `src/composables/useTableColumns.ts` — Replace `any` casts with type narrowing
- `src/composables/useCrud.ts` — No generic changes (forms are polymorphic), but type `rowKey` param

**Modified files (pages — Phase 2-3):**
- `src/views/System/SystemRole/SystemRoleIndex.vue` — Pilot: type column `render(row)` with `SystemRoleItem`
- `src/views/System/SystemDict/SystemDictIndex.vue` — Pilot: type with `DictItem`
- `src/views/System/SystemManager/SystemManagerIndex.vue` — Pilot: type with `SystemManagerItem`
- All remaining useCrud pages (~14 files) — batch migration
- `src/views/System/SystemDict/SystemDictData.vue`
- `src/views/System/SystemUser/SystemUserIndex.vue`
- `src/views/System/SystemMenu/SystemMenuIndex.vue`
- `src/views/System/SystemRegion/SystemRegionIndex.vue`
- `src/views/System/SystemMonitor/Log/SystemMonitorLogIndex.vue`
- `src/views/System/SystemModule/Job/SystemModuleJobIndex.vue`
- `src/views/System/SystemModule/Oss/SystemModuleOssIndex.vue`
- `src/views/System/SystemModule/Oss/SystemModuleOssBucket.vue`
- `src/views/System/SystemModule/Oss/SystemModuleOssFile.vue`
- `src/views/System/SystemModule/Oss/SystemModuleOssFileGroup.vue`
- `src/views/System/SystemModule/Sms/SystemModuleSmsIndex.vue`
- `src/views/System/SystemModule/Sms/SystemModuleSmsLog.vue`
- `src/views/System/SystemModule/Sms/SystemModuleSmsSign.vue`
- `src/views/System/SystemModule/Sms/SystemModuleSmsTemplate.vue`

**Modified files (misc cleanup — Phase 4):**
- `src/components/system/StrixTabBar.vue` — Replace `any` with `RouteLocationNormalizedGeneric`
- `src/stores/tabs-bar.ts` — Type `visitedRoutes` and `refreshRoutes` as `RouteLocationNormalizedGeneric[]`
- `src/composables/useFilterState.ts` — Type `options` with `SelectOption[]`
- `src/composables/useTableExport.ts` — Replace `any` casts with type narrowing
- `src/composables/useTableImport.ts` — Type `dictOptions` items

---

## Task 1: Type `handleOperate` utility

**Files:**
- Modify: `src/utils/strix-table-tool.ts`

This is the simplest high-impact fix. Every page's action column calls `handleOperate(buttons)` with `any[]`. Defining a proper `OperateButton` interface gives autocomplete to all action columns immediately.

- [ ] **Step 1: Define `OperateButton` interface and type the function signature**

In `src/utils/strix-table-tool.ts`, replace:

```typescript
export const handleOperate = (buttons: any[], _size = 'medium') => {
  const operateButtons = buttons.map((button) => {
    const { type, label, icon, disabled, onClick, popconfirm, popconfirmMessage } = button
```

With:

```typescript
export interface OperateButton {
  type?: 'primary' | 'error' | 'warning' | 'info' | 'success'
  label?: string
  icon: string
  disabled?: boolean
  onClick: () => void
  popconfirm?: boolean
  popconfirmMessage?: string
}

export const handleOperate = (buttons: OperateButton[], _size = 'medium') => {
  const operateButtons = buttons.map((button) => {
    const { type, label, icon, disabled, onClick, popconfirm, popconfirmMessage } = button
```

- [ ] **Step 2: Run type-check**

```bash
cd StrixPage && pnpm type-check
```

Expected: PASS. All existing call sites already pass objects matching this interface shape. Some pages may pass extra fields or `type: 'error' as const` — check if any type errors appear and fix.

- [ ] **Step 3: Commit**

```bash
cd StrixPage && git add -A && git commit -m "refactor(types): add OperateButton interface to handleOperate

Define typed interface for action column buttons, replacing any[] parameter.
Provides autocomplete for type, label, icon, disabled, onClick, popconfirm fields.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 2: Type `useDict` return value

**Files:**
- Modify: `src/composables/useDict.ts`
- Modify: `src/stores/dict.ts`

Currently `useDict()` returns `ShallowRef<any[]>`. The store already has a `DictItem` interface — we just need to use it.

- [ ] **Step 1: Import and use `DictItem` in useDict**

In `src/composables/useDict.ts`, replace:

```typescript
import type { Ref } from 'vue'
import { useDictStore } from '@/stores/dict.ts'
```

With:

```typescript
import type { Ref } from 'vue'
import { type DictItem, useDictStore } from '@/stores/dict.ts'
```

Then replace the `data` declaration in `useDictFull`:

```typescript
  const data = shallowRef<any[]>([])
```

With:

```typescript
  const data = shallowRef<DictItem[]>([])
```

- [ ] **Step 2: Type `useCascadeDict` filter callback**

In the same file, replace:

```typescript
    return fullData.value.filter((item: any) => item.parentValue === String(parentValue.value))
```

With:

```typescript
    return fullData.value.filter((item) => (item as DictItem & { parentValue?: string }).parentValue === String(parentValue.value))
```

Note: `parentValue` is not in the base `DictItem` interface but exists on cascade dict items. We use an intersection type to access it safely. Alternatively, if `parentValue` is a common dict field, add it to the `DictItem` interface in the store.

- [ ] **Step 3: Check if `DictItem` needs `parentValue` field**

Check the store's `DictItem` interface in `src/stores/dict.ts` (lines 6-15). If `parentValue` is not present and is used in cascade dicts, add it:

In `src/stores/dict.ts`, update the `DictItem` interface if needed:

```typescript
export interface DictItem {
  id: string
  key: string
  label: string
  value: string | number | boolean
  sort: number
  style: string
  status: number
  remark: string
  parentValue?: string
  isDefault?: number
}
```

Also fix the `getDefaultValue` method that uses `any`:

```typescript
    async function getDefaultValue(key: string): Promise<any> {
      const items = await getDictData(key)
      const defaultItem = items.find((item: any) => item.isDefault === 1)
```

Replace with:

```typescript
    async function getDefaultValue(key: string): Promise<DictItem['value'] | null> {
      const items = await getDictData(key)
      const defaultItem = items.find((item) => item.isDefault === 1)
```

- [ ] **Step 4: Run type-check**

```bash
cd StrixPage && pnpm type-check
```

Expected: PASS. Pages that use `useDict` with `.map((d: any) => ...)` will now get typed `d` parameters. Some may still explicitly annotate `any` — those will be cleaned up in the page migration tasks.

- [ ] **Step 5: Commit**

```bash
cd StrixPage && git add -A && git commit -m "refactor(types): type useDict return as DictItem[] instead of any[]

- useDict/useDictFull now return ShallowRef<DictItem[]>
- useCascadeDict filter callback typed
- DictItem interface: add parentValue, isDefault optional fields
- getDefaultValue return type narrowed

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 3: Type `useTableColumns` — eliminate `any` casts

**Files:**
- Modify: `src/composables/useTableColumns.ts`

The core issue: `DataTableColumn` is a union of `DataTableBaseColumn | DataTableSelectionColumn | DataTableExpandColumn`. Only `DataTableBaseColumn` has `.key` and `.title`. Current code casts everything to `any` to access these.

- [ ] **Step 1: Replace `any` casts with type guards**

In `src/composables/useTableColumns.ts`, replace the `isFixedColumn` function:

```typescript
function isFixedColumn(col: any): boolean {
  if (col.type === 'expand' || col.type === 'selection') return true
  if (col.key === 'actions' || col.key === 'action') return true
  return false
}
```

With:

```typescript
function isFixedColumn(col: DataTableColumn): boolean {
  if ('type' in col && (col.type === 'expand' || col.type === 'selection')) return true
  if ('key' in col && (col.key === 'actions' || col.key === 'action')) return true
  return false
}

/** Type guard: is this a base column with key and title? */
function isBaseColumn(col: DataTableColumn): col is DataTableColumn & { key: string; title: string } {
  return 'key' in col && 'title' in col && typeof col.key === 'string' && typeof col.title === 'string'
}
```

- [ ] **Step 2: Update filter/map calls to use the type guard**

Replace the filter/map calls in the function body. Find:

```typescript
  const fixedStartColumns = rawColumns.filter((col: any) => col.type === 'expand' || col.type === 'selection')
  const fixedEndColumns = rawColumns.filter((col: any) => col.key === 'actions' || col.key === 'action')
  const toggleableRawColumns = rawColumns.filter((col: any) => !isFixedColumn(col) && col.key && col.title)
```

Replace with:

```typescript
  const fixedStartColumns = rawColumns.filter((col) => 'type' in col && (col.type === 'expand' || col.type === 'selection'))
  const fixedEndColumns = rawColumns.filter((col) => 'key' in col && (col.key === 'actions' || col.key === 'action'))
  const toggleableRawColumns = rawColumns.filter((col) => !isFixedColumn(col) && isBaseColumn(col))
```

- [ ] **Step 3: Update stored config restoration to use type guard**

Find (lines 47-51):

```typescript
      for (const sc of stored) {
        const raw = toggleableRawColumns.find((c: any) => c.key === sc.key)
        if (raw) {
          result.push({ key: sc.key, title: (raw as any).title as string, visible: sc.visible })
          usedKeys.add(sc.key)
```

Replace with:

```typescript
      for (const sc of stored) {
        const raw = toggleableRawColumns.find((c) => isBaseColumn(c) && c.key === sc.key)
        if (raw && isBaseColumn(raw)) {
          result.push({ key: sc.key, title: raw.title, visible: sc.visible })
          usedKeys.add(sc.key)
```

- [ ] **Step 4: Update remaining `as any` usages in the function**

Find (lines 56-58):

```typescript
      for (const raw of toggleableRawColumns) {
        const col = raw as any
        if (!usedKeys.has(col.key)) {
          result.push({ key: col.key, title: col.title as string, visible: true })
```

Replace with:

```typescript
      for (const raw of toggleableRawColumns) {
        if (isBaseColumn(raw) && !usedKeys.has(raw.key)) {
          result.push({ key: raw.key, title: raw.title, visible: true })
```

Find (lines 65-66):

```typescript
      columnConfigs.value = toggleableRawColumns.map((col: any) => ({
        key: col.key as string,
        title: col.title as string,
```

Replace with:

```typescript
      columnConfigs.value = toggleableRawColumns.filter(isBaseColumn).map((col) => ({
        key: col.key,
        title: col.title,
```

Find (line 92):

```typescript
        const rawCol = rawColumns.find((c: any) => c.key === config.key)
```

Replace with:

```typescript
        const rawCol = rawColumns.find((c) => 'key' in c && c.key === config.key)
```

- [ ] **Step 5: Run type-check**

```bash
cd StrixPage && pnpm type-check
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd StrixPage && git add -A && git commit -m "refactor(types): replace any casts in useTableColumns with type guards

- Add isBaseColumn type guard for DataTableColumn union narrowing
- Remove all (col: any) and (col as any) patterns
- Type-safe access to .key and .title via narrowed types

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 4: Type `useCrud` — narrow `rowKey` and selection column

**Files:**
- Modify: `src/composables/useCrud.ts`

The `useCrud` composable has 7 `any` types. The form-related ones (`addForm`, `editForm`, `transformAdd`, `transformEdit`, `afterShowEdit`) are genuinely polymorphic — forms don't match row types, and different pages have different form shapes. Adding a generic here would complicate usage without much benefit. Instead, we'll narrow the clearly typeable spots.

- [ ] **Step 1: Type `rowKey` and `selectionColumn.disabled`**

In `src/composables/useCrud.ts`, replace:

```typescript
  const rowKey = (row: any) => row.id
```

With:

```typescript
  const rowKey = (row: Record<string, any>) => row.id
```

Replace the selection column disabled callback:

```typescript
      disabled: (row: any) => {
```

With:

```typescript
      disabled: (row: Record<string, any>) => {
```

- [ ] **Step 2: Type `CrudApi` methods more precisely**

Replace the `CrudApi` interface:

```typescript
export interface CrudApi {
  detail?: (id: string) => Promise<AxiosResponse<RetResult>>
  create?: (data: any) => Promise<AxiosResponse<RetResult>>
  update?: (id: string, data: any) => Promise<AxiosResponse<RetResult>>
  remove?: (id: string) => Promise<AxiosResponse<RetResult>>
  batchRemove?: (ids: string[]) => Promise<AxiosResponse<RetResult>>
  batchModify?: (data: { ids: string[]; field: string; value: string }) => Promise<AxiosResponse<RetResult>>
}
```

With:

```typescript
export interface CrudApi {
  detail?: (id: string) => Promise<AxiosResponse<RetResult>>
  create?: (data: Record<string, unknown>) => Promise<AxiosResponse<RetResult>>
  update?: (id: string, data: Record<string, unknown>) => Promise<AxiosResponse<RetResult>>
  remove?: (id: string) => Promise<AxiosResponse<RetResult>>
  batchRemove?: (ids: string[]) => Promise<AxiosResponse<RetResult>>
  batchModify?: (data: { ids: string[]; field: string; value: string }) => Promise<AxiosResponse<RetResult>>
}
```

- [ ] **Step 3: Type `UseCrudHooks` — narrow where possible**

Replace:

```typescript
export interface UseCrudHooks {
  beforeShowAdd?: () => void | Promise<void>
  beforeShowEdit?: (id: string) => void | Promise<void>
  afterShowEdit?: (detail: any) => void
  transformAdd?: (form: any) => any
  transformEdit?: (form: any) => any
  afterAdd?: () => void
  afterEdit?: () => void
  afterDelete?: () => void
  onReset?: () => void
}
```

With:

```typescript
export interface UseCrudHooks {
  beforeShowAdd?: () => void | Promise<void>
  beforeShowEdit?: (id: string) => void | Promise<void>
  afterShowEdit?: (detail: Record<string, any>) => void
  transformAdd?: (form: Record<string, any>) => Record<string, unknown>
  transformEdit?: (form: Record<string, any>) => Record<string, unknown>
  afterAdd?: () => void
  afterEdit?: () => void
  afterDelete?: () => void
  onReset?: () => void
}
```

- [ ] **Step 4: Run type-check**

```bash
cd StrixPage && pnpm type-check
```

Expected: PASS. The `Record<string, any>` and `Record<string, unknown>` types are compatible with all existing call sites. If any page passes a non-object to `create`/`update`, it will be caught — fix at that point.

- [ ] **Step 5: Commit**

```bash
cd StrixPage && git add -A && git commit -m "refactor(types): narrow any types in useCrud interfaces

- CrudApi: create/update data typed as Record<string, unknown>
- UseCrudHooks: afterShowEdit/transformAdd/transformEdit use Record types
- rowKey and selectionColumn.disabled use Record<string, any>

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 5: Pilot page — SystemRoleIndex (typed columns)

**Files:**
- Modify: `src/views/System/SystemRole/SystemRoleIndex.vue`

This page has 15 `any` types — the heaviest. We'll type the column definitions using `DataTableColumns<SystemRoleItem>` and replace `render(row: any)` with `render(row)` (typed via generic).

- [ ] **Step 1: Type the column definitions**

In `SystemRoleIndex.vue`, replace the columns declaration:

```typescript
const dataColumns: DataTableColumns = [
```

With:

```typescript
const dataColumns: DataTableColumns<SystemRoleItem> = [
```

- [ ] **Step 2: Remove `row: any` annotations from render functions**

Replace all `render(row: any)` in the columns with `render(row)` — since `DataTableColumns<SystemRoleItem>` provides the type automatically:

```typescript
    renderExpand: (row: any) => {
```
→
```typescript
    renderExpand: (row) => {
```

```typescript
    render(row: any) {
      return h(StrixTag, {
        value: row.regionPermissionType,
```
→
```typescript
    render(row) {
      return h(StrixTag, {
        value: row.regionPermissionType,
```

```typescript
    render(row: any) {
      return handleOperate([
```
→
```typescript
    render(row) {
      return handleOperate([
```

- [ ] **Step 3: Type other `any` usages in the file**

Replace helper function parameters where the row type is known:

```typescript
const renderExpandMenuChildren = (row: any, children: any, colorIndex: number) => {
```
→
```typescript
const renderExpandMenuChildren = (row: SystemRoleItem, children: SystemMenuManageItem[] | undefined, colorIndex: number) => {
```

```typescript
  children?.forEach((menu: any) => {
```
→
```typescript
  children?.forEach((menu) => {
```

```typescript
const removeRoleMenu = (row: any, menuId: string) => {
```
→
```typescript
const removeRoleMenu = (row: SystemRoleItem, menuId: string) => {
```

```typescript
const removeRolePermission = (row: any, permissionId: string) => {
```
→
```typescript
const removeRolePermission = (row: SystemRoleItem, permissionId: string) => {
```

```typescript
const handleEditSuccessResponse = (row: any, data: any) => {
```
→
```typescript
const handleEditSuccessResponse = (row: SystemRoleItem & { menus?: SystemMenuManageItem[]; loaded?: boolean }, data: SystemRoleResp) => {
```

```typescript
const selectedRows = computed(() =>
  dataRef.value?.filter((row: any) => checkedRowKeys.value.includes(row.id)) ?? []
)
```
→
```typescript
const selectedRows = computed(() =>
  dataRef.value?.filter((row) => checkedRowKeys.value.includes(row.id)) ?? []
)
```

```typescript
  fixedTabs.forEach((fixedTab: any) => {
```
→ This is in the `watch` for fixed tabs — the type is already `RouteRecordNormalized`, remove the `any`:
```typescript
  fixedTabs.forEach((fixedTab) => {
```

```typescript
const showEditRoleMenusModal = (roleRow: any) => {
```
→
```typescript
const showEditRoleMenusModal = (roleRow: SystemRoleItem) => {
```

```typescript
let editRoleMenusRoleRow: any = null
```
→
```typescript
let editRoleMenusRoleRow: SystemRoleItem | null = null
```

```typescript
const editRoleMenusRenderPrefix = ({ option: row }: { option: any }) => {
```
→
```typescript
const editRoleMenusRenderPrefix = ({ option: row }: { option: SystemMenuManageItem }) => {
```

```typescript
  const flatMenu: any[] = flatTree(systemMenuTreeData.value)
```
→
```typescript
  const flatMenu: SystemMenuManageItem[] = flatTree(systemMenuTreeData.value)
```

```typescript
  const checkedIds: any[] = [
```
→
```typescript
  const checkedIds: Array<string | number> = [
```

```typescript
  const r = visitedRoutes.value.find((item: any) => getRouteKey(item) === tabKey)
```
→ (this is in StrixTabBar, not here — skip if not present)

- [ ] **Step 4: Add `SystemRoleResp` import if not present**

Ensure the `SystemRoleResp` type is imported from `@/api/role`. If `SystemRoleItem` already covers the expanded row data, extend it locally:

```typescript
type ExpandedRoleRow = SystemRoleItem & {
  menus?: SystemMenuManageItem[]
  permissions?: SystemPermissionItem[]
  loaded?: boolean
  expandTab?: string
}
```

Use `ExpandedRoleRow` for render functions that access `.menus`, `.loaded`, `.expandTab`.

- [ ] **Step 5: Run type-check**

```bash
cd StrixPage && pnpm type-check
```

Expected: PASS. Fix any type errors that arise from tighter typing.

- [ ] **Step 6: Commit**

```bash
cd StrixPage && git add -A && git commit -m "refactor(types): type SystemRoleIndex columns with SystemRoleItem

- DataTableColumns<SystemRoleItem> provides typed render(row)
- All render/helper functions use proper row types
- ExpandedRoleRow type for row data with menus/loaded extensions
- Eliminated 15 any types

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 6: Pilot page — SystemDictIndex (typed columns)

**Files:**
- Modify: `src/views/System/SystemDict/SystemDictIndex.vue`

- [ ] **Step 1: Read the file and identify all `any` types**

```bash
cd StrixPage && grep -n ": any" src/views/System/SystemDict/SystemDictIndex.vue
```

- [ ] **Step 2: Type column definitions with `DataTableColumns<DictItem>`**

Import `DictItem` from `@/api/dict` and change the column type. Replace all `render(row: any)` with `render(row)`.

- [ ] **Step 3: Type all other `any` usages in helper functions**

Follow the same pattern as Task 5: identify each `any`, find the correct type from the API module, and apply it.

- [ ] **Step 4: Run type-check**

```bash
cd StrixPage && pnpm type-check
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd StrixPage && git add -A && git commit -m "refactor(types): type SystemDictIndex columns with DictItem

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 7: Pilot page — SystemManagerIndex (typed columns)

**Files:**
- Modify: `src/views/System/SystemManager/SystemManagerIndex.vue`

- [ ] **Step 1: Read the file and identify all `any` types**

```bash
cd StrixPage && grep -n ": any" src/views/System/SystemManager/SystemManagerIndex.vue
```

- [ ] **Step 2: Type column definitions with `DataTableColumns<SystemManagerItem>`**

Import `SystemManagerItem` from `@/api/manager`. Follow same pattern.

- [ ] **Step 3: Type all other `any` usages**

- [ ] **Step 4: Run type-check**

```bash
cd StrixPage && pnpm type-check
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd StrixPage && git add -A && git commit -m "refactor(types): type SystemManagerIndex columns with SystemManagerItem

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 8: Batch migration — SystemDictData + SystemUserIndex + SystemMenuIndex + SystemRegionIndex

**Files:**
- Modify: `src/views/System/SystemDict/SystemDictData.vue`
- Modify: `src/views/System/SystemUser/SystemUserIndex.vue`
- Modify: `src/views/System/SystemMenu/SystemMenuIndex.vue`
- Modify: `src/views/System/SystemRegion/SystemRegionIndex.vue`

- [ ] **Step 1: For each file, read, identify `any` types, replace with proper API types**

Each file follows the same pattern:
1. Import the row type from the API module (e.g., `DictDataItem`, `SystemUserItem`, `SystemMenuManageItem`, `SystemRegionListItem`)
2. Change `DataTableColumns` to `DataTableColumns<RowType>`
3. Remove `row: any` from render functions
4. Type helper function parameters

- [ ] **Step 2: Run type-check after all 4 files**

```bash
cd StrixPage && pnpm type-check
```

- [ ] **Step 3: Commit**

```bash
cd StrixPage && git add -A && git commit -m "refactor(types): type DictData, User, Menu, Region page columns

- SystemDictData: DataTableColumns<DictDataItem>
- SystemUserIndex: DataTableColumns<SystemUserItem>
- SystemMenuIndex: DataTableColumns<SystemMenuManageItem>
- SystemRegionIndex: DataTableColumns<SystemRegionListItem>

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 9: Batch migration — SystemMonitorLogIndex + SystemModuleJobIndex

**Files:**
- Modify: `src/views/System/SystemMonitor/Log/SystemMonitorLogIndex.vue`
- Modify: `src/views/System/SystemModule/Job/SystemModuleJobIndex.vue`

- [ ] **Step 1: Type columns with `SystemLogItem` and `JobItem` respectively**

Same pattern as previous tasks.

- [ ] **Step 2: Run type-check**

```bash
cd StrixPage && pnpm type-check
```

- [ ] **Step 3: Commit**

```bash
cd StrixPage && git add -A && git commit -m "refactor(types): type MonitorLog and Job page columns

- SystemMonitorLogIndex: DataTableColumns<SystemLogItem>
- SystemModuleJobIndex: DataTableColumns<JobItem>

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 10: Batch migration — OSS pages (4 files)

**Files:**
- Modify: `src/views/System/SystemModule/Oss/SystemModuleOssIndex.vue`
- Modify: `src/views/System/SystemModule/Oss/SystemModuleOssBucket.vue`
- Modify: `src/views/System/SystemModule/Oss/SystemModuleOssFile.vue`
- Modify: `src/views/System/SystemModule/Oss/SystemModuleOssFileGroup.vue`

- [ ] **Step 1: Type columns with `OssConfigItem`, `OssBucketItem`, `OssFileItem`, `OssFileGroupItem`**

- [ ] **Step 2: Run type-check**

```bash
cd StrixPage && pnpm type-check
```

- [ ] **Step 3: Commit**

```bash
cd StrixPage && git add -A && git commit -m "refactor(types): type OSS page columns

- SystemModuleOssIndex: DataTableColumns<OssConfigItem>
- SystemModuleOssBucket: DataTableColumns<OssBucketItem>
- SystemModuleOssFile: DataTableColumns<OssFileItem>
- SystemModuleOssFileGroup: DataTableColumns<OssFileGroupItem>

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 11: Batch migration — SMS pages (4 files)

**Files:**
- Modify: `src/views/System/SystemModule/Sms/SystemModuleSmsIndex.vue`
- Modify: `src/views/System/SystemModule/Sms/SystemModuleSmsLog.vue`
- Modify: `src/views/System/SystemModule/Sms/SystemModuleSmsSign.vue`
- Modify: `src/views/System/SystemModule/Sms/SystemModuleSmsTemplate.vue`

- [ ] **Step 1: Type columns with `SmsConfigItem`, `SmsLogItem`, `SmsSignItem`, `SmsTemplateItem`**

- [ ] **Step 2: Run type-check**

```bash
cd StrixPage && pnpm type-check
```

- [ ] **Step 3: Commit**

```bash
cd StrixPage && git add -A && git commit -m "refactor(types): type SMS page columns

- SystemModuleSmsIndex: DataTableColumns<SmsConfigItem>
- SystemModuleSmsLog: DataTableColumns<SmsLogItem>
- SystemModuleSmsSign: DataTableColumns<SmsSignItem>
- SystemModuleSmsTemplate: DataTableColumns<SmsTemplateItem>

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 12: Type StrixTabBar and tabs-bar store

**Files:**
- Modify: `src/components/system/StrixTabBar.vue`
- Modify: `src/stores/tabs-bar.ts`

These files have ~14 `any` types total, mostly from route typing. The proper type is `RouteLocationNormalizedGeneric` which is already imported in the store.

- [ ] **Step 1: Type `visitedRoutes` and `refreshRoutes` in the store**

In `src/stores/tabs-bar.ts`, replace:

```typescript
  const visitedRoutes = ref<any[]>([])
  const refreshRoutes = ref<any[]>([])
```

With:

```typescript
  const visitedRoutes = ref<RouteLocationNormalizedGeneric[]>([])
  const refreshRoutes = ref<RouteLocationNormalizedGeneric[]>([])
```

Also fix the `updateVisitedRouteTitle` function:

```typescript
    const index = visitedRoutes.value.findIndex((item: any) => item.fullPath === fullPath)
```
→
```typescript
    const index = visitedRoutes.value.findIndex((item) => item.fullPath === fullPath)
```

- [ ] **Step 2: Type StrixTabBar route parameters**

In `src/components/system/StrixTabBar.vue`, replace all route-typed `any` params:

```typescript
const getRouteKey = (route: any): string => {
```
→
```typescript
const getRouteKey = (r: RouteLocationNormalizedGeneric): string => {
  return r.fullPath || r.path || String(r.name) || ''
}
```

For all lambda callbacks like `(item: any)`, `(r: any)`, `(fixedTab: any)` — remove the explicit `any` and let TypeScript infer from the typed arrays.

Import `RouteLocationNormalizedGeneric` from `vue-router` if not already imported.

The `useDraggable` `onMove` callback:

```typescript
  onMove: (evt: any) => {
```
→ Keep as `any` since vue-draggable-plus doesn't export the event type. Or use a narrow inline type:
```typescript
  onMove: (evt: { related?: HTMLElement }) => {
```

- [ ] **Step 3: Run type-check**

```bash
cd StrixPage && pnpm type-check
```

Expected: PASS. Some route properties accessed (like `.query`) should exist on `RouteLocationNormalizedGeneric`.

- [ ] **Step 4: Commit**

```bash
cd StrixPage && git add -A && git commit -m "refactor(types): type StrixTabBar and tabs-bar store routes

- visitedRoutes/refreshRoutes typed as RouteLocationNormalizedGeneric[]
- StrixTabBar: remove any from route callbacks
- ~14 any types eliminated

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 13: Type useFilterState and useTableExport

**Files:**
- Modify: `src/composables/useFilterState.ts`
- Modify: `src/composables/useTableExport.ts`

- [ ] **Step 1: Type FilterDefinition.options**

In `src/composables/useFilterState.ts`, replace:

```typescript
  options?: Ref<any[]> | any[]
```

With:

```typescript
  options?: Ref<Array<{ label: string; value: string | number }>> | Array<{ label: string; value: string | number }>
```

Replace the `transform` and `resolveDisplayValue` `any` params:

```typescript
  transform?: (value: any) => string
```
→
```typescript
  transform?: (value: string | number | boolean | null) => string
```

For `ActiveFilter.value` — keep as `any` since it's genuinely polymorphic (string, number, boolean, array, null).

Replace `(d: any)` and `(o: any)` in `resolveDisplayValue`:

```typescript
        const item = cached.dictDataList.find((d: any) => d.value === value || String(d.value) === String(value))
```
→
```typescript
        const item = cached.dictDataList.find((d) => d.value === value || String(d.value) === String(value))
```

```typescript
        const item = opts.find((o: any) => o.value === value)
```
→
```typescript
        const item = opts.find((o) => o.value === value)
```

- [ ] **Step 2: Type useTableExport `any` casts**

In `src/composables/useTableExport.ts`, apply the same `isBaseColumn`-style type guard from Task 3, or use inline checks:

```typescript
    .filter((col: any) => {
```
→
```typescript
    .filter((col) => {
      const c = col as Record<string, unknown>
```

Or better, import the `isBaseColumn` helper. Since it's defined in `useTableColumns.ts`, either export it or duplicate the inline narrowing.

The simplest approach: use `'key' in col` guards inline.

- [ ] **Step 3: Run type-check**

```bash
cd StrixPage && pnpm type-check
```

- [ ] **Step 4: Commit**

```bash
cd StrixPage && git add -A && git commit -m "refactor(types): type useFilterState options and useTableExport columns

- FilterDefinition.options typed with label/value shape
- useTableExport: inline type narrowing for DataTableColumn union
- ActiveFilter.value remains any (genuinely polymorphic)

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 14: Remaining cleanup + misc `any` types

**Files:**
- Modify: Various files with 1-2 remaining `any` types each

- [ ] **Step 1: Scan for remaining `any` types**

```bash
cd StrixPage && grep -rn ": any" src/ --include="*.ts" --include="*.vue" | grep -v node_modules | grep -v "Record<string, any>"
```

Review remaining hits. Expected categories:
- `catch (e: any)` — change to `catch (e: unknown)` or `catch (e)` (TS infers)
- `axios.ts` interop — likely acceptable
- `strix-cache-call.ts` — generic cache, acceptable
- `strix-tools.ts` — utility functions, may benefit from generics
- `IndexPage.vue`, `SystemToolPopularity.vue` — page-specific, type if straightforward
- Naive UI component props — sometimes require `any` for compatibility

- [ ] **Step 2: Fix low-hanging fruit**

For each remaining `any` that has an obvious correct type, fix it. Skip any that are genuinely needed (third-party interop, truly polymorphic values).

- [ ] **Step 3: Run type-check and lint**

```bash
cd StrixPage && pnpm type-check && pnpm lint
```

- [ ] **Step 4: Commit**

```bash
cd StrixPage && git add -A && git commit -m "refactor(types): clean up remaining any types across codebase

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 15: Final verification + build

**Files:** None (verification only)

- [ ] **Step 1: Run full type-check**

```bash
cd StrixPage && pnpm type-check
```

Expected: PASS with 0 errors.

- [ ] **Step 2: Run lint**

```bash
cd StrixPage && pnpm lint
```

Expected: PASS (warnings acceptable).

- [ ] **Step 3: Run production build**

```bash
cd StrixPage && pnpm build
```

Expected: BUILD SUCCESSFUL.

- [ ] **Step 4: Count remaining `any` types**

```bash
cd StrixPage && grep -rn ": any" src/ --include="*.ts" --include="*.vue" | wc -l
```

Expected: Significantly fewer than the original ~135. Target: under 30 remaining (mostly in acceptable locations like third-party interop, truly polymorphic values, and `Record<string, any>` which is standard practice).

- [ ] **Step 5: Summary of what was achieved**

Document the before/after `any` count and which categories remain.
