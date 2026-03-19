<script setup lang="ts">
import { onMounted } from 'vue'
import { useTheme } from '~/composables/useTheme'

const { isDark, toggle } = useTheme()

// Hydration 完成后，从 DOM 实际 data-theme 同步状态
// 这样可以避免 SSR 期间 isDark=false 与客户端实际主题不匹配
onMounted(() => {
  const currentTheme = document.documentElement.getAttribute('data-theme')
  isDark.value = currentTheme === 'dark'
})
</script>

<template>
  <button
    class="theme-toggle"
    :class="{ 'theme-toggle--dark': isDark }"
    :title="isDark ? '切换到日间模式' : '切换到夜间模式'"
    aria-label="切换主题"
    @click="toggle"
  >
    <!-- 太阳图标：夜间模式时显示（可切回白天） -->
    <span class="theme-icon theme-icon--sun">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    </span>
    <!-- 月亮图标：白天模式时显示（可切到夜间） -->
    <span class="theme-icon theme-icon--moon">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    </span>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--fg-secondary);
  cursor: pointer;
  transition: border-color 180ms ease, background 180ms ease, color 180ms ease, transform 180ms ease;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

.theme-toggle:hover {
  border-color: var(--border-strong);
  background: var(--bg-elevated);
  color: var(--fg);
}

.theme-toggle:active {
  transform: scale(0.95);
}

/* 图标切换动画：精确居中避免 hover 偏移 */
.theme-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 50%;
  left: 50%;
  transition: opacity 250ms ease, transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 白天模式：显示月亮，隐藏太阳 */
.theme-icon--moon {
  opacity: 1;
  transform: translate(-50%, -50%) rotate(0deg) scale(1);
}
.theme-icon--sun {
  opacity: 0;
  transform: translate(-50%, -50%) rotate(-90deg) scale(0.5);
}

/* 夜间模式：显示太阳，隐藏月亮 */
.theme-toggle--dark .theme-icon--moon {
  opacity: 0;
  transform: translate(-50%, -50%) rotate(90deg) scale(0.5);
}
.theme-toggle--dark .theme-icon--sun {
  opacity: 1;
  transform: translate(-50%, -50%) rotate(0deg) scale(1);
}
</style>
