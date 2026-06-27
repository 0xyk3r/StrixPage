import {
  type ConfigProviderProps,
  createDiscreteApi,
  darkTheme,
  dateZhCN,
  type GlobalThemeOverrides,
  type MessageType,
  NAlert,
  zhCN
} from 'naive-ui'
import { shallowRef } from 'vue'

// 主题配置（与 App.vue 保持一致）
const lightThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#2db48c',
    primaryColorHover: '#3bc49d',
    primaryColorPressed: '#24a07c',
    primaryColorSuppl: '#3bb5a5'
  }
}

const darkThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#63e2b7',
    primaryColorHover: '#7fe7c4',
    primaryColorPressed: '#5acea7',
    primaryColorSuppl: '#7fe7c4'
  }
}

// 创建响应式的配置引用（不在模块顶层调用 computed/useOsTheme 等）
const configProviderPropsRef = shallowRef<ConfigProviderProps>({
  theme: null,
  themeOverrides: lightThemeOverrides,
  locale: zhCN,
  dateLocale: dateZhCN
})

// 使用 createDiscreteApi 创建独立的 message 实例
// 不依赖 Vue 组件上下文，可在 axios 拦截器等非 setup 环境中使用
const { message: discreteMessage } = createDiscreteApi(['message'], {
  configProviderProps: configProviderPropsRef
})

/**
 * 更新 discrete API 的主题配置
 * 应在 App.vue 的 setup 中调用，与主应用主题保持同步
 */
export function updateStrixMessageTheme(theme: 'light' | 'dark' | null) {
  configProviderPropsRef.value = {
    theme: theme === 'dark' ? darkTheme : null,
    themeOverrides: theme === 'dark' ? darkThemeOverrides : lightThemeOverrides,
    locale: zhCN,
    dateLocale: dateZhCN
  }
}

export const createStrixMessage = (
  type: MessageType,
  title: string = '系统提示',
  content: string = '',
  duration: number = 3000
) => {
  // 使用类型断言处理动态方法调用
  const messageFn = (discreteMessage as any)[type]
  if (!messageFn) return
  messageFn(content, {
    duration,
    render: (props: any) => {
      const { type, closable, onClose, content } = props
      return h(
        NAlert,
        {
          closable,
          onClose,
          type: type === 'loading' ? 'default' : type,
          title,
          style: {
            boxShadow: 'var(--n-box-shadow)',
            maxWidth: 'calc(100vw - 32px)',
            width: '480px'
          }
        },
        {
          default: () => {
            const lines = content.split('\n')
            return lines.map((line: string, index: number) => {
              return h('p', { key: index }, line)
            })
          }
        }
      )
    }
  })
}
