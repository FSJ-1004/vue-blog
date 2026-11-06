---
title: Vite 为什么比 Webpack 启动快：从 ESM 和按需编译说起
date: 2026-11-05
summary: 打包式构建 vs 基于原生 ESM 的按需加载，从一次「改一行代码等 8 秒」的体验出发，把 Vite 的启动原理讲清楚。
tags: [Vite, 构建工具, 前端工程化]
---

项目从 Webpack 换到 Vite 那天，最直观的变化是冷启动从 8 秒变成了 0.6 秒。很多人把它归结为「Vite 用了 esbuild，所以快」，这个说法只对了一半。真正让启动变快的，是**它根本不在启动时打包**。

## 打包式构建慢在哪

Webpack 的工作方式是：先扫描整个依赖图，把所有模块合并成少数几个 bundle，再交给浏览器。

假设项目有 800 个模块，那么在你敲下 `npm run dev` 之后，它必须把这 800 个模块全部读一遍、编译一遍，才能返回第一个页面。模块越多，等待越久，而且这个成本是**每次冷启动都要付一遍**的。

更糟的是热更新。改了一个文件，Webpack 需要重新计算受影响的模块链，再重新打包这部分。项目一大，改一行 CSS 等五六秒是常态。

## Vite 的做法：让浏览器自己取模块

Vite 在开发阶段几乎不打包。它把源码目录直接当作一个静态服务器，浏览器请求 `main.js` 时，Vite 才把这个文件编译成浏览器能懂的 ESM，然后由浏览器顺着 `import` 语句继续发请求。

```js
// 浏览器实际收到的代码，import 路径被改写成可请求的 URL
import { createApp } from '/node_modules/.vite/deps/vue.js'
import App from '/src/App.vue'
createApp(App).mount('#app')
```

这个过程有三个直接结果：

1. **启动时间和模块总数无关**。哪怕项目有 3000 个文件，只要首屏没用到，Vite 就不会处理它。
2. **热更新只处理当前文件**。改 `App.vue` 就只重新编译 `App.vue`，耗时基本恒定。
3. **缓存粒度更细**。浏览器按 URL 缓存单个模块，改 A 不会让 B 的缓存失效。

## 那 esbuild 和 rollup 在干什么

Vite 内部其实是两套引擎：

- **开发阶段用 esbuild** 做单文件转换（TS 转 JS、SFC 拆分成 template/script/style），因为它是 Go 写的，单文件处理速度比 babel 快一到两个数量级。
- **生产构建用 Rollup** 打包，因为 Rollup 的 tree-shaking 更成熟，产物更小。

所以准确的说法是：esbuild 负责「快」，Rollup 负责「小」，而**不打包**才是开发启动快的根本原因。

## 代价：预构建

不打包会带来一个新问题：一个库可能由几百个小文件组成（比如 lodash-es），浏览器要发几百个请求。所以 Vite 在首次启动时会做一次**依赖预构建**，用 esbuild 把 `node_modules` 里的依赖提前合并成单文件，缓存在 `.vite/deps` 下。

这也解释了为什么第一次启动稍慢、第二次飞快——依赖没变，直接复用缓存。如果遇到「改了依赖版本但行为没变」，可以删掉 `node_modules/.vite` 强制重建。

## 什么时候不适合 Vite

开发体验好不代表没有边界。以下场景要留意：

- 需要兼容不支持 ESM 的老浏览器（如 IE）时，Vite 的 dev 模式跑不起来，只能靠构建产物 + 传统 polyfill。
- 单体仓库里有大量非 ESM 的历史代码，预构建可能失败，需要 `optimizeDeps.include` 手动点名。
- 依赖 CommonJS 深度嵌套的库，偶尔会看到 `Could not resolve` 报错，本质是 CJS 到 ESM 的转换盲区。

我在做非遗那个项目时踩过一次：`element-plus` 按需引入后，部分组件的样式没生效，原因是预构建把样式入口合并了但没被引用。解决方法是把样式入口写进 `optimizeDeps.include`，或者在主入口显式 `import 'element-plus/dist/index.css'`。

## 一句话总结

Vite 的快不是「编译得更快」，而是「把编译推迟到真正需要的时候」。理解了这一点，再看它的缓存策略、预构建、HMR 边界，就都能串起来了。
