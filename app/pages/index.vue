<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useI18n, loadModule } from '~/i18n'

const i18n = useI18n()
const t    = i18n.t
const { public: { siteUrl } } = useRuntimeConfig()

// 加载 common 模块（含 SEO meta 翻译）
onMounted(async () => {
  await loadModule(i18n.locale, 'common')
})
watch(i18n.locale, async (lang) => {
  await loadModule(lang, 'common')
})

// SEO：首页 meta 信息（跟随语言动态更新）
useSeoMeta({
  title:              () => t('site.title',       'SKILLSMK | Agent Skills Marketplace'),
  ogTitle:            () => t('site.title',       'SKILLSMK | Agent Skills Marketplace'),
  description:        () => t('site.description', 'Discover and share open-source Agent Skills components from GitHub.'),
  ogDescription:      () => t('site.ogDescription', 'Browse, discover, and copy the best Agent Skills.'),
  ogUrl:              `${siteUrl}/`,
  ogImage:            `${siteUrl}/og-image.png`,
  ogType:             'website',
  ogSiteName:         'SKILLSMK',
  twitterCard:        'summary_large_image',
  twitterTitle:       () => t('site.title',       'SKILLSMK | Agent Skills Marketplace'),
  twitterDescription: () => t('site.ogDescription', 'Browse, discover, and copy the best Agent Skills.'),
})
useHead({
  link: [
    { rel: 'canonical',  href: `${siteUrl}/` },
    { rel: 'alternate', hreflang: 'en',        href: `${siteUrl}/` },
    { rel: 'alternate', hreflang: 'zh',        href: `${siteUrl}/zh/` },
    { rel: 'alternate', hreflang: 'ja',        href: `${siteUrl}/ja/` },
    { rel: 'alternate', hreflang: 'ko',        href: `${siteUrl}/ko/` },
    { rel: 'alternate', hreflang: 'de',        href: `${siteUrl}/de/` },
    { rel: 'alternate', hreflang: 'fr',        href: `${siteUrl}/fr/` },
    { rel: 'alternate', hreflang: 'es',        href: `${siteUrl}/es/` },
    { rel: 'alternate', hreflang: 'ar',        href: `${siteUrl}/ar/` },
    { rel: 'alternate', hreflang: 'pt',        href: `${siteUrl}/pt/` },
    { rel: 'alternate', hreflang: 'x-default', href: `${siteUrl}/` },
  ],
})
</script>

<template>
  <div class="main-content">
    <SearchSection />
    <CategoryOverview />
    <!-- skills-top 已改为 useAsyncData 服务端渲染，移除 ClientOnly -->
    <PopularSkills />
    <StarChart />
    <HowItWorks />
    <FaqSection />
  </div>
</template>

<style scoped>
.main-content {
  position: relative;
  z-index: 1;
}

/* 缩小各组件之间的纵向间距（约 30%）*/
.main-content :deep(.search-section)  { padding-top: 52px;  padding-bottom: 64px; }
.main-content :deep(.cat-overview)    { padding-top: 36px;  padding-bottom: 48px; }
.main-content :deep(.popular-skills)  { padding-top: 36px;  padding-bottom: 48px; }
.main-content :deep(.star-chart)      { padding-top: 48px;  padding-bottom: 64px; }
.main-content :deep(.how-it-works)    { padding-top: 48px;  padding-bottom: 64px; }
.main-content :deep(.faq-section)     { padding-top: 48px;  padding-bottom: 64px; }
</style>