import { ref } from 'vue'

// 全局单例：跨组件共享同一响应式状态
const isDark = ref(false)

function applyTheme(dark: boolean) {
  // SSR 安全
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
}

export function useTheme() {
  function toggle() {
    isDark.value = !isDark.value
    if (typeof window !== 'undefined') {
      localStorage.setItem('skillsmk-theme', isDark.value ? 'dark' : 'light')
      applyTheme(isDark.value)
    }
  }

  return { isDark, toggle }
}
