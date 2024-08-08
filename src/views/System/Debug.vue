<template>
  <div>
    <n-h3 prefix="bar" align-text type="success">
      <n-text type="success">Debug</n-text>
    </n-h3>
    {{ dictStatus }}
    <n-card>
      <div v-hasPerm="['system:user:update']">修改用户</div>
      <div v-hasPerm="['system:user:remove']">删除用户</div>
      <n-button type="primary" @click="addPermission">获取权限</n-button>
      <n-button type="warning" @click="subPermission">失去权限</n-button>
    </n-card>
  </div>
</template>
<script setup>
import { useDictsStore } from '@/stores/dicts'
import { useLoginInfoStore } from '@/stores/login-info'
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'

// const { proxy } = getCurrentInstance()
const dictsStore = useDictsStore()
const loginInfoStore = useLoginInfoStore()

const { loginInfo } = storeToRefs(loginInfoStore)

const dictStatus = ref([])
onMounted(() => {
  setTimeout(() => {
    dictsStore.getDictData('DictStatus', dictStatus)
  }, 2000)
})

const addPermission = () => {
  loginInfo.value.permissionKeys.push('system:user:update')
  loginInfo.value.permissionKeys.push('system:user:remove')
}
const subPermission = () => {
  loginInfo.value.permissionKeys = loginInfo.value.permissionKeys.filter((item) => item !== 'system:user:update')
  loginInfo.value.permissionKeys = loginInfo.value.permissionKeys.filter((item) => item !== 'system:user:remove')
}
</script>
<script>
export default {
  name: 'DebugPage'
}
</script>
<style lang="scss" scoped></style>
