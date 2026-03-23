<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { nextTick } from 'vue'
import LangSwitcher from './LangSwitcher.vue'
import ThemeToggle from './ThemeToggle.vue'
import { useI18n, loadModule } from '~/i18n'
import { useTheme } from '~/composables/useTheme'

const router = useRouter()
const isMobileMenuOpen = ref(false)
const isScrolled = ref(false)

// 接入 i18n
const i18n = useI18n()
const localePath = useLocalePath()
const t = i18n.t

// 初始化主题（确保刷新后恢复正确主题）
useTheme()

// 加载 header 模块
onMounted(async () => {
  await loadModule(i18n.locale, 'header')
})

// 语言切换时重新加载
watch(i18n.locale, async (lang) => {
  await loadModule(lang, 'header')
})

// 监听滚动，控制 header 透明度
function handleScroll() {
  isScrolled.value = window.scrollY > 20
}

onMounted(() => window.addEventListener('scroll', handleScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function handleBrandClick() {
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
  router.push(localePath('/'))
  isMobileMenuOpen.value = false
}

async function handleHashLink(e: Event, targetId: string) {
  e.preventDefault()
  isMobileMenuOpen.value = false
  
  if (router.currentRoute.value.path !== localePath('/')) {
    await router.push(localePath('/'))
    await nextTick()
    setTimeout(() => scrollToElement(targetId), 150)
  } else {
    scrollToElement(targetId)
  }
}

function handleScrollToBottom(e: Event) {
  e.preventDefault()
  isMobileMenuOpen.value = false
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
}

function scrollToElement(targetId: string) {
  const el = document.getElementById(targetId)
  if (el) {
    const y = el.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo({ top: y, behavior: 'smooth' })
  } else {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }
}

function handleNavLinkClick() {
  isMobileMenuOpen.value = false
}
</script>

<template>
  <header class="header" :class="{ 'header--scrolled': isScrolled }" role="banner">
    <!-- 扫描线装饰 -->
    <div class="header-scanline" />

    <div class="header-inner">
      <!-- Brand -->
      <a href="/" class="header-brand" @click.prevent="handleBrandClick">
        <div class="header-logo">
          <!-- 六边形 Logo SVG -->
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <polygon points="16,2 28,8.5 28,23.5 16,30 4,23.5 4,8.5" fill="none" stroke="#2563eb" stroke-width="1.5"/>
            <polygon points="16,8 23,12 23,20 16,24 9,20 9,12" fill="rgba(37,99,235,0.12)" stroke="#2563eb" stroke-width="1"/>
            <circle cx="16" cy="16" r="3" fill="#2563eb"/>
          </svg>
        </div>
        <div class="header-text">
          <span class="header-title">SKILLSMK<span class="header-title-cursor">_</span></span>
          <span class="header-subtitle">{{ t('header.subtitle', 'Agent Skills Marketplace') }}</span>
        </div>
      </a>

      <!-- Desktop Nav -->
      <nav class="header-nav" aria-label="主导航">
        <NuxtLink :to="localePath('/')" class="header-link">{{ t('header.home', '主页') }}</NuxtLink>
        <NuxtLink :to="localePath('/search')" class="header-link">{{ t('header.search', '搜索') }}</NuxtLink>
        <NuxtLink :to="localePath('/categories')" class="header-link">{{ t('header.categories', '分类') }}</NuxtLink>
        <NuxtLink :to="localePath('/rankings')" class="header-link">{{ t('header.leaderboard', '排名') }}</NuxtLink>
        <a href="#" class="header-link" @click="handleScrollToBottom">{{ t('header.about', '关于') }}</a>
        <a href="#faq" class="header-link" @click="e => handleHashLink(e, 'faq')">{{ t('header.faq', 'FAQ') }}</a>
      </nav>

      <div class="header-cta">
        <ThemeToggle />
        <LangSwitcher />
        <!-- Mobile menu toggle -->
        <button class="mobile-menu-toggle" @click="toggleMobileMenu" aria-label="Toggle menu">
          <div class="hamburger" :class="{ 'is-open': isMobileMenuOpen }">
            <span /><span /><span />
          </div>
        </button>
      </div>
    </div>

    <!-- Mobile overlay -->
    <div v-show="isMobileMenuOpen" class="mobile-menu-overlay" @click="toggleMobileMenu" />

    <!-- Mobile panel -->
    <div
      class="mobile-menu"
      :class="{ 'is-open': isMobileMenuOpen }"
      role="dialog"
      aria-modal="true"
      :aria-hidden="!isMobileMenuOpen"
      aria-label="移动导航菜单"
    >
      <nav class="mobile-nav" aria-label="移动导航">
        <NuxtLink :to="localePath('/')" class="mobile-nav-link" @click="handleNavLinkClick">
          <span class="mobile-nav-icon">▸</span> {{ t('header.home', '主页') }}
        </NuxtLink>
        <NuxtLink :to="localePath('/search')" class="mobile-nav-link" @click="handleNavLinkClick">
          <span class="mobile-nav-icon">▸</span> {{ t('header.search', '搜索') }}
        </NuxtLink>
        <NuxtLink :to="localePath('/categories')" class="mobile-nav-link" @click="handleNavLinkClick">
          <span class="mobile-nav-icon">▸</span> {{ t('header.categories', '分类') }}
        </NuxtLink>
        <NuxtLink :to="localePath('/rankings')" class="mobile-nav-link" @click="handleNavLinkClick">
          <span class="mobile-nav-icon">▸</span> {{ t('header.leaderboardFull', '排行榜') }}
        </NuxtLink>
        <div class="mobile-nav-divider" />
        <a href="#" class="mobile-nav-link" @click="handleScrollToBottom">
          <span class="mobile-nav-icon">▸</span> {{ t('header.aboutFull', '关于我们') }}
        </a>
        <a href="#faq" class="mobile-nav-link" @click="e => handleHashLink(e, 'faq')">
          <span class="mobile-nav-icon">▸</span> {{ t('header.faqFull', '常见问题 FAQ') }}
        </a>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 60px;
  /* 使用 --bg 变量作为半透明底色，自动适配深色模式 */
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
  transition: background 0.3s ease, box-shadow 0.3s ease;
}

.header--scrolled {
  background: color-mix(in srgb, var(--bg) 97%, transparent);
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.07);
}

/* 扫描线（浅色模式下隐藏） */
.header-scanline {
  display: none;
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 24px;
  height: 100%;
}

/* Brand */
.header-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  position: relative;
  z-index: 50;
  flex-shrink: 0;
}

.header-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s ease;
}

.header-brand:hover .header-logo {
  opacity: 0.75;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-title {
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--fg);
  line-height: 1;
}

.header-title-cursor {
  color: var(--muted);
  animation: blink 1.2s step-end infinite;
}

.header-subtitle {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--muted);
  letter-spacing: 0.15em;
  font-family: var(--font-mono);
}

/* Nav */
.header-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
}

.header-link {
  position: relative;
  color: var(--muted);
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.01em;
  padding: 6px 14px;
  border-radius: var(--radius-md);
  transition: color 0.2s, background 0.2s;
}

.header-link:hover {
  color: var(--fg);
  background: var(--bg-elevated);
}

.header-link.router-link-active {
  color: var(--fg);
  font-weight: 600;
}

/* CTA */
.header-cta {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 1001;  /* 确保下拉菜单在 header 内容层之上 */
}

/* Mobile toggle */
.mobile-menu-toggle {
  display: none;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 7px;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.mobile-menu-toggle:hover {
  background: var(--bg-elevated);
  border-color: var(--border-strong);
}

/* 汉堡线 */
.hamburger {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 18px;
}

.hamburger span {
  display: block;
  height: 1.5px;
  background: var(--fg-secondary);
  border-radius: 2px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.hamburger.is-open span:nth-child(1) {
  transform: translateY(5.5px) rotate(45deg);
  background: var(--accent);
}
.hamburger.is-open span:nth-child(2) {
  opacity: 0;
  transform: scaleX(0);
}
.hamburger.is-open span:nth-child(3) {
  transform: translateY(-5.5px) rotate(-45deg);
  background: var(--accent);
}

.mobile-menu-overlay {
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  z-index: 45;
}

.mobile-menu {
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  padding: 12px 16px 20px;
  box-shadow: var(--shadow-float);
  transform: translateY(-100%);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 46;
}

.mobile-menu.is-open {
  transform: translateY(0);
  opacity: 1;
  visibility: visible;
}

.mobile-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mobile-nav-icon {
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 12px;
  margin-right: 6px;
  transition: transform 0.2s;
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--fg-secondary);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all 0.15s;
  border: 1px solid transparent;
}

.mobile-nav-link:hover,
.mobile-nav-link.router-link-active {
  background: var(--bg-elevated);
  color: var(--fg);
  border-color: var(--border);
}

.mobile-nav-link:hover .mobile-nav-icon {
  transform: translateX(3px);
}

.mobile-nav-divider {
  height: 1px;
  background: var(--border);
  margin: 8px 0;
}

@media (max-width: 900px) {
  .header-inner { padding-inline: 16px; gap: 12px; }
  .header-nav { display: none; }
  .header-subtitle { display: none; }
  .mobile-menu-toggle { display: flex; }
}

@media (max-width: 640px) {
  .header-cta { gap: 6px; }
  .header-title { font-size: 13px; }
}
</style>
