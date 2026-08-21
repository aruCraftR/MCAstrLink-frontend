// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@pinia/nuxt', 'pinia-plugin-persistedstate/nuxt'],

  app: {
    head: {
      title: 'MCAstrLink 玩家面板',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }]
    }
  },

  css: ['~/assets/css/main.css'],

  // 明暗模式偏好存cookie而非localStorage: SSR可从cookie读取偏好, 避免水合不匹配
  colorMode: {
    storage: 'cookie'
  },

  runtimeConfig: {
    public: {
      // 后端API地址:
      // - 填写完整URL, 前端直连后端
      // - 填写相对路径 /mcastrlink, 请求经本服务端代理转发到后端
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/mcastrlink',
      // 页面显示的应用名, 通过 NUXT_PUBLIC_APP_NAME 覆盖
      APP_NAME: process.env.NUXT_PUBLIC_APP_NAME || 'MCAstrLink'
    },
    // 同源模式下代理转发的后端地址(仅服务端使用, 不会暴露给浏览器)
    apiProxyTarget: process.env.NUXT_API_PROXY_TARGET || 'http://127.0.0.1:22565'
  },

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  // 禁用Google字体提供者, 避免启动/构建时联网拉取字体元数据(网络受限环境)
  fonts: {
    providers: {
      google: false,
      googleicons: false
    }
  },

  // 图标完全本地化: SSR从已安装的@iconify-json/*加载, 浏览器使用打包进bundle的图标,
  // 任何情况下都不请求外部Iconify API
  icon: {
    serverBundle: 'local',
    clientBundle: {
      // 扫描代码中所有图标引用, 并显式补充动态/间接引用的图标, 全部打包进客户端bundle
      scan: true,
      icons: [
        'heroicons:server-stack',
        'heroicons:user-circle',
        'heroicons:sun',
        'heroicons:moon',
        'heroicons:arrow-right-on-rectangle',
        'heroicons:arrow-path',
        'heroicons:signal',
        'heroicons:x-circle',
        'heroicons:cloud-arrow-down',
        'heroicons:key',
        'heroicons:bars-3',
        'heroicons:exclamation-triangle',
        'heroicons:chat-bubble-oval-left-ellipsis',
        'heroicons:clock',
        'heroicons:shield-check',
        'heroicons:users',
        'mdi:server',
        'lucide:pencil',
        'lucide:trash'
      ]
    },
    // 本地集合找不到图标时也不回退到外部Iconify API
    fallbackToApi: false
  }
})
