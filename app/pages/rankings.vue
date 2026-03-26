<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { fetchSkillsTop, getSkillDisplayName } from '~/composables/useSkillsApi'
import type { ApiSkill } from '~/composables/useSkillsApi'
import { useCategoryStore } from '~/composables/useCategoryStore'
import { useI18n } from '~/i18n'

const i18n = useI18n()
const t = i18n.t
const catStore = useCategoryStore()
const { public: { siteUrl } } = useRuntimeConfig()

// SEO：排行榜页面 meta
useSeoMeta({
  title:       () => t('meta.lb.title',       'Skill Hall of Fame | SKILLSMK'),
  ogTitle:     () => t('meta.lb.title',       'Skill Hall of Fame | SKILLSMK'),
  description: () => t('meta.lb.description', 'Explore the most popular Agent Skills ranked by GitHub Stars.'),
  ogDescription:() => t('meta.lb.description','Explore the most popular Agent Skills ranked by GitHub Stars.'),
  ogUrl:       `${siteUrl}/rankings`,
  ogImage:     `${siteUrl}/og-image.png`,
  ogType:      'website',
  ogSiteName:  'SKILLSMK',
  twitterCard: 'summary_large_image',
  twitterTitle:       () => t('meta.lb.title',       'Skill Hall of Fame | SKILLSMK'),
  twitterDescription: () => t('meta.lb.description', 'Explore the most popular Agent Skills ranked by GitHub Stars.'),
})
useHead({
  link: [
    { rel: 'canonical',  href: `${siteUrl}/rankings` },
    { rel: 'alternate', hreflang: 'en',        href: `${siteUrl}/rankings` },
    { rel: 'alternate', hreflang: 'zh',        href: `${siteUrl}/zh/rankings` },
    { rel: 'alternate', hreflang: 'ja',        href: `${siteUrl}/ja/rankings` },
    { rel: 'alternate', hreflang: 'ko',        href: `${siteUrl}/ko/rankings` },
    { rel: 'alternate', hreflang: 'de',        href: `${siteUrl}/de/rankings` },
    { rel: 'alternate', hreflang: 'fr',        href: `${siteUrl}/fr/rankings` },
    { rel: 'alternate', hreflang: 'es',        href: `${siteUrl}/es/rankings` },
    { rel: 'alternate', hreflang: 'ar',        href: `${siteUrl}/ar/rankings` },
    { rel: 'alternate', hreflang: 'pt',        href: `${siteUrl}/pt/rankings` },
    { rel: 'alternate', hreflang: 'x-default', href: `${siteUrl}/rankings` },
  ],
})

// 语言切换时重新拉取分类翻译
watch(i18n.locale, async (lang) => {
  await catStore.ensureLoaded(lang)
})

const router = useRouter()
const localePath = useLocalePath()

const currentPage = ref(1)
const itemsPerPage = 10

// ── 服务端渲染初始数据（useAsyncData，与 SWR 缓存配合）──
// 首次访问由服务端执行接口请求，结果嵌入 HTML；用户翻页时再走客户端请求
const { data: _initData } = await useAsyncData(
  'leaderboard-page1',
  () => fetchSkillsTop({ page: 1, per_page: itemsPerPage })
)
const _init = _initData.value?.code === 0 ? _initData.value : null

// ── 数据状态（从 SSR 数据初始化）──
const allSkills  = ref<ApiSkill[]>(_init?.data ?? [])
const totalCount = ref(_init?.meta?.total ?? 0)
const isLoading  = ref(false)

// SPA 导航回返时，useAsyncData 重新拉取后同步更新展示数据
watch(_initData, (val) => {
  if (val?.code === 0 && currentPage.value === 1) {
    allSkills.value  = val.data
    totalCount.value = val.meta.total
  }
})

const totalPages = computed(() => Math.ceil(totalCount.value / itemsPerPage) || 1)

// ── 翻页加载（带 AbortController 防止快速翻页触发 429）──
let currentAbort: AbortController | null = null

async function loadPage() {
  currentAbort?.abort()
  currentAbort = new AbortController()
  isLoading.value = true
  try {
    const res = await fetchSkillsTop({ page: currentPage.value, per_page: itemsPerPage })
    if (res.code === 0) {
      allSkills.value  = res.data
      totalCount.value = res.meta.total
    }
  } catch (e) {
    console.error('Failed to load leaderboard', e)
  } finally {
    isLoading.value = false
  }
}

onUnmounted(() => currentAbort?.abort())

// 翻页时触发客户端加载（初始第1页数据已由 useAsyncData 提供）
watch(currentPage, () => loadPage())

// 前三名（仅第一页展示）
const topThree = computed(() =>
  currentPage.value === 1 ? allSkills.value.slice(0, 3) : []
)
// 当前页所有数据
const pagedSkills = computed(() => allSkills.value)
// 总数（用于 header 显示）
const sortedSkillsLength = computed(() => totalCount.value)

// 切页
const handleRowClick = (id: string) => router.push(localePath(`/skill/${id}`))
const goToPrevPage  = () => { if (currentPage.value > 1) currentPage.value-- }
const goToNextPage  = () => { if (currentPage.value < totalPages.value) currentPage.value++ }

// 分页点列表（最多 7 个，聚焦当前页附近）
const pageSlots = computed<number[]>(() => {
  const total = totalPages.value
  const cur   = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const half = 3
  let start = Math.max(1, cur - half)
  let end   = Math.min(total, cur + half)
  if (cur <= half + 1)        end   = Math.min(7, total)
  if (cur >= total - half)    start = Math.max(total - 6, 1)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

// 格式化 stars
const formatStars = (stars: number) => {
  if (stars >= 1000) return (stars / 1000).toFixed(1) + 'k'
  return stars.toString()
}

// 分类信息
const getCategory = (categoryId: number) => {
  const color = catStore.getColorByCategoryId(categoryId)
  const name  = catStore.getCategoryName(categoryId, i18n.locale.value)
  return name ? { name, color } : null
}



// 颁奖台配置类型
interface PodiumConfig {
  medal: string
  rank: number
  label: string
  accentColor: string
  glowColor: string
  borderColor: string
  gradient: string
}

const podiumConfig: PodiumConfig[] = [
  {
    medal: '🥈', rank: 2, label: '2nd',
    accentColor: '#94a3b8', glowColor: 'rgba(148,163,184,0.2)',
    borderColor: 'rgba(148,163,184,0.25)', gradient: 'linear-gradient(160deg, rgba(148,163,184,0.06) 0%, transparent 60%)'
  },
  {
    medal: '🥇', rank: 1, label: '1st',
    accentColor: '#fbbf24', glowColor: 'rgba(251,191,36,0.25)',
    borderColor: 'rgba(251,191,36,0.3)', gradient: 'linear-gradient(160deg, rgba(251,191,36,0.08) 0%, transparent 60%)'
  },
  {
    medal: '🥉', rank: 3, label: '3rd',
    accentColor: '#cd7c4e', glowColor: 'rgba(205,124,78,0.2)',
    borderColor: 'rgba(205,124,78,0.25)', gradient: 'linear-gradient(160deg, rgba(205,124,78,0.06) 0%, transparent 60%)'
  },
]

// 前三名颁奖台顺序：银 → 金 → 铜
const podiumOrder = computed(() => {
  const slots: Array<{ config: PodiumConfig; skill: ApiSkill | undefined }> = [
    { config: podiumConfig[0]!, skill: topThree.value[1] },
    { config: podiumConfig[1]!, skill: topThree.value[0] },
    { config: podiumConfig[2]!, skill: topThree.value[2] },
  ]
  return slots.flatMap(({ config, skill }) =>
    skill != null ? [{ config, skill }] : []
  ) as Array<{ config: PodiumConfig; skill: ApiSkill }>
})
</script>

<template>
  <div class="skill-leaderboard">
    <!-- 背景装饰 -->
    <div class="lb-bg-orb lb-bg-orb--purple" />
    <div class="lb-bg-orb lb-bg-orb--cyan" />

    <div class="leaderboard-inner">
      <!-- 标题区 -->
      <div class="lb-header fade-up">
        <div class="lb-header__badge">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#d97706">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
          LEADERBOARD
        </div>
        <h2 class="lb-header__title">{{ t('lb.title', 'Skill Star榜') }}</h2>
        <p class="lb-header__sub">{{ t('lb.subtitle', '探索社区中最受欢迎的高质量技能，按星级实时排名') }}</p>
      </div>

      <!-- 颁奖台 Top 3 -->
      <div v-if="currentPage === 1 && topThree.length > 0" class="podium-section fade-up fade-up--delay">
        <div
          v-for="{ skill, config } in podiumOrder"
          :key="skill.skill_key"
          class="podium-card"
          :class="`podium-card--rank${config.rank}`"
          :style="{
            '--pc-border': config.borderColor,
            '--pc-glow':   config.glowColor,
            '--pc-accent': config.accentColor,
            '--pc-grad':   config.gradient,
          }"
          @click="handleRowClick(skill.skill_key)"
        >
          <!-- 背景渐变层 -->
          <div class="pc-bg" />
          <!-- 扫描线 -->
          <div class="pc-scanline" />

          <!-- 排名标签 -->
          <div class="pc-rank-label">{{ config.label }}</div>
          <!-- 奖牌 -->
          <div class="pc-medal">{{ config.medal }}</div>



          <!-- 信息 -->
          <div class="pc-info">
            <div class="pc-name">{{ getSkillDisplayName(skill) }}</div>
            <div class="pc-author">@{{ skill.owner }}</div>
            <div class="pc-stars">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
              {{ formatStars(skill.repo_stars) }}
            </div>
          </div>

          <!-- 底座高度条 -->
          <div class="pc-base" :class="`pc-base--rank${config.rank}`" />
        </div>
      </div>

      <!-- 完整列表 -->
      <div class="lb-list-wrap fade-up fade-up--delay-2">
        <!-- 列表标题栏 -->
        <div class="lb-list-header">
          <span class="lb-list-header__icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </span>
          <span class="lb-list-header__label">{{ t('lb.fullRanking', '完整排名') }}</span>
          <div class="lb-list-header__line" />
          <span class="lb-list-header__count">{{ sortedSkillsLength }} skills</span>
        </div>

        <!-- 表格 -->
        <div class="lb-table-scroll">
          <table class="lb-table">
            <thead>
              <tr>
                <th class="th-rank">#</th>
                <th class="th-name">{{ t('lb.colDetail', '技能详情') }}</th>
                <th class="th-author">{{ t('lb.colAuthor', '作者') }}</th>
                <th class="th-cat">{{ t('lb.colCategory', '分类') }}</th>
                <th class="th-stars">{{ t('lb.colStars', 'Stars') }}</th>
                <th class="th-action"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(skill, idx) in pagedSkills"
                :key="skill.skill_key"
                class="lb-row"
                @click="handleRowClick(skill.skill_key)"
              >
                <!-- 排名序号 -->
                <td class="td-rank">
                  <div
                    class="rank-badge"
                    :class="{
                      'rank-badge--gold':   (currentPage - 1) * itemsPerPage + idx === 0,
                      'rank-badge--silver': (currentPage - 1) * itemsPerPage + idx === 1,
                      'rank-badge--bronze': (currentPage - 1) * itemsPerPage + idx === 2,
                    }"
                  >
                    <template v-if="(currentPage - 1) * itemsPerPage + idx === 0">🥇</template>
                    <template v-else-if="(currentPage - 1) * itemsPerPage + idx === 1">🥈</template>
                    <template v-else-if="(currentPage - 1) * itemsPerPage + idx === 2">🥉</template>
                    <template v-else>{{ (currentPage - 1) * itemsPerPage + idx + 1 }}</template>
                  </div>
                </td>

                <!-- 技能名 -->
                <td class="td-name">
                  <div class="name-cell">
                    <div class="name-info">
                      <div class="sn-name">{{ getSkillDisplayName(skill) }}</div>
                    </div>
                  </div>
                </td>

                <!-- 作者 -->
                <td class="td-author">
                  <div class="sn-author">@{{ skill.owner }}</div>
                </td>

                <!-- 分类标签 -->
                <td class="td-cat">
                  <span
                    v-if="getCategory(skill.category_id)"
                    class="cat-pill"
                    :style="{
                      background:  getCategory(skill.category_id)!.color.text + '26',
                      color:       getCategory(skill.category_id)!.color.text,
                      borderColor: getCategory(skill.category_id)!.color.text + '55'
                    }"
                  >{{ getCategory(skill.category_id)!.name }}</span>
                  <span v-else class="cat-pill cat-pill--none">—</span>
                </td>

                <!-- 星级 -->
                <td class="td-stars">
                  <div class="stars-chip">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                    {{ formatStars(skill.repo_stars) }}
                  </div>
                </td>

                <!-- 动作列 -->
                <td class="td-action">
                  <div class="row-action">
                    <span>{{ t('lb.viewAction', '查看') }}</span>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </td>
              </tr>

              <!-- 空状态 -->
              <tr v-if="pagedSkills.length === 0">
                <td colspan="6" class="empty-cell">
                  <div class="empty-wrap">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <p>{{ t('lb.noData', '暂无排行数据') }}</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 分页 -->
      <div class="lb-pagination" v-if="totalPages > 1">
        <button class="pg-btn" @click="goToPrevPage" :disabled="currentPage === 1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="pg-info">
          <span class="pg-cur">{{ currentPage }}</span>
          <span class="pg-sep">/</span>
          <span class="pg-tot">{{ totalPages }}</span>
        </div>
        <button class="pg-btn" @click="goToNextPage" :disabled="currentPage === totalPages">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================================
   容器 & 背景
============================================================ */
.skill-leaderboard {
  padding: 56px 0 80px;
  position: relative;
  overflow: hidden;
  z-index: 1;
}

/* 背景光球 */
.lb-bg-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(80px);
  z-index: 0;
}
/* 浅色模式下改为极淡蓝紫双色光球 */
.lb-bg-orb--purple {
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  width: 700px;
  height: 500px;
  background: radial-gradient(ellipse, rgba(124, 58, 237, 0.04) 0%, transparent 65%);
}
.lb-bg-orb--cyan {
  bottom: 0;
  right: -100px;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.04) 0%, transparent 70%);
}

.leaderboard-inner {
  max-width: 860px;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;
  z-index: 1;
}

/* ============================================================
   标题区
============================================================ */
.lb-header {
  text-align: center;
  margin-bottom: 28px; /* 原 56px */
}

/* badge 改用系统边框/背景变量 */
.lb-header__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 18px;
}

/* 去掉 background-clip: text 渐变剪切，改为纯色 */
.lb-header__title {
  font-family: var(--font-mono);
  font-size: clamp(28px, 4vw, 42px);
  font-weight: 800;
  margin: 0 0 14px;
  color: var(--fg);
  letter-spacing: -0.02em;
}

.lb-header__sub {
  font-size: 15px;
  color: var(--fg-secondary);
  max-width: 520px;
  margin: 0 auto;
  line-height: 1.7;
}

/* ============================================================
   颁奖台 Podium
============================================================ */
.podium-section {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 16px;
  margin-bottom: 28px; /* 原 64px */
  padding-top: 8px;    /* 原 20px */
}

.podium-card {
  --pc-border: rgba(255,255,255,0.08);
  --pc-glow:   rgba(255,255,255,0.08);
  --pc-accent: #e8eaf0;
  --pc-grad:   transparent;

  flex: 1;
  max-width: 240px;
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--pc-border);
  border-radius: 20px;
  padding: 24px 20px 0;
  text-align: center;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.35s ease, border-color 0.3s;
  box-shadow: 0 8px 32px rgba(0,0,0,0.35);
}

.podium-card:hover {
  transform: translateY(-10px);
  border-color: var(--pc-border);
  box-shadow: 0 20px 48px var(--pc-glow), 0 8px 24px rgba(0,0,0,0.4);
}

/* 渐变背景层 */
.pc-bg {
  position: absolute;
  inset: 0;
  background: var(--pc-grad);
  pointer-events: none;
}

/* 扫描线动效 */
.pc-scanline {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--pc-accent), transparent);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}
.podium-card:hover .pc-scanline {
  opacity: 0.6;
  animation: scanSlide 1.5s ease-in-out infinite;
}
@keyframes scanSlide {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* 排名标签 */
.pc-rank-label {
  position: absolute;
  top: 12px;
  right: 14px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 800;
  color: var(--pc-accent);
  letter-spacing: 0.1em;
  opacity: 0.7;
}

/* 奖牌 */
.pc-medal {
  font-size: 30px;
  margin-bottom: 14px;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
  position: relative;
  z-index: 1;
}

/* 信息区 */
.pc-info {
  position: relative;
  z-index: 1;
  width: 100%;
  padding-bottom: 20px;
  /* 由于删掉了头像，可以增加一点上边距平衡卡片内容高度 */
  padding-top: 10px;
}

.pc-name {
  font-family: var(--font-mono);
  font-size: 13.5px;
  font-weight: 700;
  color: var(--fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}
/* 金牌卡称谓名改为深色可读，浅色背景下 #fff 不可见 */
.podium-card--rank1 .pc-name { font-size: 15px; color: var(--fg); }

.pc-author {
  font-size: 11px;
  color: var(--muted);
  font-family: var(--font-mono);
  margin-bottom: 12px;
}

.pc-stars {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border-radius: 100px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--pc-border);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  color: var(--pc-accent);
}
.podium-card--rank1 .pc-stars {
  background: rgba(251,191,36,0.08);
}

/* 底座彩条 */
.pc-base {
  width: 100%;
  margin-top: auto;
  border-radius: 0 0 20px 20px;
  min-height: 4px;
  flex-shrink: 0;
}
.pc-base--rank1 { background: linear-gradient(90deg, transparent, rgba(251,191,36,0.5), transparent); height: 4px; }
.pc-base--rank2 { background: linear-gradient(90deg, transparent, rgba(148,163,184,0.4), transparent); height: 3px; }
.pc-base--rank3 { background: linear-gradient(90deg, transparent, rgba(205,124,78,0.4), transparent); height: 3px; }

/* 1/2/3 高度差 */
.podium-card--rank1 { height: 280px; order: 2; z-index: 2; }
.podium-card--rank2 { height: 240px; order: 1; }
.podium-card--rank3 { height: 220px; order: 3; }

/* ============================================================
   列表区域
============================================================ */
.lb-list-wrap {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.lb-list-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
}

.lb-list-header__icon {
  display: flex;
  align-items: center;
  color: var(--accent);
}

.lb-list-header__label {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  white-space: nowrap;
}

/* 装饰线改为系统边框色 */
.lb-list-header__line {
  flex: 1;
  height: 1px;
  background: var(--border);
}

.lb-list-header__count {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--muted);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  padding: 2px 8px;
  border-radius: 6px;
}

/* 表格 */
.lb-table-scroll { overflow-x: auto; }

.lb-table {
  width: 100%;
  border-collapse: collapse;
}

/* 表头改用较淺的系统背景 */
.lb-table thead th {
  padding: 11px 20px;
  text-align: left;
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.lb-table td {
  padding: 13px 20px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

/* 行悬停 */
.lb-row {
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}
.lb-row:hover { background: var(--bg-card-hover); }
.lb-row:last-child td { border-bottom: none; }

/* 列宽 */
.th-rank, .td-rank { width: 70px; }
.th-author,.td-author { width: 140px; }
.th-cat,  .td-cat  { width: 120px; }
.th-stars,.td-stars { width: 100px; }
.th-action,.td-action { width: 80px; text-align: right; }
.th-name, .td-name { flex: 1; min-width: 180px; }

/* 排名徽章 */
.rank-badge {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 800;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--muted);
}
.rank-badge--gold   { background: rgba(251,191,36,0.10); border-color: rgba(251,191,36,0.25); font-size: 16px; }
.rank-badge--silver { background: rgba(148,163,184,0.10); border-color: rgba(148,163,184,0.25); font-size: 16px; }
.rank-badge--bronze { background: rgba(205,124,78,0.10);  border-color: rgba(205,124,78,0.25);  font-size: 16px; }

/* 名字单元格 */
.name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mini-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}

.name-info { display: flex; flex-direction: column; gap: 2px; }

.sn-name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
}
/* hover 时技能名改为 --accent，浅色背景下可见 */
.lb-row:hover .sn-name { color: var(--accent); }
[data-theme="dark"] .lb-row:hover .sn-name { color: #3b82f6; }

/* 作者列 */
.td-author {
  vertical-align: middle;
}
.sn-author {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
}

/* 分类标签 */
.cat-pill {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid transparent;
  font-family: var(--font-sans);
  white-space: nowrap;
}
.cat-pill--none { color: var(--muted); border-color: var(--border); background: transparent; }

/* 星级 */
.stars-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  color: var(--fg-secondary);
}
.stars-chip svg { color: #f59e0b; flex-shrink: 0; }

/* 行操作 */
.row-action {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--accent);
  opacity: 0;
  transform: translateX(-6px);
  transition: opacity 0.2s, transform 0.2s;
}
.lb-row:hover .row-action { opacity: 1; transform: translateX(0); }

/* 空状态 */
.empty-cell { padding: 80px 0; text-align: center; }
.empty-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  color: var(--muted);
  font-size: 14px;
}

/* ============================================================
   分页
============================================================ */
.lb-pagination {
  margin-top: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.pg-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--fg-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.pg-btn:hover:not(:disabled) {
  border-color: var(--border-strong);
  color: var(--fg);
  background: var(--bg-elevated);
}
.pg-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.pg-track {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pg-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  border: none;
  background: var(--border);
  cursor: pointer;
  padding: 0;
  transition: all 0.2s;
}
.pg-dot--active {
  width: 20px;
  border-radius: 3px;
  background: var(--accent);
}

.pg-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  padding: 0 4px;
}
.pg-cur { color: var(--accent); }
.pg-sep { color: var(--muted); }
.pg-tot { color: var(--fg-secondary); }

/* ============================================================
   响应式
============================================================ */
@media (max-width: 768px) {
  .podium-section {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .podium-card {
    max-width: none;
    height: auto !important;
    flex-direction: row;
    padding: 16px;
    gap: 14px;
    border-radius: 14px;
  }
  .podium-card--rank1 { order: 1 !important; }
  .podium-card--rank2 { order: 2 !important; }
  .podium-card--rank3 { order: 3 !important; }

  .pc-medal { font-size: 24px; margin-bottom: 0; }
  .pc-avatar { width: 48px !important; height: 48px !important; font-size: 18px !important; border-radius: 12px !important; }
  .pc-info { padding-bottom: 0; text-align: left; }
  .pc-base { display: none; }
  .td-cat, .th-cat { display: none; }
  .lb-pagination { flex-wrap: wrap; }
}
</style>
