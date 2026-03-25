/**
 * Nuxt Server 代理路由
 *
 * 路由匹配规则：/api/proxy/** → 转发至真实后端 API
 *
 * 优化：
 *  - GET 请求使用 Nitro 服务端缓存（60s），命中缓存时直接返回，无需等待上游 API
 *  - 监听客户端连接关闭事件，若客户端中止（如快速翻页被 AbortController 取消），
 *    同步中止对上游 API 的转发请求，避免后端收到多余的请求触发 429
 */
// buildSignHeaders 由 Nitro 从 server/utils/sign.ts 自动导入，无需显式 import
import type { H3Event } from 'h3'

/**
 * 处理单次代理请求的核心逻辑（GET / 非 GET 均走此函数）
 */
async function handleProxy(event: H3Event) {
  const config  = useRuntimeConfig(event)
  const secret  = config.apiSignSecret as string
  const baseUrl = (config.apiBaseUrl as string).replace(/\/$/, '')

  // 从 URL 中取出 /api/proxy/ 后面的路径段（去掉 query string，避免重复拼接）
  const rawPath = event.path.replace(/^\/api\/proxy/, '') || '/'
  const urlPath = rawPath.split('?')[0]  // 只取路径，query 由下面的 qs 统一处理

  // 读取 query 参数
  const query = getQuery(event) as Record<string, unknown>

  // 读取 body 参数（GET/HEAD 请求没有 body，忽略错误）
  let body: Record<string, unknown> = {}
  if (!['GET', 'HEAD'].includes(event.method)) {
    try {
      body = (await readBody(event)) ?? {}
    } catch {
      body = {}
    }
  }

  // 合并参数用于签名（body 优先级高于 query）
  const allParams = { ...query, ...body }

  // 生成签名头
  const signHeaders = buildSignHeaders(allParams, secret)

  // 构造目标 URL（保留原始 query string）
  const qs = new URLSearchParams(query as Record<string, string>).toString()
  const targetUrl = `${baseUrl}${urlPath}${qs ? `?${qs}` : ''}`

  // 透传原始请求头（Content-Type，Accept-Language 等），再追加签名头
  const acceptLanguage = event.node.req.headers['accept-language']
  // 提取客户端真实 IP（优先读 x-forwarded-for，其次用 socket 直连 IP）
  const xForwardedFor = event.node.req.headers['x-forwarded-for']
  const clientIp = (
    typeof xForwardedFor === 'string'
      ? xForwardedFor.split(',')[0]?.trim()
      : Array.isArray(xForwardedFor)
        ? xForwardedFor[0]?.split(',')[0]?.trim()
        : event.node.req.socket?.remoteAddress
  ) || '127.0.0.1'

  const forwardHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Real-IP': clientIp,                           // 客户端真实 IP，由中间代理层透传
    ...(acceptLanguage ? { 'Accept-Language': acceptLanguage as string } : {}),
    ...signHeaders,
  }

  // ── 客户端 abort 透传 ──────────────────────────────────────────
  // 当前端通过 AbortController 取消请求时，Nitro 亦中止对上游 API 的调用，
  // 防止上游 API 收到多余请求触发限流（429）。
  const abortCtrl = new AbortController()
  event.node.req.on('close', () => abortCtrl.abort())

  // 转发请求
  try {
    const response = await $fetch.raw(targetUrl, {
      method:   event.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
      headers:  forwardHeaders,
      body:     Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
      signal:   abortCtrl.signal,
      ignoreResponseError: true,
    })

    // 设置响应状态码
    setResponseStatus(event, response.status)

    return response._data
  } catch (e: any) {
    // 客户端已主动中止，静默忽略
    if (e?.name === 'AbortError' || e?.cause?.name === 'AbortError') return
    throw e
  }
}

// ── GET 请求：加 60 秒服务端缓存，减少对上游 API 的重复调用 ────────────────
const cachedGetHandler = defineCachedEventHandler(
  (event: H3Event) => handleProxy(event),
  {
    maxAge: 60,                                      // 缓存 60 秒
    // 缓存 key = 完整请求路径（含 query string），不同参数互不影响
    getKey: (event: H3Event) => event.path,
    // 仅缓存服务端数据，不依赖请求头（Headers）
    varies: [],
  }
)

// ── 主入口：区分 GET 和非 GET 请求 ────────────────────────────────────────────
export default defineEventHandler((event: H3Event) => {
  // POST/PUT/DELETE/PATCH 等写操作不走缓存，直接透传
  if (event.method !== 'GET') {
    return handleProxy(event)
  }
  return cachedGetHandler(event)
})
