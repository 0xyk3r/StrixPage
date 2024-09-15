<template>
  <n-el tag="div" class="login-container">
    <n-grid cols="4" item-responsive responsive="screen">
      <n-grid-item span="0 m:0 l:2">
        <div class="login-panel-left">
          <div class="login-img-1"></div>
          <div class="login-img-2"></div>
        </div>
      </n-grid-item>
      <n-grid-item span="4 m:4 l:2">
        <div class="login-panel-right">
          <div class="login-panel-right-content">
            <div tag="div" class="login-panel-right-content-header">
              <div class="login-panel-right-content-header-title">Strix 控制中心</div>
              <div class="login-panel-right-content-header-subtitle">Welcome Back</div>
            </div>
            <div class="login-panel-right-content-body">
              <n-form
                ref="loginFormRef"
                :model="loginForm"
                :rules="loginFormRules"
                label-width="100px"
                label-placement="top"
                @submit.prevent
              >
                <n-form-item label="登录账号" path="loginName">
                  <n-input
                    v-model:value="loginForm.loginName"
                    size="large"
                    placeholder="请输入登录账号"
                    clearable
                  />
                </n-form-item>
                <n-form-item label="登录密码" path="loginPassword">
                  <n-input
                    v-model:value="loginForm.loginPassword"
                    type="password"
                    size="large"
                    placeholder="请输入登录密码"
                    clearable
                  />
                </n-form-item>
                <n-form-item>
                  <n-button
                    type="primary"
                    size="large"
                    class="btn-login"
                    strong
                    secondary
                    @click="showLoginVerify"
                    :loading="isLogging"
                  >
                    {{ isLogging ? '登录中...' : '登录' }}
                  </n-button>
                </n-form-item>
              </n-form>

              <VerifyContainer
                v-if="loginVerifyShowStatus"
                ref="verifyRef"
                mode="pop"
                captcha-type="blockPuzzle"
                :img-size="{ width: '400px', height: '200px' }"
                @success="verifySuccess"
              />
              <div class="copyright">
                Copyright &copy; 2024 ProjectAn Strix |
                <a href="http://beian.miit.gov.cn/" target="_blank">京ICP备2022027076号-1</a>
              </div>
            </div>
          </div>
        </div>
      </n-grid-item>
    </n-grid>
  </n-el>
</template>

<script setup lang="ts">
import VerifyContainer from '@/components/verifition/VerifyContainer.vue'
import { http } from '@/plugins/axios'
import { useLoginInfoStore } from '@/stores/login-info'
import { useTabsBarStore } from '@/stores/tabs-bar'
import { initStrixLoadingBar } from '@/utils/strix-loading-bar'
import { createStrixMessage, initStrixMessage } from '@/utils/strix-message'
import { type FormInst } from 'naive-ui'

const route = useRoute()
const router = useRouter()
const tabBarStore = useTabsBarStore()
const loginInfoStore = useLoginInfoStore()

initStrixLoadingBar(useLoadingBar())
initStrixMessage()

// 获取地址栏的to参数
const loggedJumpPath = route.query.to || '/'

const isLogging = ref(false)
const loginFormRef = ref<FormInst | null>(null)
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

const verifyRef = ref<Ref<InstanceType<typeof VerifyContainer>> | null>(null)
const loginVerifyShowStatus = ref(false)

const validateForm = (callback: () => void) => {
  loginFormRef.value?.validate((errors) => {
    if (errors) {
      createStrixMessage('warning', '表单校验失败', '请检查表单中的错误，并根据提示修改')
    } else {
      callback()
    }
  })
}

const showLoginVerify = () => {
  validateForm(() => {
    loginVerifyShowStatus.value = true
    nextTick(() => {
      verifyRef.value?.show()
    })
  })
}
const verifySuccess = (params: any) => {
  loginVerifyShowStatus.value = false
  loginForm.value.captchaVerification = params.captchaVerification
  login()
}

// 提交登录
const login = () => {
  validateForm(() => {
    http
      .post('system/login', loginForm.value, { meta: { operate: '登录', notify: false } })
      .then(({ data: res }) => {
        isLogging.value = false
        const loginManagerType = res.data.info.type
        loginInfoStore.updateLoginInfo(res)
        tabBarStore.delAllVisitedRoutes()
        createStrixMessage(
          'success',
          '登录成功',
          `${loginManagerType === 1 ? '超级管理员' : '当前用户'}：` + res.data.info.nickname
        )
        const pushPath = (loggedJumpPath != '/login' ? loggedJumpPath : '/') as string
        router.push(pushPath)
      })
      .catch(() => {
        loginForm.value.loginPassword = ''
      })
      .finally(() => {
        isLogging.value = false
      })
  })
}
</script>

<style lang="scss" scoped>
.login-container {
  width: 100vw;
  height: 100vh;
  background-color: var(--base-color);
  display: flex;
  align-items: center;
  justify-content: center;

  .n-grid {
    height: 100%;
  }

  .login-panel-left {
    flex: 1;
    height: 100%;
    position: relative;
    border-radius: 3rem;
    border-top-left-radius: 0.25rem;
    border-bottom-left-radius: 0.25rem;
    background-color: var(--action-color);
    box-sizing: border-box;

    .login-img-1 {
      width: 360px;
      height: 300px;
      position: absolute;
      top: 20%;
      left: 25%;
      background: url(@/assets/img/login/1.svg) no-repeat center 0;
      animation: login-img-anim 8s linear 0ms infinite normal backwards;
    }

    .login-img-2 {
      width: 550px;
      height: 420px;
      position: absolute;
      top: 30%;
      left: 28%;
      background: url(@/assets/img/login/2.svg) no-repeat center 0;
      animation: login-img-anim 6s linear 0ms infinite normal backwards;
    }
  }

  .login-panel-right {
    background-color: var(--base-color);
    flex: 1;
    height: 100%;
    position: relative;
    display: flex;

    .login-panel-right-content {
      width: 100%;
      max-width: 600px;
      padding: 2rem;
      box-sizing: border-box;
      margin: auto auto;

      .login-panel-right-content-header {
        text-align: left;
        margin-bottom: 3rem;

        .login-panel-right-content-header-title {
          font-size: 2.5rem;
          font-weight: 600;
          color: var(--text-color);
        }

        .login-panel-right-content-header-subtitle {
          font-size: 1.5rem;
          color: var(--text-color-light);
        }
      }

      .login-panel-right-content-body {
        .n-form-item {
          margin-bottom: 1rem;
        }

        .copyright {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 30px;
          line-height: 30px;
          text-align: center;
          font-size: 12px;
          color: var(--placeholder-color);

          a {
            color: var(--placeholder-color);
            text-decoration: none;
          }
        }
      }

      .btn-login {
        width: 100%;
      }
    }
  }
}

@keyframes login-img-anim {
  0% {
    transform: translateZ(0);
  }

  50% {
    transform: translate3d(0, 20px, 0);
  }

  to {
    transform: translateZ(0);
  }
}
</style>
