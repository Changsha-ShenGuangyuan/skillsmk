/**
 * useSkillDownload
 * 封装技能包下载逻辑
 *
 * 优先使用后端提供的 R2 CDN zip URL 直接下载；
 * 没有 CDN URL 时回退到旧的 GitHub 动态打包逻辑。
 */
import { ref } from 'vue'
import JSZip from 'jszip'

export function useSkillDownload(
  t: (key: string, fallback: string) => string
) {
  const isDownloading = ref(false)

  /**
   * @param githubUrl  GitHub 目录地址
   */
  async function downloadPackage(githubUrl?: string) {
    if (isDownloading.value) return
    isDownloading.value = true

    try {
      // ── 从 GitHub 动态打包下载 ──
      if (!githubUrl) {
        alert(t('detail.noGithubUrl', '暂无下载链接'))
        return
      }

      const regex = /github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+)\/(.+))?/
      const match = githubUrl.match(regex)
      if (!match) throw new Error('无效的 GitHub 链接')

      const owner = match[1]
      const repo = match[2]
      let branch = match[3]
      const path = match[4] || ''

      if (!branch || branch === 'auto') {
        const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`)
        if (!repoRes.ok) throw new Error('获取仓库信息失败')
        branch = (await repoRes.json()).default_branch || 'main'
      }

      const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
      const treeRes = await fetch(treeUrl)
      if (!treeRes.ok) throw new Error('提取目录树失败')
      const treeData = await treeRes.json()

      const zip = new JSZip()
      const targetPrefix = path ? (path.endsWith('/') ? path : path + '/') : ''
      const files = treeData.tree.filter((item: any) => item.type === 'blob' && item.path.startsWith(targetPrefix))

      if (files.length === 0) throw new Error('此路径下没有找到文件')

      const fetchPromises = files.map(async (item: any) => {
        const fileUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${item.path}`
        const fileRes = await fetch(fileUrl)
        if (!fileRes.ok) throw new Error(`获取文件失败: ${item.path}`)
        const arrayBuffer = await fileRes.arrayBuffer()
        const relativePath = targetPrefix ? item.path.substring(targetPrefix.length) : item.path
        zip.file(relativePath, arrayBuffer)
      })

      await Promise.all(fetchPromises)
      const content = await zip.generateAsync({ type: 'blob' })

      const link = document.createElement('a')
      link.href = URL.createObjectURL(content)
      // 取路径最后一段作为文件名（技能目录名），避免拼接成超长名称
      const skillDirName = path ? path.split('/').filter(Boolean).pop() || repo : repo
      link.download = `${skillDirName}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)

    } catch (error: any) {
      console.error('[Download]', error)
      alert(`${t('detail.downloadFailed', '下载失败：')}${error.message}`)
    } finally {
      isDownloading.value = false
    }
  }

  return { isDownloading, downloadPackage }
}
