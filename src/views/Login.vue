<template>
  <div class="login-container">
    <n-card class="login-form-panel" content-style="padding: 0; height: 100%;">
      <n-grid style="height: 100%" cols="24" item-responsive>
        <n-grid-item span="0:0 800:16">
          <div class="login-left" />
        </n-grid-item>
        <n-grid-item span="0:24 800:8">
          <div class="login-right">
            <div class="login-title">Strix 控制中心</div>
            <n-form ref="loginFormRef" :model="loginForm" :rules="loginFormRules" label-width="60px" class="login-form"
              @submit.prevent>
              <n-form-item label="登录用户" path="loginName">
                <n-input v-model:value="loginForm.loginName" placeholder="请输入登录账号" class="login-input" clearable />
              </n-form-item>
              <n-form-item label="登录密码" path="loginPassword">
                <n-input v-model:value="loginForm.loginPassword" type="password" placeholder="请输入登录密码" class="login-input"
                  show-password-on="mousedown" clearable />
              </n-form-item>
              <n-button type="primary" :loading="isLogging" class="login-btn" @click="showLoginVerify">
                {{ isLogging ? '登录中...' : '登录' }}
              </n-button>
            </n-form>
          </div>
        </n-grid-item>
      </n-grid>
    </n-card>
    <Verify v-if="loginVerifyShowStatus" ref="verifyRef" mode="pop" captcha-type="blockPuzzle"
      :img-size="{ width: '400px', height: '200px' }" @success="verifySuccess" />
    <div class="beian">
      <a href="http://beian.miit.gov.cn/" target="_blank">京ICP备2022027076号-1</a>
    </div>
  </div>
</template>

<script setup>
import Verify from '@/components/verifition/Verify.vue'
import { useTabsBarStore } from '@/stores/tabs-bar'
import { initStrixLoadingBar } from '@/utils/strix-loading-bar'
import { createStrixMessage, initStrixMessage } from '@/utils/strix-message'
import { useLoadingBar } from 'naive-ui'
import { getCurrentInstance, nextTick, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const { proxy } = getCurrentInstance()
const $route = useRoute()
const $router = useRouter()
const loadingBar = useLoadingBar()
initStrixLoadingBar(loadingBar)
initStrixMessage()

const tabBarStore = useTabsBarStore()

// 获取地址栏的to参数
const loggedJumpPath = $route.query.to || '/'

const isLogging = ref(false)
const loginFormRef = ref(null)
const loginForm = ref({
  loginName: '',
  loginPassword: '',
  captchaVerification: ''
})
const loginFormRules = {
  loginName: [
    { required: true, message: '请输入登录账号', trigger: 'blur' },
    { min: 2, max: 16, message: '长度在2-16字符之间', trigger: 'blur' }
  ],
  loginPassword: [
    { required: true, message: '请输入登录密码', trigger: 'blur' },
    { min: 5, max: 16, message: '长度在5-16字符之间', trigger: 'blur' }
  ]
}

const verifyRef = ref(null)
const loginVerifyShowStatus = ref(false)
const showLoginVerify = () => {
  loginFormRef.value?.validate((errors) => {
    if (errors) return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    loginVerifyShowStatus.value = true
    nextTick(() => {
      verifyRef.value?.show()
    })
  })
}
const verifySuccess = (params) => {
  loginVerifyShowStatus.value = false
  loginForm.value.captchaVerification = params.captchaVerification
  login()
}

const login = () => {
  loginFormRef.value?.validate((errors) => {
    if (errors) return createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')

    isLogging.value = true
    proxy.$http.post('system/login', loginForm.value, { operate: '登录', notify: false }).then(({ data: res }) => {
      isLogging.value = false
      const loginManagerType = res.data.info.managerType
      window.localStorage.setItem('strix_login_token', res.data.token)
      window.localStorage.setItem('strix_login_token_expire', res.data.tokenExpire)
      window.localStorage.setItem('strix_login_info', JSON.stringify(res.data.info))
      tabBarStore.delAllVisitedRoutes()
      createStrixMessage('success', '登录成功', `登录成功，${loginManagerType === 1 ? '超级账户' : '平台账户'}：` + res.data.info.nickname)
      $router.push(loggedJumpPath != '/login' ? loggedJumpPath : '/')
    }).catch(() => {
      loginForm.value.loginPassword = null
      isLogging.value = false
    })
  })
}

</script>
<script>
export default {
  name: 'LoginIndex'
}
</script>

<style lang="less" scoped>
.login-container {
  background: url(../assets/img/background.jpg) no-repeat center 0;
  -webkit-background-size: cover;
  -o-background-size: cover;
  background-size: cover;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  .beian {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 30px;
    line-height: 30px;
    text-align: center;
    font-size: 12px;

    a {
      color: #aaa;
      text-decoration: none;
    }
  }
}

.login-form-panel {
  border-radius: 4px;
  width: 60vw;
  min-width: 300px;
  max-width: 950px;
  height: 500px;
  border: 0;

  .n-grid {
    div {
      transition: all .5s cubic-bezier(.645, .045, .355, 1), border 0s, color .1s, font-size 0s;
    }
  }

  .login-left {
    width: 100%;
    height: 100%;
    color: transparent;
    background: url(../assets/img/login-image.jpg) no-repeat;
    background-size: 100% 100%;
  }

  .login-right {
    width: 100%;
    height: 100%;
    padding: 25px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;

    .login-title {
      margin-top: 40px;
      font-size: 26px;
      font-weight: 400;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .login-form {
    margin-top: 35px;
  }
}

.login-btn {
  width: 100%;
  height: 40px;
  margin-top: 30px;
  border: 0;
  background-image: linear-gradient(45deg, #8a39dc, #511fa7);
  color: #ffffff;

  &:hover {
    opacity: 0.9;
  }
}
</style>
