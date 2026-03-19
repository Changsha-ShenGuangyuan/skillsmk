<script setup lang="ts">
// Nuxt 错误页面
defineProps<{
  error: {
    statusCode: number
    statusMessage?: string
  }
}>()

const handleClearError = () => clearError({ redirect: '/' })
</script>

<template>
  <div class="error-page">
    <div class="error-container">
      <div class="error-glitch" aria-hidden="true">
        <span>{{ error.statusCode }}</span>
        <span>{{ error.statusCode }}</span>
        <span>{{ error.statusCode }}</span>
      </div>

      <h1 class="error-title">
        {{ error.statusCode === 404 ? '页面未找到' : '发生错误' }}
      </h1>

      <p class="error-description">
        {{ error.statusMessage || '抱歉，您访问的页面不存在或已被移除。' }}
      </p>

      <button class="error-btn" @click="handleClearError">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        返回首页
      </button>
    </div>
  </div>
</template>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg, #f7f8fa);
  color: var(--fg, #1a1a2e);
  font-family: 'Plus Jakarta Sans', 'JetBrains Mono', system-ui, sans-serif;
  padding: 2rem;
}

.error-container {
  text-align: center;
  max-width: 480px;
}

.error-glitch {
  position: relative;
  font-size: 120px;
  font-weight: 800;
  font-family: 'JetBrains Mono', monospace;
  color: var(--accent, #2563eb);
  line-height: 1;
  margin-bottom: 1.5rem;
}

.error-glitch span {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
}

.error-glitch span:first-child {
  position: relative;
}

.error-glitch span:nth-child(2) {
  animation: glitch-1 2s infinite;
  color: #ef4444;
  opacity: 0.5;
  clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
}

.error-glitch span:nth-child(3) {
  animation: glitch-2 2s infinite;
  color: #10b981;
  opacity: 0.5;
  clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
}

@keyframes glitch-1 {
  0%, 100% { transform: translateX(-50%); }
  20% { transform: translateX(calc(-50% - 4px)); }
  40% { transform: translateX(calc(-50% + 4px)); }
  60% { transform: translateX(calc(-50% - 2px)); }
  80% { transform: translateX(calc(-50% + 2px)); }
}

@keyframes glitch-2 {
  0%, 100% { transform: translateX(-50%); }
  20% { transform: translateX(calc(-50% + 3px)); }
  40% { transform: translateX(calc(-50% - 3px)); }
  60% { transform: translateX(calc(-50% + 1px)); }
  80% { transform: translateX(calc(-50% - 1px)); }
}

.error-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 0.75rem;
  color: var(--fg, #1a1a2e);
}

.error-description {
  font-size: 15px;
  color: var(--fg-secondary, #64748b);
  margin: 0 0 2rem;
  line-height: 1.6;
}

.error-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  background: var(--accent, #2563eb);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

:root[data-theme="dark"] .error-btn {
  color: #0f172a; /* 黑夜模式下文字改为深色 */
}

.error-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.25);
}
</style>
