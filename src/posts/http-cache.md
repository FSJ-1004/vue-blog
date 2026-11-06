---
title: 浏览器缓存到底怎么配：强缓存、协商缓存与一次真实的线上事故
date: 2026-09-30
summary: 从「用户更新了版本却还看到旧页面」出发，把 Cache-Control、ETag、Last-Modified 讲明白，并给出前后端都能用的落地配置。
tags: [HTTP, 性能优化, 浏览器]
---

去年做非遗项目上线时，改了一版页面，用户反馈「还是老样子」。我第一反应是没发版，查了服务器文件时间才发现早就更新了——是缓存惹的祸。

## 缓存的两种决策路径

浏览器拿到一个资源请求后，会先看本地有没有副本。判断逻辑分两级：

1. **强缓存**：本地副本还在有效期内，直接用，**连请求都不发**。
2. **协商缓存**：有效期过了，带上一段「凭证」去问服务器「我这份还能用吗」。服务器说能用（304），就不重新下载；说不能用，才返回新内容。

理解这两级的区别，是配缓存的前提。

## 强缓存：Cache-Control

```http
Cache-Control: max-age=31536000, immutable
```

- `max-age` 单位是秒，表示从响应时间起算的有效期。
- `immutable` 告诉浏览器「这个 URL 的内容永远不变」，用户按刷新（F5）也不会重新请求，只有强制刷新（Ctrl+F5）才会。
- `no-cache` 不是不缓存，而是**每次都要协商**，很多人被这个名字误导。
- `no-store` 才是完全不存。

优先级上，`Cache-Control` 高于 `Expires`（后者是 HTTP/1.0 的绝对时间，容易被客户端时钟影响），现代项目直接写 `Cache-Control` 就行。

## 协商缓存：ETag 和 Last-Modified

```http
# 服务器返回
ETag: "a1b2c3"
Last-Modified: Tue, 06 Oct 2026 08:00:00 GMT

# 客户端下次请求带上
If-None-Match: "a1b2c3"
If-Modified-Since: Tue, 06 Oct 2026 08:00:00 GMT
```

两者都命中，服务器返回 `304 Not Modified`，响应体为空——省的是带宽和重新解析的时间，但请求本身还是发出去了。

**ETag 优先于 Last-Modified**。原因是 `Last-Modified` 只精确到秒，一秒内改两次就判断不出来；而且文件「修改时间变了但内容没变」会导致无意义的 304 失败。

ETag 也分强弱：

- `ETag: "abc"` 强校验，内容有任何字节变化就失效。
- `ETag: W/"abc"` 弱校验，语义等价即可复用，适合压缩后的响应。

## 事故复盘：问题出在 index.html

那次我的配置是「全部资源 max-age=1 年」。页面文件名带 hash 的没问题，但 `index.html` 也被缓存了一年，于是它指着旧 hash 的文件名，新版本永远拿不到。

正确策略是按文件类型分开：

| 资源 | 策略 | 原因 |
| --- | --- | --- |
| `index.html` | `no-cache`（每次协商） | 它是入口，必须拿到最新 |
| `/assets/*.[hash].js` | `max-age=31536000, immutable` | 文件名带 hash，内容变了文件名就变 |
| 图片 / 字体 | `max-age=604800` 起 | 体积大、变更少 |
| 接口响应 | `no-store` 或短 max-age | 数据时效性强 |

一句话原则：**入口文件不缓存，带指纹的资源长缓存**。

## 前端能做的两件事

配置通常在后端或 CDN，但前端有两个动作能直接减少损失：

1. **确保构建产物文件名带 hash**。Vite 默认就是 `index-a1b2c3.js`，别手动关掉 `build.rollupOptions.output` 里的 hash。
2. **版本切换后强制刷新一次**。监听新版本时可以在页面弹一个「有新版本，点击刷新」的提示，比用户自己发现好得多。

```js
// 极简版本检测：轮询当前页面的 ETag 或版本号文件
async function checkUpdate() {
  const res = await fetch('/version.json', { cache: 'no-store' })
  const { version } = await res.json()
  if (version !== __APP_VERSION__) showUpdateToast()
}
```

`cache: 'no-store'` 在这里是必须的，否则检测请求自己也会被缓存，永远发现不了新版本。

## 验证方法

改完配置别信直觉，打开开发者工具看两处：

- **Network 面板**：状态码 200（from disk cache）/ 304 / 200 分别对应命中强缓存、协商成功、全新下载。
- **Response Headers**：确认 `Cache-Control` 真的生效，而不是被 CDN 覆盖成默认值。

CDN 覆盖是很常见的坑：源站配了 `no-cache`，但 CDN 默认缓存 30 天，用户看到的还是旧文件。这时候要去 CDN 控制台改缓存规则，或者给 URL 加版本参数绕过。
