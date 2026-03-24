/**
 * Nuxt 服务端路由：/sitemaps/pages.xml
 * 静态页面子 sitemap（首页、分类、排行榜、搜索、服务条款）
 */

const LOCALES        = ['en', 'zh', 'ja', 'ko', 'de', 'fr', 'es', 'ar', 'pt']
const DEFAULT_LOCALE = 'en'

function hreflangLinks(baseUrl: string, path: string): string {
  const lines = LOCALES.map(code => {
    const href = code === DEFAULT_LOCALE
      ? `${baseUrl}${path}`
      : `${baseUrl}/${code}${path}`
    return `    <xhtml:link rel="alternate" hreflang="${code}" href="${href}"/>`
  })
  lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${path}"/>`)
  return lines.join('\n')
}

const STATIC_PAGES = [
  { path: '/',           changefreq: 'daily',   priority: '1.0' },
  { path: '/categories', changefreq: 'weekly',  priority: '0.8' },
  { path: '/rankings',   changefreq: 'daily',   priority: '0.8' },
  { path: '/search',     changefreq: 'weekly',  priority: '0.7' },
  { path: '/terms',      changefreq: 'monthly', priority: '0.3' },
]

export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=86400')

  const config  = useRuntimeConfig()
  const baseUrl = (config.public.siteUrl as string).replace(/\/$/, '')

  const entries = STATIC_PAGES.map(p => `
  <url>
    <loc>${baseUrl}${p.path}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
${hreflangLinks(baseUrl, p.path)}
  </url>`).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries}
</urlset>`
})
