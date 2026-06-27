import './assets/style/nebula.scss'
import './assets/style/common.scss'
import './assets/style/rewrite.scss'

import 'vfonts/Lato.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// pinia 持久化插件
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import auth from './directives/auth'

const app = createApp(App)

// 全局错误处理 (L3: 兜底捕获未被组件级 ErrorBoundary 处理的错误)
app.config.errorHandler = (err, instance, info) => {
  console.error('[Strix] 未捕获的应用错误:', err)
  console.error('[Strix] 错误来源:', info)
  if (instance) {
    console.error('[Strix] 组件:', instance.$options?.name || instance.$options?.__name || '未知')
  }
}

app.use(createPinia().use(piniaPluginPersistedstate))
app.use(router)

// 注册全局指令
app.directive('auth', auth)

app.mount('#app')
