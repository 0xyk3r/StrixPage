<template>
  <div class="login-container">
    <n-card class="login-form-panel" content-style="padding: 0; height: 100%;">
      <n-grid style="height: 100%" cols="24" item-responsive>
        <n-grid-item span="0:0 800:16">
          <div class="login-left"></div>
        </n-grid-item>
        <n-grid-item span="0:24 800:8">
          <div class="login-right">
            <div class="login-title">Strix 控制中心</div>
            <n-form ref="loginFormRef" :model="loginForm" :rules="loginFormRules" label-width="60px" class="login-form"
              @submit.prevent>
              <n-form-item label="登录用户" path="loginName">
                <n-input v-model:value="loginForm.loginName" placeholder="请输入登录账号" class="login-input" clearable>
                </n-input>
              </n-form-item>
              <n-form-item label="登录密码" path="loginPassword">
                <n-input type="password" v-model:value="loginForm.loginPassword" placeholder="请输入登录密码"
                  class="login-input" show-password-on="mousedown" clearable></n-input>
              </n-form-item>
              <n-button type="primary" :loading="isLogging" class="login-btn" @click="login">
                {{ isLogging ? '登录中...' : '登录' }}
              </n-button>
            </n-form>
          </div>
        </n-grid-item>
      </n-grid>
    </n-card>
  </div>
</template>

<script setup>
import { useTabsBarStore } from '@/stores/tabs-bar'
import useCurrentInstance from '@/utils/strix-instance-tool'
import { initStrixLoadingBar } from '@/utils/strix-loading-bar'
import { createStrixNotify, initStrixNotify } from '@/utils/strix-notify'
import { useLoadingBar } from 'naive-ui'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const { proxy } = useCurrentInstance()
const $route = useRoute()
const $router = useRouter()
const loadingBar = useLoadingBar()
initStrixLoadingBar(loadingBar)
initStrixNotify()

const tabBarStore = useTabsBarStore()

// 获取地址栏的to参数
const loggedJumpPath = $route.query.to || '/'

const isLogging = ref(false)
const loginFormRef = ref(null)
const loginForm = ref({
  loginName: null,
  loginPassword: null
})
const loginFormRules = {
  loginName: [
    {
      required: true,
      message: '请输入登录账号',
      trigger: 'blur'
    },
    {
      min: 2,
      max: 16,
      message: '长度在2-16字符之间',
      trigger: 'blur'
    }
  ],
  loginPassword: [
    {
      required: true,
      message: '请输入登录密码',
      trigger: 'blur'
    },
    {
      min: 5,
      max: 16,
      message: '长度在5-16字符之间',
      trigger: 'blur'
    }
  ]
}

const login = () => {
  loginFormRef.value?.validate((errors) => {
    if (!errors) {
      isLogging.value = true

      proxy?.$http.post('system/login', loginForm.value).then(({ data: res }) => {
        isLogging.value = false
        if (res.code !== 200) {
          loginForm.value.loginPassword = null
          createStrixNotify('error', '登录失败', (res.msg ? res.msg : '未知错误'))
        } else {
          const loginManagerType = res.data.info.managerType
          window.localStorage.setItem('strix_login_token', res.data.token)
          window.localStorage.setItem('strix_login_token_expire', res.data.tokenExpire)
          window.localStorage.setItem('strix_login_info', JSON.stringify(res.data.info))
          tabBarStore.delAllVisitedRoutes()
          createStrixNotify('success', '登录成功', `登录成功，${loginManagerType === 1 ? '超级账户' : '平台账户'}：` + res.data.info.nickname)
          $router.push(loggedJumpPath != '/login' ? loggedJumpPath : '/')
        }
      }).catch((e) => {
        console.log(e)
        isLogging.value = false
        createStrixNotify('error', '登录失败', '网络异常')
      })
    } else {
      createStrixNotify('error', '登录失败', '内容校验失败，请检查您填写的内容')
    }
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
}

.login-form-panel {
  border-radius: 4px;
  width: 60vw;
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
