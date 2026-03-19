import fs from 'node:fs'
import path from 'node:path'

const localesDir = path.resolve('app/i18n/locales')
const langs = ['zh', 'en', 'ar', 'de', 'es', 'fr', 'ja', 'ko', 'pt']
const modules = [
  'categories', 'common', 'faq', 'footer', 'header', 'howItWorks',
  'leaderboard', 'notFound', 'search', 'skillCard', 'skillDetail', 'terms'
]

langs.forEach(lang => {
  const content = `\
${modules.map(mod => `import ${mod} from './${lang}/${mod}'`).join('\n')}

export default {
${modules.map(mod => `  ...${mod}`).join(',\n')}
}
`
  fs.writeFileSync(path.join(localesDir, `${lang}.ts`), content, 'utf-8')
  console.log(`Generated ${lang}.ts`)
})
