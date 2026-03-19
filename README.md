# SKILLSMK — Agent Skills Marketplace

> 从 GitHub 社区发现、下载和分享高质量的开源 Agent Skills，完全兼容 SKILL.md 标准。

## 环境变量配置

复制 `.env.example` 为 `.env`，填写以下变量：

```bash
cp .env.example .env
```

| 变量名 | 说明 | 示例 |
|---|---|---|
| `NUXT_API_SIGN_SECRET` | 后端颁发的 HMAC-SHA256 签名密钥 | `8wHf...` |
| `NUXT_API_BASE_URL` | 后端 API 地址（不含尾部斜杠） | `https://api.skillsmk.com` |
| `NUXT_PUBLIC_SITE_URL` | 站点公开域名（不含尾部斜杠） | `https://www.skillsmk.com` |

> ⚠️ 生产服务器上 `NUXT_API_BASE_URL` 必须改为公网地址，局域网地址云服务器无法访问。

## 本地开发

```bash
npm install
npm run dev
```

开发服务器默认监听 `0.0.0.0:3000`（即局域网内其他设备也可访问）。

## 生产部署

```bash
# 构建
npm run build

# 启动（以 Node.js 服务器运行）
node .output/server/index.mjs
```

建议配合 PM2 或 systemd 守护进程使用：

```bash
pm2 start .output/server/index.mjs --name skillsmk
```

## 技术栈

- **框架**: [Nuxt 4](https://nuxt.com) + Vue 3（SSR 模式）
- **多语言**: @nuxtjs/i18n（支持 zh / en / ja / ko / de / fr / es / ar / pt）
- **Markdown 渲染**: marked + highlight.js
- **ZIP 预览**: JSZip
- **OG 图生成**: nuxt-og-image + satori

## 目录结构概览

```
app/
  components/    # 公共组件（SiteHeader, SkillCard, CategoryOverview…）
  composables/   # 数据获取（useSkillsApi, useCategoryStore, useZipTree…）
  i18n/locales/  # 多语言翻译文件
  pages/         # 路由页面（index, search, categories, leaderboard, skill/[id]…）
  assets/css/    # 全局样式变量与主题
server/
  routes/        # 服务端路由（sitemap.xml, llms-full.txt…）
  utils/         # 签名中间件等服务端工具
```
