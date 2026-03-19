export interface ApiCategoryTranslation {
  category_id: number
  locale: string
  name: string
}

export interface ApiCategory {
  id: number
  slug: string
  skills_count: number
  translations: ApiCategoryTranslation[]
}

export interface CategoriesApiResponse {
  code: number
  msg: string
  data: ApiCategory[]
}

/**
 * 前端 i18n locale code → 后端 API locale 参数 映射
 * 后端支持: en, es, zh-CN, ar, pt, de, ja, fr, ko
 */
const LOCALE_MAP: Record<string, string> = {
  zh: 'zh-CN',  // 前端用 zh，后端要 zh-CN
  // 其余语言代码与后端一致，无需映射
}

/**
 * 命令式获取所有分类信息
 * - locale 通过 URL query 参数传递（?locale=zh-CN）
 */
export async function fetchCategories(locale?: string): Promise<CategoriesApiResponse> {
  const query: Record<string, string> = {}
  if (locale) {
    // 转换为后端识别的 locale 格式
    query.locale = LOCALE_MAP[locale] ?? locale
  }
  const result = await $fetch<CategoriesApiResponse>('/api/proxy/categories', { query })
  return result
}
