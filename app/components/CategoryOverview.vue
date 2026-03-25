<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useI18n, loadModule } from '~/i18n'
import { useCategoryStore } from '~/composables/useCategoryStore'
import { fetchSkills } from '~/composables/useSkillsApi'

const router  = useRouter()
const localePath = useLocalePath()
const i18n    = useI18n()
const { t }   = i18n
const catStore = useCategoryStore()

// 分类加载状态：初始为 true，确保首次访问立即显示骨架屏
const isLoadingCats = ref(true)

// i18n 模块加载（客户端）+ 分类数据主动加载
onMounted(async () => {
  await loadModule(i18n.locale.value, 'categories')
  // 主动加载分类（不依赖 length 判断，确保数据最新）
  await catStore.ensureLoaded(i18n.locale.value)
  isLoadingCats.value = false  // 数据就绪，切换为真实内容
})
watch(i18n.locale, async (lang) => {
  await loadModule(lang, 'categories')
  await catStore.ensureLoaded(lang)  // 语言切换时重新拉取分类（带多语言翻译）
})

// 获取全站技能总数（服务端渲染）
const { data: _countData } = await useAsyncData('category-overview-count',
  () => fetchSkills({ page: 1, per_page: 1 })
)
const totalSkillsFromApi = ref(
  _countData.value?.code === 0 ? _countData.value.meta.total : 0
)

// SPA 导航回应时同步总数
watch(_countData, (val) => {
  if (val?.code === 0) totalSkillsFromApi.value = val.meta.total
})

const totalSkills     = computed(() => totalSkillsFromApi.value)
const totalCategories = computed(() => catStore.categories.value.length)

// 副标题（带参数插値）
const subText = computed(() =>
  t('cat.overview.sub', '%n% 个分类 · 共 %total% 个技能')
    .replace('%n%', String(totalCategories.value))
    .replace('%total%', String(totalSkills.value))
)

// 分类图标（按分类 ID 匹配，可根据实际分类扩充）
const categoryIcons: Record<number, string> = {
  1: `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`,
  2: `<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>`,
  3: `<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>`,
  4: `<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>`,
  5: `<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>`,
  6: `<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><path d="M12 8v4l3 3"/>`,
}

// 获取分类颜色
 const getCatColor = (catId: number) => catStore.getColorByCategoryId(catId)

// 入场动画
const isVisible = ref(false)
onMounted(() => {
  const el = document.querySelector('.cat-overview')
  if (!el) { isVisible.value = true; return }
  const obs = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) { isVisible.value = true; obs.disconnect() }
    },
    { threshold: 0.08 }
  )
  obs.observe(el)
})

function goToCategory(id: number) {
  router.push(localePath({ path: '/categories', query: { cat: id } }))
}
function goToAll() {
  router.push(localePath('/categories'))
}
</script>


<template>
  <section class="cat-overview" :class="{ 'is-visible': isVisible }">
    <!-- 背景装饰 -->
    <div class="cov-orb-purple" />

    <div class="cov-inner">
      <!-- 标题 + CTA 左右布局 -->
      <div class="cov-header">
        <div class="cov-header-left">
          <div class="cov-badge">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            {{ t('cat.overview.badge', 'CATEGORIES') }}
          </div>
          <h2 class="cov-title">
            {{ t('cat.overview.title', 'Browse by') }}
            <span class="cov-title-accent">{{ t('cat.overview.accent', 'Category') }}</span>
          </h2>
          <p class="cov-sub">{{ subText }}</p>
        </div>
        <button class="cov-view-all" @click="goToAll">
          {{ t('cat.overview.viewAll', 'View All') }}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      <!-- 分类文件夹网格 -->
      <div class="cov-folder-grid">
        <!-- 已加载：显示真实内容 -->
        <template v-if="!isLoadingCats">
          <div
            v-for="(cls, idx) in catStore.categories.value"
            :key="cls.id"
            class="cov-folder"
            :class="`cov-folder--delay-${Math.min(idx, 9)}`"
            @click="goToCategory(cls.id)"
            @keydown.enter.prevent="goToCategory(cls.id)"
            @keydown.space.prevent="goToCategory(cls.id)"
            role="button"
            tabindex="0"
            :aria-label="catStore.getCategoryName(cls.id, i18n.locale.value)"
          >
            <!-- 文件夹耳朵 -->
            <div class="cov-folder-tab" />
            <!-- 文件夹主体 -->
            <div class="cov-folder-body">
              <!-- 文件夹图标 -->
              <svg class="cov-folder-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <!-- 分类名 -->
              <span class="cov-folder-name">{{ catStore.getCategoryName(cls.id, i18n.locale.value) }}</span>
              <!-- 数量标签 -->
              <span class="cov-folder-count" v-if="(cls.skills_count ?? 0) > 0">
                {{ cls.skills_count }}
                <span class="cov-folder-unit">{{ t('cat.overview.skills', 'skills') }}</span>
              </span>
            </div>
          </div>
        </template>

        <!-- 加载中：18 个文件夹骨架屏 -->
        <template v-else>
          <div
            v-for="i in 18"
            :key="`sk-cat-${i}`"
            class="cov-folder cov-folder--skeleton is-visible"
            aria-hidden="true"
          >
            <div class="cov-folder-tab sk-block" />
            <div class="cov-folder-body">
              <div class="sk-block sk-icon" />
              <div class="sk-block sk-text" />
              <div class="sk-block sk-count" />
            </div>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ── 容器 ── */
.cat-overview {
  padding: 56px 0 70px;
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.cov-orb-purple {
  position: absolute;
  top: -40px;
  right: -60px;
  width: 350px;
  height: 350px;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(90px);
  z-index: 0;
  background: radial-gradient(circle, rgba(167, 139, 250, 0.07) 0%, transparent 65%);
}

.cov-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;
  z-index: 1;
}

/* ── 标题区 ── */
.cov-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.is-visible .cov-header { opacity: 1; transform: none; }

.cov-header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cov-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin-bottom: 4px;
  width: fit-content;
}

.cov-title {
  font-family: var(--font-display);
  font-size: clamp(20px, 3vw, 28px);
  font-weight: 800;
  margin: 0;
  color: var(--fg);
  letter-spacing: -0.02em;
  line-height: 1.2;
}

/* 去掉 background-clip: text 渐变，改用纯色 --purple */
.cov-title-accent {
  color: var(--purple);
}

.cov-sub {
  font-size: 12px;
  color: var(--muted);
  margin: 0;
  font-family: var(--font-mono);
  letter-spacing: 0.01em;
}

/* ── View All 按钮 ── */
.cov-view-all {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--radius-md);
  background: transparent;
  border: 1px solid var(--border);
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.18s, border-color 0.18s, color 0.18s;
  flex-shrink: 0;
  align-self: flex-end;
  margin-bottom: 4px;
  letter-spacing: 0.02em;
}
.cov-view-all:hover {
  background: var(--bg-elevated);
  border-color: var(--accent);
}
.cov-view-all svg { transition: transform 0.15s; }
.cov-view-all:hover svg { transform: translateX(3px); }

/* ── 文件夹网格 ── */
.cov-folder-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

/* ── 单个文件夹 ── */
.cov-folder {
  position: relative;
  cursor: pointer;
  opacity: 0;
  transform: translateY(10px);
  transition:
    opacity 0.35s ease,
    transform 0.35s ease,
    box-shadow 0.2s;
}
.is-visible .cov-folder { opacity: 1; transform: none; }

/* 入场动画延迟 */
.cov-folder--delay-0 { transition-delay: 0.04s; }
.cov-folder--delay-1 { transition-delay: 0.08s; }
.cov-folder--delay-2 { transition-delay: 0.12s; }
.cov-folder--delay-3 { transition-delay: 0.16s; }
.cov-folder--delay-4 { transition-delay: 0.20s; }
.cov-folder--delay-5 { transition-delay: 0.24s; }
.cov-folder--delay-6 { transition-delay: 0.28s; }
.cov-folder--delay-7 { transition-delay: 0.32s; }
.cov-folder--delay-8 { transition-delay: 0.36s; }
.cov-folder--delay-9 { transition-delay: 0.40s; }

/* 文件夹耳朵：统一用细边框色，不彩色 */
.cov-folder-tab {
  width: 40%;
  height: 6px;
  border-radius: 4px 4px 0 0;
  background: var(--border);
  margin-left: 10px;
  transition: width 0.2s, background 0.2s;
}
.cov-folder:hover .cov-folder-tab {
  width: 50%;
  background: var(--accent);
}

/* 文件夹主体：顶部边框改为 accent，hover 时才显色 */
.cov-folder-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px 14px;
  border-radius: 0 6px 6px 6px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-top: 2px solid var(--border);
  transition:
    background 0.18s,
    border-color 0.18s,
    box-shadow 0.18s;
}
.cov-folder:hover .cov-folder-body {
  background: var(--bg-secondary);
  border-top-color: var(--accent);
  box-shadow: 0 4px 16px rgba(0,0,0,0.07);
}

/* 文件夹图标：统一用 fg-secondary，hover 用 accent */
.cov-folder-icon {
  color: var(--fg-secondary);
  opacity: 0.6;
  transition: opacity 0.18s, transform 0.18s, color 0.18s;
}
.cov-folder:hover .cov-folder-icon {
  color: var(--accent);
  opacity: 1;
  transform: scale(1.08);
}

/* 分类名 */
.cov-folder-name {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.01em;
}

/* 数量：默认灰色，hover 变 accent */
.cov-folder-count {
  display: inline-flex;
  align-items: baseline;
  gap: 3px;
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 800;
  color: var(--fg-secondary);
  line-height: 1;
  transition: color 0.18s;
}
.cov-folder:hover .cov-folder-count {
  color: var(--accent);
}
.cov-folder-unit {
  font-size: 10px;
  font-weight: 500;
  color: var(--muted);
  letter-spacing: 0.04em;
}

/* ── 骨架屏公用动画 ── */
@keyframes sk-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}

/* 骨架块基类 */
.sk-block {
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    var(--bg-elevated) 25%,
    var(--border)      50%,
    var(--bg-elevated) 75%
  );
  background-size: 200% 100%;
  animation: sk-shimmer 1.4s ease-in-out infinite;
}

/* 骨架文件夹耳朵 */
.cov-folder--skeleton .cov-folder-tab.sk-block {
  width: 40%;
  height: 6px;
  margin-left: 10px;
  opacity: 0.6;
}

/* 骨架文件夹主体展开 */
.cov-folder--skeleton .cov-folder-body {
  pointer-events: none;
  cursor: default;
}

/* 图标占位 */
.sk-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  opacity: 0.5;
}

/* 分类名占位 */
.sk-text {
  width: 70%;
  height: 12px;
  opacity: 0.55;
}

/* 数量占位 */
.sk-count {
  width: 45%;
  height: 18px;
  opacity: 0.4;
}

/* 响应式 */
@media (max-width: 768px) {
  .cov-folder-grid { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; }
  .cov-header      { flex-direction: column; align-items: flex-start; gap: 12px; }
  .cov-view-all    { align-self: flex-start; }
}

@media (max-width: 480px) {
  .cat-overview    { padding: 40px 0 50px; }
  .cov-folder-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
}
</style>
