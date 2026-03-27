/**
 * GitHub Tree 代理路由
 *
 * 路径：/api/github-tree（独立于 /api/proxy/[...path] 通配符之外）
 *
 * 性能优化：
 *   - 并行尝试 main + master 两个分支，取先成功的（省去一次串行 RTT）
 *   - Nitro 缓存 1 小时，同一仓库重复访问直接命中缓存
 *   - 负值缓存（Negative Cache）：失败路径 60 秒内不再透传到 GitHub，防止限流雪崩
 *
 * 请求参数（Query）：
 *   owner  — 仓库拥有者
 *   repo   — 仓库名
 *   branch — 分支名（可选，传 'auto' 或不传时自动猜测）
 *   path   — 子目录过滤前缀（可选）
 *
 * 返回结果：
 *   { files: string[], defaultBranch: string, rawBase: string }
 */
import type { H3Event } from 'h3'

/**
 * 负值缓存（Negative Cache）
 * 对 GitHub API 返回 404 / 403 / 429 / 5xx 等失败的仓库路径，
 * 在服务端内存中记录 60 秒，期间相同请求直接返回错误，不再透传 GitHub。
 *
 * 结构：key -> 过期时间戳（ms）
 */
const negativeCache = new Map<string, number>()
const NEGATIVE_TTL_MS = 60_000 // 60 秒

/** 检查某个 key 是否命中负值缓存（若已过期则自动删除） */
function isNegativeCached(key: string): boolean {
  const exp = negativeCache.get(key)
  if (exp === undefined) return false
  if (Date.now() > exp) {
    negativeCache.delete(key)
    return false
  }
  return true
}

/** 写入负值缓存 */
function setNegativeCache(key: string): void {
  negativeCache.set(key, Date.now() + NEGATIVE_TTL_MS)
}

function getGitHubHeaders(): Record<string, string> {
  const token = process.env.NUXT_GITHUB_TOKEN
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'skillsmk-nuxt',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

/**
 * 尝试获取指定分支的文件树，失败返回 null
 */
async function tryFetchTree(
  owner: string,
  repo: string,
  branch: string,
  headers: Record<string, string>
): Promise<{ tree: Array<{ path: string; type: string }> } | null> {
  try {
    return await $fetch<{ tree: Array<{ path: string; type: string }> }>(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
      { headers }
    )
  } catch {
    return null
  }
}

async function fetchGitHubTree(event: H3Event) {
  const query = getQuery(event) as Record<string, string>
  const { owner, repo, path: subPath } = query
  let branch = query.branch

  if (!owner || !repo) {
    throw createError({ statusCode: 400, statusMessage: '缺少 owner 或 repo 参数' })
  }

  // ── 负值缓存检查：如果此仓库路径在 60 秒内已失败，直接拦截 ──
  const negKey = `${owner}/${repo}/${branch || 'auto'}/${subPath || ''}`
  if (isNegativeCached(negKey)) {
    throw createError({
      statusCode: 503,
      statusMessage: '仓库文件树暂时不可用（已缓存错误 60 秒），请稍后重试',
    })
  }

  const ghHeaders = getGitHubHeaders()
  let treeData: { tree: Array<{ path: string; type: string }> } | null = null
  let resolvedBranch = branch

  if (branch && branch !== 'auto') {
    // 分支已知：直接请求
    treeData = await tryFetchTree(owner, repo, branch, ghHeaders)
    if (!treeData) {
      setNegativeCache(negKey)
      throw createError({ statusCode: 404, statusMessage: `找不到分支 ${branch} 的文件树` })
    }
  } else {
    // 分支未知：并行尝试 main 和 master，取先成功的（省去一次 RTT）
    const candidates = ['main', 'master']
    const results = await Promise.allSettled(
      candidates.map(b => tryFetchTree(owner, repo, b, ghHeaders).then(r => ({ data: r, branch: b })))
    )

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.data) {
        treeData = result.value.data
        resolvedBranch = result.value.branch
        break
      }
    }

    // 如果 main/master 都失败，回退到 API 查询真实默认分支
    if (!treeData) {
      try {
        const repoData = await $fetch<{ default_branch: string }>(
          `https://api.github.com/repos/${owner}/${repo}`,
          { headers: ghHeaders }
        )
        resolvedBranch = repoData.default_branch || 'main'
        treeData = await tryFetchTree(owner, repo, resolvedBranch, ghHeaders)
      } catch {
        // ignore
      }
    }

    if (!treeData) {
      // 写入负值缓存，60 秒内不再透传 GitHub
      setNegativeCache(negKey)
      throw createError({ statusCode: 404, statusMessage: '无法获取仓库文件树，请检查仓库是否公开' })
    }
  }

  // 按子目录过滤
  const targetPrefix = subPath ? (subPath.endsWith('/') ? subPath : subPath + '/') : ''
  const files = treeData.tree
    .filter((item) => item.type === 'blob' && item.path.startsWith(targetPrefix))
    .map((item) => targetPrefix ? item.path.substring(targetPrefix.length) : item.path)

  return {
    files,
    defaultBranch: resolvedBranch,
    rawBase: `https://raw.githubusercontent.com/${owner}/${repo}/${resolvedBranch}/${targetPrefix}`,
  }
}

// Nitro 缓存：1 小时，按 owner/repo/branch/path 作为 key
export default defineCachedEventHandler(fetchGitHubTree, {
  maxAge: 3600,
  getKey: (event: H3Event) => {
    const q = getQuery(event) as Record<string, string>
    return `github-tree:${q.owner}/${q.repo}/${q.branch || 'auto'}/${q.path || ''}`
  },
  varies: [],
})
