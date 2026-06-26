<template>
  <div class="profile-page">
    <div class="profile-page__sidebar">
      <div class="profile-page__avatar-section">
        <StrixAvatar :manager-id="loginInfo.id" :config="loginInfo.avatarConfig" :size="72" />
        <div class="profile-page__avatar-name">{{ loginInfo.nickname }}</div>
        <div class="profile-page__avatar-id">ID: {{ loginInfo.id }}</div>
      </div>

      <n-menu v-model:value="activeMenu" :options="menuOptions" :indent="12" />
    </div>

    <div class="profile-page__content">
      <Transition name="profile-fade" mode="out-in">
        <ProfileBasicInfo v-if="activeMenu === 'basic'" :key="'basic'" />
        <ProfileSecurity v-else-if="activeMenu === 'security'" :key="'security'" />
        <ProfileLoginLogs v-else-if="activeMenu === 'logs'" :key="'logs'" />
      </Transition>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useLoginInfoStore } from '@/stores/login-info'
import { storeToRefs } from 'pinia'
import { type MenuOption, NIcon } from 'naive-ui'
import { h } from 'vue'
import { History, ShieldCheck, UserRound } from '@lucide/vue'
import StrixAvatar from '@/components/common/StrixAvatar.vue'
import ProfileBasicInfo from './ProfileBasicInfo.vue'
import ProfileSecurity from './ProfileSecurity.vue'
import ProfileLoginLogs from './ProfileLoginLogs.vue'

const loginInfoStore = useLoginInfoStore()
const { loginInfo } = storeToRefs(loginInfoStore)

const activeMenu = ref('basic')

const menuOptions: MenuOption[] = [
  {
    label: '基本信息',
    key: 'basic',
    icon: () => h(NIcon, null, { default: () => h(UserRound) })
  },
  {
    label: '账户安全',
    key: 'security',
    icon: () => h(NIcon, null, { default: () => h(ShieldCheck) })
  },
  {
    label: '登录记录',
    key: 'logs',
    icon: () => h(NIcon, null, { default: () => h(History) })
  }
]
</script>

<style lang="scss" scoped>
.profile-page {
  display: flex;
  gap: 0;
  min-height: calc(100vh - 120px);
  background: var(--n-color);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);

  &__sidebar {
    width: 200px;
    flex-shrink: 0;
    border-right: 1px solid var(--n-border-color);
    padding: 24px 0 16px;
    display: flex;
    flex-direction: column;
  }

  &__avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 0 16px 20px;
    border-bottom: 1px solid var(--n-border-color);
    margin-bottom: 12px;
  }

  &__avatar-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--n-text-color);
    text-align: center;
    margin-top: 4px;
  }

  &__avatar-id {
    font-size: 11px;
    color: var(--n-text-color-3);
    text-align: center;
  }

  &__content {
    flex: 1;
    min-width: 0;
    padding: 28px 32px;
    overflow-y: auto;
  }
}

.profile-fade-enter-active,
.profile-fade-leave-active {
  transition: opacity 0.15s ease;
}

.profile-fade-enter-from,
.profile-fade-leave-to {
  opacity: 0;
}
</style>
