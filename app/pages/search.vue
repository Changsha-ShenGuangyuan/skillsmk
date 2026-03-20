<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useI18n, loadModule } from '~/i18n'
import { fetchSkills, toSkillCardProps } from '~/composables/useSkillsApi'
import type { ApiSkill } from '~/composables/useSkillsApi'

const i18n = useI18n()
const t = i18n.t
const { public: { siteUrl } } = useRuntimeConfig()

// SEO
useSeoMeta({
  title:        () => t('meta.search.title',       'Skill List | SKILLSMK'),
  ogTitle:      () => t('meta.search.title',       'Skill List | SKILLSMK'),
  description:  () => t('meta.search.description', 'Search and browse all open-source Agent Skills.'),
  ogDescription:() => t('meta.search.description', 'Search and browse all open-source Agent Skills.'),
  ogUrl:        `${siteUrl}/search`,
  ogImage:      `${siteUrl}/og-image.png`,
  ogType:       'website',
  ogSiteName:   'SKILLSMK',
  twitterCard:  'summary_large_image',
  twitterTitle:       () => t('meta.search.title',       'Skill List | SKILLSMK'),
  twitterDescription: () => t('meta.search.description', 'Search and browse all open-source Agent Skills.'),
  robots:       'noindex, follow',
})
useHead({
  link: [{ rel: 'canonical', href: `${siteUrl}/search` }],
})

onMounted(async () => {
  await Promise.all([
    loadModule(i18n.locale, 'search'),
    loadModule(i18n.locale, 'common'),
  ])
})
watch(i18n.locale, async (lang) => {
  await Promise.all([
    loadModule(lang, 'search'),
    loadModule(lang, 'common'),
  ])
})

const route = useRoute()
const router = useRouter()

// 初始查询参数（从 URL 获取，支持直接访问搜索结果页）
const initialQuery = String(route.query.q || '')
const initialPage  = Number(route.query.page) || 1

// ── 搜索 & 分页状态 ──
const searchQuery = ref(initialQuery)
const currentPage = ref(initialPage)
const itemsPerPage = 9

// ── 服务端渲染初始数据（useAsyncData，与 SWR 缓存配合）──
const { data: _initData } = await useAsyncData(
  `search-q${initialQuery}-p${initialPage}`,
  () => fetchSkills({ page: initialPage, per_page: itemsPerPage, q: initialQuery || undefined })
)
const _init = _initData.value?.code === 0 ? _initData.value : null

// ── API 数据状态（从 SSR 数据初始化）──
const apiSkills  = ref<ApiSkill[]>(_init?.data ?? [])
const totalItems = ref(_init?.meta?.total ?? 0)
const totalPages = ref(_init?.meta?.last_page ?? 1)
const isLoading  = ref(false)

// SPA 导航回返时同步初始数据
watch(_initData, (val) => {
  if (val?.code === 0) {
    apiSkills.value  = val.data
    totalItems.value = val.meta.total
    totalPages.value = val.meta.last_page
  }
})

// ── 加载数据（带 AbortController，取消旧请求避免 429）──
let currentAbort: AbortController | null = null

async function loadSkills() {
  // 取消上一次未完成的请求
  currentAbort?.abort()
  currentAbort = new AbortController()
  const signal = currentAbort.signal

  isLoading.value = true
  try {
    const res = await fetchSkills({
      page: currentPage.value,
      per_page: itemsPerPage,
      q: searchQuery.value || undefined,
    }, signal)
    if (res.code === 0) {
      apiSkills.value  = res.data
      totalItems.value = res.meta.total
      totalPages.value = res.meta.last_page
    }
  } catch (e: any) {
    if (e?.name !== 'AbortError' && !e?.message?.includes('aborted')) {
      console.error('[search] loadSkills 失败', e)
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
  isLoading.value = true // 立即显示骨架屏
  clearTimeout(fetchTimer)
  fetchTimer = setTimeout(() => {
    loadSkills()
  }, 300)
}

// 离开搜索页时清理定时器和 in-flight 请求，防止 429
onUnmounted(() => {
  clearTimeout(fetchTimer)
  currentAbort?.abort()
})

// 初始数据已由 useAsyncData（SSR）提供；仅在搜索词/翻页变化时触发客户端请求
watch(
  [searchQuery, currentPage],
  ([newQuery, newPage], [oldQuery, _oldPage]) => {
    if (newQuery !== oldQuery) {
      if (currentPage.value !== 1) {
        currentPage.value = 1
        return // 触发 currentPage 的 watch，当前这次短路抚弃
      }
    }
    debouncedLoadSkills()
  },
  { immediate: false } // 初始数据已由 useAsyncData 提供，无需立即触发
)

const paginatedSkills = computed(() => apiSkills.value.map(toSkillCardProps))

const goToPrevPage = () => { if (currentPage.value > 1) currentPage.value-- }
const goToNextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++ }

</script>

<template>
  <div class="skill-search-page fade-up">
    <!-- 背景光晕 -->
    <div class="ss-orb ss-orb--1" />
    <div class="ss-orb ss-orb--2" />

    <div class="search-inner">
      <!-- 页面头部 -->
      <div class="search-header">
        <div class="search-badge">
          <span class="badge-dot" />
          <span>SKILL LIST</span>
        </div>
        <h1 class="search-title">SKILL <span class="title-accent">{{ t('search.listTitle', '列表') }}</span></h1>
        <p class="search-desc">{{ t('search.listDesc', '通过关键字搜索你需要的 Agent Skills') }}</p>
      </div>

      <!-- 搜索框 -->
      <div class="search-bar-container">
        <div class="search-input-wrapper">
          <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            :placeholder="t('search.searchPlaceholder', '输入关键字搜索技能...')"
          />
          <div v-if="searchQuery" class="search-count">
            {{ totalItems }} {{ t('search.items', '项') }}
          </div>
        </div>
      </div>

      <!-- 结果区 -->
      <div class="search-results">
        <!-- 加载中骨架屏 -->
        <template v-if="isLoading">
          <div class="skills-grid">
            <div v-for="n in 9" :key="n" class="skeleton-card">
              <div class="skeleton-header">
                <div class="skeleton-tag" />
              </div>
              <div class="skeleton-title" />
              <div class="skeleton-desc" />
              <div class="skeleton-desc skeleton-desc--short" />
              <div class="skeleton-footer" />
            </div>
          </div>
        </template>

        <!-- 数据列表 -->
        <template v-else-if="paginatedSkills.length > 0">
          <div class="skills-grid">
            <SkillCard
              v-for="skill in paginatedSkills"
              :key="String(skill.id)"
              :skill="skill"
            />
          </div>
        </template>

        <!-- 空状态（加载完成且真的没有数据） -->
        <div v-else class="empty-state">
          <div class="empty-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <p class="empty-text">未找到匹配 "<span class="empty-query">{{ searchQuery }}</span>" 的 Skill</p>
          <p class="empty-hint">{{ t('search.noResultHint', '换个关键字试试，或清空搜索框浏览全部') }}</p>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination" v-if="totalPages > 1">
        <button class="page-btn" @click="goToPrevPage" :disabled="currentPage === 1" aria-label="上一页">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span class="page-info">
          <span class="page-cur">{{ currentPage }}</span>
          <span class="page-sep"> / </span>
          <span>{{ totalPages }}</span>
        </span>
        <button class="page-btn" @click="goToNextPage" :disabled="currentPage === totalPages" aria-label="下一页">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.skill-search-page {
  padding: 60px 0 100px;
  min-height: calc(100vh - 70px);
  position: relative;
  z-index: 1;
  overflow: hidden;
}

/* 背景光晕 */
.ss-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
  z-index: 0;
}

.ss-orb--1 {
  width: 500px;
  height: 400px;
  top: -100px;
  left: -100px;
  /* 浅色模式下极淡蓝色装饰 */
  background: radial-gradient(circle, rgba(37, 99, 235, 0.04) 0%, transparent 70%);
}

.ss-orb--2 {
  width: 400px;
  height: 400px;
  bottom: 100px;
  right: -100px;
  background: radial-gradient(circle, rgba(124, 58, 237, 0.04) 0%, transparent 70%);
}

.search-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;
  z-index: 1;
}

/* 头部 */
.search-header {
  text-align: center;
  margin-bottom: 40px;
}

/* badge 改用系统边框和中性色 */
.search-badge {
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
  margin-bottom: 16px;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #16a34a;
}

.search-title {
  font-family: var(--font-mono);
  font-size: clamp(28px, 4vw, 42px);
  font-weight: 800;
  margin: 0 0 12px;
  color: var(--fg);
  letter-spacing: -0.02em;
}

/* 去掉 text-shadow 青色光晓，改用纯色 */
.title-accent {
  color: var(--fg);
}

.search-desc {
  font-size: 15px;
  color: var(--fg-secondary);
  margin: 0;
}

/* 搜索框 */
.search-bar-container {
  max-width: 620px;
  margin: 0 auto 48px;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 12px 20px;
  gap: 12px;
  transition: all 0.3s ease;
}

.search-input-wrapper:focus-within {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-float);
}

.search-icon {
  color: var(--muted);
  flex-shrink: 0;
  transition: color 0.2s;
}

.search-input-wrapper:focus-within .search-icon {
  color: var(--fg);
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 15px;
  font-family: var(--font-sans);
  color: var(--fg);
}

.search-input::placeholder {
  color: var(--muted);
}

.search-count {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--muted);
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

/* 网格 */
.skills-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 48px;
}

/* 骨架屏卡片 */
@keyframes skeleton-shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
}

.skeleton-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 160px;
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
}

.skeleton-tag,
.skeleton-title,
.skeleton-desc,
.skeleton-footer {
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    var(--border) 25%,
    var(--bg-elevated) 50%,
    var(--border) 75%
  );
  background-size: 800px 100%;
  animation: skeleton-shimmer 1.4s infinite linear;
}

.skeleton-tag    { width: 60px;  height: 20px; }
.skeleton-title  { width: 70%;   height: 16px; margin-top: 4px; }
.skeleton-desc   { width: 100%;  height: 13px; }
.skeleton-desc--short { width: 60%; }
.skeleton-footer { width: 40%;   height: 13px; margin-top: 8px; }

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon {
  color: var(--muted);
  opacity: 0.4;
  margin-bottom: 8px;
}

.empty-text {
  font-size: 16px;
  color: var(--fg-secondary);
  margin: 0;
  font-weight: 500;
}

.empty-query {
  color: var(--orange);
  font-family: var(--font-mono);
}

.empty-hint {
  font-size: 13px;
  color: var(--muted);
  margin: 0;
  font-family: var(--font-mono);
}

/* 分页 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
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

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-info {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--muted);
}

.page-cur {
  color: var(--fg);
  font-weight: 700;
}

.page-sep {
  color: var(--muted);
}

@media (max-width: 1024px) {
  .skills-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 640px) {
  .skills-grid { grid-template-columns: minmax(0, 1fr); }
  .search-input-wrapper { border-radius: 14px; padding: 14px 16px; }
}
</style>
