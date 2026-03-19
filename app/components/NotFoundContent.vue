<script setup lang="ts">

const router = useRouter()
const localePath = useLocalePath()

function goHome() {
  router.push(localePath('/'))
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="not-found-page">
    <!-- 背景光球 -->
    <div class="nf-orb nf-orb--red" />
    <div class="nf-orb nf-orb--purple" />

    <!-- 网格背景 -->
    <div class="nf-grid" />

    <div class="nf-content fade-up">
      <!-- 顶部标签 -->
      <div class="nf-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        ERROR · 404
      </div>

      <!-- 大号错误码 -->
      <div class="nf-code" aria-hidden="true">
        <span class="nf-code__digit">4</span>
        <span class="nf-code__zero">
          <svg viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="36" stroke="url(#grad0)" stroke-width="3" stroke-dasharray="6 4"/>
            <circle cx="40" cy="40" r="22" stroke="rgba(37,99,235,0.2)" stroke-width="1.5"/>
            <circle cx="40" cy="40" r="6" fill="rgba(37,99,235,0.4)"/>
            <defs>
              <linearGradient id="grad0" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                <stop stop-color="#3b82f6"/>
                <stop offset="1" stop-color="#7c3aed"/>
              </linearGradient>
            </defs>
          </svg>
        </span>
        <span class="nf-code__digit">4</span>
      </div>

      <!-- 扫描线分隔 -->
      <div class="nf-divider"/>

      <h1 class="nf-title">页面未找到</h1>
      <p class="nf-desc">
        您访问的技能或页面不存在。<br/>
        可能已被删除，或地址输入有误。
      </p>

      <!-- 终端风格错误信息框 -->
      <div class="nf-terminal">
        <div class="nf-terminal__bar">
          <span class="nf-terminal__dot nf-terminal__dot--red"/>
          <span class="nf-terminal__dot nf-terminal__dot--yellow"/>
          <span class="nf-terminal__dot nf-terminal__dot--green"/>
          <span class="nf-terminal__file">shell</span>
        </div>
        <div class="nf-terminal__body">
          <span class="nf-terminal__prompt">$</span>
          <span class="nf-terminal__cmd">fetch <span class="nf-terminal__path">{{ $route.path }}</span></span>
          <br/>
          <span class="nf-terminal__error">↳ Error 404: Resource not found</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="nf-actions">
        <button class="nf-btn nf-btn--primary" @click="goHome">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          返回主页
        </button>
        <button class="nf-btn nf-btn--ghost" @click="goBack">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          返回上页
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── 页面容器 ── */
.not-found-page {
  min-height: calc(100vh - 70px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  position: relative;
  overflow: hidden;
}

/* ── 背景光球 ── */
.nf-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(90px);
  z-index: 0;
}
.nf-orb--red {
  top: 10%;
  left: 30%;
  width: 500px;
  height: 400px;
  background: radial-gradient(ellipse, rgba(239, 68, 68, 0.08) 0%, transparent 65%);
}
.nf-orb--purple {
  bottom: 5%;
  right: 20%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.10) 0%, transparent 65%);
}

/* ── 网格背景 ── */
.nf-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(34, 211, 238, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(34, 211, 238, 0.03) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
  z-index: 0;
}

/* ── 内容卡片 ── */
.nf-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 520px;
  width: 100%;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 48px 40px 44px;
  box-shadow: var(--shadow-float);
}

/* ── 顶部标签 ── */
.nf-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.07);
  color: #f87171;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin-bottom: 28px;
}

/* ── 大号错误码 ── */
.nf-code {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
  line-height: 1;
}

/* 去掉渐变剪切，改用简洁纯色 */
.nf-code__digit {
  font-family: var(--font-mono);
  font-size: clamp(72px, 12vw, 100px);
  font-weight: 900;
  color: var(--fg);
  letter-spacing: -0.04em;
}

/* 图标容器改为蓝色系发光 */
.nf-code__zero {
  width: clamp(64px, 10vw, 88px);
  height: clamp(64px, 10vw, 88px);
  flex-shrink: 0;
  animation: nfSpin 12s linear infinite;
  filter: drop-shadow(0 0 10px rgba(37, 99, 235, 0.25));
}
.nf-code__zero svg { width: 100%; height: 100%; }

@keyframes nfSpin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* ── 扫描线分隔 ── */
.nf-divider {
  height: 1px;
  background: var(--border);
  margin: 0 0 24px;
}

/* ── 标题与描述 ── */
.nf-title {
  font-family: var(--font-mono);
  font-size: 22px;
  font-weight: 700;
  color: var(--fg);
  margin: 0 0 12px;
  letter-spacing: -0.01em;
}

.nf-desc {
  font-size: 14px;
  color: var(--fg-secondary);
  line-height: 1.75;
  margin: 0 0 28px;
}

/* ── 终端错误框 ── */
.nf-terminal {
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid var(--border);
  border-radius: 10px;
  margin-bottom: 32px;
  overflow: hidden;
  text-align: left;
}

.nf-terminal__bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.025);
  border-bottom: 1px solid var(--border);
}

.nf-terminal__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}
.nf-terminal__dot--red    { background: #ef4444; }
.nf-terminal__dot--yellow { background: #f59e0b; }
.nf-terminal__dot--green  { background: #10b981; }

.nf-terminal__file {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted);
  margin-left: 4px;
  letter-spacing: 0.06em;
}

.nf-terminal__body {
  padding: 14px 16px;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.9;
}

.nf-terminal__prompt {
  color: var(--accent);
  margin-right: 8px;
}

.nf-terminal__cmd {
  color: var(--fg-secondary);
}

.nf-terminal__path {
  color: #a78bfa;
}

.nf-terminal__error {
  color: #f87171;
  display: inline-block;
  padding-left: 4px;
}

/* ── 操作按钮 ── */
.nf-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.nf-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 22px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  font-family: var(--font-mono);
  cursor: pointer;
  letter-spacing: 0.03em;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease;
  white-space: nowrap;
}

/* 主按钮改为黑色系，与全站 CTA 一致 */
.nf-btn--primary {
  background: var(--accent);
  color: #ffffff;
  border: 1px solid var(--accent);
}
.nf-btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-float);
  background: #374151;
  border-color: #374151;
}

.nf-btn--ghost {
  background: var(--bg-elevated);
  color: var(--fg-secondary);
  border: 1px solid var(--border);
}
.nf-btn--ghost:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-strong);
  color: var(--fg);
  transform: translateY(-2px);
}
</style>
