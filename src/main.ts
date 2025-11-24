import './assets/style/base.scss'
import './assets/style/common.scss'
import './assets/style/rewrite.scss'

import 'vfonts/Lato.css'

import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import router from './router'

// 自定义指令
import installDirectives from './directives'
// pinia 持久化插件
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const app = createApp(App)

app.use(createPinia().use(piniaPluginPersistedstate))
app.use(router)

installDirectives(app)

app.mount('#app')
