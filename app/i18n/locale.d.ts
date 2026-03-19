/**
 * i18n 本地化模块声明
 * 所有翻译文件均 export default 一个 Record<string, string>
 */
declare module '*/locales/zh/*' {
  const value: Record<string, string>
  export default value
}

declare module '*/locales/en/*' {
  const value: Record<string, string>
  export default value
}
