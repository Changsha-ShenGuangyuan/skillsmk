/**
 * Nuxt 服务端路由：/api/skills.json
 *
 * 技能数据 JSON API 端点。
 * 供 AI 爬虫（特别是支持 JSON 解析的平台）以机器可读格式获取所有技能数据。
 * 也可用于第三方工具、AI Agent 插件直接调用。
 *
 * 数据来源：动态调用后端 /skills API，每次请求实时获取。
 */

type SkillItem = {
  skill_id: string
  skill_key: string
  name: string
  description: string
  owner: string
  repo_full_name: string
  repo_stars: number
  category_id: number
}

type SkillsApiResponse = {
  code: number
  data: SkillItem[]
  meta: {
    total: number
    per_page: number
    current_page: number
    last_page: number
  }
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Content-Type', 'application/json; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  // 允许跨域（便于 AI 插件等外部服务调用）
  setHeader(event, 'Access-Control-Allow-Origin', '*')

  const config  = useRuntimeConfig()
  const baseUrl = config.public.siteUrl as string
  const apiBase = (config.apiBaseUrl as string).replace(/\/$/, '')
  const secret  = config.apiSignSecret as string

  // ─── 从后端 API 获取全量技能（分页拉取）──────────────────────
  const allSkills: SkillItem[] = []
  try {
    const p1Params = { page: 1, per_page: 50 }
    const firstRes = await $fetch<SkillsApiResponse>(`${apiBase}/skills`, {
      params: p1Params,
      headers: buildSignHeaders(p1Params, secret),
    }).catch(() => null)

    if (firstRes?.code === 0) {
      allSkills.push(...firstRes.data)
      const { last_page } = firstRes.meta
      if (last_page > 1) {
        const pages = Array.from({ length: last_page - 1 }, (_, i) => i + 2)
        const results = await Promise.allSettled(
          pages.map(p => {
            const params = { page: p, per_page: 50 }
            return $fetch<SkillsApiResponse>(`${apiBase}/skills`, {
              params,
              headers: buildSignHeaders(params, secret),
            })
          })
        )
        for (const r of results) {
          if (r.status === 'fulfilled' && r.value?.code === 0) {
            allSkills.push(...r.value.data)
          }
        }
      }
    }
  } catch (e) {
    console.error('[api/skills.json] API 请求失败', e)
  }

  const skills = allSkills.map((skill) => ({
    id:          skill.skill_id,
    name:        skill.name,
    description: skill.description,
    author:      skill.owner       || null,
    stars:       skill.repo_stars  || 0,
    pageUrl:     `${baseUrl}/skill/${skill.skill_id}`,
    githubUrl:   skill.repo_full_name ? `https://github.com/${skill.repo_full_name}` : null,
    installCmd:  skill.skill_key ? `npx skills add ${skill.skill_key}` : null,
  }))

  return {
    meta: {
      source:      baseUrl,
      description: 'Complete list of Agent Skills available on SKILLSMK',
      llmsFullTxt: `${baseUrl}/llms-full.txt`,
      totalSkills: allSkills.length,
      updatedAt:   new Date().toISOString().split('T')[0],
    },
    skills,
  }
})
