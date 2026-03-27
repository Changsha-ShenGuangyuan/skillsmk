<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from '~/i18n'
import { useCategoryStore } from '~/composables/useCategoryStore'
// Composables
import { useSkillShare }    from '~/composables/useSkillShare'
import { useSkillDownload } from '~/composables/useSkillDownload'
import { useZipTree }       from '~/composables/useZipTree'
// marked 改为动态导入版：highlight.js+marked 只在本页实际需要时才加载
import { marked } from '~/composables/useMarkdownRenderer'
import { fetchSkillDetail, fetchSkillDetailByKey, fetchSkillDetailAuto } from '~/composables/useSkillsApi'
import type { ApiSkillDetail } from '~/composables/useSkillsApi'
import { useSkillPreview } from '~/composables/useSkillPreview'

const i18n = useI18n()
const t    = i18n.t
const catStore = useCategoryStore()
const { public: { siteUrl } } = useRuntimeConfig()

// ── 点击卡片传入的基础预览数据（可立即渲染，无需等待 API）──────────
const { preview, clearPreview } = useSkillPreview()

// 语言切换时重新拉取分类翻译
watch(i18n.locale, async (lang) => {
  await catStore.ensureLoaded(lang)
})

// ── 路由 ──────────────────────────────────────────────────────
const route  = useRoute()
const router = useRouter()

// ── Markdown 解析（SSR 兼容）─────────────────────────────────
interface ParsedMd {
  metadata: Record<string, string>
  markdownContent: string
  rawMarkdown: string
}

async function parseMarkdown(mdText: string): Promise<ParsedMd> {
  if (!mdText) return { metadata: {}, markdownContent: '<p>暂时没有详细说明。</p>', rawMarkdown: '' }

  const match = mdText.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (match?.[1]) {
    const parsedMeta: Record<string, string> = {}
    // 支持 YAML 块标量（| 保留换行 / > 折叠为空格）
    const fmLines = match[1].split('\n')
    let blockKey: string | null = null
    let blockStyle: '|' | '>' | null = null
    let blockLines: string[] = []
    const flushBlock = () => {
      if (!blockKey) return
      const joined = blockStyle === '>'
        ? blockLines.join(' ').replace(/\s+/g, ' ').trim()
        : blockLines.join('\n').trim()
      if (joined) parsedMeta[blockKey] = joined
      blockKey = null; blockStyle = null; blockLines = []
    }
    for (const fmLine of fmLines) {
      if (/^\S/.test(fmLine)) {
        flushBlock()
        const idx = fmLine.indexOf(':')
        if (idx === -1) continue
        const key = fmLine.slice(0, idx).trim()
        const raw = fmLine.slice(idx + 1).trim()
        if (!key) continue
        if (raw === '|' || raw === '>') {
          blockKey = key; blockStyle = raw as '|' | '>'; blockLines = []
        } else {
          const val = raw.replace(/^["']|["']$/g, '').trim()
          if (val) parsedMeta[key] = val
        }
      } else if (blockKey) {
        blockLines.push(fmLine.trim())
      }
    }
    flushBlock()
    const markdownContent = await marked(mdText.replace(match[0], '').trim())
    return { metadata: parsedMeta, markdownContent, rawMarkdown: mdText }
  } else {
    const markdownContent = await marked(mdText)
    return { metadata: {}, markdownContent, rawMarkdown: mdText }
  }
}

// ── 数据获取（lazy: true，页面立即渲染，不阻塞等待 API）────────────
const { data: ssrData, status, refresh: _refreshSsrData } = await useAsyncData(
  () => `skill-${route.params.id}`,
  async () => {
    try {
      const res = await fetchSkillDetailAuto(route.params.id as string)
      if (res.code !== 0 || !res.data) return { error: true, detail: null, metadata: {}, markdownContent: '', rawMarkdown: '' }
      const parsed = await parseMarkdown(res.data.skill_md_content || '')
      return { error: false, detail: res.data, ...parsed }
    } catch (e: any) {
      console.warn('[SkillDetail] useAsyncData 获取失败', e)
      return { error: true, detail: null, metadata: {}, markdownContent: '', rawMarkdown: '' }
    }
  },
  { watch: [() => route.params.id] }  // SSR 渲染：配合 routeRules SWR 缓存，首屏直接输出完整 HTML
)

// ── 从 ssrData 派生响应式数据（computed）─────────────────────
const skill           = computed<ApiSkillDetail | null>(() => ssrData.value?.detail ?? null)
const metadata        = computed<Record<string, string>>(() => ssrData.value?.metadata ?? {})
const rawMarkdown     = computed<string>(() => ssrData.value?.rawMarkdown ?? '')
const markdownContent = computed<string>(() => {
  if (status.value === 'pending') return ''
  return ssrData.value?.markdownContent ?? '<p>技能不存在或已下架。</p>'
})
const isLoadingMd = computed<boolean>(() => status.value === 'pending' || status.value === 'idle')
// 实际 API 失败（请求完成但返回了 error: true）
const fetchError  = computed<boolean>(() => !isLoadingMd.value && !!ssrData.value?.error && !skill.value)

// 重试加载详情数据
function retryLoad() {
  _refreshSsrData()
}


// API 加载完成后，清空预览缓存（避免切换到其他详情页时显示旧数据）
watch(skill, (val) => {
  if (val) clearPreview()
})

// ── 预览数据优先：API 未返回时用卡片数据立即渲染 ─────────────────
// 标题：API 有数据用 API，否则用预览
const displayName = computed(() => skill.value?.name ?? preview.value?.name ?? '')
// 描述：优先 API，其次预览
const displayDescription = computed(() => skill.value?.description ?? preview.value?.description ?? '')
// 作者：优先 API owner 字段，其次预览 author
const displayAuthor = computed(() => skill.value?.owner ?? preview.value?.author ?? '')
// Stars：优先 API，其次预览
const displayStars = computed(() => {
  const s = skill.value?.repo_stars ?? preview.value?.stars ?? 0
  return s >= 1000 ? (s / 1000).toFixed(1) + 'k' : s.toString()
})
// 分类 ID：优先 API，其次预览
const displayCategoryId = computed(() => skill.value?.category_id ?? preview.value?.categoryId ?? null)
// 是否处于「有预览但 API 还未返回」状态
const isPreviewMode = computed(() => isLoadingMd.value && !!preview.value)

// ── 其他 UI 状态 ref ──────────────────────────────────────────
const isCopying          = ref(false)
const isCopiedInstall    = ref(false)
const selectedPkgManager = ref<'npx' | 'bunx' | 'pnpm'>('npx')

// ── GitHub 相关 URL ──
// githubLinkUrl：用户点击跳转的按钮链接
// 使用 HEAD ref（GitHub 自动重定向到默认分支），有 skill_path 则直接定位到技能目录
const githubLinkUrl = computed(() => {
  if (!skill.value?.repo_full_name) return ''
  const s = skill.value
  const hasPath = typeof s.skill_path === 'string' && s.skill_path.trim() && s.skill_path !== 'undefined'
  if (hasPath) {
    return `https://github.com/${s.repo_full_name}/tree/HEAD/${s.skill_path.trim()}`
  }
  return `https://github.com/${s.repo_full_name}`
})

// githubFetchUrl：传给 composable 用于拉取文件树和下载 ZIP
// 'auto' 作为占位符，composable 检测到后会查询 GitHub API 获取真实 default_branch
const githubUrl = computed(() => {
  if (!skill.value) return ''
  const s = skill.value
  let pathStr = ''
  if (typeof s.skill_path === 'string' && s.skill_path.trim() && s.skill_path !== 'undefined') {
    pathStr = `/${s.skill_path.trim()}`
  }
  return `https://github.com/${s.repo_full_name}/tree/auto${pathStr}`
})

// ── Composables ──────────────────────────────────────────────
const skillName = computed(() => skill.value?.name)

// 分享菜单容器的模板 ref，由组件声明并传入 useSkillShare
// 供其内部 handleClickOutside 使用，以检测点击外部区域来关闭菜单
const shareMenuRef = ref<HTMLElement | null>(null)

const {
  isShareMenuOpen, isCopiedLink,
  toggleShareMenu, shareToX, shareToWhatsApp, copyShareLink,
} = useSkillShare(skillName, t, shareMenuRef)

const { isDownloading, downloadPackage: _download } = useSkillDownload(t)
// 使用 GitHub 动态打包下载
function downloadPackage() {
  _download(githubUrl.value)
}

const {
  zipFiles, showZipPreview, visibleZipNodes,
  loadZipPreview, toggleFolder, readZipFile,
} = useZipTree()

// ── Zip 文件预览弹窗状态 ──────────────────────────────────────
const zipViewerVisible  = ref(false)
const zipViewerFileName = ref('')
const zipViewerRawText  = ref<string | null>(null)

// 安装方式切换：'cmd' = 命令安装，'zip' = 下载 ZIP
const installMode = ref<'cmd' | 'zip'>('cmd')

// 所有可以用文本方式读取并预览的文件扩展名
const PREVIEWABLE_EXTS = ['.md', '.txt', '.ts', '.tsx', '.js', '.jsx', '.vue', '.json', '.yaml', '.yml', '.sh', '.py', '.css', '.html', '.xml', '.toml', '.env', '.gitignore']

function isPreviewable(name: string) {
  const lower = name.toLowerCase()
  return PREVIEWABLE_EXTS.some(ext => lower.endsWith(ext))
}

async function handleZipNodeClick(node: { path: string; name: string; isDir: boolean; isOpen: boolean; children: any[]; depth: number }) {
  if (node.isDir) { toggleFolder(node); return }
  if (!isPreviewable(node.name)) return

  zipViewerFileName.value = node.name
  zipViewerRawText.value  = null
  zipViewerVisible.value  = true
  zipViewerRawText.value  = await readZipFile(node.path)
}

// loadSkillData 已移除，数据由上方 useAsyncData 统一获取

// ── 复制 Markdown / 安装命令 ──────────────────────────────────
const copyMarkdown = async () => {
  if (!rawMarkdown.value) return
  isCopying.value = true
  try { await copyToClipboard(rawMarkdown.value) } catch (e) { console.error(e) }
  setTimeout(() => (isCopying.value = false), 2000)
}

const computedInstallCmd = computed(() => {
  const s = skill.value
  if (!s?.repo_full_name) return ''
  // skills 工具需要 GitHub 仓库路径格式：owner/repo/skill_path
  // skill_key 是后端内部标识，不能直接用于 git clone
  const pkg = s.skill_path?.trim()
    ? `${s.repo_full_name}/${s.skill_path.trim()}`
    : s.repo_full_name
  const cmds = { npx: `npx skills add ${pkg}`, bunx: `bunx skills add ${pkg}`, pnpm: `pnpm dlx skills add ${pkg}` }
  return cmds[selectedPkgManager.value] ?? `npx skills add ${pkg}`
})

const copyInstallCmd = async () => {
  if (!computedInstallCmd.value) return
  isCopiedInstall.value = true
  try { await copyToClipboard(computedInstallCmd.value) } catch (e) { console.error(e) }
  setTimeout(() => (isCopiedInstall.value = false), 2000)
}

// ── 标签 / Stars ──────────────────────────────────────────────
const displayTags = computed(() => {
  const tags: Array<{ id: number; name: string; color: { bg: string; text: string } }> = []
  const catId = skill.value?.category_id
  if (catId != null) {
    // getCategoryName 在 catStore 未加载时返回空字符串，用 slug 或 ID 字符串兜底
    const cat   = catStore.getCategoryById(catId)
    const name  = catStore.getCategoryName(catId, i18n.locale.value) || cat?.slug || String(catId)
    const color = catStore.getColorByCategoryId(catId)
    tags.push({ id: catId, name, color })
  }
  return tags
})

const formattedStars = computed(() => {
  const s = skill.value?.repo_stars || 0
  return s >= 1000 ? (s / 1000).toFixed(1) + 'k' : s.toString()
})

const formattedForks = computed(() => {
  const f = skill.value?.repo_forks || 0
  return f >= 1000 ? (f / 1000).toFixed(1) + 'k' : f.toString()
})

// ── 动态 SEO Meta（跟随技能数据 + 语言同步更新）─────────────────
const _metaSuffix  = () => t('meta.detail.suffix',  ' | SKILLSMK')
const _metaFallback = () => t('meta.detail.fallback', 'Discover and download high-quality Agent Skills on SKILLSMK.')
// 拼接描述：技能简介 + 作者 + Star 数，丰富 Google 搜索摘要
const _metaDesc = () => {
  const s = skill.value
  if (!s) return _metaFallback()
  const base   = s.description || _metaFallback()
  const author = s.owner      ? `${t('detail.metaBy', ' by ')}@${s.owner}` : ''
  const stars  = s.repo_stars ? ` · ⭐ ${s.repo_stars >= 1000 ? (s.repo_stars / 1000).toFixed(1) + 'k' : s.repo_stars}${t('detail.metaStars', ' stars')}` : ''
  return `${base}${author}${stars}`
}
useSeoMeta({
  title:              () => skill.value ? `${skill.value.name}${_metaSuffix()}` : 'SKILLSMK',
  ogTitle:            () => skill.value ? `${skill.value.name}${_metaSuffix()}` : 'SKILLSMK',
  description:        _metaDesc,
  ogDescription:      _metaDesc,
  ogUrl:              () => `${siteUrl}/skill/${route.params.id}`,
  ogType:             'article',
  ogSiteName:         'SKILLSMK',
  twitterCard:        'summary_large_image',
  twitterTitle:       () => skill.value ? `${skill.value.name}${_metaSuffix()}` : 'SKILLSMK',
  twitterDescription: _metaDesc,
})
// canonical + hreflang
// 技能页内容不做多语言翻译，所有语言的 hreflang 均指向同一 URL，并声明 x-default
useHead(() => {
  const skillUrl = `${siteUrl}/skill/${route.params.id}`
  const hreflangLocales = ['en', 'zh', 'ja', 'ko', 'de', 'fr', 'es', 'ar', 'pt']
  return {
    link: [
      { rel: 'canonical', href: skillUrl },
      ...hreflangLocales.map(lang => ({ rel: 'alternate', hreflang: lang, href: skillUrl })),
      { rel: 'alternate', hreflang: 'x-default', href: skillUrl },
    ],
  }
})

// JSON-LD Schema — 使用 useHead computed 直接计算，避免 watchEffect 中间 ref 竞争
// skill 为 null 时返回空 script 数组，不注入任何内容
useHead(computed(() => {
  const s = skill.value
  if (!s) return { script: [] }
  let innerHTML = ''
  try {
    innerHTML = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareSourceCode',
          '@id': `${siteUrl}/skill/${route.params.id}#skill`,
          name: s.name,
          description: s.description || '',
          url: `${siteUrl}/skill/${route.params.id}`,
          ...(s.repo_full_name ? { codeRepository: `https://github.com/${s.repo_full_name}` } : {}),
          ...(s.owner ? { author: { '@type': 'Person', name: s.owner } } : {}),
          programmingLanguage: 'Markdown',
          runtimePlatform: 'LLM Agent / AI Coding Assistant',
          isAccessibleForFree: true,
          license: 'https://opensource.org/licenses/MIT',
          inLanguage: 'en',
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'SKILLSMK', item: `${siteUrl}/` },
            { '@type': 'ListItem', position: 2, name: 'Skills', item: `${siteUrl}/search` },
            { '@type': 'ListItem', position: 3, name: s.name, item: `${siteUrl}/skill/${route.params.id}` },
          ],
        },
      ],
    })
  } catch (_e) { /* JSON 序列化异常时不注入 Schema */ }
  return innerHTML
    ? { script: [{ type: 'application/ld+json', key: 'skill-schema', innerHTML }] }
    : { script: [] }
}))


// ── ZIP 预览（纯客户端，SSR 数据就绪后触发）──────────────────
onMounted(() => {
  // SSR 已渲染出 skill 时，直接加载 ZIP 预览
  if (skill.value && githubUrl.value) {
    loadZipPreview(githubUrl.value)
  }
})

// 路由切换后 skill 变化时触发 ZIP 预览
watch(skill, (val, old) => {
  if (val && val !== old && githubUrl.value) {
    loadZipPreview(githubUrl.value)
  }
})
</script>


<template>
  <!-- skill 有数据，或有卡片预览数据时，都直接展示页面主体 -->
  <div class="skill-detail" v-if="skill || isPreviewMode">
    <!-- 文件标签头部 -->
    <div class="skill-detail-file-header">
      <div class="skill-detail-file-dots">
        <span class="skill-detail-dot skill-detail-dot--red"></span>
        <span class="skill-detail-dot skill-detail-dot--yellow"></span>
        <span class="skill-detail-dot skill-detail-dot--green"></span>
      </div>
      <div class="skill-detail-file-name">SKILL.md</div>
      <div class="skill-detail-file-status">readonly</div>
    </div>
    
    <div class="skill-detail-header">
      <h3 class="skill-detail-title">{{ displayName }}</h3>
      
      <!-- 星级和类别区域 -->
      <div class="skill-detail-meta">
        <div class="skill-detail-meta-item" v-if="displayAuthor">
          <span class="skill-detail-meta-label">{{ t('detail.author', '作者') }}：</span>
          <span class="skill-detail-meta-value">{{ displayAuthor }}</span>
        </div>
        
        <div class="skill-detail-meta-item">
          <span class="skill-detail-meta-label">{{ t('detail.category', '分类') }}：</span>
          <div v-if="displayTags.length > 0" class="skill-detail-tags">
            <div 
              v-for="(tag, index) in displayTags" 
              :key="tag.id || index"
              class="skill-detail-tag"
              :style="{
                background:  tag.color.text + '26',
                color:       tag.color.text,
                borderColor: tag.color.text + '55'
              }"
            >
              {{ tag.name }}
            </div>
          </div>
          <span v-else class="skill-detail-meta-value">{{ catStore.getCategoryName(displayCategoryId ?? 0, i18n.locale.value) }}</span>
        </div>

        <div class="skill-detail-meta-item">
          <div class="skill-detail-repo-stats">
            <!-- Stars -->
            <div class="repo-stat-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
              <span class="repo-stat-count">{{ displayStars }}</span>
            </div>
            <!-- Forks -->
            <div class="repo-stat-badge">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/>
              </svg>
              <span class="repo-stat-count">{{ formattedForks }}</span>
            </div>
          </div>
        </div>

        <div class="skill-detail-meta-item" v-if="githubLinkUrl">
          <a :href="githubLinkUrl" target="_blank" rel="noopener noreferrer" class="skill-detail-github-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            GitHub
          </a>
        </div>
        
        <div class="skill-detail-meta-item skill-detail-share-wrapper" ref="shareMenuRef">
          <button class="skill-detail-share-btn" @click="toggleShareMenu" title="分享此技能">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            {{ t('detail.share', '分享') }}
          </button>
          <Transition name="share-dropdown">
            <div v-if="isShareMenuOpen" class="skill-detail-share-menu">
              <button class="share-menu-item" @click="shareToX">
                <!-- X (Twitter) Logo -->
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                {{ t('detail.shareToX', '分享到 X') }}
              </button>
              <button class="share-menu-item" @click="shareToWhatsApp">
                <!-- WhatsApp Logo -->
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {{ t('detail.shareToWhatsApp', '分享到 WhatsApp') }}
              </button>
              <div class="share-menu-divider"></div>
              <button class="share-menu-item" @click="copyShareLink">
                <svg v-if="!isCopiedLink" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                {{ isCopiedLink ? t('detail.copiedLink', '已复制！') : t('detail.copyLink', '复制链接') }}
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>
    
    <div class="skill-detail-content">
      <div class="skill-detail-left">
        <!-- 基础信息表单 (优先显示 Markdown 中的 Frontmatter) -->
        <div class="skill-detail-form">
          <template v-if="Object.keys(metadata).length > 0">
            <div v-for="(value, key) in metadata" :key="key" class="skill-detail-field">
              <div class="skill-detail-field-label">
                {{ key }}: <span class="skill-detail-field-value">{{ value }}</span>
              </div>
            </div>
          </template>
          
          <!-- 预览模式（API 未返回）：回退到卡片基础数据 -->
          <template v-else-if="isPreviewMode">
            <div class="skill-detail-field">
              <div class="skill-detail-field-label">name: <span class="skill-detail-field-value">{{ displayName }}</span></div>
            </div>
            <div class="skill-detail-field">
              <div class="skill-detail-field-label">description: <span class="skill-detail-field-value">{{ displayDescription }}</span></div>
            </div>
          </template>

          <div class="skill-detail-field">
            <!-- 骨架屏：API 还未返回时展示动画占位块 -->
          <div v-if="isLoadingMd" class="skill-md-skeleton">
            <div class="skeleton-line skeleton-line--title"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line skeleton-line--short"></div>
            <div class="skeleton-spinner-wrap">
              <svg class="skeleton-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-opacity="0.2"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
              </svg>
              <span class="skeleton-spinner-text">{{ t('detail.skillmdLoading', '加载说明中...') }}</span>
            </div>
          </div>
          <div class="skill-detail-field-content" v-else v-html="markdownContent"></div>
          </div>
        </div>
      </div>
      
      <div class="skill-detail-right">
        <!-- 操作面板 -->
        <div class="skill-detail-actions-panel">
          <h4 class="skill-detail-actions-title">{{ t('detail.actions', '操作') }}</h4>
          
          <button class="skill-action-btn skill-action-btn--primary" @click="downloadPackage" :disabled="isDownloading">
            <template v-if="!isDownloading">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              {{ t('detail.download', '下载技能包 (.zip)') }}
            </template>
            <template v-else>
              <svg class="icon-loading" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="2" x2="12" y2="6"></line>
                <line x1="12" y1="18" x2="12" y2="22"></line>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                <line x1="2" y1="12" x2="6" y2="12"></line>
                <line x1="18" y1="12" x2="22" y2="12"></line>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                <line x1="16.24" y1="4.93" x2="19.07" y2="7.76"></line>
              </svg>
              {{ t('detail.downloading', '打包下载中...') }}
            </template>
          </button>
          
          <button class="skill-action-btn skill-action-btn--secondary" @click="copyMarkdown">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            {{ isCopying ? t('detail.copied', '已复制！') : t('detail.copy', '复制 SKILL.md 内容') }}
          </button>

          <!-- 安装命令区块 -->
          <div v-if="skill?.repo_full_name" class="skill-install-block">
            <!-- 头部：终端标题栏 -->
            <div class="skill-install-header">
              <span class="skill-install-header-prompt">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="4 17 10 11 4 5"></polyline>
                  <line x1="12" y1="19" x2="20" y2="19"></line>
                </svg>
                install --global
              </span>
              <a
                href="https://skills.sh"
                target="_blank"
                rel="noopener noreferrer"
                class="skill-install-header-link"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
                skills.sh
              </a>
            </div>

            <!-- 包管理器 Tab -->
            <div class="skill-install-tabs">
              <button
                v-for="pm in ['npx', 'bunx', 'pnpm']"
                :key="pm"
                class="skill-install-tab"
                :class="{ 'is-active': selectedPkgManager === pm }"
                @click="selectedPkgManager = pm as 'npx' | 'bunx' | 'pnpm'"
              >{{ pm }}</button>
            </div>

            <!-- 命令行 + 复制按钮 -->
            <div class="skill-install-cmd-row">
              <code class="skill-install-cmd">{{ computedInstallCmd }}</code>
              <button
                class="skill-install-copy-btn"
                :class="{ 'is-copied': isCopiedInstall }"
                @click="copyInstallCmd"
                :title="isCopiedInstall ? t('detail.copied', '已复制！') : t('detail.copyCmd', '复制命令')"
              >
                <svg v-if="!isCopiedInstall" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </button>
            </div>
          </div>

          <!-- 压缩包预览窗口 -->
          <div v-if="showZipPreview" class="skill-zip-preview">
            <h5 class="skill-zip-preview-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              {{ t('detail.zipTitle', '目录预览') }}
              <span class="skill-zip-count">{{ zipFiles.length }} {{ t('detail.zipItems', '项') }}</span>
            </h5>
            <div class="skill-zip-tree">
              <div v-for="node in visibleZipNodes" :key="node.path" 
                   class="skill-zip-item"
                   :class="{ 'skill-zip-folder': node.isDir, 'skill-zip-file-clickable': !node.isDir && isPreviewable(node.name) }"
                   :style="{ paddingLeft: `${node.depth * 16 + 8}px` }"
                   @click="handleZipNodeClick(node)">
                
                <span class="skill-zip-toggle" :class="{ 'is-open': node.isOpen, 'is-invisible': !node.isDir }">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </span>

                <span class="skill-zip-icon-type">
                  <template v-if="node.isDir && !node.isOpen">
                    <!-- Closed folder icon -->
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </template>
                  <template v-else-if="node.isDir && node.isOpen">
                    <!-- Open folder icon -->
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
                      <!-- Base folder back -->
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" opacity="0.4"></path>
                      <!-- Open flap -->
                      <path d="M2 10h18a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9z"></path>
                    </svg>
                  </template>
                  <template v-else-if="node.name.toLowerCase() === 'skill.md'">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2">
                      <rect x="3" y="5" width="18" height="14" rx="2" ry="2"></rect>
                      <polyline points="7 15 7 9 9 11 11 9 11 15"></polyline>
                      <line x1="14" y1="11" x2="14" y2="15"></line>
                      <line x1="17" y1="13" x2="14" y2="13"></line>
                    </svg>
                  </template>
                  <template v-else-if="node.name.toLowerCase().endsWith('.py')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2">
                      <polyline points="16 18 22 12 16 6"></polyline>
                      <polyline points="8 6 2 12 8 18"></polyline>
                    </svg>
                  </template>
                  <template v-else-if="node.name.toLowerCase().endsWith('.txt')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <line x1="10" y1="9" x2="8" y2="9"></line>
                    </svg>
                  </template>
                  <template v-else>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2">
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                      <polyline points="13 2 13 9 20 9"></polyline>
                    </svg>
                  </template>
                </span>
                <span class="skill-zip-name" :class="{ 'skill-zip-bold': node.name === 'SKILL.md' }">{{ node.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 使用指南面板 -->
        <div class="skill-detail-actions-panel">
          <h4 class="skill-detail-actions-title">{{ t('detail.usageGuide', '使用指南') }}</h4>

          <!-- 安装方式切换按钮 -->
          <div class="install-mode-tabs">
            <button
              class="install-mode-tab"
              :class="{ 'is-active': installMode === 'cmd' }"
              @click="installMode = 'cmd'"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="4 17 10 11 4 5"></polyline>
                <line x1="12" y1="19" x2="20" y2="19"></line>
              </svg>
              {{ t('detail.installModeCmd', '命令安装') }}
            </button>
            <button
              class="install-mode-tab"
              :class="{ 'is-active': installMode === 'zip' }"
              @click="installMode = 'zip'"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              {{ t('detail.installModeZip', '下载 ZIP') }}
            </button>
          </div>

          <!-- 命令安装指引 -->
          <ol v-if="installMode === 'cmd'" class="skill-usage-steps">
            <li>
              <strong>1. {{ t('detail.stepInstall', '运行安装命令') }}</strong>
              <p>{{ t('detail.stepInstallDesc', '复制上方的安装命令在终端中执行，以进行全局安装。') }}</p>
            </li>
            <li>
              <strong>2. {{ t('detail.stepConfig', '配置环境变量') }}</strong>
              <p>{{ t('detail.stepConfigDesc', '根据组件说明，在您的 MCP 客户端配置相应的环境密钥。') }}</p>
            </li>
            <li>
              <strong>3. {{ t('detail.stepRun', '客户端使用') }}</strong>
              <p>{{ t('detail.stepRunDesc', '在支持 MCP 的应用（如 Claude 或 Cursor ）中配置并启用该技能。') }}</p>
            </li>
          </ol>

          <!-- ZIP 下载指引 -->
          <ol v-else class="skill-usage-steps">
            <li>
              <strong>1. {{ t('detail.stepDownload', '下载 ZIP 包') }}</strong>
              <p>{{ t('detail.stepDownloadDesc', '点击右上角【下载技能包 (.zip)】按钮，将该技能的所有文件下载到本地。') }}</p>
            </li>
            <li>
              <strong>2. {{ t('detail.stepExtract', '解压并放入配置') }}</strong>
              <p>{{ t('detail.stepExtractDesc', '解压 ZIP 包，将文件放入您的 MCP 客户端配置目录中。') }}</p>
            </li>
            <li>
              <strong>3. {{ t('detail.stepConfigZip', '配置并启用') }}</strong>
              <p>{{ t('detail.stepConfigZipDesc', '按照 SKILL.md 中的说明，在支持 MCP 的应用中配置并启用该技能。') }}</p>
            </li>
          </ol>
        </div>
      </div>

    </div>
  </div>
  <!-- 加载失败提示 -->
  <div v-else-if="fetchError" class="skill-detail-error">
    <div class="skill-error-icon">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    </div>
    <p class="skill-error-title">{{ t('detail.loadError', '详情加载失败') }}</p>
    <p class="skill-error-desc">{{ t('detail.loadErrorDesc', '该技能可能不存在或已下架，请检查网络并重试。') }}</p>
    <div class="skill-error-actions">
      <button class="skill-error-retry" @click="retryLoad">{{ t('detail.retry', '重新加载') }}</button>
      <button class="skill-error-back" @click="router.back()">{{ t('detail.goBack', '返回上一页') }}</button>
    </div>
  </div>
  <!-- 加载中（status 为 pending 且无预览数据） -->
  <div v-else class="skill-detail-loading">
    <svg class="detail-loading-spinner" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10" stroke-opacity="0.2"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
    </svg>
    {{ t('detail.loading', '加载中...') }}
  </div>

  <!-- Zip 文件内容预览弹窗 -->
  <ZipFileViewer
    v-model="zipViewerVisible"
    :file-name="zipViewerFileName"
    :raw-text="zipViewerRawText"
  />
</template>

<style scoped>
/* ============================================================
   SkillDetail — 暗黑工业科技主题
============================================================ */
.skill-detail {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  max-width: 1200px;
  margin: 32px auto;
  overflow: visible;
}

/* 文件标签头部 */
.skill-detail-file-header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.skill-detail-file-dots {
  display: flex;
  align-items: center;
  gap: 6px;
}

.skill-detail-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.skill-detail-dot--red    { background-color: #ef4444; }
.skill-detail-dot--yellow { background-color: #f59e0b; }
.skill-detail-dot--green  { background-color: #10b981; }

.skill-detail-file-name {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--fg-secondary);
  flex: 1;
  letter-spacing: 0.04em;
}

.skill-detail-file-status {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--muted);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 0.06em;
}

/* ── 头部 ── */
.skill-detail-header {
  padding: 20px;
  margin-bottom: 0;
}

/* ── 加载失败错误提示 ── */
.skill-detail-error {
  background: var(--bg-card);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 16px;
  padding: 60px 40px;
  text-align: center;
  max-width: 1200px;
  margin: 40px auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.skill-error-icon {
  color: #ef4444;
  opacity: 0.7;
  margin-bottom: 4px;
}

.skill-error-title {
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 700;
  color: var(--fg);
  margin: 0;
}

.skill-error-desc {
  font-size: 14px;
  color: var(--fg-secondary);
  margin: 0;
}

.skill-error-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.skill-error-retry,
.skill-error-back {
  padding: 8px 20px;
  border-radius: 8px;
  border: 1px solid var(--border);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.skill-error-retry {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
.skill-error-retry:hover { opacity: 0.85; }

.skill-error-back {
  background: var(--bg-elevated);
  color: var(--fg-secondary);
}
.skill-error-back:hover {
  border-color: var(--border-strong);
  color: var(--fg);
}

/* ── 加载中状态 ── */
.skill-detail-loading {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 60px 40px;
  text-align: center;
  color: var(--muted);
  font-family: var(--font-mono);
  max-width: 1200px;
  margin: 40px auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
.detail-loading-spinner {
  animation: spin 1s linear infinite;
  color: var(--muted);
}

.skill-detail-title {
  font-family: var(--font-mono);
  font-size: 20px;
  font-weight: 700;
  color: var(--fg);
  margin: 0 0 16px 0;
  letter-spacing: -0.01em;
}

/* ── meta 区 ── */
.skill-detail-meta {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  padding: 14px 0;
  border-top: 1px solid var(--border);
  margin-top: 16px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 20px;
}

.skill-detail-meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.skill-detail-meta-label {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
}

.skill-detail-meta-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--fg-secondary);
}

.skill-detail-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.skill-detail-tag {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 999px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  letter-spacing: 0.03em;
}

.skill-detail-stars {
  display: flex;
  align-items: center;
  gap: 5px;
}

.skill-detail-stars .star-count {
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
}

/* GitHub badge 风格：Stars + Forks 并排 */
.skill-detail-repo-stats {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.repo-stat-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px 3px 0;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--fg-secondary);
}

.skill-detail-github-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 500;
  color: var(--accent);
  text-decoration: none;
  font-family: var(--font-mono);
  transition: opacity 0.2s;
}

.skill-detail-github-link:hover { opacity: 0.75; }

/* ── 分享按钮 ── */
.skill-detail-share-wrapper {
  position: relative;
}

.skill-detail-share-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 500;
  color: var(--fg-secondary);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  padding: 4px 10px;
  transition: all 0.2s;
}

.skill-detail-share-btn:hover {
  border-color: var(--border-strong);
  color: var(--fg);
  background: var(--bg-secondary);
}

.skill-detail-share-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 170px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
  padding: 6px;
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.share-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  font-size: 13px;
  font-weight: 500;
  color: var(--fg-secondary);
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  font-family: var(--font-sans);
}

.share-menu-item:hover {
  background: var(--bg-elevated);
  color: var(--fg);
}

.share-menu-divider {
  height: 1px;
  background: var(--border);
  margin: 4px 0;
}

.share-dropdown-enter-active,
.share-dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.share-dropdown-enter-from,
.share-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ── 内容区布局 ── */
.skill-detail-content {
  display: flex;
  gap: 24px;
  padding: 0 20px 20px;
}

.skill-detail-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.skill-detail-form {
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  min-width: 0;
}

/* ── 右侧操作面板容器 ── */
.skill-detail-right {
  width: 290px;
  flex-shrink: 0;
  /* 设置 Flex 布局以实现多个表单块（面板）堆叠间距 */
  display: flex;
  flex-direction: column;
  gap: 16px;
  /* CSS sticky：到达顶部阈值时固定，内容区底部结束时自动解除 */
  position: sticky;
  top: 88px;
  align-self: flex-start;
  /* 面板内容超出视口时可内部滚动 */
  max-height: calc(100vh - 108px);
  overflow-y: auto;
  /* 滚动条美化 */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
}

.skill-detail-right::-webkit-scrollbar {
  width: 4px;
}
.skill-detail-right::-webkit-scrollbar-track {
  background: transparent;
}
.skill-detail-right::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 2px;
}
.skill-detail-right::-webkit-scrollbar-thumb:hover {
  background: var(--muted);
}

/* ── 夜间模式滚动条覆盖 ── */
[data-theme="dark"] .skill-detail-right {
  scrollbar-color: rgba(255, 255, 255, 0.35) transparent;
}
[data-theme="dark"] .skill-detail-right::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.35);
}
[data-theme="dark"] .skill-detail-right::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.55);
}

.skill-detail-actions-panel {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skill-detail-actions-title {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin: 0 0 4px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}

/* ── 使用指南 ── */
.skill-usage-steps {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skill-usage-steps li {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skill-usage-steps strong {
  font-size: 13px;
  color: var(--fg);
  font-weight: 600;
}

.skill-usage-steps p {
  font-size: 13px;
  color: var(--muted);
  margin: 0;
  line-height: 1.6;
}

.skill-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  border: 1px solid transparent;
  font-family: var(--font-sans);
}

.skill-action-btn--primary {
  background: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
  font-family: var(--font-mono);
}

.skill-action-btn--primary:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

.skill-action-btn--secondary {
  background: var(--bg-elevated);
  border-color: var(--border);
  color: var(--fg-secondary);
}

.skill-action-btn--secondary:hover {
  border-color: var(--border-strong);
  color: var(--fg);
  background: var(--bg-secondary);
}

/* 安装方式切换按钮 */
.install-mode-tabs {
  display: flex;
  gap: 6px;
  margin: 10px 0 14px;
  flex-wrap: wrap;         /* 宽度不足时允许换行 */
}

.install-mode-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: var(--radius-sm, 6px);
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--fg-secondary);
  font-size: 12px;
  font-weight: 500;
  font-family: var(--font-mono);
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.02em;
  flex: 1 1 auto;           /* 均分父容器宽度 */
  min-width: 0;             /* 允许收缩 */
  white-space: nowrap;      /* 不换行 */
  overflow: hidden;
  text-overflow: ellipsis;  /* 仍然过长时截断 */
}

.install-mode-tab:hover {
  border-color: var(--border-strong);
  color: var(--fg);
  background: var(--bg-secondary);
}

.install-mode-tab.is-active {
  background: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
}

.skill-install-block {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.skill-install-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 12px;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border);
}

.skill-install-header-prompt {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--muted);
}

.skill-install-header-link {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--fg-secondary);
  text-decoration: none;
  opacity: 0.8;
  transition: opacity 0.15s;
}
.skill-install-header-link:hover { opacity: 1; color: var(--fg); }

.skill-install-tabs {
  display: flex;
  gap: 4px;
  padding: 8px 12px 4px;
}

.skill-install-tab {
  padding: 3px 12px;
  border-radius: 999px;
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 600;
  color: var(--fg-secondary);
  background: var(--bg-card);
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.15s ease;
  line-height: 1.6;
}

.skill-install-tab:hover {
  color: var(--fg);
  background: var(--bg-elevated);
  border-color: var(--border-strong);
}

.skill-install-tab.is-active {
  color: #2563eb;
  background: rgba(37, 99, 235, 0.07);
  border-color: rgba(37, 99, 235, 0.35);
  font-weight: 700;
}

/* 命令行 */
.skill-install-cmd-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px 10px;
}

.skill-install-cmd-prefix {
  display: none; /* 前缀已内嵌在命令内 */
}

.skill-install-cmd {
  flex: 1;
  font-family: var(--font-mono);
  font-size: 11.5px;
  /* 浅色下 --fg-secondary 是深灰，深色下是浅灰，两者均可读 */
  color: var(--fg-secondary);
  word-break: break-all;
  line-height: 1.5;
  user-select: all;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skill-install-copy-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.skill-install-copy-btn:hover {
  border-color: var(--border-strong);
  color: var(--fg);
  background: var(--bg-secondary);
}

.skill-install-copy-btn.is-copied {
  border-color: rgba(16, 185, 129, 0.4);
  background: rgba(16, 185, 129, 0.08);
  color: #10b981;
}

/* ── ZIP 预览面板 ── */
.skill-zip-preview {
  margin-top: 4px;
  /* 深色模式用 --bg-secondary，浅色模式同样合适 */
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.skill-zip-preview-title {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--fg-secondary);
  padding: 8px 12px;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.skill-zip-count {
  margin-left: auto;
  font-size: 10px;
  font-weight: 500;
  color: var(--muted);
}

.skill-zip-tree {
  padding: 6px;
  max-height: 200px;
  overflow-y: auto;
  font-family: var(--font-mono);
  font-size: 11px;
  scrollbar-width: thin;
  scrollbar-color: rgba(34,211,238,0.2) transparent;
}

.skill-zip-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  color: var(--fg-secondary);
  white-space: nowrap;
  transition: background-color 0.15s;
  user-select: none;
  border-radius: 4px;
}

.skill-zip-item:hover {
  background: rgba(34, 211, 238, 0.05);
  color: var(--fg);
}

.skill-zip-folder {
  color: var(--fg);
  cursor: pointer;
}

.skill-zip-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  color: var(--muted);
  transition: transform 0.2s ease;
}

.skill-zip-toggle.is-open { transform: rotate(90deg); }
.skill-zip-toggle.is-invisible { visibility: hidden; }

.skill-zip-icon-type {
  display: flex;
  align-items: center;
  margin-right: 2px;
}

.skill-zip-name { overflow: hidden; text-overflow: ellipsis; }

.skill-zip-bold {
  font-weight: 700;
  color: var(--accent);
}

/* 可以点击打开预览的文件（.md / .txt） */
.skill-zip-file-clickable {
  cursor: pointer;
}

.skill-zip-file-clickable:hover {
  background: var(--bg-elevated);
  color: var(--fg);
}

/* ── 字段行 ── */
.skill-detail-field {
  border: none;
  border-bottom: 1px solid var(--border);
  padding: 16px;
  transition: background 0.2s;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.skill-detail-field:last-child { border-bottom: none; }

.skill-detail-field:hover {
  background: rgba(255,255,255,0.01);
}

.skill-detail-field-label {
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 0;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  line-height: 1.6;
}

.skill-detail-field-value {
  font-weight: 400;
  color: var(--fg-secondary);
  word-break: break-word;
  font-family: var(--font-sans);
  font-size: 15px;
  line-height: 1.6;
}

.skill-detail-field-required {
  font-size: 10px;
  font-weight: 600;
  color: #ef4444;
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.2);
  padding: 2px 6px;
  border-radius: 999px;
  font-family: var(--font-mono);
}

.skill-detail-field-optional {
  font-size: 10px;
  font-weight: 600;
  color: #22c55e;
  background: rgba(34,197,94,0.1);
  border: 1px solid rgba(34,197,94,0.2);
  padding: 2px 6px;
  border-radius: 999px;
  font-family: var(--font-mono);
}

/* ============================================================
   Markdown 渲染样式 — 暗黑主题版
============================================================ */
.skill-detail-field-content {
  line-height: 1.8;
  color: var(--fg-secondary);
  overflow-wrap: break-word;
  word-break: break-word;
  min-width: 0;
  max-width: 100%;
  font-size: 0.9375rem;
}

/* ── 标题 ── */
.skill-detail-field-content :deep(h1) {
  font-family: var(--font-mono);
  font-size: 1.6rem;
  font-weight: 700;
  margin: 2rem 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(34, 211, 238, 0.2);
  color: var(--fg);
  word-break: break-word;
  letter-spacing: -0.02em;
}

.skill-detail-field-content :deep(h2) {
  font-family: var(--font-mono);
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1.75rem 0 0.875rem;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid var(--border);
  color: var(--fg);
  word-break: break-word;
}

.skill-detail-field-content :deep(h3) {
  font-family: var(--font-mono);
  font-size: 1.05rem;
  font-weight: 600;
  margin: 1.5rem 0 0.625rem;
  color: var(--accent);
  word-break: break-word;
}

.skill-detail-field-content :deep(h4),
.skill-detail-field-content :deep(h5),
.skill-detail-field-content :deep(h6) {
  font-size: 1rem;
  font-weight: 600;
  margin: 1.25rem 0 0.5rem;
  color: var(--fg);
}

/* ── 段落 ── */
.skill-detail-field-content :deep(p) {
  margin: 0.875rem 0;
  word-break: break-word;
  line-height: 1.8;
  color: var(--fg-secondary);
}

/* ── 列表 ── */
.skill-detail-field-content :deep(ul),
.skill-detail-field-content :deep(ol) {
  margin: 0.875rem 0;
  padding-left: 1.75rem;
  color: var(--fg-secondary);
}

.skill-detail-field-content :deep(li) {
  margin: 0.375rem 0;
  word-break: break-word;
  line-height: 1.75;
}

.skill-detail-field-content :deep(li > p) { margin: 0.25rem 0; }

/* ── 图片 ── */
.skill-detail-field-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  border: 1px solid var(--border);
}

/* ── 行内代码 ── */
.skill-detail-field-content :deep(code:not(pre code)) {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  background: rgba(34, 211, 238, 0.08);
  padding: 0.15rem 0.45rem;
  border-radius: 0.3rem;
  color: var(--accent);
  border: 1px solid rgba(34, 211, 238, 0.2);
  word-break: break-all;
  font-variant-ligatures: none;
}

/* ── 代码块 ── */
.skill-detail-field-content :deep(.md-code-block) {
  margin: 1.25rem 0;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #30363d;
  background-color: #0d1117;
}

.skill-detail-field-content :deep(.md-code-lang) {
  display: flex;
  align-items: center;
  padding: 6px 14px;
  background-color: #161b22;
  border-bottom: 1px solid #30363d;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: #8b949e;
  letter-spacing: 0.04em;
  text-transform: lowercase;
  user-select: none;
}

.skill-detail-field-content :deep(.md-code-block pre) {
  margin: 0;
  border-radius: 0;
  max-height: 420px;
  overflow: auto;
  background-color: transparent;
}

.skill-detail-field-content :deep(pre:not(.md-code-block pre)) {
  max-height: 420px;
  width: 100%;
  overflow: auto;
  border-radius: 10px;
  margin: 1.25rem 0;
  background-color: #0d1117;
  border: 1px solid #30363d;
}

.skill-detail-field-content :deep(pre code) {
  padding: 1.125rem 1.375rem;
  min-width: 100%;
  box-sizing: border-box;
  display: inline-block;
  background-color: transparent;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  line-height: 1.65;
  color: #c9d1d9;
  font-variant-ligatures: none;
}

/* ── 引用块 ── */
.skill-detail-field-content :deep(blockquote) {
  border-left: 3px solid var(--accent);
  background: rgba(34, 211, 238, 0.04);
  padding: 0.625rem 1rem;
  margin: 1rem 0;
  border-radius: 0 8px 8px 0;
  color: var(--fg-secondary);
}

.skill-detail-field-content :deep(blockquote p) { margin: 0; }

/* ── 粗体 / 斜体 ── */
.skill-detail-field-content :deep(strong) {
  font-weight: 700;
  color: var(--fg);
}

.skill-detail-field-content :deep(em) {
  color: var(--fg-secondary);
  font-style: italic;
}

/* ── 分割线 ── */
.skill-detail-field-content :deep(hr) {
  border: none;
  border-top: 1px solid var(--border);
  margin: 1.5rem 0;
}

/* ── 表格 ── */
.skill-detail-field-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  font-size: 0.875rem;
}

.skill-detail-field-content :deep(th) {
  background: rgba(34, 211, 238, 0.06);
  font-weight: 600;
  padding: 8px 12px;
  border: 1px solid var(--border);
  text-align: left;
  color: var(--fg);
  font-family: var(--font-mono);
}

.skill-detail-field-content :deep(td) {
  padding: 7px 12px;
  border: 1px solid var(--border);
  color: var(--fg-secondary);
}

.skill-detail-field-content :deep(tr:nth-child(even)) {
  background: rgba(255,255,255,0.01);
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .skill-detail {
    margin: 12px;
    border-radius: 12px;
  }

  .skill-detail-content {
    flex-direction: column;
    gap: 16px;
    padding: 0 12px 16px;
  }


  .skill-detail-right {
    width: 100% !important;
    position: static !important;
    top: auto !important;
    right: auto !important;
  }

  .skill-detail-left { gap: 12px; }

  .skill-detail-header {
    padding: 12px 12px 0;
    margin-bottom: 12px;
  }

  .skill-detail-field { padding: 12px; }
  .skill-detail-title { font-size: 17px; }

  .skill-detail-meta {
    flex-wrap: wrap;
    gap: 12px;
    padding: 12px 0;
  }

  .skill-action-btn {
    padding: 12px 14px;
    font-size: 14px;
  }
}

/* 按钮加载状态动画 */
.icon-loading {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
/* ── 骨架屏（Markdown 加载中）─────────────────────────────────── */
.skill-md-skeleton {
  padding: 8px 0 16px;
}

/* 灰色占位条，带波纹动画 */
.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    var(--bg-elevated) 25%,
    var(--bg-secondary) 50%,
    var(--bg-elevated) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s infinite;
  margin-bottom: 10px;
  width: 100%;
  opacity: 0.8;
}

.skeleton-line--title {
  height: 16px;
  width: 55%;
  margin-bottom: 16px;
}

.skeleton-line--short {
  width: 40%;
}

@keyframes skeleton-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 转圈 + 文字提示 */
.skeleton-spinner-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  color: var(--muted);
}

.skeleton-spinner {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: var(--muted);
  animation: spin 0.9s linear infinite;
}

.skeleton-spinner-text {
  font-size: 12px;
  font-family: var(--font-mono);
  letter-spacing: 0.04em;
}

/* ── 详情页加载中 ── */
.skill-detail-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 240px;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 0.04em;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.detail-loading-spinner {
  color: var(--muted);
  animation: spin 0.9s linear infinite;
  flex-shrink: 0;
}

/* ── 详情页加载失败 ── */
.skill-detail-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  min-height: 280px;
  padding: 48px 24px;
  text-align: center;
  max-width: 1200px;
  margin: 32px auto;
  background: rgba(239, 68, 68, 0.03);
  border: 1px solid rgba(239, 68, 68, 0.18);
  border-radius: var(--radius-lg);
}

.skill-error-icon {
  color: #ef4444;
  opacity: 0.65;
}

.skill-error-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--fg);
  margin: 0;
}

.skill-error-desc {
  font-size: 14px;
  color: var(--fg-secondary);
  margin: 0;
  max-width: 380px;
}

.skill-error-actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

.skill-error-retry,
.skill-error-back {
  padding: 8px 20px;
  border-radius: 8px;
  border: 1px solid var(--border);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.skill-error-retry {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
.skill-error-retry:hover {
  opacity: 0.88;
}

.skill-error-back {
  background: var(--bg-elevated);
  color: var(--fg-secondary);
}
.skill-error-back:hover {
  border-color: var(--border-strong);
  color: var(--fg);
}

</style>
