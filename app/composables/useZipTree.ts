/**
 * useZipTree
 * 封装目录预览的构建与交互逻辑
 *
 * loadZipPreview 通过服务端代理 /api/proxy/github-tree 获取文件树
 * 文件内容读取通过 GitHub Raw URL 按需拉取
 *
 * 优化改动：
 *   - 移除 JSZip 依赖（之前静态导入但实际未使用，约 90KB）
 *   - 改为通过 Nitro 服务端代理调用 GitHub API（支持 Token + 1h 缓存）
 */
import { ref, computed } from 'vue'

export interface ZipNode {
  path: string
  name: string
  isDir: boolean
  isOpen: boolean
  children: ZipNode[]
  depth: number
}

function buildZipTree(paths: string[]): ZipNode[] {
  const root: ZipNode[] = []
  const nodeMap = new Map<string, ZipNode>()

  paths.forEach(p => {
    const parts = p.split('/').filter(Boolean)
    let currentPath = ''
    let parentNode: ZipNode | null = null

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1
      const isDir = !(isLast && !p.endsWith('/'))
      const partPath = currentPath + part + (isDir ? '/' : '')

      if (!nodeMap.has(partPath)) {
        const node: ZipNode = {
          path: partPath, name: part,
          isDir, isOpen: false, children: [], depth: index
        }
        nodeMap.set(partPath, node)
        parentNode ? parentNode.children.push(node) : root.push(node)
      }
      parentNode = nodeMap.get(partPath)!
      currentPath = partPath
    })
  })

  const sortNodes = (nodes: ZipNode[]) => {
    nodes.sort((a, b) => {
      if (a.isDir && !b.isDir) return -1
      if (!a.isDir && b.isDir) return 1
      return a.name.localeCompare(b.name)
    })
    nodes.forEach(n => n.children.length && sortNodes(n.children))
  }
  sortNodes(root)
  return root
}

/** 模块级内存缓存：同一 repo + 路径在应用生命周期内只请求一次 */
const _treeCache = new Map<string, { files: string[]; rawBase: string }>()

export function useZipTree() {
  const zipFiles = ref<string[]>([])
  const zipRootNodes = ref<ZipNode[]>([])

  // 记录 GitHub Raw Base URL（由代理返回）
  const githubRawBase = ref<string | null>(null)

  /**
   * 加载并预览目录结构
   * @param githubUrl 当前技能的 GitHub URL
   */
  async function loadZipPreview(githubUrl?: string) {
    zipFiles.value = []
    zipRootNodes.value = []
    githubRawBase.value = null

    if (!githubUrl) return

    try {
      // 从 GitHub URL 解析 owner/repo/branch/path
      const regex = /github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+)\/(.+))?/
      const match = githubUrl.match(regex)
      if (!match) return

      const owner = match[1]
      const repo = match[2]
      const branch = match[3] || 'auto'
      const path = match[4] || ''

      // 内存缓存 key（同一 repo + 路径在本次会话内只请求一次）
      const cacheKey = `${owner}/${repo}/${branch}/${path}`
      const cached = _treeCache.get(cacheKey)
      if (cached) {
        zipFiles.value = cached.files
        zipRootNodes.value = buildZipTree(cached.files)
        githubRawBase.value = cached.rawBase
        return
      }

      // 通过服务端代理获取文件树（Nitro 1h 缓存 + 并行分支探测）
      const result = await $fetch<{ files: string[]; defaultBranch: string; rawBase: string }>(
        '/api/github-tree',
        { query: { owner, repo, branch, path } }
      )

      // 写入内存缓存
      _treeCache.set(cacheKey, { files: result.files, rawBase: result.rawBase })

      zipFiles.value = result.files
      zipRootNodes.value = buildZipTree(result.files)
      githubRawBase.value = result.rawBase
    } catch (err) {
      console.error('[useZipTree] 文件树加载失败:', err)
    }
  }

  const showZipPreview = computed(() => zipFiles.value.length > 0)

  const visibleZipNodes = computed(() => {
    const result: ZipNode[] = []
    const traverse = (nodes: ZipNode[]) => {
      nodes.forEach(node => {
        result.push(node)
        if (node.isDir && node.isOpen && node.children.length) {
          traverse(node.children)
        }
      })
    }
    traverse(zipRootNodes.value)
    return result
  })

  function toggleFolder(node: ZipNode) {
    if (node.isDir) node.isOpen = !node.isOpen
  }

  // 读取文件内容：通过 GitHub Raw URL 按需拉取
  async function readZipFile(filePath: string): Promise<string | null> {
    if (githubRawBase.value) {
      try {
        const res = await fetch(`${githubRawBase.value}${filePath}`)
        if (!res.ok) return null
        return await res.text()
      } catch (err) {
        console.error('[useZipTree] GitHub Raw 拉取文件失败:', err)
        return null
      }
    }
    return null
  }

  return {
    zipFiles,
    showZipPreview,
    visibleZipNodes,
    loadZipPreview,
    toggleFolder,
    readZipFile,
  }
}
