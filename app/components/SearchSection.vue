<script setup lang="ts">
import { ref, computed, onUnmounted, watch, nextTick } from 'vue'
import SkillCard from './SkillCard.vue'
import CategoryItem from './CategoryItem.vue'
import { useI18n } from '~/i18n'
import { fetchSkills, toSkillCardProps } from '~/composables/useSkillsApi'
import type { ApiSkill } from '~/composables/useSkillsApi'
import { useCategoryStore } from '~/composables/useCategoryStore'

const i18n = useI18n()
const t = i18n.t
const catStore = useCategoryStore()



const query = ref('')
const hintKey = ref<'default' | 'noInput' | 'searching'>('default')
const hintArg = ref('')

const hint = computed(() => {
  if (hintKey.value === 'noInput') return t('search.hintEmpty', '试试 "git-automation"、"code-reviewer" 或 "frontend-design"')
  if (hintKey.value === 'searching') return `${t('search.hintSearching', '正在显示')} "${hintArg.value}" ${t('search.hintOf', '的搜索结果')}`
  return t('search.placeholder', '支持按技能名称、描述关键词实时过滤')
})

// 分类数据（显式声明 locale 依赖，以触发多语言重排）
const categories = computed(() => {
  const currentLang = i18n.locale.value
  return catStore.categories.value.map(cat => ({
    id:    cat.id.toString(),
    name:  catStore.getCategoryName(cat.id, currentLang),
    items: [] as any[]
  }))
})

const activeCategory = ref<string | null>(null)

function toggleCategory(id: string) {
  activeCategory.value = activeCategory.value === id ? null : id
}

const router = useRouter()
const localePath = useLocalePath()

function goToSearch() {
  router.push(localePath('/search'))
}

// ── SSR 初始数据（服务端执行，嵌入 HTML Payload）──
const { data: _initData, status: _initStatus } = await useAsyncData('search-section-skills', () =>
  fetchSkills({ page: 1, per_page: 9 })
)
const _init = _initData.value?.code === 0 ? _initData.value : null


// ── API 数据状态（从 SSR 数据初始化）──
const apiSkills   = ref<ApiSkill[]>(_init?.data ?? [])
const totalSkills = ref(_init?.meta?.total ?? 0)
// 骨架条件：无数据 OR 状态加载中
const _initLoading = computed(() => !_initData.value || _initStatus.value === 'idle' || _initStatus.value === 'pending')
const _manualLoading = ref(false)  // 搜索/筛选时手动控制骨架
const isLoading = computed(() => _initLoading.value || _manualLoading.value)

// SPA 导航回返时同步初始数据
watch(_initData, (val) => {
  if (val?.code === 0) {
    apiSkills.value   = val.data
    totalSkills.value = val.meta.total
  }
})

// ── 加载过滤后的技能列表（带 AbortController 防 429）──
let currentAbort: AbortController | null = null

async function loadSkills() {
  currentAbort?.abort()
  currentAbort = new AbortController()
  _manualLoading.value = true
  try {
    const res = await fetchSkills({
      page: 1,
      per_page: 9,
      q: query.value || undefined,
      category_id: activeCategory.value ? Number(activeCategory.value) : undefined,
    })
    if (res.code === 0) {
      apiSkills.value = res.data
    }
  } finally {
    _manualLoading.value = false
  }
}

// 离开首页时清理 in-flight 请求
onUnmounted(() => currentAbort?.abort())

// 搜索或分类变化时 debounce 加载
let debounceTimer: ReturnType<typeof setTimeout>
watch([query, activeCategory], () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => loadSkills(), 300)
})

// 展示给模板的卡片列表
const displaySkills = computed(() => apiSkills.value.map(toSkillCardProps))

// 数据到达时保存并还原滚动位置，防止 DOM 替换导致滚动跳顶
if (import.meta.client) {
  watch(isLoading, (newVal, oldVal) => {
    if (oldVal === true && newVal === false) {
      const savedY = window.scrollY
      nextTick(() => window.scrollTo({ top: savedY, behavior: 'instant' as ScrollBehavior }))
    }
  })
}
</script>

<template>
  <section class="search-section">
    <!-- 背景装饰光晕 -->
    <div class="ss-bg-orb ss-bg-orb--left" />
    <div class="ss-bg-orb ss-bg-orb--right" />

    <div class="search-section-inner">
      <!-- Hero 区域 -->
      <div class="search-section-hero fade-up">
        <!-- 状态标签 -->
        <div class="ss-badge">
          <span class="ss-badge-dot" />
          <span class="ss-badge-label">LIVE · OPEN SOURCE MARKETPLACE</span>
        </div>

        <h1 class="search-section-title">
          {{ t('search.heroLine1', '发现复用') }}<br />
          <span class="text-gradient">{{ t('search.heroLine2', '开源 Agent Skills') }}</span>
        </h1>
        <p class="search-section-description fade-up fade-up--delay">
          {{ t('search.heroDesc1', '从 GitHub 社区探索高质量的 AI 代理技能库。完全兼容') }} <code class="inline-code">SKILL.md</code> {{ t('search.heroDesc2', '标准规范，助您快速提取领域知识，一键装备至各类大模型或自动化 Agent。') }}
        </p>

        <!-- 搜索框 -->
        <form class="search-section-form fade-up fade-up--delay-2" @submit.prevent>
          <div class="search-input-wrapper">
            <span class="search-prefix">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              v-model="query"
              class="search-input"
              type="text"
              :placeholder='t("search.inputPlaceholder", "Try \"openai-whisper-api\" or \"video-frames\"")'
            />
          </div>
          <p class="search-hint">{{ hint }}</p>
        </form>

        <!-- 分类胶囊 -->
        <div class="search-section-categories fade-up fade-up--delay-3">
          <span class="categories-label">POPULAR:</span>
          <div class="categories-list">
            <CategoryItem
              v-for="category in categories"
              :key="category.id"
              :category="category"
              :active="activeCategory === category.id"
              @click="toggleCategory(category.id)"
            />
          </div>
        </div>
      </div>

      <!-- 统计数据 -->
      <div class="stats-row fade-up fade-up--delay-4">
        <div class="stat-item">
          <span class="stat-number">{{ totalSkills.toLocaleString() }}</span>
          <span class="stat-label">Ready Skills</span>
        </div>
        <div class="stat-divider" />
        <div class="stat-item">
          <span class="stat-number">{{ categories.length }}</span>
          <span class="stat-label">Categories</span>
        </div>
      </div>

      <!-- 技能卡片网格 -->
      <div class="skills-section fade-up">
        <div class="skills-section-header">
          <h2 class="skills-section-title">
            <span class="title-prefix">▸</span> {{ t('search.availableSkills', '预览技能') }}
          </h2>
          <div class="skills-header-right">
            <button class="view-all-btn" @click="goToSearch">
              {{ t('search.viewAll', '查看全部') }}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </div>
        <div class="skills-grid">
          <!-- 骨架卡片：isLoading 时展示，无论有无旧数据 -->
          <template v-if="isLoading">
            <div v-for="i in 9" :key="i" class="skill-card-skeleton">
              <div class="sks-header">
                <div class="sks-line sks-line--name"></div>
                <div class="sks-tag"></div>
              </div>
              <div class="sks-body">
                <div class="sks-line"></div>
                <div class="sks-line"></div>
                <div class="sks-line sks-line--short"></div>
              </div>
              <div class="sks-footer">
                <div class="sks-stars"></div>
              </div>
            </div>
          </template>
          <!-- 真实卡片列表：数据返回后显示 -->
          <template v-else>
          <SkillCard
            v-for="skill in displaySkills"
            :key="String(skill.id)"
            :skill="skill"
          />
          </template>
        </div>

        <!-- 空状态：0 条结果且非加载中时显示 -->
        <div v-if="!isLoading && displaySkills.length === 0" class="skills-empty">
          <div class="skills-empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </div>
          <p class="skills-empty-title">{{ t('search.emptyTitle', '未找到匹配的技能') }}</p>
          <p class="skills-empty-desc">{{ t('search.emptyDesc', '试试其他关键词，或取消已选分类过滤') }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.search-section {
  position: relative;
  padding: 80px 0 100px;
  overflow: hidden;
  z-index: 1;
}

/* 背景装饰无需（浅色模式下献隐） */
.ss-bg-orb { display: none; }

.search-section-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;
  z-index: 1;
}

/* Hero */
.search-section-hero {
  text-align: center;
  margin-bottom: 28px; /* 原 50px → 28px */
}

/* 状态标签 */
.ss-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  margin-bottom: 24px;
}

.ss-badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #16a34a;
  animation: pulseGlow 2s ease-in-out infinite;
}

.ss-badge-label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  letter-spacing: 0.1em;
}

/* 标题 */
.search-section-title {
  font-family: var(--font-display);
  font-size: clamp(38px, 5.5vw, 68px);
  font-weight: 800;
  line-height: 1.12;
  color: var(--fg);
  margin: 0 0 24px;
  letter-spacing: -0.03em;
}

/* 改为纯色，避免 background-clip: text 在浅色背景上产生字体边缘光晕 */
.text-gradient {
  color: var(--purple);
}

/* 描述 */
.search-section-description {
  font-size: 16px;
  line-height: var(--lh-body);
  color: var(--fg-secondary);
  max-width: 580px;
  margin: 0 auto 36px;
}

.inline-code {
  font-family: var(--font-mono);
  font-size: 13px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 1px 6px;
  color: var(--fg-secondary);
}

/* 搜索框 */
.search-section-form {
  margin-bottom: 28px;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 680px;
  margin: 0 auto;
  padding: 5px 5px 5px 18px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
  transition: all 0.25s ease;
}

.search-input-wrapper:focus-within {
  border-color: var(--border-strong);
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.06), var(--shadow-card);
}

.search-prefix {
  color: var(--muted);
  display: flex;
  align-items: center;
  flex-shrink: 0;
  transition: color 0.2s;
}

.search-input-wrapper:focus-within .search-prefix {
  color: var(--fg);
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--fg);
  font-size: 15px;
  font-family: var(--font-sans);
  padding: 12px 0;
}

.search-input::placeholder {
  color: var(--muted);
}

.search-hint {
  margin-top: 12px;
  font-size: 12.5px;
  font-family: var(--font-mono);
  color: var(--muted);
  text-align: center;
  letter-spacing: 0.02em;
}

/* 分类 */
.search-section-categories {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.categories-label {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 600;
  flex-shrink: 0;
}

.categories-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.stats-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0;
  margin: 20px auto 16px;
  max-width: 680px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px 40px;
  box-shadow: var(--shadow-card);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  gap: 5px;
}

.stat-number {
  font-family: var(--font-mono);
  font-size: 24px;
  font-weight: 800;
  color: var(--fg);
  letter-spacing: -0.02em;
  line-height: 1;
}

.stat-label {
  font-size: 10px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 600;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: var(--border);
  margin: 0 8px;
  flex-shrink: 0;
}

/* 技能区 */
.skills-section {
  margin-top: 0;
}

.skills-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.skills-section-title {
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 700;
  color: var(--fg);
  margin: 0;
}

.title-prefix {
  color: var(--muted);
  margin-right: 8px;
}

.skills-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.view-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 5px 12px;
  cursor: pointer;
  letter-spacing: 0.04em;
  transition: background 0.18s, border-color 0.18s, color 0.18s;
  white-space: nowrap;
}

.view-all-btn:hover {
  background: var(--bg-elevated);
  border-color: var(--accent);
  color: var(--accent);
}


.skills-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  /* 移除 min-height，改为内容自适应高度 */
}

/* 空状态提示框 */
.skills-empty {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  gap: 12px;
}

.skills-empty-icon {
  color: var(--muted);
  opacity: 0.5;
  margin-bottom: 8px;
}

.skills-empty-title {
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 600;
  color: var(--fg-secondary);
  margin: 0;
}

.skills-empty-desc {
  font-size: 13px;
  color: var(--muted);
  margin: 0;
}

/* 响应式 */
@media (max-width: 900px) {
  .skills-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .search-section { padding: 60px 0 80px; }
  .search-section-inner { padding: 0 16px; }
  .search-section-title { font-size: 32px; }
  .search-section-description { font-size: 14px; }

  /* 搜索框：保持横向，不换行 */
  .search-input-wrapper {
    flex-direction: row;
    border-radius: 999px;
    padding: 4px 4px 4px 14px;
    align-items: center;
    gap: 8px;
  }
  .search-prefix {
    flex-shrink: 0;
  }
  .search-input {
    text-align: left;
    padding: 10px 0;
    font-size: 14px;
  }

  .stats-row {
    flex-direction: row;
    gap: 0;
    padding: 16px 12px;
  }
  .stat-divider {
    width: 1px;
    height: 36px;
    margin: 0 4px;
    background: var(--border);
  }
  .stat-number { font-size: 20px; }
  .stat-label { font-size: 9px; letter-spacing: 0.05em; text-align: center; }
  .skills-grid { grid-template-columns: 1fr; }
}

/* ── SearchSection 骨架卡片 ──────────────────────────── */
.skill-card-skeleton {
  height: 220px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow: hidden;
}

@keyframes sks-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.sks-line,
.sks-tag,
.sks-stars {
  border-radius: 5px;
  background: linear-gradient(
    90deg,
    var(--bg-elevated) 25%,
    var(--bg-secondary) 50%,
    var(--bg-elevated) 75%
  );
  background-size: 200% 100%;
  animation: sks-shimmer 1.4s infinite;
  opacity: 0.8;
}

/* Header 区 */
.sks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 14px;
  gap: 8px;
}
.sks-line--name { height: 13px; flex: 1; }
.sks-tag        { width: 52px; height: 18px; border-radius: 4px; flex-shrink: 0; }

/* Body 区 */
.sks-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-left: 16px;
}
.sks-line        { height: 11px; width: 100%; }
.sks-line--short { width: 60%; }

/* Footer 区 */
.sks-footer {
  padding-top: 10px;
  border-top: 1px solid var(--border);
}
.sks-stars { height: 11px; width: 36px; }
</style>
