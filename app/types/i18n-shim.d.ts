/**
 * @nuxtjs/i18n 全局类型补全（临时 shim）
 *
 * 背景：@nuxtjs/i18n 模块的 auto-import 类型未在 .nuxt/types/imports.d.ts 中生成，
 * 导致 useLocalePath 等组合函数在编辑器中报 TS 错误。
 *
 * 此文件将缺失的类型声明到全局，效果等同于 nuxt prepare 正确执行后的结果。
 *
 * 长期修复方法：删除 .nuxt 目录后执行 `npx nuxt prepare` 或重启 dev server。
 */

declare global {
  /**
   * 返回一个函数，用于将路由路径本地化为当前或指定语言的前缀路径。
   * eg: useLocalePath()('/')  →  '/zh' or '/'
   */
  function useLocalePath(): (route: string | Record<string, unknown>, locale?: string) => string

  /**
   * 返回一个函数，用于切换当前路由到指定语言的路径。
   */
  function useSwitchLocalePath(): (locale: string) => string

  /**
   * 返回一个函数，用于解析当前路由的基础名称（去掉语言后缀）。
   */
  function useRouteBaseName(): (route?: string | Record<string, unknown>) => string | undefined
}

export {}
