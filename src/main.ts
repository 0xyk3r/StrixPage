import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import router from './router'

// 全局样式表
import './assets/style/common.css'
import './assets/style/common.less'
import './assets/style/super.css'

// Naive UI 以及 Lato 字体
import {
  NButton,
  NDataTable,
  NForm,
  NFormItem,
  NFormItemGi,
  NGi,
  NGrid,
  NH3,
  NInput,
  NInputGroup,
  NInputNumber,
  NModal,
  NSelect,
  NSpace,
  NSpin,
  NText,
  create
} from 'naive-ui'

const naive = create({
  components: [
    NButton,
    NDataTable,
    NForm,
    NFormItem,
    NFormItemGi,
    NGi,
    NGrid,
    NH3,
    NInput,
    NInputGroup,
    NInputNumber,
    NModal,
    NSelect,
    NSpace,
    NSpin,
    NText
  ]
})

// pinia 持久化插件
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// 自定义指令
import installDirectives from './directives'

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(naive)
installDirectives(app)

app.use(pinia).use(router).mount('#app')
