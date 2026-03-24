/**
 * Nitro 服务端路由：/sitemap.xsl
 *
 * 为 sitemap.xml 提供 XSLT 样式表，使浏览器以可读的表格形式渲染 sitemap。
 * sitemap.xml 通过 <?xml-stylesheet?> 处理指令引用本路由。
 */
export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'application/xslt+xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=86400')

  return `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  exclude-result-prefixes="sm xhtml">

  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html lang="zh">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Sitemap — SKILLSMK</title>
        <style>
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            font-size: 14px;
            background: #f7f8fa;
            color: #111827;
            line-height: 1.6;
          }

          /* ── 顶部 Bar ── */
          .header {
            background: #fff;
            border-bottom: 1px solid #e5e7eb;
            padding: 16px 32px;
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .header-logo {
            display: flex;
            align-items: center;
            gap: 10px;
            text-decoration: none;
            color: #111827;
          }
          .header-title {
            font-size: 16px;
            font-weight: 700;
            font-family: ui-monospace, monospace;
            letter-spacing: 0.05em;
          }
          .header-badge {
            font-size: 11px;
            font-family: ui-monospace, monospace;
            font-weight: 600;
            padding: 2px 8px;
            border-radius: 999px;
            background: #eef0f3;
            border: 1px solid #e5e7eb;
            color: #6b7280;
            letter-spacing: 0.06em;
          }

          /* ── 主容器 ── */
          .container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 32px 24px;
          }

          /* ── 统计卡片 ── */
          .stats {
            display: flex;
            gap: 12px;
            margin-bottom: 28px;
            flex-wrap: wrap;
          }
          .stat-card {
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 14px 20px;
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 140px;
          }
          .stat-label {
            font-size: 11px;
            font-family: ui-monospace, monospace;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }
          .stat-value {
            font-size: 22px;
            font-weight: 800;
            font-family: ui-monospace, monospace;
            color: #111827;
          }

          /* ── 表格 ── */
          .table-wrap {
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
          }
          .table-header {
            padding: 14px 20px;
            border-bottom: 1px solid #e5e7eb;
            background: #f7f8fa;
            font-family: ui-monospace, monospace;
            font-size: 12px;
            font-weight: 700;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          thead th {
            padding: 10px 20px;
            text-align: left;
            font-family: ui-monospace, monospace;
            font-size: 11.5px;
            font-weight: 700;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            background: #f7f8fa;
            border-bottom: 1px solid #e5e7eb;
            white-space: nowrap;
          }
          tbody tr {
            border-bottom: 1px solid #f3f4f6;
            transition: background 0.15s;
          }
          tbody tr:last-child { border-bottom: none; }
          tbody tr:hover { background: #f7f8fa; }
          td {
            padding: 10px 20px;
            vertical-align: middle;
          }

          /* URL 列 */
          .url-cell a {
            color: #2563eb;
            text-decoration: none;
            font-size: 13px;
            word-break: break-all;
          }
          .url-cell a:hover { text-decoration: underline; }

          /* 标签 */
          .tag {
            display: inline-block;
            font-family: ui-monospace, monospace;
            font-size: 10.5px;
            font-weight: 600;
            padding: 2px 7px;
            border-radius: 5px;
            border: 1px solid transparent;
          }
          .tag-daily    { background: rgba(37,99,235,0.08);  color: #2563eb;  border-color: rgba(37,99,235,0.2); }
          .tag-weekly   { background: rgba(22,163,74,0.08);  color: #16a34a;  border-color: rgba(22,163,74,0.2); }
          .tag-monthly  { background: rgba(107,114,128,0.1); color: #4b5563;  border-color: rgba(107,114,128,0.2); }
          .pri-high   { color: #16a34a; font-weight: 700; font-family: ui-monospace, monospace; }
          .pri-mid    { color: #2563eb; font-weight: 600; font-family: ui-monospace, monospace; }
          .pri-low    { color: #6b7280; font-weight: 600; font-family: ui-monospace, monospace; }

          .date-cell {
            font-family: ui-monospace, monospace;
            font-size: 12px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>

        <!-- 顶部 Header -->
        <div class="header">
          <a href="/" class="header-logo">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="16,2 28,8.5 28,23.5 16,30 4,23.5 4,8.5" fill="none" stroke="#2563eb" stroke-width="1.5"/>
              <polygon points="16,8 23,12 23,20 16,24 9,20 9,12" fill="rgba(37,99,235,0.12)" stroke="#2563eb" stroke-width="1"/>
              <circle cx="16" cy="16" r="3" fill="#2563eb"/>
            </svg>
            <span class="header-title">SKILLSMK</span>
          </a>
          <span class="header-badge">SITEMAP.XML</span>
        </div>

        <div class="container">

          <!-- 统计卡片 -->
          <div class="stats">
            <div class="stat-card">
              <span class="stat-label">Total URLs</span>
              <span class="stat-value"><xsl:value-of select="count(sm:urlset/sm:url)"/></span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Static Pages</span>
              <span class="stat-value">
                <xsl:value-of select="count(sm:urlset/sm:url[sm:changefreq != 'weekly' or not(sm:lastmod)])"/>
              </span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Skill Pages</span>
              <span class="stat-value">
                <xsl:value-of select="count(sm:urlset/sm:url[sm:lastmod])"/>
              </span>
            </div>
          </div>

          <!-- URL 表格 -->
          <div class="table-wrap">
            <div class="table-header">URL Index</div>
            <table>
              <thead>
                <tr>
                  <th style="width:50px">#</th>
                  <th>URL</th>
                  <th style="width:100px">Freq</th>
                  <th style="width:80px">Priority</th>
                  <th style="width:110px">Last Mod</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sm:urlset/sm:url">
                  <tr>
                    <!-- 序号 -->
                    <td style="color:#9ca3af;font-family:ui-monospace,monospace;font-size:12px">
                      <xsl:value-of select="position()"/>
                    </td>
                    <!-- URL -->
                    <td class="url-cell">
                      <a href="{sm:loc}" target="_blank" rel="noopener">
                        <xsl:value-of select="sm:loc"/>
                      </a>
                    </td>
                    <!-- Changefreq -->
                    <td>
                      <xsl:choose>
                        <xsl:when test="sm:changefreq = 'daily'">
                          <span class="tag tag-daily"><xsl:value-of select="sm:changefreq"/></span>
                        </xsl:when>
                        <xsl:when test="sm:changefreq = 'weekly'">
                          <span class="tag tag-weekly"><xsl:value-of select="sm:changefreq"/></span>
                        </xsl:when>
                        <xsl:otherwise>
                          <span class="tag tag-monthly"><xsl:value-of select="sm:changefreq"/></span>
                        </xsl:otherwise>
                      </xsl:choose>
                    </td>
                    <!-- Priority -->
                    <td>
                      <xsl:choose>
                        <xsl:when test="number(sm:priority) >= 0.8">
                          <span class="pri-high"><xsl:value-of select="sm:priority"/></span>
                        </xsl:when>
                        <xsl:when test="number(sm:priority) >= 0.5">
                          <span class="pri-mid"><xsl:value-of select="sm:priority"/></span>
                        </xsl:when>
                        <xsl:otherwise>
                          <span class="pri-low"><xsl:value-of select="sm:priority"/></span>
                        </xsl:otherwise>
                      </xsl:choose>
                    </td>
                    <!-- Lastmod -->
                    <td class="date-cell">
                      <xsl:value-of select="sm:lastmod"/>
                    </td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </div>

        </div>
      </body>
    </html>
  </xsl:template>

</xsl:stylesheet>`
})
