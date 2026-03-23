# ══════════════════════════════════════════════════════════════════════════════
# 前端 Dockerfile — Nuxt 3 SSR (Node.js 22)
# 构建命令：docker build -t skillsmk-frontend ./skillsmk
# ══════════════════════════════════════════════════════════════════════════════

# ── 第一阶段：构建（build stage）────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# 先复制 package 文件以利用 Docker 层缓存
COPY package.json package-lock.json ./

# 安装全量依赖（Nuxt 3 构建需要完整的 devDependencies）
# 使用 npm ci 保证确定性构建
RUN npm ci --prefer-offline

# 复制其余源代码
COPY . .

# 执行 Nuxt 构建（生成 .output 目录）
# 环境变量在运行时由容器注入，构建时仅需基础参数
ARG NUXT_PUBLIC_SITE_URL=https://skillsmk.com
ENV NUXT_PUBLIC_SITE_URL=${NUXT_PUBLIC_SITE_URL} \
    NODE_ENV=production

RUN npm run build


# ── 第二阶段：运行时（runtime stage）────────────────────────────────────────
FROM node:22-alpine AS runner

LABEL maintainer="SkillsMK Team" \
      version="1.0" \
      description="SkillsMK Frontend - Nuxt 3 SWRPM2 on Node 22"

# 设置时区和运行环境
ENV TZ=Asia/Shanghai \
    NODE_ENV=production \
    PORT=3000

RUN apk add --no-cache tzdata \
    && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime \
    && echo $TZ > /etc/timezone

WORKDIR /app

# 从构建阶段仅拷贝编译后的结果（.output 包含 server + public）
COPY --from=builder /app/.output ./

# 安全性：使用非 root 用户运行
RUN addgroup -S nuxt && adduser -S nuxt -G nuxt
USER nuxt

# ── 对外端口 ─────────────────────────────────────────────────────────────────
EXPOSE 3000

# ── 启动命令 ─────────────────────────────────────────────────────────────────
# .output/server/index.mjs 是 Nuxt 3 生成的标准入口
CMD ["node", "server/index.mjs"]
