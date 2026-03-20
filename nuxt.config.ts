// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // 运行时配置（服务端私有变量从 .env 中自动注入）
  runtimeConfig: {
    // 私有变量：只在服务端（Nitro）中可用，不会暴露给浏览器
    apiSignSecret: '', // 由 NUXT_API_SIGN_SECRET 自动注入
    apiBaseUrl: '',    // 由 NUXT_API_BASE_URL 自动注入
    // 公共变量：SSR + 客户端均可使用
    public: {
      siteUrl: 'https://www.skillsmk.com', // 由 NUXT_PUBLIC_SITE_URL 自动注入
    },
  },

  // 开启 SSR
  ssr: true,

  // 全局 CSS
  css: ['~/assets/css/style.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'en' },  // i18n defaultLocale 为 en，SSR 阶段输出此属性
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1.0',
      meta: [
        { name: 'theme-color', content: '#f7f8fa' },
        { name: 'author', content: 'SKILLSMK' },
        { name: 'robots', content: 'index, follow' },
        // keywords 在 app.vue 中由 useSeoMeta 随 i18n 动态注入
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpolygon points='16,2 28,8.5 28,23.5 16,30 4,23.5 4,8.5' fill='none' stroke='%232563eb' stroke-width='1.5'/%3E%3Cpolygon points='16,8 23,12 23,20 16,24 9,20 9,12' fill='rgba(37,99,235,0.12)' stroke='%232563eb' stroke-width='1'/%3E%3Ccircle cx='16' cy='16' r='3' fill='%232563eb'/%3E%3C/svg%3E",
        },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap',
        },
      ],
      script: [
        {
          // 主题初始化：在 DOM 解析阶段立即执行，防止 FOUC（页面闪烁）
          // 默认为 light，只有 localStorage 明确保存 'dark' 时才切暗色
          tagPriority: 'critical',
          innerHTML: `(function(){
  var saved = localStorage.getItem('skillsmk-theme');
  var dark  = saved === 'dark' || (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
})();`,
        },

        {
          type: 'application/ld+json',
          innerHTML: (() => {
            // 构建时从环境变量读取域名，与 runtimeConfig.public.siteUrl 保持一致
            const s = process.env.NUXT_PUBLIC_SITE_URL || 'https://www.skillsmk.com'
            return JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebSite',
                  '@id': `${s}/#website`,
                  url: `${s}/`,
                  name: 'SKILLSMK',
                  description: 'Discover and share open-source Agent Skills from GitHub',
                  inLanguage: 'en',
                  availableLanguage: ['zh', 'en', 'ja', 'ko', 'de', 'fr', 'es', 'ar', 'pt'],
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: { '@type': 'EntryPoint', urlTemplate: `${s}/search?q={search_term_string}` },
                    'query-input': 'required name=search_term_string',
                  },
                },
                {
                  '@type': 'SoftwareApplication',
                  '@id': `${s}/#app`,
                  name: 'SKILLSMK',
                  applicationCategory: 'DeveloperApplication',
                  operatingSystem: 'Web',
                  url: `${s}/`,
                  description: 'Open-source Agent Skills marketplace, curated high-quality LLM skill components',
                  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
                },
                {
                  '@type': 'Organization',
                  '@id': `${s}/#org`,
                  name: 'SKILLSMK',
                  url: `${s}/`,
                  logo: `${s}/og-image.png`,
                },
              ],
            })
          })(),
        },
      ],
    },
  },

  // Vite 构建配置 (从 vite.config.ts 迁移)
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            highlight: ['highlight.js'],
            markdown: ['marked', 'marked-highlight'],
          },
        },
      },
      chunkSizeWarningLimit: 800,
    },
  },

  // 模块配置
  modules: [
    '@nuxtjs/i18n',
    'nuxt-og-image'
  ],

  // 站点配置 (nuxt-og-image 及诸多 SEO 模块需要)
  site: {
    url: 'https://www.skillsmk.com',
    name: 'SKILLSMK'
  },

  // i18n 多语言路由配置
  i18n: {
    locales: [
      { code: 'zh', language: 'zh-CN', name: '中文', file: 'zh.ts' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.ts' },
      { code: 'ar', language: 'ar-SA', name: 'العربية', file: 'ar.ts' },
      { code: 'de', language: 'de-DE', name: 'Deutsch', file: 'de.ts' },
      { code: 'es', language: 'es-ES', name: 'Español', file: 'es.ts' },
      { code: 'fr', language: 'fr-FR', name: 'Français', file: 'fr.ts' },
      { code: 'ja', language: 'ja-JP', name: '日本語', file: 'ja.ts' },
      { code: 'ko', language: 'ko-KR', name: '한국어', file: 'ko.ts' },
      { code: 'pt', language: 'pt-BR', name: 'Português', file: 'pt.ts' }
    ],
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'skillmk-locale',
      redirectOn: 'root',
      // alwaysRedirect: true 使服务端在渲染前先重定向到正确语言的 URL，
      // 确保 SSR 和客户端使用同一 locale，消除 Hydration Mismatch
      alwaysRedirect: true,
    },
    // v10 中懒加载为默认行为（无需 lazy 选项），langDir 为顶层配置
    langDir: '../app/i18n/locales/',
  },

  // 路由规则：全站统一使用 SWR（Stale-While-Revalidate）缓存策略
  // 首次请求服务端渲染并缓存，缓存过期后后台悄悄刷新，用户始终秒开
  routeRules: {
    '/':            { swr: 1800  },  // 首页：30分钟，含技能数量等动态数据
    '/categories':  { swr: 3600  },  // 分类页：1小时，分类变化少
    '/leaderboard': { swr: 600   },  // 排行榜：10分钟，需要相对及时
    '/terms':       { swr: 86400 },  // 条款页：1天，内容极少变化
    '/skill/**':    { swr: 3600  },  // 技能详情：1小时
    // /search 走正常 SSR，支持 ?q= 长尾搜索词实时查询
  },
})
