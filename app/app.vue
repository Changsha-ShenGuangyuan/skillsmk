<script setup lang="ts">
import { provideI18n } from './i18n'
import { useCategoryStore } from '~/composables/useCategoryStore'

// 在根组件提供全局 i18n 上下文
const i18n = provideI18n()
const t    = i18n.t

// 初始化全局分类 Store（确保页面加载时即触发第一次请求）
const catStore = useCategoryStore()

/** i18n locale code → BCP-47 HTML lang 属性值映射 */
const LOCALE_TO_LANG: Record<string, string> = {
  zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR',
  de: 'de-DE', fr: 'fr-FR', es: 'es-ES',
  ar: 'ar-SA', pt: 'pt-BR', en: 'en-US',
}

// SSR + 客户端均生效：动态更新 html[lang]
useHead({
  htmlAttrs: {
    // 响应式 getter：SSR 阶段根据当前语言注入，客户端语言切换时自动更新
    lang: () => LOCALE_TO_LANG[i18n.locale.value] ?? i18n.locale.value,
  },
})

// 全局 keywords meta：随 i18n 语言切换动态更新
useSeoMeta({
  keywords: () => t('site.keywords', 'Agent skills, claude agent skills, claude skills, skill, ai skills, github skills, openclaw skills'),
})

// 客户端：监听语言切换，重新加载分类数据
if (import.meta.client) {
  watch(i18n.locale, async (lang) => {
    await catStore.ensureLoaded(lang)
  })

  // 应用启动时加载分类（携带初始语言）
  onMounted(async () => {
    await catStore.ensureLoaded(i18n.locale.value)
  })
}
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
