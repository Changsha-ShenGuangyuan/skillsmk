/**
 * 服务端 i18n 重定向中间件
 *
 * 在 Nitro 渲染任何 HTML 之前，对根路径 / 做服务端 302 重定向，
 * 确保用户拿到的 HTML 与客户端期望的 locale 一致，消除 Hydration Mismatch。
 *
 * 优先级：cookie > Accept-Language（仅对非默认语言 en 生效）
 */

// 非默认（英文）的支持语言列表
const SUPPORTED_NON_DEFAULT = ['zh', 'ar', 'de', 'es', 'fr', 'ja', 'ko', 'pt']

export default defineEventHandler((event) => {
  const url = getRequestURL(event)

  // 只对根路径进行语言重定向
  if (url.pathname !== '/') return

  // 1. 优先读取语言 cookie
  const cookieLocale = getCookie(event, 'skillmk-locale')
  if (cookieLocale && SUPPORTED_NON_DEFAULT.includes(cookieLocale)) {
    return sendRedirect(event, `/${cookieLocale}${url.search}`, 302)
  }

  // 2. 解析 Accept-Language 请求头，检测浏览器首选语言
  const acceptLang = getRequestHeader(event, 'accept-language') || ''
  const detectedLocale = parseAcceptLanguage(acceptLang)
  if (detectedLocale) {
    return sendRedirect(event, `/${detectedLocale}${url.search}`, 302)
  }

  // 3. 默认语言（英文），直接渲染，无需重定向
})

/**
 * 解析 Accept-Language 头，返回第一个支持的非默认语言 code（如 'zh'）
 * Accept-Language: zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7
 */
function parseAcceptLanguage(acceptLang: string): string | null {
  const parts = acceptLang.split(',')
  for (const part of parts) {
    const lang = (part.split(';')[0] ?? '').trim().toLowerCase()
    // 取语言代码前两位（zh-CN → zh）
    const code = lang.slice(0, 2)
    if (SUPPORTED_NON_DEFAULT.includes(code)) return code
  }
  return null
}
