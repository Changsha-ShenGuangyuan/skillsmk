/**
 * 路由切换自动滚顶插件
 * 监听 afterEach 钩子，每次路由完成后将 window 平滑滚至顶部
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hooks.hook('page:finish', () => {
    // page:finish 在路由切换且页面渲染完成后触发
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  })
})
