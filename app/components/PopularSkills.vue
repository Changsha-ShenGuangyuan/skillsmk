<script setup lang="ts">
import { onMounted, watch } from 'vue'
import SkillCard from './SkillCard.vue'
import { useI18n } from '~/i18n'
import { fetchSkillsTop, toSkillCardProps } from '~/composables/useSkillsApi'

const i18n = useI18n()
const t = i18n.t

// 兜底：若 SSR payload 中热门技能数据为空，客户端主动重新获取
onMounted(async () => {
  if (!topData.value || topData.value.code !== 0 || !topData.value.data?.length) {
    await refreshTop()
  }
})

// 热门技能：使用 useAsyncData 在服务端获取，支持 SWR 缓存
const { data: topData, refresh: refreshTop } = await useAsyncData('popular-skills', () =>
  fetchSkillsTop({ per_page: 4 })
)

// 映射为 SkillCard 所需格式
const popularSkills = computed(() =>
  topData.value?.code === 0 ? topData.value.data.map(toSkillCardProps) : []
)
</script>

<template>
  <section class="popular-skills">
    <!-- 装饰光晕 -->
    <div class="ps-orb" />

    <div class="popular-skills-inner">
      <div class="popular-skills-header">
        <div class="popular-label">
          <span class="label-dot" />
          <span>POPULAR.md</span>
        </div>
        <h2 class="popular-title">{{ t('search.trendingTitle', 'Trending Agent Skills') }}</h2>
        <p class="popular-desc">
          {{ t('search.trendingDesc', '社区使用量最高、评分最优的精选技能 — 基于实时统计数据') }}
        </p>
      </div>

      <div class="popular-grid">
        <!-- 已加载 -->
        <template v-if="popularSkills.length > 0">
          <SkillCard
            v-for="skill in popularSkills"
            :key="skill.id"
            :skill="skill"
          />
        </template>

        <!-- 加载中：4 个卡片骨架屏 -->
        <template v-else>
          <div
            v-for="i in 4"
            :key="`sk-pop-${i}`"
            class="ps-skeleton-card"
            aria-hidden="true"
          >
            <div class="ps-sk-header">
              <div class="ps-sk-block ps-sk-avatar" />
              <div class="ps-sk-meta">
                <div class="ps-sk-block ps-sk-title" />
                <div class="ps-sk-block ps-sk-sub" />
              </div>
            </div>
            <div class="ps-sk-block ps-sk-desc" />
            <div class="ps-sk-block ps-sk-desc ps-sk-desc--short" />
            <div class="ps-sk-footer">
              <div class="ps-sk-block ps-sk-tag" />
              <div class="ps-sk-block ps-sk-stars" />
            </div>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
.popular-skills {
  padding: 80px 0 100px;
  position: relative;
  z-index: 1;
  overflow: hidden;
}

.ps-orb {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 700px;
  height: 300px;
  /* 浅色模式下极淡紫色装饰 */
  background: radial-gradient(ellipse, rgba(124, 58, 237, 0.04) 0%, transparent 70%);
  filter: blur(60px);
  pointer-events: none;
  z-index: 0;
}

.popular-skills-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;
  z-index: 1;
}

.popular-skills-header {
  text-align: center;
  margin-bottom: 56px;
}

.popular-label {
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
  letter-spacing: 0.08em;
  margin-bottom: 20px;
}

.label-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #16a34a;
}

.popular-title {
  font-family: var(--font-mono);
  font-size: clamp(24px, 3vw, 36px);
  font-weight: 800;
  margin: 0 0 16px;
  color: var(--fg);
  letter-spacing: -0.02em;
}

.popular-desc {
  font-size: 15px;
  line-height: 1.65;
  color: var(--fg-secondary);
  max-width: 520px;
  margin: 0 auto;
}

.popular-grid {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding: 16px 4px 48px;
  margin: -16px -4px -48px;
  scrollbar-width: none;
  -ms-overflow-style: none;
  scroll-behavior: smooth;
}

.popular-grid::-webkit-scrollbar {
  display: none;
}

.popular-grid > * {
  flex: 0 0 266px;
}

@media (max-width: 768px) {
  .popular-skills { padding: 48px 0 64px; }
  .popular-grid > * { flex: 0 0 230px; }
}

/* ── 骨架屏 ── */
@keyframes ps-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}

/* 骨架卡 - 尺寸与真实 SkillCard 一致 */
.ps-skeleton-card {
  flex: 0 0 266px;
  height: 200px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0;
}

/* 骨架块公共样式 */
.ps-sk-block {
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    var(--bg-elevated) 25%,
    var(--border)      50%,
    var(--bg-elevated) 75%
  );
  background-size: 200% 100%;
  animation: ps-shimmer 1.4s ease-in-out infinite;
}

/* 头部区块 */
.ps-sk-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ps-sk-avatar {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  flex-shrink: 0;
  opacity: 0.5;
}

.ps-sk-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ps-sk-title {
  height: 13px;
  width: 65%;
  opacity: 0.55;
}

.ps-sk-sub {
  height: 11px;
  width: 40%;
  opacity: 0.4;
}

/* 描述行 */
.ps-sk-desc {
  height: 11px;
  width: 90%;
  opacity: 0.4;
}
.ps-sk-desc--short {
  width: 60%;
}

/* 底部标签和星数 */
.ps-sk-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.ps-sk-tag {
  height: 20px;
  width: 60px;
  border-radius: 999px;
  opacity: 0.45;
}

.ps-sk-stars {
  height: 20px;
  width: 50px;
  border-radius: 999px;
  opacity: 0.45;
}

@media (max-width: 768px) {
  .ps-skeleton-card { flex: 0 0 230px; }
}
</style>
