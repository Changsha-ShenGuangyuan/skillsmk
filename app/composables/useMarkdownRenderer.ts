/**
 * useMarkdownRenderer
 * 封装 highlight.js 注册 + marked 自定义 renderer
 * 供需要渲染 Markdown 的组件复用
 */
import { marked } from 'marked'
import hljs from 'highlight.js/lib/core'
import 'highlight.js/styles/github-dark.css'

import langBash       from 'highlight.js/lib/languages/bash'
import langPython     from 'highlight.js/lib/languages/python'
import langJavascript from 'highlight.js/lib/languages/javascript'
import langTypescript from 'highlight.js/lib/languages/typescript'
import langJson       from 'highlight.js/lib/languages/json'
import langYaml       from 'highlight.js/lib/languages/yaml'
import langMarkdown   from 'highlight.js/lib/languages/markdown'
import langXml        from 'highlight.js/lib/languages/xml'
import langPlaintext  from 'highlight.js/lib/languages/plaintext'

// 只注册 SKILL.md 中常见语言（避免全量打包）
hljs.registerLanguage('bash',       langBash)
hljs.registerLanguage('sh',         langBash)
hljs.registerLanguage('shell',      langBash)
hljs.registerLanguage('python',     langPython)
hljs.registerLanguage('javascript', langJavascript)
hljs.registerLanguage('js',         langJavascript)
hljs.registerLanguage('typescript', langTypescript)
hljs.registerLanguage('ts',         langTypescript)
hljs.registerLanguage('json',       langJson)
hljs.registerLanguage('yaml',       langYaml)
hljs.registerLanguage('yml',        langYaml)
hljs.registerLanguage('markdown',   langMarkdown)
hljs.registerLanguage('xml',        langXml)
hljs.registerLanguage('html',       langXml)
hljs.registerLanguage('plaintext',  langPlaintext)

// 自定义 renderer：高亮代码块 + 语言标识栏
const renderer = new marked.Renderer()
renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
  const highlighted = hljs.highlight(text, { language }).value
  const langLabel = lang || ''
  return `<div class="md-code-block">${
    langLabel ? `<div class="md-code-lang">${langLabel}</div>` : ''
  }<pre><code class="hljs language-${language}">${highlighted}</code></pre></div>`
}
marked.use({ renderer })

export { marked, hljs }
