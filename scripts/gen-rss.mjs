// 构建期生成 rss.xml 与 sitemap.xml。
// 挂在 `vite build` 之后执行，产物直接落在 dist/ 里。
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { site } from '../src/site.config.js'

const root = dirname(fileURLToPath(import.meta.url))
const postsDir = join(root, '../src/posts')
const distDir = join(root, '../dist')

// 与 src/utils/posts.js 保持同一套解析规则
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

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const posts = readdirSync(postsDir)
  .filter((f) => f.endsWith('.md'))
  .map((f) => {
    const raw = readFileSync(join(postsDir, f), 'utf8')
    const { data } = parseFrontmatter(raw)
    return {
      slug: f.replace(/\.md$/, ''),
      title: data.title || f,
      date: data.date || '1970-01-01',
      summary: data.summary || '',
      draft: data.draft === 'true'
    }
  })
  .filter((p) => !p.draft)
  .sort((a, b) => (a.date < b.date ? 1 : -1))

const base = site.url.replace(/\/$/, '')

const items = posts
  .map(
    (p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${base}/post/${p.slug}</link>
      <guid isPermaLink="true">${base}/post/${p.slug}</guid>
      <description>${escapeXml(p.summary)}</description>
      <pubDate>${new Date(p.date + 'T08:00:00+08:00').toUTCString()}</pubDate>
    </item>`
  )
  .join('\n')

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(site.title)}</title>
    <link>${base}</link>
    <description>${escapeXml(site.description)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`

const urls = [
  { loc: `${base}/`, priority: '1.0' },
  { loc: `${base}/archive`, priority: '0.7' },
  { loc: `${base}/tags`, priority: '0.6' },
  { loc: `${base}/about`, priority: '0.6' },
  ...posts.map((p) => ({ loc: `${base}/post/${p.slug}`, priority: '0.8', lastmod: p.date }))
]

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.priority}</priority></url>`
  )
  .join('\n')}
</urlset>
`

writeFileSync(join(distDir, 'rss.xml'), rss)
writeFileSync(join(distDir, 'sitemap.xml'), sitemap)
console.log(`[gen-rss] 已生成 ${posts.length} 篇文章的 rss.xml 与 sitemap.xml`)
