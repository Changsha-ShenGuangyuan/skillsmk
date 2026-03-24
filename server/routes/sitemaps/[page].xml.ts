/**
 * Nuxt 服务端路由：/sitemaps/[page].xml
 *
 * 技能页动态子 sitemap，每个子 sitemap 对应 API 的一页数据（100条/页）。
 * 爬虫按需拉取，服务端只做一次 API 调用即可响应。
 */

type SkillItem = {
  skill_key: string
  updated_at?: string
}
type SkillsApiResponse = {
  code: number
  data: SkillItem[]
  meta: { total: number; per_page: number; current_page: number; last_page: number }
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')

  const config  = useRuntimeConfig()
  const baseUrl = (config.public.siteUrl as string).replace(/\/$/, '')
  const apiBase = (config.apiBaseUrl as string).replace(/\/$/, '')
  const secret  = config.apiSignSecret as string

  // 路由参数 page 是从 0 开始的索引，API page 从 1 开始
  const pageParam = getRouterParam(event, 'page') ?? '0'
  const pageIndex = parseInt(pageParam, 10)

  if (isNaN(pageIndex) || pageIndex < 0) {
    setResponseStatus(event, 404)
    return '<?xml version="1.0" encoding="UTF-8"?><error>Invalid page</error>'
  }

  const apiPage = pageIndex + 1  // 转换为 1-based
  const perPage = 100
  const today   = new Date().toISOString().split('T')[0]

  let skills: SkillItem[] = []
  try {
    const params = { page: apiPage, per_page: perPage }
    const res = await $fetch<SkillsApiResponse>(`${apiBase}/skills`, {
      params,
      headers: buildSignHeaders(params, secret),
    }).catch(() => null)

    if (res?.code === 0) {
      skills = res.data
    }
  } catch (e) {
    console.error(`[sitemaps/${pageIndex}.xml] API 请求失败`, e)
  }

  const entries = skills
    .filter(s => s.skill_key)
    .map(s => {
      const lastmod = s.updated_at ? s.updated_at.split('T')[0] : today
      return `
  <url>
    <loc>${baseUrl}/skill/${s.skill_key}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`
    }).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`
})
