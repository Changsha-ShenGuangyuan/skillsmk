/**
 * useSkillsApi — 技能列表 API 统一封装
 *
 * 对接后端 GET /skills 接口，通过 Nuxt Server 代理（/api/proxy/skills）
 * 自动注入 HMAC-SHA256 签名头后转发到 http://192.168.2.40:9501
 *
 * 响应结构（后端返回）：
 * {
 *   code: 0,
 *   msg: "ok",
 *   data: ApiSkill[],
 *   meta: { total, per_page, current_page, last_page }
 * }
 *
 * 技能详情接口：GET /skills/{skillId}
 * {
 *   code: 0,
 *   msg: "ok",
 *   data: ApiSkillDetail
 * }
 */

// ── 后端技能对象类型 ──
export interface ApiSkill {
  skill_id: string
  skill_key: string
  repo_full_name: string
  owner: string
  repo_name: string
  repo_stars: number
  repo_forks: number
  skill_path: string
  name: string
  description: string
  category_id: number
}

// ── 分页元信息 ──
export interface ApiMeta {
  total: number
  per_page: number
  current_page: number
  last_page: number
}

// ── 后端响应包装 ──
export interface SkillsApiResponse {
  code: number
  msg: string
  data: ApiSkill[]
  meta: ApiMeta
}

// ── 传给 /skills 的查询参数 ──
export interface SkillsQueryParams {
  page?: number
  per_page?: number
  q?: string
  category_id?: number | null
  repo?: string
  is_fork?: 0 | 1
}

/**
 * 获取技能的显示名称（降级策略）
 * 1. 优先用 name 字段
 * 2. name 为空时从 skill_path 末段提取（如 "skills/apple-notes" → "apple-notes"）
 * 3. skill_path 也没有则用 repo_name
 */
export function getSkillDisplayName(skill: Pick<ApiSkill, 'name' | 'skill_path' | 'repo_name'>): string {
  if (skill.name?.trim()) return skill.name.trim()
  if (skill.skill_path?.trim()) {
    const parts = skill.skill_path.replace(/\/$/, '').split('/')
    const last = parts[parts.length - 1]
    if (last) return last
  }
  return skill.repo_name || ''
}

/**
 * 将后端 ApiSkill 映射为 SkillCard 所需的字段
 */
export function toSkillCardProps(skill: ApiSkill) {
  return {
    id: skill.skill_id,            // 用 skill_id（UUID）作路由参数，确保后端可直接查询
    skillId: skill.skill_id,        // 同上，保持兼容
    name: getSkillDisplayName(skill),
    description: skill.description,
    author: skill.owner,
    category: '', // 由 SkillCard 内部按 Classification 自动解析
    Classification: skill.category_id,
    stars: skill.repo_stars,
    // 暂无 Popular 字段；星数 ≥ 500 视为热门
    Popular: skill.repo_stars >= 500 ? 1 : 0,
  }
}

// ── skill_key → skill_id 本地缓存（localStorage），跨标签页共享 ──
const CACHE_KEY = 'sk_key_map'

function saveToCache(skills: ApiSkill[]) {
  if (!import.meta.client) return
  try {
    const existing = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
    skills.forEach(s => { if (s.skill_key && s.skill_id) existing[s.skill_key] = s.skill_id })
    localStorage.setItem(CACHE_KEY, JSON.stringify(existing))
  } catch { /* 静默失败 */ }
}

function getFromCache(skillKey: string): string | null {
  if (!import.meta.client) return null
  try {
    const map = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
    return map[skillKey] ?? null
  } catch { return null }
}

/**
 * 命令式版本（适合事件处理器 / watch 回调中调用）
 * 返回数据时自动写入 skill_key→skill_id 缓存
 */
export async function fetchSkills(params: SkillsQueryParams, signal?: AbortSignal): Promise<SkillsApiResponse> {
  const query: Record<string, string | number> = {}
  if (params.page) query.page = params.page
  if (params.per_page) query.per_page = params.per_page
  if (params.q?.trim()) query.q = params.q.trim()
  if (params.category_id) query.category_id = params.category_id
  if (params.repo?.trim()) query.repo = params.repo.trim()
  if (params.is_fork !== undefined) query.is_fork = params.is_fork

  const result = await $fetch<SkillsApiResponse>('/api/proxy/skills', { query, signal })
  // 自动缓存 skill_key → skill_id 映射，供详情页直接 URL 访问时使用
  if (result.code === 0 && result.data?.length) saveToCache(result.data)
  return result
}

// ── 技能详情接口类型（GET /skills/{skillKey}）──
export interface ApiSkillDetail {
  skill_id: string
  skill_key: string
  repo_full_name: string
  owner: string
  repo_name: string
  is_fork: boolean
  repo_stars: number
  repo_forks: number
  skill_path: string
  tree_sha: string
  name: string
  description: string
  user_invocable: boolean
  frontmatter_extra: Record<string, unknown>
  skill_md_content: string           // SKILL.md 完整文本
  file_tree: Record<string, unknown> // 文件树 JSON 结构
  category_id: number
  mirror_status: string
  mirror_retry_count: number
  mirrored_at: string
  created_at: string
  updated_at: string
}

export interface SkillDetailApiResponse {
  code: number
  msg: string
  data: ApiSkillDetail | null
}

/**
 * 判断字符串是否为 UUID 格式（v4 常见格式）
 */
export function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

/**
 * 获取技能详情（命令式）
 * @param skillKey  技能唯一键（skill_key 字段，如 microsoft-vscode-github-skills-accessibility-skill-md）
 */
export async function fetchSkillDetail(skillKey: string): Promise<SkillDetailApiResponse> {
  return $fetch<SkillDetailApiResponse>(`/api/proxy/skills/${skillKey}`)
}

/**
 * 通过 skill_key 获取技能详情（优先查 localStorage 缓存，无缓存再两步查询）
 * 缓存由 fetchSkills 自动填充（用户浏览过列表即有缓存）
 * @param skillKey 技能唯一键（如 microsoft-vscode-github-skills-accessibility-skill-md）
 */
export async function fetchSkillDetailByKey(skillKey: string): Promise<SkillDetailApiResponse> {
  // Step 1: 查 localStorage 缓存（同浏览器跨标签页有效）
  const cachedId = getFromCache(skillKey)
  if (cachedId) {
    return $fetch<SkillDetailApiResponse>(`/api/proxy/skills/${cachedId}`)
  }
  // Step 2: 缓存未命中，按 skill_key 查列表取 skill_id（后端暂不支持筛选，结果不可靠）
  const listRes = await $fetch<SkillsApiResponse>('/api/proxy/skills', {
    query: { skill_key: skillKey, page: 1, per_page: 1 },
  })
  const skillId = listRes.data?.[0]?.skill_id
  if (!skillId) {
    return { code: 404, msg: 'Skill not found', data: null }
  }
  // Step 3: 用 skill_id 请求详情
  return $fetch<SkillDetailApiResponse>(`/api/proxy/skills/${skillId}`)
}

/**
 * 获取技能详情：直接以 UUID 请求，后端 GET /skills/{uuid} 接口稳定可靠。
 * URL 路由参数统一使用 skill_id，不再依赖 skill_key 或 localStorage 缓存。
 */
export async function fetchSkillDetailAuto(id: string): Promise<SkillDetailApiResponse> {
  return fetchSkillDetail(id)
}

// ── 热门技能排行榜接口类型 ──
export interface SkillsTopQueryParams {
  page?: number
  per_page?: number
}

export interface SkillsTopApiResponse {
  code: number
  msg: string
  data: ApiSkill[]
  meta: ApiMeta
}

/**
 * 命令式获取热门技能排行榜
 */
export async function fetchSkillsTop(params: SkillsTopQueryParams = {}): Promise<SkillsTopApiResponse> {
  const query: Record<string, number> = {}
  query.page = params.page ?? 1  // 始终包含 page，防止缺少参数导致鉴权失败
  if (params.per_page) query.per_page = params.per_page

  return $fetch<SkillsTopApiResponse>('/api/proxy/skills-top', { query })
}
