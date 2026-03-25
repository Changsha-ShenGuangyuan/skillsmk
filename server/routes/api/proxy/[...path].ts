/**
 * Nuxt Server 代理路由
 *
 * 路由匹配规则：/api/proxy/** → 转发至真实后端 API
 *
 * 优化：
 *  - skill 详情接口（/skills/:id）：5 分钟服务端缓存
 *  - 排行榜/列表接口（/skills-top, /skills）：2 分钟缓存
 *  - 其余 GET 接口：60 秒缓存
 *  - 非 GET 写操作：不缓存，直接透传
 *  - 监听客户端 abort 事件，同步中止上游请求，防止触发 429
 */
// buildSignHeaders 由 Nitro 从 server/utils/sign.ts 自动导入
import type { H3Event } from 'h3'

/**
 * 处理单次代理请求的核心逻辑
 */
async function handleProxy(event: H3Event) {
  const config  = useRuntimeConfig(event)
  const secret  = config.apiSignSecret as string
  const baseUrl = (config.apiBaseUrl as string).replace(/\/$/, '')

  // 取出 /api/proxy/ 后面的路径段（去掉 query string）
  const rawPath = event.path.replace(/^\/api\/proxy/, '') || '/'
  const urlPath = rawPath.split('?')[0]

  // 读取 query 参数
  const query = getQuery(event) as Record<string, unknown>

  // 读取 body（GET/HEAD 无 body）
  let body: Record<string, unknown> = {}
  if (!['GET', 'HEAD'].includes(event.method)) {
    try {
      body = (await readBody(event)) ?? {}
    } catch {
      body = {}
    }
  }

  const allParams = { ...query, ...body }
  const signHeaders = buildSignHeaders(allParams, secret)

  const qs = new URLSearchParams(query as Record<string, string>).toString()
  const targetUrl = `${baseUrl}${urlPath}${qs ? `?${qs}` : ''}`

  const acceptLanguage = event.node.req.headers['accept-language']
  const xForwardedFor  = event.node.req.headers['x-forwarded-for']
  const clientIp = (
    typeof xForwardedFor === 'string'
      ? xForwardedFor.split(',')[0]?.trim()
      : Array.isArray(xForwardedFor)
        ? xForwardedFor[0]?.split(',')[0]?.trim()
        : event.node.req.socket?.remoteAddress
  ) || '127.0.0.1'

  const forwardHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Real-IP': clientIp,
    ...(acceptLanguage ? { 'Accept-Language': acceptLanguage as string } : {}),
    ...signHeaders,
  }

  // 客户端 abort 透传：前端取消请求时同步中止上游调用，防止 429
  const abortCtrl = new AbortController()
  event.node.req.on('close', () => abortCtrl.abort())

  try {
    const response = await $fetch.raw(targetUrl, {
      method:  event.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
      headers: forwardHeaders,
      body:    Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
      signal:  abortCtrl.signal,
      ignoreResponseError: true,
    })
    setResponseStatus(event, response.status)
    return response._data
  } catch (e: any) {
    if (e?.name === 'AbortError' || e?.cause?.name === 'AbortError') return
    throw e
  }
}

// ── skill 详情接口：5 分钟缓存（详情内容较稳定，缓存时间长减少频繁触达上游）────────
const cachedSkillDetailHandler = defineCachedEventHandler(
  (event: H3Event) => handleProxy(event),
  {
    maxAge: 300,  // 5 分钟
    getKey: (event: H3Event) => `skill-detail:${event.path || ''}`,
    varies: [],
  }
)

// ── 排行榜 / 列表接口：2 分钟缓存 ─────────────────────────────────────────────
const cachedListHandler = defineCachedEventHandler(
  (event: H3Event) => handleProxy(event),
  {
    maxAge: 120,  // 2 分钟
    getKey: (event: H3Event) => `skill-list:${event.path || ''}`,
    varies: [],
  }
)

// ── 其余 GET 接口：60 秒缓存 ───────────────────────────────────────────────────
const cachedDefaultHandler = defineCachedEventHandler(
  (event: H3Event) => handleProxy(event),
  {
    maxAge: 60,
    getKey: (event: H3Event) => `proxy-default:${event.path || ''}`,
    varies: [],
  }
)

/**
 * 从 /api/proxy/ 后的路径判断属于哪类接口
 * 例：/api/proxy/skills/some-skill-key → urlPath = /skills/some-skill-key
 */
function getUrlPath(event: H3Event): string {
  return ((event.path || '').replace(/^\/api\/proxy/, '') || '/').split('?')[0] || '/'
}

// ── 主入口 ─────────────────────────────────────────────────────────────────────
export default defineEventHandler((event: H3Event) => {
  // 非 GET 写操作不缓存
  if (event.method !== 'GET') return handleProxy(event)

  const urlPath = getUrlPath(event)

  // skill 详情：/skills/:id（精确匹配，确保只有单个技能详情才走长缓存）
  if (/^\/skills\/[^/]+$/.test(urlPath)) return cachedSkillDetailHandler(event)

  // 排行榜 / 列表：/skills 和 /skills-top
  if (urlPath === '/skills' || urlPath === '/skills-top') return cachedListHandler(event)

  // 其余接口
  return cachedDefaultHandler(event)
})
