import type { RouterConfig } from '@nuxt/schema'

/**
 * 路由滚动行为配置
 * - 普通路由切换：置顶（插件 scroll-to-top.client.ts 负责平滑滚动）
 * - 带 #hash 的锚点：平滑滚动到目标元素
 * - 浏览器前进/后退：恢复历史位置
 */
export default {
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth', top: 80 }
    }
    return { top: 0, left: 0 }
  },
} satisfies RouterConfig
