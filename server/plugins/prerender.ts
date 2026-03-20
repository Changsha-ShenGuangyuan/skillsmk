/**
 * Nitro 服务端插件：预渲染阶段动态注入全量 skill 路由
 *
 * 仅在 `npm run generate`（预渲染构建）时执行。
 * 通过后端 API 分页拉取所有 skill_key，将 /skill/{skill_key} 批量注入预渲染队列，
 * 确保每个技能详情页都能被 SSG 生成为静态 HTML。
 *
 * 使用 prerender:init 钩子（Nitro 3.x 支持）。
 */
import { buildSignHeaders } from '../utils/sign'

export default defineNitroPlugin((nitroApp) => {
  // @ts-ignore
  nitroApp.hooks.hook('prerender:init', async (prerenderer: any) => {
    const config = useRuntimeConfig()
    const apiBase = (config.apiBaseUrl as string || '').replace(/\/$/, '')
    const secret = config.apiSignSecret as string

    if (!apiBase) {
      console.warn('[prerender] NUXT_API_BASE_URL 未配置，跳过 skill 路由注入')
      return
    }

    console.log('[prerender] 开始从 API 拉取全量 skill 列表...')

    const allKeys: string[] = []
    try {
      const p1Params = { page: 1, per_page: 100 }
      const first = await $fetch<any>(`${apiBase}/skills`, {
        params:  p1Params,
        headers: buildSignHeaders(p1Params, secret),
      }).catch((e: unknown) => {
        console.error('[prerender] 第 1 页请求失败:', e)
        return null
      })

      if (first?.code === 0) {
        allKeys.push(...(first.data as any[]).map((s: any) => s.skill_key).filter(Boolean))

        const lastPage: number = first.meta?.last_page ?? 1
        if (lastPage > 1) {
          const pages = Array.from({ length: lastPage - 1 }, (_, i) => i + 2)
          const results = await Promise.allSettled(
            pages.map((p) => {
              const params = { page: p, per_page: 100 }
              return $fetch<any>(`${apiBase}/skills`, {
                params,
                headers: buildSignHeaders(params, secret),
              })
            })
          )
          for (const r of results) {
            if (r.status === 'fulfilled' && r.value?.code === 0) {
              allKeys.push(...(r.value.data as any[]).map((s: any) => s.skill_key).filter(Boolean))
            }
          }
        }
      } else {
        console.warn('[prerender] API 返回异常：', first)
      }
    } catch (e) {
      console.error('[prerender] 拉取 skill 列表失败', e)
    }

    const routes = allKeys.map((key) => `/skill/${key}`)
    console.log(`[prerender] 注入 ${routes.length} 条 skill 预渲染路由`)

    // 将路由追加到预渲染器写入队列
    await prerenderer.routes.enqueue(routes)
  })
})
