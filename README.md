# vue-blog

一个用 **Vue 3 + Vite** 手写的静态博客。没有 Hexo、没有 WordPress、没有数据库——文章就是 `src/posts/` 下的 Markdown 文件，改完 `git push` 就发布。

线上示例：部署后把这里的链接换成你的域名。

## 技术选型

| 选择 | 理由 |
| --- | --- |
| Vue 3 + `<script setup>` | 组合式 API 更贴近实际项目，避免长期停留在选项式写法 |
| Vite | 开发期不打包，冷启动和热更新与项目规模无关 |
| vue-router（history 模式） | URL 干净，可被搜索引擎收录；SPA 兜底交给托管平台 |
| markdown-it | 比 marked 更可控，插件生态成熟；不需要 frontmatter 库，手写解析 |
| highlight.js（core + 按需注册） | 只注册 8 种语言，chunk 从 900KB 降到 20KB |
| 原生 CSS 变量 | 不引 Tailwind，暗色模式靠一份变量表切换，零运行时 |

## 目录结构

```
vue-blog/
├── index.html            # 唯一入口，含防闪烁的主题初始化脚本
├── vite.config.js
├── scripts/
│   └── gen-rss.mjs       # 构建期生成 rss.xml / sitemap.xml
├── public/
│   └── favicon.svg
└── src/
    ├── main.js
    ├── App.vue           # 布局 + 主题状态
    ├── style.css         # 全站样式与设计变量
    ├── site.config.js    # 站点名 / 导航 / 社交链接，改这里改全站
    ├── router/index.js   # 首页同步加载，其余路由懒加载
    ├── utils/posts.js    # 读 Markdown、解析 frontmatter、渲染 HTML
    ├── components/       # AppHeader / AppFooter / PostList
    ├── views/            # Home / Post / Archive / Tags / Tag / About
    └── posts/            # 文章，一个 .md 一篇
```

## 本地运行

```bash
npm install        # 首次
npm run dev        # http://localhost:5173
npm run build      # 产物到 dist/，同时生成 rss.xml 与 sitemap.xml
npm run preview    # 预览构建产物
```

## 写一篇新文章

在 `src/posts/` 新建 `my-post.md`，开头写 frontmatter：

```markdown
---
title: 文章标题
date: 2026-11-06
summary: 一句话摘要，会出现在列表页和 RSS 里
tags: [Vue 3, 笔记]
---

正文从这里开始……
```

文件名就是 URL：`my-post.md` → `/post/my-post`。写完刷新即可看到。

可选字段：`draft: true` 只在 `dev` 环境出现，`build` 时自动排除。

## 部署

**Vercel（推荐）**：导入仓库 → 框架选 Vite → 直接部署。`vue-router` 用 history 模式，需要在仓库根目录放 `vercel.json`：

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

**GitHub Pages**：把 `vite.config.js` 里的 `base` 改成 `/仓库名/`，路由改成 `createWebHashHistory`（Pages 没有服务端 fallback）。

部署后记得把 `src/site.config.js` 的 `url` 改成真实域名，RSS 和 sitemap 里的链接才对。

## 构建数据

`npm run build` 实测（6 篇文章）：

```
dist/index.html                  0.96 kB │ gzip:   0.52 kB
dist/assets/index-*.css         13.74 kB │ gzip:   3.70 kB
dist/assets/highlight-*.js      20.98 kB │ gzip:   8.46 kB
dist/assets/index-*.js         273.78 kB │ gzip: 112.92 kB
各页面路由 chunk                  0.6 - 3.2 kB
```

首页只需要 `index.js` + `index.css`，文章页才加载 `PostView` 与高亮库。

## 踩坑记录

1. **深色模式首屏闪白**：在 `onMounted` 里才读 `localStorage` 会晚一帧，必须先在内联脚本里把 `data-theme` 写进 `documentElement`。顺带修了背景色卡在过渡态的问题。
2. **阅读时间恒为 1 分钟**：统计中文的正则写成了 `/\u4e00-\u9fa5/g`，漏掉方括号，实际只匹配到三个字符。正确写法 `/[\u4e00-\u9fa5]/g`。
3. **`highlight.js` 整包引入 900KB**：改成 `lib/core` + `registerLanguage`，同时给 `js` / `ts` / `sh` 注册别名，否则文章里写 ` ```js ` 不会被高亮。
4. **Windows 换行导致 frontmatter 解析失败**：正则必须写 `\r?\n`，否则本地正常、CI 上挂掉。
5. **`label` 是 inline 元素**：给搜索框设 `max-width` 无效，要加 `display: block`。

## 后续规划

- 全文搜索换成构建期生成的倒排索引，支持正文检索
- 图片自动压缩（sharp + 构建钩子）
- 接入 Giscus 评论（GitHub Discussions，零后端）
- 用 GitHub Actions 跑构建并部署，做一条完整的 CI 流水线

## License

MIT
