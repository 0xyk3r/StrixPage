<template>
  <div class="profile-basic">
    <div class="profile-section__title">基本信息</div>

    <!-- 头像设置 -->
    <div class="profile-basic__avatar-card">
      <div class="profile-basic__avatar-info">
        <StrixAvatar :manager-id="loginInfo.id" :config="loginInfo.avatarConfig" :size="80" />
        <div class="profile-basic__avatar-text">
          <div class="profile-basic__avatar-title">个人头像</div>
          <div class="profile-basic__avatar-desc">支持 {{ STYLE_NAMES.length }} 种风格，细化到每个组件的自定义配置</div>
        </div>
      </div>
      <div class="profile-basic__avatar-actions">
        <n-button type="primary" ghost size="small" @click="showPicker = true">
          <template #icon>
            <strix-icon icon="palette" :size="14" />
          </template>
          配置头像
        </n-button>
        <n-popconfirm @positive-click="handleResetAvatar">
          <template #trigger>
            <n-button size="small" quaternary>
              <template #icon>
                <strix-icon icon="rotate-ccw" :size="14" />
              </template>
              重置默认
            </n-button>
          </template>
          重置后将使用管理员 ID 自动生成头像，确认重置？
        </n-popconfirm>
      </div>
    </div>

    <!-- 昵称 -->
    <div class="profile-section__title" style="margin-top: 24px">昵称设置</div>
    <n-form
      ref="nicknameFormRef"
      :model="nicknameForm"
      :rules="nicknameRules"
      label-placement="left"
      label-width="80"
      style="max-width: 420px"
    >
      <n-form-item label="当前昵称" path="nickname">
        <n-input
          v-model:value="nicknameForm.nickname"
          :maxlength="20"
          show-count
          placeholder="请输入昵称（2~20 个字符）"
          clearable
        />
      </n-form-item>
      <n-form-item>
        <n-button type="primary" :loading="nicknameLoading" @click="handleSaveNickname"> 保存昵称</n-button>
      </n-form-item>
    </n-form>

    <!-- 只读账户信息 -->
    <div class="profile-section__title" style="margin-top: 24px">账户信息</div>
    <n-descriptions v-if="profileInfo" :column="1" label-placement="left" bordered style="max-width: 420px">
      <n-descriptions-item label="登录账号">{{ profileInfo?.loginName ?? '-' }}</n-descriptions-item>
      <n-descriptions-item label="账户类型">
        <StrixTag :value="profileInfo?.type" dict-name="SystemManagerType" />
      </n-descriptions-item>
      <n-descriptions-item label="账户状态">
        <StrixTag :value="profileInfo?.status" dict-name="SystemManagerStatus" />
      </n-descriptions-item>
      <n-descriptions-item label="注册时间">{{ profileInfo?.createdTime ?? '-' }}</n-descriptions-item>
    </n-descriptions>

    <!-- 头像配置器弹窗 -->
    <AvatarPickerDialog
      v-model:show="showPicker"
      :manager-id="loginInfo.id"
      :current-config="loginInfo.avatarConfig"
      @confirm="handleAvatarConfirm"
    />
  </div>
</template>

<script lang="ts" setup>
import { useLoginInfoStore } from '@/stores/login-info'
import { storeToRefs } from 'pinia'
import { profileApi } from '@/api/profile'
import { textField } from '@/utils/form-rules'
import { STYLE_NAMES } from '@/utils/dicebear-util'
import StrixAvatar from '@/components/common/StrixAvatar.vue'
import AvatarPickerDialog from '@/components/common/AvatarPickerDialog.vue'
import StrixTag from '@/components/common/StrixTag.vue'
import type { FormInst } from 'naive-ui'

const loginInfoStore = useLoginInfoStore()
const { loginInfo } = storeToRefs(loginInfoStore)

// 加载个人信息
const profileInfo = ref<any>(null)
onMounted(() => {
  profileApi.getProfile().then(({ data: res }) => {
    profileInfo.value = res.data
    nicknameForm.nickname = res.data.nickname
  })
})

// 昵称
const nicknameFormRef = ref<FormInst | null>(null)
const nicknameForm = reactive({ nickname: loginInfo.value.nickname ?? '' })
const nicknameRules = { nickname: textField('昵称', { min: 2, max: 20 }) }
const nicknameLoading = ref(false)

async function handleSaveNickname() {
  await nicknameFormRef.value?.validate()
  nicknameLoading.value = true
  profileApi
    .updateNickname(nicknameForm.nickname)
    .then(() => {
      loginInfoStore.loginInfo.nickname = nicknameForm.nickname
    })
    .finally(() => {
      nicknameLoading.value = false
    })
}

// 头像
const showPicker = ref(false)

function handleAvatarConfirm(configJson: string) {
  profileApi.updateAvatar(configJson).then(() => {
    loginInfoStore.loginInfo.avatarConfig = configJson
  })
}

function handleResetAvatar() {
  profileApi.updateAvatar(null).then(() => {
    loginInfoStore.loginInfo.avatarConfig = null
  })
}
</script>

<style lang="scss" scoped>
.profile-basic {
  &__avatar-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: var(--n-color-hover);
    border-radius: 8px;
    border: 1px solid var(--n-border-color);
    max-width: 560px;
  }

  &__avatar-info {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &__avatar-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__avatar-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--n-text-color);
  }

  &__avatar-desc {
    font-size: 12px;
    color: var(--n-text-color-3);
    max-width: 220px;
    line-height: 1.5;
  }

  &__avatar-actions {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: flex-end;
  }
}

.profile-section__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--n-text-color-2);
  margin-bottom: 12px;
  padding-left: 2px;
  border-left: 3px solid var(--primary-color);
  padding-left: 8px;
}
</style>
