<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useI18n, loadModule } from '~/i18n'

// 接入 i18n
const i18n = useI18n()
const localePath = useLocalePath()
const t = i18n.t

onMounted(async () => {
  await loadModule(i18n.locale, 'footer')
})

watch(i18n.locale, async (lang) => {
  await loadModule(lang, 'footer')
})

</script>

<template>
  <footer class="footer" role="contentinfo">
    <!-- 顶部分隔光线 -->
    <div class="footer-top-glow" />

    <div class="footer-inner">
      <div class="footer-main">
        <!-- Brand -->
        <div class="footer-brand">
          <div class="footer-logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="16,2 28,8.5 28,23.5 16,30 4,23.5 4,8.5" fill="none" stroke="#2563eb" stroke-width="1.5"/>
              <polygon points="16,8 23,12 23,20 16,24 9,20 9,12" fill="rgba(37,99,235,0.12)" stroke="#2563eb" stroke-width="1"/>
              <circle cx="16" cy="16" r="3" fill="#2563eb"/>
            </svg>
            <span class="footer-logo-text">SKILLSMK</span>
          </div>
          <p class="footer-description">
            {{ t('footer.description', '发现、浏览、一键复制最优质的 Agent Skills。精选技能库，LLM 测评打分，助你效率翻倍。') }}
          </p>
          <!-- 终端风格状态 -->
          <div class="footer-terminal">
            <span class="terminal-dot terminal-dot--red" />
            <span class="terminal-dot terminal-dot--yellow" />
            <span class="terminal-dot terminal-dot--green" />
            <span class="terminal-status">system: online<span class="terminal-cursor">_</span></span>
          </div>
        </div>

        <!-- Links -->
        <div class="footer-links">
          <div class="footer-link-col">
            <h4 class="footer-link-title">{{ t('footer.quickLinks', '快速链接') }}</h4>
            <ul class="footer-link-list">
              <li><NuxtLink :to="localePath('/search')" class="footer-link"><span class="link-arrow">›</span> {{ t('footer.search', '搜索') }}</NuxtLink></li>
              <li><NuxtLink :to="localePath('/leaderboard')" class="footer-link"><span class="link-arrow">›</span> {{ t('footer.leaderboard', '排行榜') }}</NuxtLink></li>
              <li><NuxtLink :to="localePath('/categories')" class="footer-link"><span class="link-arrow">›</span> {{ t('footer.categories', '分类') }} <span class="link-badge">NEW</span></NuxtLink></li>
            </ul>
          </div>

          <div class="footer-link-col">
            <h4 class="footer-link-title">{{ t('footer.about', '关于') }}</h4>
            <ul class="footer-link-list">
              <li><a href="https://github.com/" target="_blank" rel="noopener noreferrer" class="footer-link"><span class="link-arrow">›</span> GitHub</a></li>
              <li><a href="https://code.claude.com/docs/en/skills" target="_blank" rel="noopener noreferrer" class="footer-link"><span class="link-arrow">›</span> {{ t('footer.claudeDocs', 'Claude 文档') }}</a></li>
              <li><NuxtLink :to="localePath('/terms')" class="footer-link"><span class="link-arrow">›</span> {{ t('footer.terms', '服务条款') }}</NuxtLink></li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Bottom bar -->
      <div class="footer-bottom">
        <span class="footer-copyright">{{ t('footer.copyright', '内容来源于 GITHUB，版权归原作者所有') }}</span>
        <div class="footer-divider-dot" />
        <span class="footer-copyright">{{ t('footer.rights', '© 2026 SKILLSMK. ALL RIGHTS RESERVED.') }}</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  position: relative;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
  padding: 56px 0 28px;
  z-index: 1;
}

/* 顶部分隔线 */
.footer-top-glow { display: none; }

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.footer-main {
  display: flex;
  flex-wrap: wrap;
  gap: 64px;
  margin-bottom: 48px;
  padding-bottom: 40px;
  border-bottom: 1px solid var(--border);
}

.footer-brand {
  flex: 1;
  min-width: 280px;
  max-width: 380px;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.footer-logo-text {
  font-family: var(--font-mono);
  font-size: 20px;
  font-weight: 800;
  color: var(--fg);
  letter-spacing: 0.06em;
}

.footer-description {
  font-size: 14px;
  line-height: 1.7;
  color: var(--fg-secondary);
  margin-bottom: 20px;
}

.footer-terminal {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
}

.terminal-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.terminal-dot--red    { background: #ef4444; }
.terminal-dot--yellow { background: #f59e0b; }
.terminal-dot--green  { background: #22c55e; }

.terminal-status {
  font-size: 11px;
  color: var(--muted);
  margin-left: 6px;
  letter-spacing: 0.04em;
}

.terminal-cursor {
  color: var(--muted);
  animation: blink 1.2s step-end infinite;
}

/* Links */
.footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 48px;
  flex: 1;
}

.footer-link-col {
  min-width: 120px;
}

.footer-link-title {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  margin-bottom: 18px;
}

.footer-link-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-link-list li {
  margin-bottom: 12px;
}

.footer-link {
  font-size: 14px;
  color: var(--fg-secondary);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: color 0.2s, gap 0.2s;
}

.link-arrow {
  color: var(--muted);
  font-size: 16px;
  line-height: 1;
  transition: transform 0.2s, color 0.2s;
}

.footer-link:hover {
  color: var(--fg);
}

.footer-link:hover .link-arrow {
  transform: translateX(2px);
  color: var(--fg);
}

.footer-link--red { color: var(--orange); }
.footer-link--red:hover { color: #f97316; }

.footer-link--cyan { color: var(--accent); }
.footer-link--cyan:hover { color: #67e8f9; }

.link-badge {
  font-size: 9px;
  font-weight: 700;
  /* 用 --bg-card 做文字，--fg 做背景在深色下会翻转为白；
     改用半透明中性色，两种主题下都不扎眼 */
  color: var(--bg-card);
  background: var(--muted);
  padding: 1px 5px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-left: 2px;
  font-family: var(--font-mono);
}

/* Bottom */
.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.footer-copyright {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--muted);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.footer-divider-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--muted);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .footer { padding: 48px 0 28px; }
  .footer-main { flex-direction: column; gap: 40px; }
  .footer-brand { max-width: 100%; }
  .footer-links { gap: 36px; }
  .footer-bottom { flex-direction: column; align-items: flex-start; }
  .footer-divider-dot { display: none; }
}
</style>
