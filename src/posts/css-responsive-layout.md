---
title: 先写 375px：一套不返工的响应式布局流程
date: 2026-08-22
summary: 从窄屏起步而不是从桌面往回压，配合 grid、min-width: 0 和断点选择，把移动端适配做在前面而不是事后打补丁。
tags: [CSS, 响应式, 布局]
---

大多数响应式出问题，不是因为不会写 `@media`，而是**顺序错了**：先按桌面画好，再用 `max-width` 一条条往回压。压到最后一定会有某个元素被挤成一条线。

## 为什么应该先写 375px

移动端是约束最强的场景：屏幕最窄、可点区域最小、字号压力最大。先在最紧的约束下把信息层级排顺，桌面只是「有更多空间时展开」。

反过来做的话，你已经为一个宽屏设计了双栏、侧边栏、绝对定位的装饰层，这些结构在 375px 上没有地方放，只能靠 `display: none` 藏起来——藏得越多，两套代码的差异越大，维护成本翻倍。

## 断点的选择

不要盯着 iPhone 的具体机型。按内容密度选两个断点就够：

```css
/* 基础样式：375px 起，单列 */
.card-list { display: grid; grid-template-columns: 1fr; gap: 16px; }

/* 平板及以上 */
@media (min-width: 768px) {
  .card-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

/* 桌面 */
@media (min-width: 1024px) {
  .card-list { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
```

两个细节：

- **显式写列数，不用 `auto-fit` / `auto-fill`。** 它们在中间宽度可能算出 3 列，把卡片压成 100px 宽，中文变成一字一行。
- **`minmax(0, 1fr)` 里的 0 不能省。** `1fr` 的默认最小值是 `auto`，遇到长英文单词或长 URL 时，列会被撑破，溢出容器。

## 三个高频语法坑

**1. flex 子项要写 `min-width: 0`**

```css
.row { display: flex; gap: 12px; }
.row__text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
```

flex 子项的默认 `min-width` 是 `auto`，意味着「不许比内容更窄」。长文本会直接撑出容器，省略号失效。

**2. 图片防止溢出**

```css
img { max-width: 100%; height: auto; display: block; }
```

`display: block` 是为了去掉 inline 元素底部的基线空隙——那个 3px 的缝在卡片里特别明显。

**3. 移动端字号**

- 正文 ≥ 14px，说明文字 ≥ 13px。
- `<input>` / `<textarea>` **必须 ≥ 16px**，否则 iOS Safari 聚焦时会自动放大页面，用户再也缩放不回去。

## 用 clamp 减少断点数量

如果只是字号或间距随屏幕变化，不需要额外断点：

```css
.hero__title {
  font-size: clamp(1.75rem, 4vw + 1rem, 2.875rem);
}
```

`clamp(最小值, 弹性值, 最大值)` 一步搞定。注意中间项要用 `vw + rem` 的形式，纯 `vw` 在小屏上会缩得过头。

## 触摸等价路径

这个坑在桌面测试时完全看不出来：hover 才出现的内容，手机上永远出不来。

处理原则很简单——**凡是 hover 才有的信息，必须有 click 能到达的方式**：

```css
@media (hover: hover) and (pointer: fine) {
  .card:hover .card__actions { opacity: 1; }
}
```

把 hover 效果整体包进 `@media (hover: hover)`，桌面才启用；移动端直接把操作按钮常驻显示。这比用 `.touch` 类名判断设备可靠得多，因为它检测的是**指针能力**而不是设备型号（带触屏的笔记本也能正确命中）。

## 检查清单

发布前对着手机过一遍：

- 横向不出现滚动条（出现说明某个元素溢出了）
- 手指能点到所有按钮，热区不小于 44×44px
- 长标题、长英文、长 URL 不撑破卡片
- 双指缩放没被禁用（不要写 `user-scalable=no`）
- 关键内容不需要横向滚动才能看全

这五条都过了，基本不会在真机上翻车。
