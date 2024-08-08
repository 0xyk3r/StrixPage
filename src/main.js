import { createApp } from 'vue'
import { createPinia } from 'pinia'

import Mitt from 'mitt'
import App from './App.vue'
import router from './router'

// 全局样式表
import './assets/style/super.css'
import './assets/style/common.css'
import './assets/style/common.less'
// Naive UI 以及 Lato 字体
import 'vfonts/Lato.css'
import naive from 'naive-ui'
// axios 网络框架
import installAxios from './plugins/axios'
// pinia 持久化插件
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
// 自定义指令
import installDirectives from './directives/index'

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(naive)
// 创建Mitt全局事件总线
app.config.globalProperties.$EventBus = Mitt()
installAxios(app)
installDirectives(app)

app.use(pinia).use(router).mount('#app')
