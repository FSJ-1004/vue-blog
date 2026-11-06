import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import css from 'highlight.js/lib/languages/css'
import xml from 'highlight.js/lib/languages/xml'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'
import markdown from 'highlight.js/lib/languages/markdown'

// 只注册用得到的语言，比整包引入少几百 KB。
// 这是构建体积优化里最容易被忽略、收益又很直观的一步。
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript) // 文章里习惯写 ```js，别名必须手动注册
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('css', css)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('vue', xml)
hljs.registerLanguage('json', json)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('md', markdown)

const md = new MarkdownIt({
  html: true, // 文章是作者自己写的，允许内嵌少量 HTML 做提示块
  linkify: true,
  typographer: true,
  highlight(code, lang) {
    const tag = lang ? `<span class="code-lang">${escapeHtml(lang)}</span>` : ''
    if (lang && hljs.getLanguage(lang)) {
      const highlighted = hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
      return `<pre class="code-block">${tag}<code class="hljs">${highlighted}</code></pre>`
    }
    return `<pre class="code-block">${tag}<code class="hljs">${escapeHtml(code)}</code></pre>`
  }
})

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * 极简 frontmatter 解析：只支持 `key: value` 和 `tags: [a, b]` 两种写法。
 * 不引第三方 YAML 库，是为了让构建产物少一个依赖，也方便面试时讲清原理。
 */
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { data: {}, content: raw }

  const data = {}
  match[1].split(/\r?\n/).forEach((line) => {
    const idx = line.indexOf(':')
    if (idx === -1) return
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()
    if (!key) return
    if (/^\[.*\]$/.test(value)) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
    } else {
      value = value.replace(/^['"]|['"]$/g, '')
    }
    data[key] = value
  })
  return { data, content: match[2] }
}

// 中文按 400 字/分钟估，英文按 200 词/分钟，够用，不用装库
function estimateReadingTime(text) {
  const cn = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const en = (text.match(/[a-zA-Z]+/g) || []).length
  return Math.max(1, Math.round(cn / 400 + en / 200))
}

function stripMarkdown(text) {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*`_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// eager + raw：构建时就把所有 md 的原文打进包，首次进入即可拿到文章列表。
// 正文 HTML 延迟到真正打开文章时才渲染，首页不用为全部文章付出解析成本。
const files = import.meta.glob('../posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
})

const posts = Object.entries(files).map(([path, raw]) => {
  const slug = path.split('/').pop().replace(/\.md$/, '')
  const { data, content } = parseFrontmatter(raw)
  const plain = stripMarkdown(content)
  return {
    slug,
    title: data.title || slug,
    date: data.date || '1970-01-01',
    summary: data.summary || plain.slice(0, 90),
    tags: Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : [],
    draft: data.draft === 'true',
    readingTime: estimateReadingTime(content),
    content
  }
})

// 草稿只在 dev 环境出现，打包后自动消失
const visible = posts
  .filter((p) => !p.draft || import.meta.env.DEV)
  .sort((a, b) => (a.date < b.date ? 1 : -1))

const htmlCache = new Map()

export function getAllPosts() {
  return visible
}

export function getPostBySlug(slug) {
  return visible.find((p) => p.slug === slug)
}

export function getPostHtml(slug) {
  if (htmlCache.has(slug)) return htmlCache.get(slug)
  const post = getPostBySlug(slug)
  if (!post) return ''
  const html = md.render(post.content)
  htmlCache.set(slug, html)
  return html
}

export function getAllTags() {
  const map = new Map()
  visible.forEach((post) => {
    post.tags.forEach((tag) => {
      map.set(tag, (map.get(tag) || 0) + 1)
    })
  })
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

export function getPostsByTag(tag) {
  return visible.filter((p) => p.tags.includes(tag))
}

export function getAdjacentPosts(slug) {
  const idx = visible.findIndex((p) => p.slug === slug)
  return {
    prev: idx > 0 ? visible[idx - 1] : null,
    next: idx > -1 && idx < visible.length - 1 ? visible[idx + 1] : null
  }
}

export function formatDate(str) {
  const [y, m, d] = str.split('-')
  return `${y} 年 ${Number(m)} 月 ${Number(d)} 日`
}

export function shortDate(str) {
  return str.slice(2).replace(/-/g, '.')
}
