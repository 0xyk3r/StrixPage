<template>
  <div>
    <n-space :size="16" vertical>
      <!-- 控制按钮 -->
      <n-card title="权限控制">
        <n-space>
          <n-button type="primary" @click="addPermission">获取权限</n-button>
          <n-button type="warning" @click="subPermission">失去权限</n-button>
          <n-button type="info" @click="resetPermission">重置权限</n-button>
        </n-space>
        <n-divider />
        <div>
          <strong>当前权限：</strong>
          <n-tag
            v-for="perm in loginInfoStore.loginInfo.permissionKeys || []"
            :key="perm"
            size="small"
            style="margin-right: 8px"
            type="info"
          >
            {{ perm }}
          </n-tag>
          <n-text v-if="!loginInfoStore.loginInfo.permissionKeys?.length" depth="3"> （无权限） </n-text>
        </div>
      </n-card>

      <!-- 指令测试 -->
      <n-card title="指令 v-auth - 基础用法">
        <n-space vertical>
          <!-- 单个权限（字符串） -->
          <div v-auth="'system:user:update'">
            <n-alert type="success">v-auth="'system:user:update'" - 单个权限（字符串）</n-alert>
          </div>

          <!-- 单个权限（数组） -->
          <div v-auth="['system:user:remove']">
            <n-alert type="warning">v-auth="['system:user:remove']" - 单个权限（数组）</n-alert>
          </div>

          <!-- 多个权限 OR 逻辑（默认） -->
          <div v-auth="['system:user:update', 'system:user:remove']">
            <n-alert type="info">
              v-auth="['system:user:update', 'system:user:remove']" - OR 逻辑（默认，满足任一即可）
            </n-alert>
          </div>
        </n-space>
      </n-card>

      <!-- 修饰符测试 -->
      <n-card title="指令 v-auth - 逻辑修饰符">
        <n-space vertical>
          <!-- OR 逻辑（显式指定） -->
          <div v-auth.or="['system:user:update', 'system:user:remove']">
            <n-alert type="success"> v-auth.or="['update', 'remove']" - 显式 OR 逻辑（满足任一即可） </n-alert>
          </div>

          <!-- AND 逻辑 -->
          <div v-auth.and="['system:user:update', 'system:user:remove']">
            <n-alert type="warning"> v-auth.and="['update', 'remove']" - AND 逻辑（需要同时满足） </n-alert>
          </div>

          <!-- AND 逻辑 - 部分权限 -->
          <div v-auth.and="['system:user:update', 'system:user:view']">
            <n-alert type="info"> v-auth.and="['update', 'view']" - AND 逻辑（update有，view无） </n-alert>
          </div>
        </n-space>
      </n-card>

      <!-- 实际应用场景 -->
      <n-card title="实际应用场景">
        <n-space vertical>
          <!-- 按钮权限控制 -->
          <n-space>
            <n-button v-auth="'system:user:update'" type="primary">编辑用户</n-button>
            <n-button v-auth="'system:user:remove'" type="error">删除用户</n-button>
            <n-button v-auth.and="['system:user:update', 'system:user:remove']" type="warning">
              批量操作（需要编辑和删除权限）
            </n-button>
          </n-space>

          <n-divider />

          <!-- 表格操作列 -->
          <n-space>
            <span>表格操作列示例：</span>
            <n-button v-auth="'system:user:view'" size="small" text type="primary"> 查看 </n-button>
            <n-button v-auth="'system:user:update'" size="small" text type="info"> 编辑 </n-button>
            <n-button v-auth="'system:user:remove'" size="small" text type="error"> 删除 </n-button>
          </n-space>

          <n-divider />

          <!-- 复杂组合 -->
          <div v-auth.or="['system:user:update', 'system:user:view']">
            <n-alert title="复杂场景" type="success"> 只要有查看或编辑权限，就能看到卡片 </n-alert>
          </div>
        </n-space>
      </n-card>
    </n-space>
  </div>
</template>

<script lang="ts" setup>
import { useLoginInfoStore } from '@/stores/login-info'

const loginInfoStore = useLoginInfoStore()

// 初始化权限数组（如果不存在）
if (!loginInfoStore.loginInfo.permissionKeys) {
  loginInfoStore.loginInfo.permissionKeys = []
}

const addPermission = () => {
  const perms = loginInfoStore.loginInfo.permissionKeys || []
  if (!perms.includes('system:user:update')) {
    perms.push('system:user:update')
  }
  if (!perms.includes('system:user:remove')) {
    perms.push('system:user:remove')
  }
  loginInfoStore.loginInfo.permissionKeys = perms
}

const subPermission = () => {
  loginInfoStore.loginInfo.permissionKeys = (loginInfoStore.loginInfo.permissionKeys || []).filter(
    (item: string) => item !== 'system:user:update' && item !== 'system:user:remove'
  )
}

const resetPermission = () => {
  loginInfoStore.loginInfo.permissionKeys = []
}
</script>

<style lang="scss" scoped></style>
