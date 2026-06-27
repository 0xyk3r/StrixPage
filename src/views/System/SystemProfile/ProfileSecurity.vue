<template>
  <div class="profile-security">
    <div class="profile-section__title">修改密码</div>
    <n-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-placement="left"
      label-width="100"
      style="max-width: 420px"
    >
      <n-form-item label="当前密码" path="oldPassword">
        <n-input
          v-model:value="form.oldPassword"
          type="password"
          show-password-on="click"
          placeholder="请输入当前密码"
          clearable
        />
      </n-form-item>
      <n-form-item label="新密码" path="newPassword">
        <n-input
          v-model:value="form.newPassword"
          type="password"
          show-password-on="click"
          placeholder="请输入新密码（6~32 位）"
          clearable
          @input="formRef?.validate()"
        />
      </n-form-item>
      <n-form-item label="确认新密码" path="confirmPassword">
        <n-input
          v-model:value="form.confirmPassword"
          type="password"
          show-password-on="click"
          placeholder="请再次输入新密码"
          clearable
        />
      </n-form-item>
      <n-form-item>
        <n-button type="primary" :loading="loading" @click="handleSubmit">确认修改</n-button>
        <n-button style="margin-left: 8px" @click="resetForm">重置</n-button>
      </n-form-item>
    </n-form>

    <n-divider />

    <div class="profile-section__title">登录凭证状态</div>
    <n-descriptions :column="1" label-placement="left" bordered style="max-width: 420px">
      <n-descriptions-item label="当前登陆状态">
        <n-tag type="success" size="small">有效</n-tag>
      </n-descriptions-item>
      <n-descriptions-item label="凭证到期时间">{{ tokenExpire }}</n-descriptions-item>
    </n-descriptions>
  </div>
</template>

<script lang="ts" setup>
import { profileApi } from '@/api/profile'
import { useLoginInfoStore } from '@/stores/login-info'
import { storeToRefs } from 'pinia'
import type { FormInst, FormRules } from 'naive-ui'

const loginInfoStore = useLoginInfoStore()
const { loginTokenExpire } = storeToRefs(loginInfoStore)

const tokenExpire = computed(() => {
  if (!loginTokenExpire.value) return '-'
  return String(loginTokenExpire.value).replace('T', ' ')
})

const formRef = ref<FormInst | null>(null)
const loading = ref(false)

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const rules: FormRules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 32, message: '新密码长度应在 6~32 位之间', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value) => {
        if (value !== form.newPassword) return new Error('两次输入的密码不一致')
        return true
      },
      trigger: ['blur', 'input']
    }
  ]
}

async function handleSubmit() {
  await formRef.value?.validate()
  loading.value = true
  profileApi
    .updatePassword(form.oldPassword, form.newPassword)
    .then(() => {
      resetForm()
    })
    .finally(() => {
      loading.value = false
    })
}

function resetForm() {
  form.oldPassword = ''
  form.newPassword = ''
  form.confirmPassword = ''
  formRef.value?.restoreValidation()
}
</script>

<style lang="scss" scoped>
.profile-section__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--n-text-color-2);
  margin-bottom: 12px;
  border-left: 3px solid var(--primary-color);
  padding-left: 8px;
}
</style>
