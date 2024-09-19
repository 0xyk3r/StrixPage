<template>
  <div>
    <n-card>
      <div v-hasPerm="['system:user:update']">修改用户</div>
      <div v-hasPerm="['system:user:remove']">删除用户</div>
      <n-button type="primary" @click="addPermission">获取权限</n-button>
      <n-button type="warning" @click="subPermission">失去权限</n-button>
    </n-card>
  </div>
</template>
<script setup lang="ts">
import { type LoginInfoStore, useLoginInfoStore } from '@/stores/login-info'
import { storeToRefs } from 'pinia'

const loginInfoStore = useLoginInfoStore()
const { loginInfo } = storeToRefs(loginInfoStore) as LoginInfoStore

const addPermission = () => {
  loginInfo.value.permissionKeys.push('system:user:update')
  loginInfo.value.permissionKeys.push('system:user:remove')
}
const subPermission = () => {
  loginInfo.value.permissionKeys = loginInfo.value.permissionKeys.filter(
    (item: string) => item !== 'system:user:update'
  )
  loginInfo.value.permissionKeys = loginInfo.value.permissionKeys.filter(
    (item: string) => item !== 'system:user:remove'
  )
}
</script>
<style lang="scss" scoped></style>
