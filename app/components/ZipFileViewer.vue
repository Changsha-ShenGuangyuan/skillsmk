<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { marked } from '~/composables/useMarkdownRenderer'

const props = defineProps<{
  /** 文件名（用于顶部标题栏显示） */
  fileName: string
  /** 原始文件文本内容 */
  rawText: string | null
  /** 是否显示弹窗 */
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
}>()

const renderedHtml = ref('')
const isLoading = ref(false)

// 每次 rawText / modelValue 变化时重新渲染
watch(
  () => [props.rawText, props.modelValue],
  async ([text, visible]) => {
    if (!visible || text == null) return
    isLoading.value = true
    try {
      renderedHtml.value = await marked(text as string)
    } finally {
      isLoading.value = false
    }
  },
  { immediate: true }
)

function close() {
  emit('update:modelValue', false)
}

// 弹窗开启时锁住页面滚动，关闭时恢复
watch(
  () => props.modelValue,
  (visible) => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = visible ? 'hidden' : ''
  }
)

// 组件卸载时确保清理（避免页面永远锁死）
onUnmounted(() => {
  if (typeof document !== 'undefined') document.body.style.overflow = ''
})

// 点击遮罩关闭
function onBackdropClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('zfv-backdrop')) close()
}

// 根据文件名得到类型标签兼展示名称
function getFileType(name: string): { type: 'md' | 'code' | 'text', label: string } {
  const lower = name.toLowerCase()
  if (lower.endsWith('.md')) return { type: 'md', label: 'Markdown' }
  if (lower.endsWith('.txt')) return { type: 'text', label: 'Text' }
  if (lower.endsWith('.json')) return { type: 'code', label: 'JSON' }
  if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return { type: 'code', label: 'TypeScript' }
  if (lower.endsWith('.js') || lower.endsWith('.jsx')) return { type: 'code', label: 'JavaScript' }
  if (lower.endsWith('.vue')) return { type: 'code', label: 'Vue' }
  if (lower.endsWith('.yaml') || lower.endsWith('.yml')) return { type: 'code', label: 'YAML' }
  if (lower.endsWith('.sh')) return { type: 'code', label: 'Shell' }
  if (lower.endsWith('.py')) return { type: 'code', label: 'Python' }
  if (lower.endsWith('.css')) return { type: 'code', label: 'CSS' }
  if (lower.endsWith('.html')) return { type: 'code', label: 'HTML' }
  if (lower.endsWith('.toml')) return { type: 'code', label: 'TOML' }
  return { type: 'text', label: 'Text' }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="zfv-fade">
      <div
        v-if="modelValue"
        class="zfv-backdrop"
        @click="onBackdropClick"
      >
        <div class="zfv-dialog">
          <!-- 顶部标题栏 -->
          <div class="zfv-header">
            <div class="zfv-header-left">
              <!-- 仿 macOS dots -->
              <div class="zfv-dots">
                <span class="zfv-dot zfv-dot--red"/>
                <span class="zfv-dot zfv-dot--yellow"/>
                <span class="zfv-dot zfv-dot--green"/>
              </div>
              <!-- 文件名 + 类型徽标 -->
              <span class="zfv-filename">{{ fileName }}</span>
              <span class="zfv-badge" :class="`zfv-badge--${getFileType(fileName).type}`">
                {{ getFileType(fileName).label }}
              </span>
            </div>
            <button class="zfv-close" @click="close" title="关闭">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <!-- 内容区 -->
          <div class="zfv-body" :class="{ 'zfv-body--code': getFileType(fileName).type !== 'md' }">
            <div v-if="isLoading" class="zfv-loading">
              <svg class="zfv-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              加载中...
            </div>
            <!-- Markdown 渲染 -->
            <div
              v-else-if="getFileType(fileName).type === 'md'"
              class="skill-detail-field-content zfv-md-content"
              v-html="renderedHtml"
            />
            <!-- 代码文件（JSON / TS / JS 等）-->
            <pre
              v-else-if="getFileType(fileName).type === 'code'"
              class="zfv-code-content"
            ><code>{{ rawText }}</code></pre>
            <!-- 纯文本 -->
            <pre
              v-else
              class="zfv-plain-content"
            >{{ rawText }}</pre>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── 遮罩 ── */
.zfv-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

/* ── 弹窗主体 ── */
.zfv-dialog {
  width: 100%;
  max-width: 860px;
  max-height: 85vh;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── 标题栏 ── */
.zfv-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  gap: 12px;
  flex-shrink: 0;
}

.zfv-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.zfv-dots {
  display: flex;
  gap: 5px;
  flex-shrink: 0;
}

.zfv-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.zfv-dot--red    { background: #ef4444; }
.zfv-dot--yellow { background: #f59e0b; }
.zfv-dot--green  { background: #10b981; }

.zfv-filename {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--fg-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.zfv-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 999px;
  border: 1px solid;
  letter-spacing: 0.06em;
  flex-shrink: 0;
}

.zfv-badge--md {
  color: #6366f1;
  border-color: #6366f140;
  background: #6366f115;
}

.zfv-badge--txt {
  color: var(--muted);
  border-color: var(--border);
  background: var(--bg-elevated);
}

.zfv-badge--code {
  color: #10b981;
  border-color: #10b98140;
  background: #10b98115;
}

.zfv-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid transparent;
  color: var(--muted);
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.zfv-close:hover {
  border-color: var(--border);
  background: var(--bg-elevated);
  color: var(--fg);
}

/* ── 内容区 ── */
.zfv-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}

/* 代码/文本文件时：body 自身不滚动，由内部代码块接管 */
.zfv-body--code {
  overflow: hidden;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.zfv-md-content {
  /* 复用 skill detail 中 markdown 内容区的样式 */
  font-size: 14px;
  line-height: 1.75;
}

.zfv-plain-content {
  flex: 1;              /* 与 .zfv-code-content 一致，撑满剩余高度 */
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.7;
  color: var(--fg-secondary);
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
  padding: 16px 20px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  scrollbar-width: thin; /* 宽度由这里设定，颜色由非 scoped 块统一管理 */
}

/* 代码文件（JSON / TS / JS 等）— 独立的双向滚动容器 */
.zfv-code-content {
  flex: 1;              /* 撑满 .zfv-body--code 的剩余高度 */
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.65;
  color: var(--fg-secondary);
  background: var(--bg-secondary);
  border-top: 1px solid var(--border); /* 仅顶部分隔线，与 header 呼应 */
  padding: 16px 20px;
  overflow: auto;
  white-space: pre;
  margin: 0;
  scrollbar-width: thin; /* 宽度由这里设定，颜色由非 scoped 块统一管理 */
}

.zfv-code-content code {
  font-family: inherit;
  font-size: inherit;
  color: inherit;
  background: none;
  padding: 0;
}


/* ── 加载中 ── */
.zfv-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 0;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 13px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.zfv-spin {
  animation: spin 1s linear infinite;
}

/* ── 弹出动画 ── */
.zfv-fade-enter-active,
.zfv-fade-leave-active {
  transition: opacity 0.2s ease;
}

.zfv-fade-enter-active .zfv-dialog,
.zfv-fade-leave-active .zfv-dialog {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.zfv-fade-enter-from,
.zfv-fade-leave-to {
  opacity: 0;
}

.zfv-fade-enter-from .zfv-dialog,
.zfv-fade-leave-to .zfv-dialog {
  transform: translateY(12px) scale(0.97);
  opacity: 0;
}

/* ── 响应式 ── */
@media (max-width: 640px) {
  .zfv-backdrop { padding: 0; }
  .zfv-dialog {
    max-width: 100%;
    max-height: 100dvh;
    border-radius: 0;
  }
}
</style>

<!-- WebKit 滚动条独立全局 style——避开 Vue scoped 导致 ::-webkit-scrollbar 不生效 -->
<style>
/* ── 尺寸（WebKit）── */
.zfv-plain-content::-webkit-scrollbar,
.zfv-code-content::-webkit-scrollbar,
.zfv-body::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

/* ── 日间：黑色系 ── */
.zfv-plain-content::-webkit-scrollbar-track,
.zfv-code-content::-webkit-scrollbar-track,
.zfv-body::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.08);
  border-radius: 999px;
}

.zfv-plain-content::-webkit-scrollbar-thumb,
.zfv-code-content::-webkit-scrollbar-thumb,
.zfv-body::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.38);
  border-radius: 999px;
}

.zfv-plain-content::-webkit-scrollbar-thumb:hover,
.zfv-code-content::-webkit-scrollbar-thumb:hover,
.zfv-body::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.55);
}

/* Firefox 日间（标准属性，Chrome 121+ 同样生效） */
.zfv-plain-content,
.zfv-code-content,
.zfv-body {
  scrollbar-color: rgba(0, 0, 0, 0.38) rgba(0, 0, 0, 0.08);
}

/* ── 夜间：白色系 ── */
[data-theme="dark"] .zfv-plain-content::-webkit-scrollbar-track,
[data-theme="dark"] .zfv-code-content::-webkit-scrollbar-track,
[data-theme="dark"] .zfv-body::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.06);
}

[data-theme="dark"] .zfv-plain-content::-webkit-scrollbar-thumb,
[data-theme="dark"] .zfv-code-content::-webkit-scrollbar-thumb,
[data-theme="dark"] .zfv-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.35);
}

[data-theme="dark"] .zfv-plain-content::-webkit-scrollbar-thumb:hover,
[data-theme="dark"] .zfv-code-content::-webkit-scrollbar-thumb:hover,
[data-theme="dark"] .zfv-body::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.55);
}

/* Firefox 夜间（specificity 高于上面的日间规则，确保覆盖） */
[data-theme="dark"] .zfv-plain-content,
[data-theme="dark"] .zfv-code-content,
[data-theme="dark"] .zfv-body {
  scrollbar-color: rgba(255, 255, 255, 0.35) rgba(255, 255, 255, 0.06);
}
</style>
