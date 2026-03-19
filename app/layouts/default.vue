<script setup lang="ts">
// Nuxt 自动导入 SiteHeader / SiteFooter 组件，无需手动 import
</script>

<template>
  <div class="page">
    <SiteHeader />
    <slot />
    <SiteFooter />
  </div>
</template>

<style scoped>
.page {
  position: relative;
  min-height: 100vh;
  color: var(--fg);
  background-color: var(--bg);
  overflow: visible;
  padding-top: 60px;
}
</style>
