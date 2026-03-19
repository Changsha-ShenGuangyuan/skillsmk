<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n, loadModule } from '~/i18n'
import { fetchSkills, toSkillCardProps } from '~/composables/useSkillsApi'
import type { ApiSkill } from '~/composables/useSkillsApi'
import { useCategoryStore } from '~/composables/useCategoryStore'

const i18n = useI18n()
const t = i18n.t
const catStore = useCategoryStore()
const { public: { siteUrl } } = useRuntimeConfig()

// SEO：技能分类页面 meta（跟随语言动态更新）
useSeoMeta({
  title:        () => t('meta.cat.title',       'Skill Categories | SKILLSMK'),
  ogTitle:      () => t('meta.cat.title',       'Skill Categories | SKILLSMK'),
  description:  () => t('meta.cat.description', 'Browse all open-source Agent Skills by category.'),
  ogDescription:() => t('meta.cat.description', 'Browse all open-source Agent Skills by category.'),
  ogUrl:        `${siteUrl}/categories`,
  ogImage:      `${siteUrl}/og-image.png`,
  ogType:       'website',
  ogSiteName:   'SKILLSMK',
  twitterCard:  'summary_large_image',
  twitterTitle:       () => t('meta.cat.title',       'Skill Categories | SKILLSMK'),
  twitterDescription: () => t('meta.cat.description', 'Browse all open-source Agent Skills by category.'),
})
useHead({
  link: [
    { rel: 'canonical',  href: `${siteUrl}/categories` },
    { rel: 'alternate', hreflang: 'en',        href: `${siteUrl}/categories` },
    { rel: 'alternate', hreflang: 'zh',        href: `${siteUrl}/zh/categories` },
    { rel: 'alternate', hreflang: 'ja',        href: `${siteUrl}/ja/categories` },
    { rel: 'alternate', hreflang: 'ko',        href: `${siteUrl}/ko/categories` },
    { rel: 'alternate', hreflang: 'de',        href: `${siteUrl}/de/categories` },
    { rel: 'alternate', hreflang: 'fr',        href: `${siteUrl}/fr/categories` },
    { rel: 'alternate', hreflang: 'es',        href: `${siteUrl}/es/categories` },
    { rel: 'alternate', hreflang: 'ar',        href: `${siteUrl}/ar/categories` },
    { rel: 'alternate', hreflang: 'pt',        href: `${siteUrl}/pt/categories` },
    { rel: 'alternate', hreflang: 'x-default', href: `${siteUrl}/categories` },
  ],
})

onMounted(async () => {
  await Promise.all([
    loadModule(i18n.locale.value, 'categories'),
    loadModule(i18n.locale.value, 'common'),
    catStore.ensureLoaded(i18n.locale.value),
  ])
})
watch(i18n.locale, async (lang) => {
  await Promise.all([
    loadModule(lang, 'categories'),
    loadModule(lang, 'common'),
  ])
})

// ── 筛选 & 分页状态 ──
const route = useRoute()
const router = useRouter()
const activeCategoryId = ref(Number(route.query.cat) || 0)       // 0 = ALL
const currentPage = ref(1)
const itemsPerPage = 9

function setActiveCategory(id: number) {
  activeCategoryId.value = id
  currentPage.value = 1
  router.replace({ query: { ...route.query, cat: id === 0 ? undefined : id } })
}

watch(() => route.query.cat, (newVal) => {
  const newId = Number(newVal) || 0
  if (activeCategoryId.value !== newId) {
    activeCategoryId.value = newId
    currentPage.value = 1
  }
})

// ── API 数据状态 ──
const apiSkills = ref<ApiSkill[]>([])
const totalSkillsFound = ref(0)
const totalPages = ref(1)
const isLoading = ref(false)

// ── 加载数据（带 AbortController，取消旧请求避免 429）──
let currentAbort: AbortController | null = null

async function loadSkills() {
  currentAbort?.abort()
  currentAbort = new AbortController()
  const signal = currentAbort.signal

  isLoading.value = true
  try {
    const res = await fetchSkills({
      page: currentPage.value,
      per_page: itemsPerPage,
      category_id: activeCategoryId.value || undefined,
    }, signal)
    if (res.code === 0) {
      apiSkills.value = res.data
      totalSkillsFound.value = res.meta.total
      totalPages.value = res.meta.last_page
    }
  } catch (e: any) {
    if (e?.name !== 'AbortError' && !e?.message?.includes('aborted')) {
      console.error('[categories] loadSkills 失败', e)
    }
  } finally {
    if (currentAbort?.signal === signal) {
      isLoading.value = false
    }
  }
}

// 采用防抖执行加载，避免各种状态变化同时触发大量请求
let fetchTimer: ReturnType<typeof setTimeout>
function debouncedLoadSkills() {
  // 先丫断上一次正在进行的请求（让代理层通过 req.close 事件将上游请求一并取消）
  currentAbort?.abort()
  clearTimeout(fetchTimer)
  fetchTimer = setTimeout(() => {
    loadSkills()
  }, 800) // 800ms 防抖：确保快速切分类期间不会向后端发送中间请求
}

// 统一把初始加载和条件变化全部集中到 watch
watch(
  [activeCategoryId, currentPage],
  () => {
    debouncedLoadSkills()
  },
  { immediate: true }
)

// ── 展示列表 ──
const paginatedSkills = computed(() => apiSkills.value.map(toSkillCardProps))

// (已移除对当前页按分类计数的无用逻辑)
</script>

<template>
  <div class="skill-categories fade-up">
    <!-- 背景光晕 -->
    <div class="sc-orb sc-orb--1" />
    <div class="sc-orb sc-orb--2" />

    <div class="categories-inner">
      <!-- Header -->
      <header class="top-header">
        <div class="header-left">
          <span class="subtitle">{{ t('cat.badge', 'BROWSE SKILLS') }}</span>
          <h1 class="title">{{ t('cat.title', '技能') }}<span class="title-accent">{{ t('cat.titleAccent', '分类') }}</span></h1>
        </div>
        <div class="header-right">
          <div class="stats-block">
            <span class="stats-number">{{ totalSkillsFound.toLocaleString() }}</span>
            <span class="stats-label">{{ t('cat.skillsFound', 'SKILLS FOUND') }}</span>
          </div>
        </div>
      </header>

      <!-- 分隔线 -->
      <div class="divider">
        <div class="divider-glow" />
      </div>

      <!-- 分类胶囊 -->
      <div class="category-pills">
        <button
          class="pill-btn"
          :class="{ active: activeCategoryId === 0 }"
          @click="setActiveCategory(0)"
        >
          ALL
        </button>
        <button
          v-for="cat in catStore.categories.value"
          :key="cat.id"
          class="pill-btn"
          :class="{ active: activeCategoryId === cat.id }"
          @click="setActiveCategory(cat.id)"
        >
          {{ catStore.getCategoryName(cat.id, i18n.locale.value) }}
          <span class="pill-count" v-if="(cat.skills_count ?? 0) > 0">{{ cat.skills_count }}</span>
        </button>
      </div>

      <!-- 技能网格 -->
      <div class="categories-content">
        <template v-if="paginatedSkills.length > 0">
          <div class="skills-grid">
            <SkillCard
              v-for="skill in paginatedSkills"
              :key="String(skill.id)"
              :skill="skill"
            />
          </div>

          <!-- 分页 -->
          <div v-if="totalPages > 1" class="pagination">
            <button
              class="page-btn"
              @click="currentPage > 1 && currentPage--"
              :disabled="currentPage === 1"
              aria-label="上一页"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
            <button
              class="page-btn"
              @click="currentPage < totalPages && currentPage++"
              :disabled="currentPage === totalPages"
              aria-label="下一页"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </template>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <div class="empty-icon-wrap">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p class="empty-text">{{ t('cat.emptyText', '该分类下暂无相关的 Skill') }}</p>
          <span class="empty-sub">{{ t('cat.emptySub', '尝试切换其他分类或清除筛选条件') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skill-categories {
  padding: 80px 0 100px;
  min-height: calc(100vh - 70px);
  position: relative;
  z-index: 1;
  overflow: hidden;
}

/* 背景装饰 */
.sc-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
  z-index: 0;
}

/* 浅色模式下不需要背景光球 */
.sc-orb--1 { display: none; }
.sc-orb--2 { display: none; }

.categories-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;
  z-index: 1;
}

/* Header */
.top-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
}

.subtitle {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-weight: 600;
  display: block;
  margin-bottom: 8px;
}

.title {
  font-family: var(--font-mono);
  font-size: clamp(32px, 4vw, 48px);
  font-weight: 800;
  margin: 0;
  color: var(--fg);
  line-height: 1.1;
  letter-spacing: -0.02em;
}

/* 移除深色主题遗留的青色光晕，改为纯色 --purple 强调 */
.title-accent {
  color: var(--purple);
  margin-left: 4px;
}

.header-right {
  text-align: right;
}

.stats-block {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

/* 去掉渐变剪切（浅色背景上会产生字体边缘光晕），改为纯色 */
.stats-number {
  font-family: var(--font-mono);
  font-size: 42px;
  font-weight: 800;
  color: var(--purple);
  line-height: 1;
  letter-spacing: -0.02em;
}

.stats-label {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-weight: 600;
}

/* 分隔线 */
.divider {
  position: relative;
  height: 1px;
  background: var(--border);
  margin: 0 0 28px;
  overflow: visible;
}

.divider-glow {
  position: absolute;
  left: 0;
  top: 0;
  width: 30%;
  height: 1px;
  background: linear-gradient(90deg, var(--accent), transparent);
  opacity: 0.6;
}

/* 胶囊 */
.category-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 24px;
}

.pill-btn {
  padding: 8px 18px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--fg-secondary);
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-sans);
  cursor: pointer;
  transition: all 0.25s ease;
  letter-spacing: 0.02em;
}

.pill-btn:hover {
  border-color: var(--border-strong);
  color: var(--fg);
  background: var(--bg-elevated);
  transform: translateY(-1px);
}

.pill-btn.active {
  background: var(--accent);
  color: #ffffff;
  border-color: var(--accent);
  box-shadow: var(--shadow-float);
}
/* 深色模式下 --accent 是白色，率先用品牌蓝 */
[data-theme="dark"] .pill-btn.active {
  background: #2563eb;
  border-color: #2563eb;
}

/* 分类数量角标 */
.pill-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 5px;
  margin-left: 6px;
  border-radius: 999px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  line-height: 1;
  transition: all 0.25s ease;
}

.pill-btn:hover .pill-count {
  background: var(--border);
  border-color: var(--border-strong);
  color: var(--fg-secondary);
}

.pill-btn.active .pill-count {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.4);
  color: #ffffff;
}



/* 网格 */
.categories-content { width: 100%; }

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 18px;
}

/* 分页 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 48px;
}

.page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--fg-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--border-strong);
  color: var(--fg);
  background: var(--bg-elevated);
}

.page-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.page-info {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--muted);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon-wrap {
  color: var(--muted);
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  color: var(--fg-secondary);
  font-weight: 500;
  margin: 0 0 8px;
}

.empty-sub {
  font-size: 13px;
  color: var(--muted);
  font-family: var(--font-mono);
}

@media (max-width: 768px) {
  .top-header { flex-direction: column; align-items: flex-start; gap: 20px; }
  .header-right { text-align: left; width: 100%; }
  .stats-block { align-items: flex-start; }
  .skills-grid { grid-template-columns: 1fr; }
}
</style>
