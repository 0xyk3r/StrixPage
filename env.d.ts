/// <reference types="vite/client" />

declare module 'vue' {
  interface GlobalComponents {
    StrixEmpty: (typeof import('./src/components/common/StrixEmpty.vue'))['default']
  }
}
