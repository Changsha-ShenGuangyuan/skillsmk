<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import SkillCard from './SkillCard.vue'
import { useI18n, loadModule } from '~/i18n'
import { fetchSkillsTop, toSkillCardProps } from '~/composables/useSkillsApi'
import type { ApiSkill } from '~/composables/useSkillsApi'

const i18n = useI18n()
const t = i18n.t

onMounted(async () => {
  if (!import.meta.client) return
  await loadModule(i18n.locale.value, 'search')
  await loadPopular()
})
watch(i18n.locale, async (lang) => {
  await loadModule(lang, 'search')
})

// ── 热门技能数据 ──
const topSkills = ref<ApiSkill[]>([])

async function loadPopular() {
  try {
    const res = await fetchSkillsTop({ per_page: 4 })
    if (res.code === 0) {
      topSkills.value = res.data
    }
  } catch (e) {
    console.error('Failed to load top skills', e)
  }
}

// 映射为 SkillCard 所需格式
const popularSkills = computed(() => topSkills.value.map(toSkillCardProps))
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
        <SkillCard
          v-for="skill in popularSkills"
          :key="skill.id"
          :skill="skill"
        />
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
</style>
