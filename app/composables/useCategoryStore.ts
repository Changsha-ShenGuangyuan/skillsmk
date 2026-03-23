/**
 * useCategoryStore
 *
 * 全局单例分类数据存储，基于 Nuxt useState 实现跨组件共享，避免重复 API 请求。
 * - 首次调用时自动发起 /categories 请求（携带当前语言）
 * - 语言切换时自动重新请求，分类名称实时更新
 * - getCategoryName() 无需手动传 locale，直接使用 Store 内部维护的当前语言
 */
import { fetchCategories } from '~/composables/useCategoriesApi'
import type { ApiCategory } from '~/composables/useCategoriesApi'

// 固定色系调色板（按分类顺序循环取色，颜色偏淡柔和）
const PALETTE = [
  { bg: 'rgba(96,165,250,0.10)',  text: '#60a5fa' },  // 蓝
  { bg: 'rgba(167,139,250,0.10)', text: '#a78bfa' },  // 紫
  { bg: 'rgba(52,211,153,0.10)',  text: '#34d399' },  // 绿
  { bg: 'rgba(251,191,36,0.10)',  text: '#fbbf24' },  // 黄
  { bg: 'rgba(248,113,113,0.10)', text: '#f87171' },  // 红
  { bg: 'rgba(34,211,238,0.10)',  text: '#22d3ee' },  // 青
  { bg: 'rgba(232,121,249,0.10)', text: '#e879f9' },  // 粉紫
  { bg: 'rgba(163,230,53,0.10)',  text: '#a3e635' },  // 黄绿
]

export function getColorByIndex(idx: number) {
  return PALETTE[((idx % PALETTE.length) + PALETTE.length) % PALETTE.length] as { bg: string; text: string }
}

// 模块级：跨所有 useCategoryStore() 实例共享，防止并发请求竞态
let _inFlightPromise: Promise<void> | null = null

export function useCategoryStore() {
  // useState 保证跨组件单例（同一个 key 只有一份状态）
  const categories   = useState<ApiCategory[]>('global-categories', () => [])
  const isLoaded     = useState<boolean>('global-categories-loaded', () => false)
  // 记录上一次请求时使用的 locale，避免重复请求相同语言
  const loadedLocale = useState<string>('global-categories-locale', () => '')

  /**
   * 加载分类数据
   * - 首次调用时承载所有翻译
   * - 语言切换时，locale 与上次不同则重新请求，更新翻译缓存
   * - 并发调用时共享同一个 in-flight Promise，避免发出多个重复请求
   */
  async function ensureLoaded(locale?: string) {
    const lang = locale || 'en'
    // 语言未变且已有数据：直接复用（优先判断）
    if (isLoaded.value && loadedLocale.value === lang) return
    // 兜底：categories 已有 SSR 数据且语言匹配，即使 isLoaded 状态丢失也不重复请求
    if (import.meta.client && categories.value.length > 0 && loadedLocale.value === lang) {
      isLoaded.value = true  // 修复标志位
      return
    }
    // 如果已有请求在进行，等待它完成（而不是发出新请求）
    if (_inFlightPromise) return _inFlightPromise

    _inFlightPromise = (async () => {
      try {
        const res = await fetchCategories(lang) // 传入当前语言
        if (res.code === 0) {
          categories.value   = res.data
          isLoaded.value     = true
          loadedLocale.value = lang
        }
      } catch (e) {
        console.error('[useCategoryStore] 加载分类失败', e)
      } finally {
        _inFlightPromise = null  // 请求完成后清空，下次语言切换时可重新触发
      }
    })()

    return _inFlightPromise
  }

  /**
   * 根据 category_id 查找分类对象
   */
  function getCategoryById(id: number): ApiCategory | undefined {
    return categories.value.find(c => c.id === id)
  }

  /**
   * 根据 category_id 获取分类颜色（按列表索引循环取色）
   */
  function getColorByCategoryId(id: number): { bg: string; text: string } {
    const idx = categories.value.findIndex(c => c.id === id)
    return getColorByIndex(idx >= 0 ? idx : 0)
  }

  /**
   * 根据 category_id 获取本地化分类名称
   *
   * 匹配策略（优先级从高到低）：
   *   1. 精确匹配 locale（如 zh-CN === zh-CN）
   *   2. 前缀匹配：locale 为短码时匹配以其开头的翻译（zh → zh-CN）
   *   3. translations 第一条（fallback）
   *   4. slug（最终 fallback）
   */
  function getCategoryName(id: number, locale?: string): string {
    const cat = getCategoryById(id)
    if (!cat) return ''
    const lang = (locale || 'zh').toLowerCase()

    const translations = cat.translations ?? []

    // 1. 精确匹配
    let match = translations.find(t => t.locale.toLowerCase() === lang)
    // 2. 前缀匹配（如 zh → zh-CN, en → en-US）
    if (!match) match = translations.find(
      t => t.locale.toLowerCase().startsWith(lang + '-') || lang.startsWith(t.locale.toLowerCase() + '-')
    )
    // 3. fallback 到第一条翻译
    if (!match) match = translations[0]

    return match?.name || cat.slug
  }

  return { categories, isLoaded, ensureLoaded, getCategoryById, getColorByCategoryId, getCategoryName }
}
