/**
 * 全局分类数据预加载插件
 *
 * 使用 Nuxt callOnce：在服务端运行一次，客户端通过 payload 恢复状态，
 * 无论刷新还是 SPA 导航均不会发起额外的分类 API 请求。
 */
import { useCategoryStore } from '~/composables/useCategoryStore'

export default defineNuxtPlugin(async (nuxtApp) => {
  const catStore = useCategoryStore()
  const locale = (nuxtApp.$i18n as { locale: { value: string } })?.locale?.value || 'en'

  // callOnce 确保：服务端执行一次并将结果写入 payload，客户端直接读取 payload，不重复请求
  await callOnce('category-store-init', () => catStore.ensureLoaded(locale))
})
