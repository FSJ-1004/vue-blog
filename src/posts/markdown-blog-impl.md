---
title: 不装 CMS，怎么用 Vue 加 Markdown 搭一个博客
date: 2026-10-16
summary: 这个站点本身是怎么跑起来的：import.meta.glob 读文件、自己解析 frontmatter、按需渲染、构建期生成 RSS。
tags: [Vue 3, Markdown, 项目实践]
---

这个博客没有数据库，没有后台，也没有 Hexo 那种生成器。整站就是一个 Vue 项目，文章是 `src/posts/` 下的 `.md` 文件。这篇记录一下它到底是怎么串起来的。

## 第一步：让打包器认识 Markdown

Vite 提供了 `import.meta.glob`，可以在构建时把一批文件当作模块导入。用 `query: '?raw'` 拿到原文而不是解析结果：

```js
const files = import.meta.glob('../posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
})

// 结果形如：
// { '../posts/vite-dev-server.md': '---\ntitle: ...' }
```

`eager: true` 表示立即加载，适合文章总量在几百篇以内的博客。如果文章上千篇，应该去掉 eager 改成函数形式，配合路由做懒加载：

```js
const files = import.meta.glob('../posts/*.md', { query: '?raw', import: 'default' })
// 调用时才下载：await files['../posts/xxx.md']()
```

这个取舍很重要：`eager` 简单但把全部原文塞进首屏包，不 `eager` 省流量但列表页拿不到标题。折中方案是构建期生成一个 `index.json` 存元信息，正文按需取。

## 第二步：自己解析 frontmatter

常见做法是装 `gray-matter`，但它依赖 js-yaml，体积不小。博客的 frontmatter 只有 `title` / `date` / `tags` / `summary` 四个字段，手写解析完全够用：

```js
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { data: {}, content: raw }

  const data = {}
  match[1].split(/\r?\n/).forEach((line) => {
    const idx = line.indexOf(':')
    if (idx === -1) return
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()
    if (/^\[.*\]$/.test(value)) {
      value = value.slice(1, -1).split(',').map((s) => s.trim())
    }
    data[key] = value
  })
  return { data, content: match[2] }
}
```

**注意正则里的 `\r?\n`**。Windows 上编辑的 md 文件是 CRLF 换行，如果只写 `\n`，在 CI 上会解析失败、在本地却正常——这类问题最难查。

## 第三步：列表页只解析元信息，正文延迟渲染

首屏只需要标题、日期、摘要、标签，不需要每篇文章的 HTML。所以拆成两层：

```js
// 列表：构建时就解析好的元信息
const posts = Object.entries(files).map(([path, raw]) => {
  const slug = path.split('/').pop().replace(/\.md$/, '')
  const { data, content } = parseFrontmatter(raw)
  return { slug, title: data.title, date: data.date, tags: data.tags, content }
})

// 正文：真正打开文章时才 render，并缓存
const htmlCache = new Map()
export function getPostHtml(slug) {
  if (htmlCache.has(slug)) return htmlCache.get(slug)
  const html = md.render(getPostBySlug(slug).content)
  htmlCache.set(slug, html)
  return html
}
```

`htmlCache` 用 `Map` 而不是对象，是因为 `Map` 的 key 可以是任意类型、遍历顺序稳定，也不会意外继承原型链上的属性。

## 第四步：markdown-it 的配置要点

```js
const md = new MarkdownIt({
  html: true,      // 允许文内嵌 HTML（写作时可用 <div class="tip">）
  linkify: true,   // 裸链接自动转 a 标签
  typographer: true,
  highlight(code, lang) {
    // 自己包一层 pre/code，方便注入语言标签和复制按钮
  }
})
```

`html: true` 有 XSS 风险，但这个博客的内容全部由作者本地写入，不走用户输入，因此可以放开。**如果哪天加了评论区或允许投稿，必须换成 `html: false` 或接 DOMPurify。** 这条边界要说清楚，别养成习惯。

代码高亮用 highlight.js 的 `lib/core`，只注册用得到的语言：

```js
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
hljs.registerLanguage('javascript', javascript)
```

只注册 8 种语言后，这个 chunk 从 900KB 降到 120KB 左右。整包引入 `highlight.js` 是最常见的体积陷阱。

## 第五步：构建期生成 RSS

RSS 必须在构建时产出静态文件，所以挂在 `npm run build` 后面：

```json
"build": "vite build && node scripts/gen-rss.mjs"
```

脚本复用同一套 frontmatter 解析逻辑，把 `dist/rss.xml` 写出来。**同一个解析函数被两边引用**，避免了「页面显示的日期」和「RSS 里的日期」对不上这种低级问题。

## 这套方案的边界

说清楚它不能做什么，比吹它能做什么更有说服力：

- **没有后台**：写文章 = 建一个 md 文件 + git push，非技术用户用不了。
- **没有评论**：需要的话接 Giscus（基于 GitHub Discussions），零后端。
- **没有全文搜索索引**：目前是前端过滤标题和摘要，文章多了要上 Fuse.js 或构建期生成倒排索引。
- **图片要自己压**：md 里引用的图片放在 `public/` 下，构建时不做优化，建议用 sharp 写个压缩脚本。

这些恰好是下一步可以迭代的方向，也是简历里「后续规划」可以写的内容。
