<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useI18n, loadModule } from '~/i18n'

const i18n = useI18n()
const t = i18n.t

onMounted(async () => {
  await loadModule(i18n.locale, 'howItWorks')
})

watch(i18n.locale, async (lang) => {
  await loadModule(lang, 'howItWorks')
})

// steps 从翻译中读取，语言切换时自动更新
const steps = computed(() => [
  {
    title: t('hiw.card1.title', '可组合'),
    desc:  t('hiw.card1.desc', ''),
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5Z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`,
    tag: '01'
  },
  {
    title: t('hiw.card2.title', '可移植'),
    desc:  t('hiw.card2.desc', ''),
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
    tag: '02'
  },
  {
    title: t('hiw.card3.title', '高效'),
    desc:  t('hiw.card3.desc', ''),
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
    tag: '03'
  },
  {
    title: t('hiw.card4.title', '强大'),
    desc:  t('hiw.card4.desc', ''),
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
    tag: '04'
  }
])
</script>

<template>
  <section id="how-it-works" class="how-it-works fade-up">
    <!-- 背景装饰 -->
    <div class="hiw-bg-orb" />

    <div class="container">
      <div class="section-header">
        <div class="section-badge">
          <span class="badge-icon">⚙</span>
          <span>{{ t('hiw.badge', 'HOW IT WORKS') }}</span>
        </div>
        <h2 class="section-title">
          {{ t('hiw.title', 'Skills') }} <span class="title-accent">{{ t('hiw.titleAccent', '工作原理') }}</span>
        </h2>
        <p class="section-subtitle">
          {{ t('hiw.subtitle', '') }}
        </p>
      </div>

      <div class="features-grid">
        <div
          v-for="step in steps"
          :key="step.title"
          class="feature-card"
        >
          <!-- 序号标签 -->
          <div class="feature-tag">{{ step.tag }}</div>

          <!-- 图标 -->
          <div class="feature-icon" v-html="step.icon" />

          <!-- 分隔线 -->
          <div class="feature-divider" />

          <h3 class="feature-title">{{ step.title }}</h3>
          <p class="feature-desc">{{ step.desc }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.how-it-works {
  padding: 80px 0 100px;
  position: relative;
  z-index: 1;
  overflow: hidden;
}

.hiw-bg-orb { display: none; }

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;
  z-index: 1;
}

.section-header {
  text-align: center;
  max-width: 680px;
  margin: 0 auto 64px;
}

.section-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  letter-spacing: 0.1em;
  margin-bottom: 20px;
}

.badge-icon {
  font-size: 13px;
}

.section-title {
  font-family: var(--font-mono);
  font-size: clamp(26px, 3.5vw, 38px);
  font-weight: 800;
  margin: 0 0 16px;
  color: var(--fg);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.title-accent {
  color: var(--fg);
}

.section-subtitle {
  color: var(--fg-secondary);
  font-size: 15px;
  line-height: 1.7;
  margin: 0;
}

/* 特性网格 */
.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.feature-card {
  --card-color: #374151;
  --card-bg: rgba(55, 65, 81, 0.05);

  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
}

/* 顶部细线 accent 条 — 统一使用 border 颜色 */
.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--border);
  border-radius: 16px 16px 0 0;
  opacity: 1;
}

.feature-card:hover {
  transform: translateY(-5px);
  border-color: var(--border-strong);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  background: var(--bg-elevated);
}

.feature-icon {
  width: 44px;
  height: 44px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
  transition: background 0.2s, border-color 0.2s;
}

.feature-icon :deep(svg) {
  width: 20px;
  height: 20px;
  stroke: var(--fg-secondary);
}

.feature-card:hover .feature-icon {
  background: var(--bg-secondary);
  border-color: var(--border-strong);
}

/* 卡片角落序号 */
.feature-tag {
  position: absolute;
  top: 16px;
  right: 16px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  letter-spacing: 0.08em;
  opacity: 0.5;
}

/* 分隔线 */
.feature-divider {
  height: 1px;
  margin-bottom: 16px;
  border-radius: 2px;
  background: var(--border);
  opacity: 0.8;
}

.feature-title {
  font-family: var(--font-mono);
  font-size: 17px;
  font-weight: 700;
  margin: 0 0 10px;
  letter-spacing: -0.01em;
  /* 统一黑白配色，不用彩色 */
  color: var(--fg);
}

.feature-desc {
  font-size: 13px;
  color: var(--fg-secondary);
  line-height: 1.7;
  margin: 0;
  flex: 1;
}

@media (max-width: 1024px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .how-it-works { padding: 60px 0 80px; }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }
}
</style>
