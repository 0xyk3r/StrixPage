import './assets/style/base.scss'
import './assets/style/common.scss'
import './assets/style/rewrite.scss'

import 'vfonts/Lato.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// pinia 持久化插件
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import auth from './directives/auth.ts'

const app = createApp(App)

app.use(createPinia().use(piniaPluginPersistedstate))
app.use(router)

// 注册全局指令
app.directive('auth', auth)

app.mount('#app')
