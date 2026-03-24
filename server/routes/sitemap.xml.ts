/**
 * Nuxt 服务端路由：/sitemap.xml
 *
 * 动态生成 sitemap，包含：
 * - 静态页面（首页、分类、排行榜、服务条款）— 含 hreflang 多语言标注
 * - 所有技能详情页（/skill/{skill_key}）— 从后端 API 实时拉取
 *
 * 爬虫每次请求都能拿到最新技能列表，新增技能可被快速发现。
 */

/** 支持的语言列表（与 nuxt.config.ts i18n.locales 保持同步）*/
const LOCALES = ['en', 'zh', 'ja', 'ko', 'de', 'fr', 'es', 'ar', 'pt']
const DEFAULT_LOCALE = 'en'

/** 构建某路径的 hreflang alternate 标签组 */
function hreflangLinks(baseUrl: string, path: string): string {
  const lines = LOCALES.map((code) => {
    const href = code === DEFAULT_LOCALE
      ? `${baseUrl}${path}`
      : `${baseUrl}/${code}${path}`
    return `    <xhtml:link rel="alternate" hreflang="${code}" href="${href}"/>`
  })
  lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${path}"/>`)
  return lines.join('\n')
}

/** 静态页面配置 */
const STATIC_PAGES = [
  { path: '/',            changefreq: 'daily',   priority: '1.0' },
  { path: '/categories',  changefreq: 'weekly',  priority: '0.8' },
  { path: '/rankings', changefreq: 'daily',   priority: '0.8' },
  { path: '/search',      changefreq: 'weekly',  priority: '0.7' },
  { path: '/terms',       changefreq: 'monthly', priority: '0.3' },
]

type SkillItem = {
  skill_key: string
  name: string
  updated_at?: string
}
type SkillsApiResponse = {
  code: number
  data: SkillItem[]
  meta: { total: number; per_page: number; current_page: number; last_page: number }
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  // 缓存 1 小时，减轻 API 压力
  setHeader(event, 'Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')

  const config  = useRuntimeConfig()
  const baseUrl = config.public.siteUrl as string
  const apiBase = (config.apiBaseUrl as string).replace(/\/$/, '')
  const secret  = config.apiSignSecret as string

  // ─── 拉取全量技能列表（分页）────────────────────────────────────
  const allSkills: SkillItem[] = []
  try {
    const p1Params = { page: 1, per_page: 100 }
    const first = await $fetch<SkillsApiResponse>(`${apiBase}/skills`, {
      params:  p1Params,
      headers: buildSignHeaders(p1Params, secret),
    }).catch(() => null)

    if (first?.code === 0) {
      allSkills.push(...first.data)
      const { last_page } = first.meta
      if (last_page > 1) {
        const pages = Array.from({ length: last_page - 1 }, (_, i) => i + 2)
        const results = await Promise.allSettled(
          pages.map(p => {
            const params = { page: p, per_page: 100 }
            return $fetch<SkillsApiResponse>(`${apiBase}/skills`, {
              params,
              headers: buildSignHeaders(params, secret),
            })
          })
        )
        for (const r of results) {
          if (r.status === 'fulfilled' && r.value?.code === 0) {
            allSkills.push(...r.value.data)
          }
        }
      }
    }
  } catch (e) {
    console.error('[sitemap.xml] API 请求失败', e)
  }

  // ─── 生成静态页 URL 条目 ─────────────────────────────────────────
  const staticEntries = STATIC_PAGES.map(p => `
  <url>
    <loc>${baseUrl}${p.path}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
${hreflangLinks(baseUrl, p.path)}
  </url>`).join('')

  // ─── 生成技能页 URL 条目 ─────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0]
  const skillEntries = allSkills
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
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${staticEntries}
${skillEntries}
</urlset>`
})
