import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      dts: 'src/@types/auto-imports.d.ts',
      imports: [
        'vue',
        'vue-router',
        {
          'naive-ui': ['useDialog', 'useMessage', 'useNotification', 'useLoadingBar']
        }
      ]
    }),
    Components({
      dts: 'src/@types/components.d.ts',
      resolvers: [NaiveUiResolver()]
    }),
    VitePWA({
      // registerType: 'autoUpdate',
      // devOptions: {
      //   enabled: true,
      //   type: 'module'
      // },
      includeAssets: ['favicon.ico', 'pwa/apple-touch-icon.png', 'pwa/mask-icon.svg'],
      manifest: {
        name: 'Strix',
        short_name: 'Strix',
        description: 'ProjectAn Strix',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        screenshots: [
          {
            src: 'pwa/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Strix'
          },
          {
            src: 'pwa/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Strix'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '127.0.0.1',
    port: 19889
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('axios')) return 'axios'
            if (id.includes('lodash')) return 'lodash'
            if (id.includes('echarts')) return 'echarts'
            if (id.includes('jsencrypt')) return 'jsencrypt'
          }
        }
      }
    },
    cssMinify: 'lightningcss',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true
      }
    }
  }
})
