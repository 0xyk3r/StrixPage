import { createApp } from 'vue'
import { createPinia } from 'pinia'

import Mitt from 'mitt'
import App from './App.vue'
import router from './router'

// 全局样式表
import './assets/style/base.css'
import './assets/style/common.css'
import './assets/style/common.less'
// Naive UI 以及 Lato 字体
import 'vfonts/Lato.css'
import naive from 'naive-ui'
// 网络框架
import installAxios from './plugins/axios'
// 缓存工具
import installStrixLocalCache from './utils/strix-local-cache'
// pinia持久化插件
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(naive)
// 创建Mitt全局事件总线
app.config.globalProperties.$EventBus = Mitt()
app.config.globalProperties.$Theme = { name: '' }
installAxios(app)
installStrixLocalCache(app)

app.use(pinia).use(router).mount('#app')
