<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n, loadModule } from '~/i18n'
import { fetchSkillsTop } from '~/composables/useSkillsApi'
import { useCategoryStore } from '~/composables/useCategoryStore'

const i18n = useI18n()
const t    = i18n.t
const catStore = useCategoryStore()

// i18n 模块懒加载（客户端）+ 数据兜底加载
onMounted(async () => {
  await loadModule(i18n.locale.value, 'leaderboard')
  // 兜底：若 SSR payload 中 Top10 数据为空，客户端主动重新获取
  if (!top10Data.value || top10Data.value.code !== 0 || !top10Data.value.data?.length) {
    await refreshTop10()
  }
  // 兜底：若分类数据为空，补充加载（用于分类标签显示）
  if (catStore.categories.value.length === 0) {
    await catStore.ensureLoaded(i18n.locale.value)
  }
})
watch(i18n.locale, async (lang) => {
  await loadModule(lang, 'leaderboard')
})

const router     = useRouter()
const localePath = useLocalePath()

// 热门 Top10：改为客户端获取（server: false），服务端立即发骨架 HTML
const { data: top10Data, status: top10Status, refresh: refreshTop10 } = await useAsyncData('star-chart-top10', () =>
  fetchSkillsTop({ per_page: 10 }),
  { server: false, lazy: true }
)
const top10 = computed(() =>
  top10Data.value?.code === 0 ? top10Data.value.data : []
)

// status 为 'idle' 或 'pending' 时显示骨架（idle=客户端尚未开始请求，pending=请求中）
const isLoadingChart = computed(() => top10Status.value === 'idle' || top10Status.value === 'pending')

// 从 Store 读取分类名称和颜色
const getCatName  = (categoryId: number) => catStore.getCategoryName(categoryId, i18n.locale.value)
const getCatColor = (categoryId: number): { text: string } => catStore.getColorByCategoryId(categoryId)
// 获取分类索引（保留与模板兼容）
const getCatIdx   = (categoryId: number) => {
  const idx = catStore.categories.value.findIndex(c => c.id === categoryId)
  return idx >= 0 ? idx : 0
}

// 格式化 stars
const fmt = (n: number) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)


// 排名奖牌
const rankMedal = (rank: number) => {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return null
}

// ── 入场动画 ──
const animatedRows = ref<Set<number>>(new Set())
const isVisible    = ref(false)

onMounted(() => {
  const el = document.querySelector('.star-chart')
  if (!el) { triggerAll(); return }
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        triggerAll()
        observer.disconnect()
      }
    },
    { threshold: 0.15 }
  )
  observer.observe(el)
})

function triggerAll() {
  isVisible.value = true
  top10.value.forEach((_, i) => {
    setTimeout(() => animatedRows.value.add(i), i * 60)
  })
}

// 点击跳转
const handleClick = (id: string) => router.push(localePath(`/skill/${id}`))

</script>

<template>
  <section class="star-chart" :class="{ 'is-visible': isVisible }">
    <!-- 背景装饰 -->
    <div class="sc-orb sc-orb--gold" />
    <div class="sc-orb sc-orb--cyan" />

    <div class="sc-inner">
      <!-- 标题区 -->
      <div class="sc-header">
        <div class="sc-badge">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#d97706">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
          STAR CHART
        </div>
        <h2 class="sc-title">{{ t('lb.title', 'Top 10 Star 排名') }}</h2>
        <p class="sc-sub">{{ t('lb.subtitle', '社区最受欢迎的 10 个 Agent Skill，实时 Star 数据可视化') }}</p>
      </div>

      <!-- 图表主体 -->
      <div class="sc-chart-wrap">
        <!-- 顶栏：查看完整排名 + Y 轴标签 -->
        <div class="sc-chart-header">
          <button class="sc-view-all" @click="router.push(localePath('/rankings'))">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
            {{ t('lb.fullRanking', '查看完整排名') }}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
          <div class="sc-axis-label">STARS</div>
        </div>

        <!-- 图表行列表 -->
        <div class="sc-rows">
          <!-- 加载中：骨架屏占位 -->
          <template v-if="isLoadingChart">
            <div v-for="i in 10" :key="i" class="sc-row-skeleton">
              <div class="sc-sk-rank"></div>
              <div class="sc-sk-info">
                <div class="sc-sk-line sc-sk-line--name"></div>
              </div>
              <div class="sc-sk-pill"></div>
              <div class="sc-sk-stars"></div>
            </div>
          </template>
          <!-- 数据就绪：真实内容 -->
          <template v-else>
          <div
            v-for="(skill, idx) in top10"
            :key="skill.skill_key"
            class="sc-row"
            :class="{ 'sc-row--animated': animatedRows.has(idx) }"
            @click="handleClick(skill.skill_key)"
          >
            <!-- 左侧：排名 + 技能信息 -->
            <div class="sc-row-left">
              <!-- 排名徽章 -->
              <div class="sc-rank" :class="{
                'sc-rank--gold':   idx === 0,
                'sc-rank--silver': idx === 1,
                'sc-rank--bronze': idx === 2,
              }">
                <span v-if="rankMedal(idx + 1)" class="sc-rank-medal">{{ rankMedal(idx + 1) }}</span>
                <span v-else class="sc-rank-num">{{ idx + 1 }}</span>
              </div>



              <!-- 技能名 -->
              <div class="sc-info">
                <div class="sc-skill-name">{{ skill.name }}</div>
              </div>

              <!-- 作者单独一列 -->
              <div class="sc-author">@{{ skill.owner }}</div>

              <!-- 分类标签 -->
              <template v-if="getCatName(skill.category_id)">
                <div
                  class="sc-cat-pill"
                  :style="{
                    background:  getCatColor(getCatIdx(skill.category_id)).text + '20',
                    color:       getCatColor(getCatIdx(skill.category_id)).text,
                    borderColor: getCatColor(getCatIdx(skill.category_id)).text + '44',
                  }"
                >{{ getCatName(skill.category_id) }}</div>
              </template>
            </div>

            <!-- 右侧：star 数 -->
            <div class="sc-row-right">
              <div class="sc-star-count">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
                {{ fmt(skill.repo_stars) }}
              </div>
            </div>

            <!-- hover 时的行高亮线 -->
            <div class="sc-row-line" />
          </div>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.star-chart {
  padding: 80px 0 100px;
  position: relative;
  overflow: hidden;
  z-index: 1;
}

/* 背景光球 */
.sc-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(90px);
  z-index: 0;
}
.sc-orb--gold {
  top: -80px;
  left: 30%;
  width: 600px;
  height: 400px;
  /* 改为极淡蓝色，贴合浅色系 */
  background: radial-gradient(ellipse, rgba(37, 99, 235, 0.04) 0%, transparent 65%);
}
.sc-orb--cyan {
  bottom: -60px;
  right: 10%;
  width: 400px;
  height: 400px;
  /* 改为极淡紫色装饰 */
  background: radial-gradient(circle, rgba(124, 58, 237, 0.04) 0%, transparent 70%);
}

/* ── 内容容器 ── */
.sc-inner {
  max-width: 860px;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;
  z-index: 1;
}

/* ============================================================
   标题区
============================================================ */
.sc-header {
  text-align: center;
  margin-bottom: 52px;
  /* 入场动画 */
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.is-visible .sc-header {
  opacity: 1;
  transform: none;
}

.sc-badge {
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

.sc-title {
  font-family: var(--font-mono);
  font-size: clamp(26px, 4vw, 40px);
  font-weight: 800;
  margin: 0 0 14px;
  /* 改为浅色系：深黑过渡到工程蓝，去掉金色/青色 */
  background: linear-gradient(135deg, var(--fg) 0%, #2563eb 60%, #7c3aed 100%);
  background-size: 200%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradientShift 6s ease infinite;
  letter-spacing: -0.02em;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50%       { background-position: 100% 50%; }
}

.sc-sub {
  font-size: 15px;
  color: var(--fg-secondary);
  max-width: 520px;
  margin: 0 auto;
  line-height: 1.7;
}

/* ============================================================
   图表主体
============================================================ */
.sc-chart-wrap {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 28px 28px 20px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.35);
  /* 入场 */
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s ease 0.15s, transform 0.6s ease 0.15s;
}
.is-visible .sc-chart-wrap {
  opacity: 1;
  transform: none;
}

/* 内部顶栏：包含按钮和坐标轴标签 */
.sc-chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

/* Y 轴标签 */
.sc-axis-label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: var(--muted);
  text-align: right;
  padding-right: 4px;
}

/* ── 行列表 ── */
.sc-rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ── 每一行 ── */
.sc-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
  /* 入场：初始透明 + 偏移 */
  opacity: 0;
  transform: translateX(-16px);
  transition: opacity 0.4s ease, transform 0.4s ease, background 0.2s;
}
.sc-row--animated {
  opacity: 1;
  transform: none;
}
.sc-row:hover {
  /* 改为中性浅灰 hover，与浅色系一致 */
  background: var(--bg-card-hover);
}

/* 行底部高亮线 */
.sc-row-line {
  position: absolute;
  bottom: 0;
  left: 12px;
  right: 12px;
  height: 1px;
  background: var(--border);
}
.sc-row:last-child .sc-row-line { display: none; }

/* ── 左侧 ── */
.sc-row-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1; /* 让左侧占据更多弹性空间 */
  min-width: 0;
}

/* 排名徽章 */
.sc-rank {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  flex-shrink: 0;
}
.sc-rank-medal { font-size: 16px; line-height: 1; }
.sc-rank-num {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 800;
  color: var(--muted);
}
.sc-rank--gold   { border-color: rgba(251,191,36,0.35); background: rgba(251,191,36,0.08); }
.sc-rank--silver { border-color: rgba(148,163,184,0.35); background: rgba(148,163,184,0.08); }
.sc-rank--bronze { border-color: rgba(205,124,78,0.35); background: rgba(205,124,78,0.08); }



/* 技能名 + 作者 */
.sc-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.sc-skill-name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s;
}
/* hover 时技能名加深为主色 */
.sc-row:hover .sc-skill-name { color: #2563eb; }

.sc-author {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  width: 120px; /* 给作者列固定的视觉宽度 */
  flex-shrink: 0;
}

/* 分类标签 */
.sc-cat-pill {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10.5px;
  font-weight: 600;
  border: 1px solid transparent;
  white-space: nowrap;
}

/* ── 右侧：Star 区 ── */
.sc-row-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  /* 不再使用 flex: 1，由右侧内容自然撑开，左侧占据剩余空间 */
}

/* Star 计数 */
.sc-star-count {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: 12.5px;
  font-weight: 700;
  color: var(--fg-secondary);
  min-width: 48px;
  text-align: right;
}
/* star 图标保留琥珀金，与奖牌体系一致 */
.sc-star-count svg { color: #d97706; }




/* 「查看完整排行榜」跳转按钮 */
.sc-view-all {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 16px;
  border-radius: 10px;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.18s, border-color 0.18s, color 0.18s;
  flex-shrink: 0;
}
.sc-view-all:hover {
  background: var(--bg-elevated);
  border-color: var(--accent);
}
.sc-view-all svg:last-child {
  transition: transform 0.25s ease;
}
.sc-view-all:hover svg:last-child {
  transform: translateX(3px);
}

/* ============================================================
   响应式
============================================================ */
@media (max-width: 900px) {
  .sc-cat-pill   { display: none; }
}

@media (max-width: 600px) {
  .star-chart    { padding: 48px 0 60px; }
  .sc-row        { flex-direction: column; align-items: flex-start; gap: 6px; }
  .sc-row-left   { flex: none; width: 100%; }
  .sc-row-right  { width: 100%; justify-content: flex-start; }
}

/* ── StarChart 骨架屏 ─────────────────────────────────────────── */
.sc-row-skeleton {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 12px;
  border-radius: 10px;
}

/* 骨架公共波纹 */
@keyframes sc-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.sc-sk-rank,
.sc-sk-line,
.sc-sk-pill,
.sc-sk-stars {
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    var(--bg-elevated) 25%,
    var(--bg-secondary) 50%,
    var(--bg-elevated) 75%
  );
  background-size: 200% 100%;
  animation: sc-shimmer 1.4s infinite;
  opacity: 0.75;
}

.sc-sk-rank   { width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0; }
.sc-sk-info   { flex: 1; min-width: 0; }
.sc-sk-line--name { height: 13px; width: 55%; }
.sc-sk-pill   { width: 64px; height: 20px; border-radius: 6px; flex-shrink: 0; }
.sc-sk-stars  { width: 44px; height: 14px; flex-shrink: 0; }
</style>
