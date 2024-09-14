import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import router from './router'

// 全局样式表
import './assets/style/common.css'
import './assets/style/common.less'
import './assets/style/super.css'

// pinia 持久化插件
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// 自定义指令
import installDirectives from './directives'

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

installDirectives(app)

app.use(pinia).use(router).mount('#app')
