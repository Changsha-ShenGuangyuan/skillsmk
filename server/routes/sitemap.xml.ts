/**
 * Nuxt 服务端路由：/sitemap.xml
 *
 * Sitemap Index 格式：
 *  - 只做一次轻量 API 调用（per_page=1）获取总页数
 *  - 返回 <sitemapindex>，列出所有子 sitemap 的 URL
 *  - 子 sitemap 由 /sitemaps/pages.xml 和 /sitemaps/[n].xml 提供
 *
 * 优势：本路由极快（1 次 API）；爬虫按需拉取子 sitemap，并发可控。
 */

type MetaResponse = {
  code: number
  meta: { last_page: number }
  data: unknown[]
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')

  const config  = useRuntimeConfig()
  const baseUrl = (config.public.siteUrl as string).replace(/\/$/, '')
  const apiBase = (config.apiBaseUrl as string).replace(/\/$/, '')
  const secret  = config.apiSignSecret as string

  // 只拉第 1 页（per_page=1）获取 last_page，避免拉全量数据
  let lastPage = 1
  try {
    const params = { page: 1, per_page: 100 }
    const res = await $fetch<MetaResponse>(`${apiBase}/skills`, {
      params,
      headers: buildSignHeaders(params, secret),
    }).catch(() => null)

    if (res?.code === 0 && res.meta?.last_page) {
      lastPage = res.meta.last_page
    }
  } catch (e) {
    console.error('[sitemap.xml] 获取总页数失败', e)
  }

  // 生成子 sitemap 条目
  const today = new Date().toISOString().split('T')[0]

  // 静态页 sitemap
  const staticEntry = `
  <sitemap>
    <loc>${baseUrl}/sitemaps/pages.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`

  // 技能分片 sitemap（每个子 sitemap = 100条技能）
  const skillEntries = Array.from({ length: lastPage }, (_, i) => `
  <sitemap>
    <loc>${baseUrl}/sitemaps/${i}.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntry}
${skillEntries}
</sitemapindex>`
})
