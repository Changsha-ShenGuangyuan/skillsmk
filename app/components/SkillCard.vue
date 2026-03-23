<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useI18n, loadModule } from '~/i18n'
import { useCategoryStore } from '~/composables/useCategoryStore'

const i18n = useI18n()
const t = i18n.t
const router = useRouter()
const localePath = useLocalePath()

onMounted(async () => {
  await loadModule(i18n.locale.value, 'skillCard')
})
watch(i18n.locale, async (lang) => {
  await loadModule(lang, 'skillCard')
})

const catStore = useCategoryStore()

interface Skill {
  id: string
  skillId?: string     // UUID，用于跳转时携带 ?sid= 直接请求详情
  name: string
  author?: string
  description: string
  category: string
  Classification?: number
  stars?: number
}

const props = defineProps({
  skill: {
    type: Object as () => Skill,
    required: true
  }
})



function handleCardClick() {
  window.scrollTo({ top: 0, behavior: 'instant' })
  // 用 history state 传递 UUID，不显示在 URL 中
  router.push({
    path: localePath(`/skill/${props.skill.id}`),
    state: props.skill.skillId ? { sid: props.skill.skillId } : undefined,
  })
}

// 根据 Classification 字段显示标签
const displayTags = computed(() => {
  const tags: Array<{ id: number; name: string; color: { bg: string; text: string } }> = []
  const catId = props.skill.Classification
  if (catId) {
    const name  = catStore.getCategoryName(catId, i18n.locale.value)
    const color = catStore.getColorByCategoryId(catId)
    if (name) tags.push({ id: catId, name, color })
  } else if (props.skill.category) {
    // 回退：按分类名称匹配
    const cat   = catStore.categories.value.find(c =>
      c.translations?.some(tr => tr.name === props.skill.category)
    )
    if (cat) {
      const idx   = catStore.categories.value.indexOf(cat)
      const color = catStore.getColorByCategoryId(cat.id)
      const name  = catStore.getCategoryName(cat.id, i18n.locale.value) || props.skill.category
      tags.push({ id: cat.id, name, color })
    }
  }
  return tags
})

// 格式化 stars
const formattedStars = computed(() => {
  const stars = props.skill.stars || 0
  if (stars >= 1000) return (stars / 1000).toFixed(1) + 'k'
  return stars.toString()
})


</script>

<template>
  <div
    class="skill-card"
    @click="handleCardClick"
  >
    <!-- 悬停光晕 -->
    <div class="card-glow" />

    <!-- Header -->
    <div class="card-header">
      <div class="card-name-wrap">
        <span class="card-prompt">›</span>
        <span class="card-name">{{ skill.name }}</span>
      </div>
      <div class="card-tags">
        <span
          v-for="(tag, i) in displayTags"
          :key="tag.id ?? i"
          class="card-tag"
          :title="tag.name"
          :style="{ background: tag.color.bg, color: tag.color.text }"
        >{{ tag.name }}</span>
      </div>
    </div>

    <!-- Body -->
    <div class="card-body">
      <div class="card-line card-line--author">
        <span class="code-kw">from</span>
        <span class="code-val">"{{ skill.author || t('card.defaultAuthor', 'OpenClaw') }}"</span>
      </div>
      <div class="card-line">
        <span class="card-desc">{{ skill.description }}</span>
      </div>
    </div>

    <!-- Footer -->
    <div class="card-footer">
      <div class="card-stars">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
        <span class="star-count">{{ formattedStars }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skill-card {
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 18px;
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.5;
  height: 220px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: border-color 0.3s ease, transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

/* 悬停光晕（浅色模式下隐藏）*/
.card-glow { display: none; }

.skill-card:hover {
  transform: translateY(-3px);
  z-index: 2;
  border-color: var(--border-strong);
  box-shadow: var(--shadow-float);
}

/* Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
  gap: 8px;
}

.card-name-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.card-prompt {
  color: var(--muted);
  font-size: 16px;
  line-height: 1;
  flex-shrink: 0;
  font-weight: 700;
}

.card-name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--fg-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-tags {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
  /* 需要加上 min-width 约束，避免子级文本无限伸长被强制推平 */
  min-width: 0;
  max-width: 52%;
  align-items: center;
}

.card-tag {
  display: inline-block;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  white-space: nowrap;
  letter-spacing: 0.04em;
  font-family: var(--font-mono);
  background: var(--bg-elevated);
  color: var(--muted);
  border: 1px solid var(--border);
  transition: border-color 0.15s, color 0.15s;
  /* 适当放宽最大宽度，防止翻译导致的过短截断 */
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
}

.card-tag:hover {
  border-color: var(--border-strong);
  color: var(--fg-secondary);
}


/* Body */
.card-body {
  flex: 1;
  padding-left: 16px;
  position: relative;
}

.card-body::before {
  content: '';
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: 1px;
  background: var(--border);
  border-radius: 2px;
}

.skill-card:hover .card-body::before {
  background: var(--border-strong);
}

.card-line {
  margin-bottom: 7px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.card-line--author {
  color: var(--fg-secondary);
}

.code-kw {
  color: #2563eb;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.code-val {
  color: var(--fg-secondary);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-desc {
  color: var(--fg-secondary);
  font-size: 12px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3; /* 标准属性，兼容未来浏览器 */
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
  font-family: var(--font-sans);
  line-height: 1.5;
}

/* Footer */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}

.card-stars {
  display: flex;
  align-items: center;
  gap: 5px;
}

.star-count {
  font-size: 12px;
  color: var(--muted);
  font-weight: 600;
}

</style>