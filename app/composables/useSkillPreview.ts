/**
 * useSkillPreview
 *
 * 在 SkillCard 和详情页 [id].vue 之间共享卡片的基础数据。
 * 点击卡片时写入，详情页读取后立即渲染，无需等待 API 返回。
 */
export interface SkillPreview {
  /** skill 的 slug / key，与路由 [id] 对应 */
  id: string
  name: string
  description: string
  author?: string
  stars?: number
  /** 分类 ID，用于显示分类标签 */
  categoryId?: number
}

export function useSkillPreview() {
  // useState 保证 SSR/CSR 共享同一个引用
  const preview = useState<SkillPreview | null>('skill-preview', () => null)

  /** 点击卡片时调用，写入基础数据 */
  function setPreview(data: SkillPreview) {
    preview.value = data
  }

  /** 详情页数据加载完毕后调用，清空预览缓存 */
  function clearPreview() {
    preview.value = null
  }

  return { preview, setPreview, clearPreview }
}
