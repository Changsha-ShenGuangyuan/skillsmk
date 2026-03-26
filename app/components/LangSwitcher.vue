<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { LANGS, useI18n } from '~/i18n'

const { locale, setLocale } = useI18n()

const selected = ref(LANGS.find(l => l.value === locale.value) ?? LANGS[0]!)
const open = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

// 切换语言：切换后恢复滚动位置
async function select(lang: typeof LANGS[number]) {
  if (selected.value.value === lang.value) {
    open.value = false
    return
  }
  // 记录切换前的滚动位置，切换后恢复（避免路由变化触发 scrollBehavior 置顶）
  const savedScrollY = window.scrollY
  await setLocale(lang.value)
  selected.value = lang
  open.value = false
  // 路由完成渲染后恢复滚动位置
  await nextTick()
  requestAnimationFrame(() => {
    window.scrollTo({ top: savedScrollY, behavior: 'instant' })
  })
}

function toggleDropdown() {
  open.value = !open.value
}

function handleClickOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<template>
  <div class="lang-switcher" ref="dropdownRef">
    <!-- 触发按钮 -->
    <button
      class="lang-trigger"
      :class="{ 'lang-trigger--open': open }"
      @click="toggleDropdown"
      aria-label="选择语言"
      aria-haspopup="listbox"
      :aria-expanded="open"
    >
      <!-- 地球图标 -->
      <svg class="lang-trigger-globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
      <!-- 语言标志和代码：只在客户端渲染，避免 SSR hydration mismatch -->
      <ClientOnly>
        <span class="lang-trigger-flag">{{ selected.flag }}</span>
        <span class="lang-trigger-code">{{ selected.code }}</span>
        <template #fallback>
          <span class="lang-trigger-code">{{ LANGS[1]!.code }}</span>
        </template>
      </ClientOnly>
      <!-- 折叠箭头 -->
      <svg class="lang-trigger-chevron" :class="{ 'is-open': open }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>


    <!-- 下拉菜单 -->
    <Transition name="ls-dropdown">
      <div v-if="open" class="lang-dropdown">
        <!-- 顶部扫描线 -->
        <div class="lang-dropdown-scanline" />
        <ul class="lang-list" role="listbox" aria-label="语言选择">
          <li
            v-for="lang in LANGS"
            :key="lang.value"
            class="lang-item"
            :class="{ 'lang-item--active': selected.value === lang.value }"
            role="option"
            :aria-selected="selected.value === lang.value"
            :tabindex="0"
            @click="select(lang)"
            @keydown.enter="select(lang)"
            @keydown.space.prevent="select(lang)"
          >
            <span class="lang-item-flag">{{ lang.flag }}</span>
            <span class="lang-item-label">{{ lang.label }}</span>
            <span class="lang-item-code">{{ lang.code }}</span>
            <!-- 选中对勾 -->
            <svg v-if="selected.value === lang.value" class="lang-item-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ── 容器 ── */
.lang-switcher {
  position: relative;
}

/* ── 触发按钮 ── */
.lang-trigger {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px 6px 8px;
  border-radius: 9px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.03);
  color: var(--fg-secondary);
  font-size: 11.5px;
  font-weight: 700;
  font-family: var(--font-mono);
  cursor: pointer;
  letter-spacing: 0.07em;
  line-height: 1;
  transition: border-color 180ms ease, background 180ms ease, color 180ms ease, box-shadow 180ms ease;
  white-space: nowrap;
}

.lang-trigger:hover,
.lang-trigger--open {
  border-color: var(--border-strong);
  background: var(--bg-elevated);
  color: var(--fg);
}

.lang-trigger-globe {
  width: 13px;
  height: 13px;
  stroke-width: 1.7;
  flex-shrink: 0;
  opacity: 0.55;
  transition: opacity 180ms;
}
.lang-trigger:hover .lang-trigger-globe,
.lang-trigger--open .lang-trigger-globe {
  opacity: 1;
}

.lang-trigger-flag {
  font-size: 13px;
  line-height: 1;
  flex-shrink: 0;
}

.lang-trigger-code {
  font-family: var(--font-mono);
}

.lang-trigger-chevron {
  width: 11px;
  height: 11px;
  flex-shrink: 0;
  opacity: 0.6;
  transition: transform 220ms cubic-bezier(0.4, 0, 0.2, 1), opacity 180ms;
}
.lang-trigger-chevron.is-open {
  transform: rotate(180deg);
  opacity: 1;
}

/* ── 下拉面板 ── */
.lang-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 160px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow-float);
  overflow: hidden;
  z-index: 1100;
}

/* 顶部装饰线改为系统边框色 */
.lang-dropdown-scanline {
  height: 1px;
  background: var(--border);
}

/* ── 语言列表 ── */
.lang-list {
  list-style: none;
  margin: 0;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.lang-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 140ms ease, color 140ms ease;
  font-size: 13px;
  color: var(--fg-secondary);
  border: 1px solid transparent;
}

.lang-item:hover {
  background: var(--bg-elevated);
  color: var(--fg);
}

.lang-item--active {
  background: var(--bg-elevated);
  border-color: var(--border-strong);
  color: var(--fg);
  font-weight: 600;
}

.lang-item-flag {
  font-size: 16px;
  line-height: 1;
  flex-shrink: 0;
}

.lang-item-label {
  flex: 1;
  font-weight: 500;
  font-family: var(--font-sans);
  font-size: 13px;
}

.lang-item-code {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--muted);
  opacity: 0.7;
}
.lang-item--active .lang-item-code { opacity: 1; color: var(--fg-secondary); }

.lang-item-check {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
  color: var(--accent);
  stroke-width: 2.5;
}

/* ── 下拉动画 ── */
.ls-dropdown-enter-active,
.ls-dropdown-leave-active {
  transition: opacity 160ms ease, transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.ls-dropdown-enter-from,
.ls-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}
</style>
