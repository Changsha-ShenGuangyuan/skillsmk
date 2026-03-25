/**
 * useMarkdownRenderer — 动态导入版
 *
 * highlight.js（264KB）和 marked（153KB）改为动态异步导入，
 * 让这两个大库从主 chunk 中完全剥离，只在 skill 详情页首次调用时懒加载，
 * 其他页面（首页、排行榜等）完全不加载这两个库，显著减少初始 JS 体积。
 */

// 懒初始化：只在第一次调用时执行，后续复用同一个 Promise
let _markedPromise: Promise<typeof import('marked').marked> | null = null

async function getMarked() {
  if (!_markedPromise) {
    _markedPromise = (async () => {
      // 动态导入 marked 和 highlight.js，Vite 会自动拆分为独立 chunk
      const [{ marked }, hljs, langBash, langPython, langJs, langTs, langJson, langYaml, langMd, langXml, langPlaintext] =
        await Promise.all([
          import('marked'),
          import('highlight.js/lib/core'),
          import('highlight.js/lib/languages/bash'),
          import('highlight.js/lib/languages/python'),
          import('highlight.js/lib/languages/javascript'),
          import('highlight.js/lib/languages/typescript'),
          import('highlight.js/lib/languages/json'),
          import('highlight.js/lib/languages/yaml'),
          import('highlight.js/lib/languages/markdown'),
          import('highlight.js/lib/languages/xml'),
          import('highlight.js/lib/languages/plaintext'),
        ])

      // 动态注入 highlight.js 的 CSS（客户端）
      if (import.meta.client) {
        await import('highlight.js/styles/github-dark.css')
      }

      // 注册语言（只注册 SKILL.md 中常见语言）
      const h = hljs.default
      h.registerLanguage('bash',       langBash.default)
      h.registerLanguage('sh',         langBash.default)
      h.registerLanguage('shell',      langBash.default)
      h.registerLanguage('python',     langPython.default)
      h.registerLanguage('javascript', langJs.default)
      h.registerLanguage('js',         langJs.default)
      h.registerLanguage('typescript', langTs.default)
      h.registerLanguage('ts',         langTs.default)
      h.registerLanguage('json',       langJson.default)
      h.registerLanguage('yaml',       langYaml.default)
      h.registerLanguage('yml',        langYaml.default)
      h.registerLanguage('markdown',   langMd.default)
      h.registerLanguage('xml',        langXml.default)
      h.registerLanguage('html',       langXml.default)
      h.registerLanguage('plaintext',  langPlaintext.default)

      // 自定义 renderer：高亮代码块 + 语言标识栏
      const renderer = new marked.Renderer()
      renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
        const language = lang && h.getLanguage(lang) ? lang : 'plaintext'
        const highlighted = h.highlight(text, { language }).value
        const langLabel = lang || ''
        return `<div class="md-code-block">${
          langLabel ? `<div class="md-code-lang">${langLabel}</div>` : ''
        }<pre><code class="hljs language-${language}">${highlighted}</code></pre></div>`
      }
      marked.use({ renderer })

      return marked
    })()
  }
  return _markedPromise
}

/**
 * 渲染 Markdown 字符串为 HTML（异步，首次调用时懒加载依赖库）
 */
export async function marked(src: string): Promise<string> {
  const markedFn = await getMarked()
  return markedFn(src) as string
}
