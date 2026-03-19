/**
 * i18n 兼容层
 * 代理到 @nuxtjs/i18n 供全局组件兼容使用
 */
import { computed } from 'vue'
import type { Ref } from 'vue'
import { useI18n as useNuxtI18n } from '#imports'

export type SupportedLocale = 'zh' | 'en' | 'ar' | 'de' | 'es' | 'fr' | 'ja' | 'ko' | 'pt'

export const LANGS = [
  { code: 'ZH', label: '中文', flag: '🇨🇳', value: 'zh' as SupportedLocale },
  { code: 'EN', label: 'English', flag: '🇺🇸', value: 'en' as SupportedLocale },
  { code: 'AR', label: 'العربية', flag: '🇸🇦', value: 'ar' as SupportedLocale },
  { code: 'DE', label: 'Deutsch', flag: '🇩🇪', value: 'de' as SupportedLocale },
  { code: 'ES', label: 'Español', flag: '🇪🇸', value: 'es' as SupportedLocale },
  { code: 'FR', label: 'Français', flag: '🇫🇷', value: 'fr' as SupportedLocale },
  { code: 'JA', label: '日本語', flag: '🇯🇵', value: 'ja' as SupportedLocale },
  { code: 'KO', label: '한국어', flag: '🇰🇷', value: 'ko' as SupportedLocale },
  { code: 'PT', label: 'Português', flag: '🇧🇷', value: 'pt' as SupportedLocale },
] as const

// 兼容原有的按需加载接口，已由 Nuxt i18n 统一接管路由加载
// 支持传入 string 或 Ref<string>，内部自动解包
export async function loadModule(locale: string | Ref<string>, mod: string): Promise<void> {
  return Promise.resolve()
}

export async function setLocale(locale: SupportedLocale): Promise<void> {
  if (import.meta.client) {
    localStorage.setItem('skillmk-locale', locale)
  }
}

export function provideI18n() {
  return useNuxtI18n()
}

export function useI18n() {
  const i18n = useNuxtI18n()
  // 用 computed 包裹，使 locale 为 ComputedRef<string>，
  // 外部 watch(i18n.locale, ...) 和 i18n.locale.value 均可正常工作
  const locale = computed(() => i18n.locale.value)
  return {
    locale,
    setLocale: i18n.setLocale,
    t: (key: string, fallback?: string) => {
      // Nuxt i18n t()
      const val = i18n.t(key)
      return val === key && fallback ? fallback : val
    }
  }
}

export function translate(key: string, fallback = key): string {
  // 全局非 hook 的 translate 比较棘手，如果在组件外调用可能报错。
  // 在 Nuxt3 中推荐统一在 Vue Context 内使用 useI18n().t()
  return fallback
}

