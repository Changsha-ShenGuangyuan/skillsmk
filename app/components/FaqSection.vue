<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n, loadModule } from '~/i18n'

const i18n = useI18n()
const t = i18n.t

onMounted(async () => {
  await loadModule(i18n.locale, 'faq')
})

watch(i18n.locale, async (lang) => {
  await loadModule(lang, 'faq')
})

type FaqItem = {
  q: string
  a: string
}

// 从翻译中动态生成 FAQ 条目
const items = computed<FaqItem[]>(() => [
  { q: t('faq.q1', '?'), a: t('faq.a1', '') },
  { q: t('faq.q2', '?'), a: t('faq.a2', '') },
  { q: t('faq.q3', '?'), a: t('faq.a3', '') },
  { q: t('faq.q4', '?'), a: t('faq.a4', '') },
  { q: t('faq.q5', '?'), a: t('faq.a5', '') },
  { q: t('faq.q6', '?'), a: t('faq.a6', '') },
])

// ── FAQPage Schema（GEO：让 AI 引擎直接引用 FAQ 内容）──────────
useHead(computed(() => ({
  script: [
    {
      type: 'application/ld+json',
      key: 'faq-schema',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.value.map(item => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a,
          },
        })),
      }),
    },
  ],
})))

// 用 Set 记录所有已展开的索引，支持同时展开多条
const openSet = ref<Set<number>>(new Set([0]))

function toggle(i: number) {
  if (openSet.value.has(i)) {
    openSet.value.delete(i)
  } else {
    openSet.value.add(i)
  }
  // 触发响应式更新
  openSet.value = new Set(openSet.value)
}

// ── 高度动画钩子（作用于 faq-answer-wrap 层）──
function onEnter(el: Element, done: () => void) {
  const wrap = el as HTMLElement
  // wrap 默认 overflow:hidden，直接从 height:0 开始
  wrap.style.height = '0'
  wrap.style.opacity = '0'
  // 双重 rAF：确保浏览器渲染一帧 height:0 后再开始过渡
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      wrap.style.transition = 'height 0.35s cubic-bezier(0.2,0.8,0.2,1), opacity 0.3s ease'
      wrap.style.height    = wrap.scrollHeight + 'px'
      wrap.style.opacity   = '1'
      wrap.addEventListener('transitionend', done, { once: true })
    })
  })
}

function onAfterEnter(el: Element) {
  const wrap = el as HTMLElement
  wrap.style.height     = 'auto'
  wrap.style.transition = ''
}

function onLeave(el: Element, done: () => void) {
  const wrap = el as HTMLElement
  // 先固定实际高度，再过渡到 0
  wrap.style.height   = wrap.scrollHeight + 'px'
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      wrap.style.transition = 'height 0.3s cubic-bezier(0.4,0,0.6,1), opacity 0.25s ease'
      wrap.style.height    = '0'
      wrap.style.opacity   = '0'
      wrap.addEventListener('transitionend', done, { once: true })
    })
  })
}

function onAfterLeave(el: Element) {
  const wrap = el as HTMLElement
  wrap.style.height     = ''
  wrap.style.opacity    = ''
  wrap.style.transition = ''
}
</script>

<template>
  <section id="faq" class="faq-section fade-up fade-up--delay-3">
    <!-- 背景光晕 -->
    <div class="faq-orb" />

    <div class="faq-container">
      <!-- 左侧固定信息 -->
      <header class="faq-head">
        <div class="faq-label">
          <span class="faq-label-dot" />
          {{ t('faq.badge', 'FAQ.md') }}
        </div>
        <div class="faq-meta">{{ t('faq.metaSuffix', '常见问题解答 · 共') }} {{ items.length }} {{ t('faq.metaUnit', '项') }}</div>
        <h2 class="faq-title">{{ t('faq.title1', '一切关于') }}<br /><span class="faq-title-accent">{{ t('faq.titleAccent', 'Agent Skills') }}</span><br />{{ t('faq.title2', '的全方位解答') }}</h2>
        <p class="faq-lead">
          {{ t('faq.lead', '') }}
        </p>

        <!-- 终端装饰 -->
        <div class="faq-terminal">
          <span class="faq-terminal-line">
            <span class="t-prompt">$</span>
            <span class="t-cmd">skill --help</span>
          </span>
          <span class="faq-terminal-line t-output">→ {{ items.length }} questions answered</span>
        </div>
      </header>

      <!-- 右侧 FAQ 列表 -->
      <div class="faq-list">
        <div
          v-for="(item, index) in items"
          :key="item.q"
          role="button"
          tabindex="0"
          class="faq-item"
          :class="{ 'faq-item--open': openSet.has(index) }"
          :aria-expanded="openSet.has(index)"
          :aria-controls="`faq-answer-${index}`"
          @click="toggle(index)"
          @keydown.enter.space.prevent="toggle(index)"
        >
          <div class="faq-question">
            <span class="faq-q-prefix">Q{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="faq-q-text">{{ item.q }}</span>
            <span class="faq-icon" aria-hidden="true">
              <svg
                width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2"
                :style="{ transform: openSet.has(index) ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }"
              >
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </span>
          </div>
          <Transition
            :css="false"
            @enter="onEnter"
            @after-enter="onAfterEnter"
            @leave="onLeave"
            @after-leave="onAfterLeave"
          >
            <!-- wrap 层负责高度动画，answer 层保持正常 margin/padding -->
            <div v-if="openSet.has(index)" class="faq-answer-wrap" :id="`faq-answer-${index}`">
              <div class="faq-answer">
                <span class="faq-a-prefix">// </span>
                <p class="faq-a-text">{{ item.a }}</p>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.faq-section {
  padding: 60px 0 80px;
  position: relative;
  z-index: 1;
  overflow: hidden;
}

.faq-orb { display: none; }

.faq-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  gap: 48px;
  position: relative;
  z-index: 1;
}

@media (min-width: 768px) {
  .faq-container {
    flex-direction: row;
    align-items: flex-start;
    gap: 64px;
  }
}

/* ── 左侧信息区 ── */
.faq-head {
  flex: 1;
  /* 移动端不限宽、不做 sticky，避免大片空白 */
}

@media (min-width: 768px) {
  .faq-head {
    max-width: 300px;
    position: sticky;
    top: 100px;
  }
}

.faq-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  letter-spacing: 0.06em;
  margin-bottom: 12px;
}

.faq-label-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #16a34a;
}

.faq-meta {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 20px;
  letter-spacing: 0.04em;
}

.faq-title {
  font-family: var(--font-mono);
  margin: 0 0 16px;
  font-size: clamp(22px, 2.5vw, 28px);
  font-weight: 800;
  color: var(--fg);
  line-height: 1.3;
  letter-spacing: -0.02em;
}

.faq-title-accent {
  color: var(--fg);
  font-style: normal;
}

.faq-lead {
  margin: 0 0 24px;
  font-size: 14px;
  line-height: 1.75;
  color: var(--fg-secondary);
}

.faq-terminal {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 12px;
}

.faq-terminal-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.t-prompt {
  color: var(--muted);
  font-weight: 700;
}

.t-cmd {
  color: var(--fg-secondary);
}

.t-output {
  color: var(--muted);
  padding-left: 4px;
}

/* ── 右侧 FAQ 列表 ── */
.faq-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 2;
}

.faq-item {
  width: 100%;
  text-align: left;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  padding: 18px 20px;
  color: inherit;
  cursor: pointer;
  /* 必须 visible，否则高度动画会被裁剪 */
  overflow: visible;
  /* 去除 button 的默认样式残留 */
  font-family: inherit;
  font-size: inherit;
  transition: border-color 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
              background   0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
              box-shadow   0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.faq-item:hover {
  border-color: var(--border-strong);
  background: var(--bg-secondary);
  box-shadow: var(--shadow-card);
}

.faq-item--open {
  border-color: var(--border-strong);
  background: var(--bg-secondary);
  box-shadow: var(--shadow-card);
}

.faq-question {
  display: flex;
  align-items: center;
  gap: 12px;
}

.faq-q-prefix {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  letter-spacing: 0.06em;
  flex-shrink: 0;
  opacity: 0.7;
}

.faq-q-text {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: var(--fg);
  line-height: 1.4;
}

.faq-icon {
  color: var(--muted);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.faq-item--open .faq-icon {
  color: var(--fg);
}

.faq-answer-wrap {
  /* JS 钩子控制此层的 height/overflow，纯粹做高度动画容器 */
  overflow: hidden;
}

.faq-answer {
  margin-top: 14px;
  display: flex;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
}

.faq-a-prefix {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
  opacity: 0.6;
  flex-shrink: 0;
  padding-top: 2px;
}

.faq-a-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.75;
  color: var(--fg-secondary);
}
</style>
