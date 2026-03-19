<script setup lang="ts">

interface Category {
  id: string
  name: string
  items: Array<{
    id: string
    name: string
    description?: string
  }>
}

const props = defineProps({
  category: {
    type: Object as () => Category,
    required: true
  },
  active: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <div class="category-item" :class="{ 'category-item--active': active }">
    {{ category.name }}
  </div>
</template>

<style scoped>
.category-item {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 6px 16px;
  transition: all 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  color: var(--fg-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  white-space: nowrap;
  letter-spacing: 0.01em;
}

.category-item:hover {
  border-color: var(--border-strong);
  color: var(--fg);
  background: var(--bg-elevated);
  transform: translateY(-1px);
}

.category-item--active {
  background: var(--accent);
  color: var(--bg);
  border-color: var(--accent);
  font-weight: 600;
}

.category-item--active:hover {
  background: var(--fg-secondary);
  border-color: var(--fg-secondary);
}

@media (max-width: 768px) {
  .category-item {
    padding: 5px 12px;
    font-size: 12px;
  }
}
</style>