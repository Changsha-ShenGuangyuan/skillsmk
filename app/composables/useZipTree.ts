/**
 * useZipTree
 * 封装 ZIP 目录预览的构建与交互逻辑
 *
 * loadZipPreview 支持两种方式：
 *   - cdnUrl（优先）：直接从 R2 CDN 拉取 zip
 *   - localId（回退）：从本地 /downloads/{id}.zip 拉取（旧方式）
 */
import { ref, computed } from 'vue'
import JSZip from 'jszip'

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

export function useZipTree() {
  const zipFiles = ref<string[]>([])
  const zipRootNodes = ref<ZipNode[]>([])
  const zipInstance = ref<JSZip | null>(null)
  
  // 记录 fallback 使用的 GitHub Raw Base URL
  const githubRawBase = ref<string | null>(null)

  /**
   * 加载并预览 ZIP 目录结构
   * @param githubUrl 当前技能的 GitHub URL（通过 API 获取目录结构用于展示）
   */
  async function loadZipPreview(githubUrl?: string) {
    zipFiles.value = []
    zipRootNodes.value = []
    zipInstance.value = null
    githubRawBase.value = null

    if (!githubUrl) return

    // 从 GitHub 接口拉取目录结构数据（无内容预览，仅看目录树）
    try {
      const regex = /github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+)\/(.+))?/
      const match = githubUrl.match(regex)
      if (!match) return

      const owner = match[1]
      const repo = match[2]
      let branch = match[3]
      const path = match[4] || ''

      if (!branch || branch === 'auto') {
        try {
          const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`)
          if (repoRes.ok) {
            const repoData = await repoRes.json()
            branch = repoData.default_branch || 'main'
          } else {
            branch = 'main'
          }
        } catch {
          branch = 'main'
        }
      }

      // 保存 Raw Base，用于动态读取单个文件
      const targetPrefix = path ? (path.endsWith('/') ? path : path + '/') : ''
      githubRawBase.value = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${targetPrefix}`

      const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`)
      if (!treeRes.ok) return
      const treeData = await treeRes.json()

      const files: string[] = treeData.tree
        .filter((item: any) => item.type === 'blob' && item.path.startsWith(targetPrefix))
        .map((item: any) => targetPrefix ? item.path.substring(targetPrefix.length) : item.path)

      zipFiles.value = files
      zipRootNodes.value = buildZipTree(files)
    } catch (err) {
      console.error('[useZipTree] GitHub Tree 拉取失败:', err)
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

  // 读取文件内容：优先从内存 zip 提取，如果没有 zip 实例但有 raw base，则按需通过网络拉取
  async function readZipFile(filePath: string): Promise<string | null> {
    if (zipInstance.value) {
      const file = zipInstance.value.file(filePath)
      if (!file) return null
      try {
        return await file.async('text')
      } catch {
        return null
      }
    }
    
    // 如果没有本地 zip 实例，则尝试通过 GitHub Raw 动态读取
    if (githubRawBase.value) {
      try {
        // githubRawBase 已经包含了 targetPrefix 目录，直接拼相对文件路径即可
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
