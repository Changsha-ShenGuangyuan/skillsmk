/**
 * Nitro 服务端路由：/sitemap.xsl
 * 标准 Yoast 风格样式表，同时支持 <sitemapindex> 和 <urlset> 两种格式。
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

  <!-- ── 公共 CSS ── -->
  <xsl:template name="styles">
    <style>
      body {
        font-family: Helvetica, Arial, sans-serif;
        font-size: 13px;
        color: #545353;
        background: #fff;
        margin: 0;
      }
      #header {
        background-color: #2563eb;
        padding: 20px 28px;
        color: #fff;
      }
      #header h1 { margin: 0 0 6px; font-size: 18px; }
      #header p  { margin: 0; font-size: 13px; opacity: 0.85; }
      #header a  { color: #fff; text-decoration: underline; }
      #content { padding: 20px 28px; }
      #intro {
        background: #f5f5f5;
        border: 1px solid #e0e0e0;
        padding: 12px 16px;
        border-radius: 4px;
        margin-bottom: 20px;
        font-size: 12px;
        line-height: 1.7;
      }
      #intro a { color: #2563eb; }
      table { width: 100%; border-collapse: collapse; }
      thead tr { background-color: #2563eb; color: #fff; }
      thead th {
        text-align: left;
        padding: 8px 12px;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.03em;
      }
      tbody tr { border-bottom: 1px solid #eee; }
      tbody tr:hover { background: #f9f9f9; }
      tbody tr:last-child { border-bottom: none; }
      td { padding: 7px 12px; vertical-align: middle; font-size: 12.5px; }
      td a { color: #2563eb; text-decoration: none; }
      td a:hover { text-decoration: underline; }
    </style>
  </xsl:template>

  <!-- ── 入口：sitemapindex ── -->
  <xsl:template match="/sm:sitemapindex">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>XML Sitemap Index — SKILLSMK</title>
        <xsl:call-template name="styles"/>
      </head>
      <body>
        <div id="header">
          <h1>XML Sitemap Index</h1>
          <p>
            This sitemap index contains <xsl:value-of select="count(sm:sitemap)"/> sub-sitemaps.
            Site: <a href="https://www.skillsmk.com">www.skillsmk.com</a>.
          </p>
        </div>
        <div id="content">
          <div id="intro">
            This is the <strong>Sitemap Index</strong> for <strong>SKILLSMK</strong>.
            It lists all sub-sitemaps used by search engines such as
            <a href="https://www.google.com/webmasters/sitemaps/" target="_blank" rel="noopener">Google</a>
            and <a href="https://www.bing.com/webmaster" target="_blank" rel="noopener">Bing</a>.
            Click any sub-sitemap to view its URLs.
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:70%">Sitemap URL</th>
                <th>Last Modified</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sm:sitemap">
                <tr>
                  <td><a href="{sm:loc}" target="_blank" rel="noopener"><xsl:value-of select="sm:loc"/></a></td>
                  <td><xsl:value-of select="sm:lastmod"/></td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </div>
      </body>
    </html>
  </xsl:template>

  <!-- ── 入口：urlset（子 sitemap）── -->
  <xsl:template match="/sm:urlset">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>XML Sitemap — SKILLSMK</title>
        <xsl:call-template name="styles"/>
      </head>
      <body>
        <div id="header">
          <h1>XML Sitemap</h1>
          <p>
            This sitemap contains <xsl:value-of select="count(sm:url)"/> URLs.
            <a href="/sitemap.xml">← Back to Sitemap Index</a>
          </p>
        </div>
        <div id="content">
          <div id="intro">
            This is a sub-sitemap for <strong>SKILLSMK</strong>, used by search engines such as
            <a href="https://www.google.com/webmasters/sitemaps/" target="_blank" rel="noopener">Google</a>
            and <a href="https://www.bing.com/webmaster" target="_blank" rel="noopener">Bing</a>.
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:58%">URL</th>
                <th>Last Modified</th>
                <th>Change Frequency</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sm:url">
                <tr>
                  <td><a href="{sm:loc}" target="_blank" rel="noopener"><xsl:value-of select="sm:loc"/></a></td>
                  <td><xsl:value-of select="sm:lastmod"/></td>
                  <td><xsl:value-of select="sm:changefreq"/></td>
                  <td><xsl:value-of select="sm:priority"/></td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </div>
      </body>
    </html>
  </xsl:template>

</xsl:stylesheet>`
})
