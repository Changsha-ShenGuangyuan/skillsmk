<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import SkillCard from './SkillCard.vue'
import CategoryItem from './CategoryItem.vue'
import { useI18n, loadModule } from '~/i18n'
import { fetchSkills, toSkillCardProps } from '~/composables/useSkillsApi'
import type { ApiSkill } from '~/composables/useSkillsApi'
import { useCategoryStore } from '~/composables/useCategoryStore'

const i18n = useI18n()
const t = i18n.t
const catStore = useCategoryStore()

onMounted(async () => {
  await loadModule(i18n.locale.value, 'search')
})
watch(i18n.locale, async (lang) => {
  await loadModule(lang, 'search')
})

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

// ── API 数据状态 ──
const apiSkills = ref<ApiSkill[]>([])
const totalSkills = ref(0)  // 全站总量，由独立请求获取，不受过滤条件影响
const isLoading = ref(false)

// ── 专门获取全站总量（不带任何过滤参数，与列表请求解耦）──
async function loadGlobalStats() {
  try {
    const res = await fetchSkills({ page: 1, per_page: 1 })
    if (res.code === 0 && res.meta?.total) {
      totalSkills.value = res.meta.total
    }
  } catch { /* 静默忽略，不影响主流程 */ }
}

// ── 加载过滤后的技能列表 ──
async function loadSkills() {
  isLoading.value = true
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
    isLoading.value = false
  }
}

onMounted(() => {
  loadGlobalStats()
  loadSkills()
})

// 搜索或分类变化时 debounce 加载
let debounceTimer: ReturnType<typeof setTimeout>
watch([query, activeCategory], () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => loadSkills(), 300)
})

// 展示给模板的卡片列表
const displaySkills = computed(() => apiSkills.value.map(toSkillCardProps))
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
          <SkillCard
            v-for="skill in displaySkills"
            :key="String(skill.id)"
            :skill="skill"
          />
        </div>

        <!-- 空状态：0 条结果时显示，替代大片空白 -->
        <div v-if="displaySkills.length === 0" class="skills-empty">
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
</style>
