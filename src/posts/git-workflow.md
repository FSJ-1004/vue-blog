---
title: 实习生也能写好的 Git 提交：从 commit message 到分支模型
date: 2026-07-15
summary: 面试官会翻你的 GitHub。一个提交信息混乱的仓库，比一个功能简单的仓库更容易被扣分。这里是最小可用的规范。
tags: [Git, 团队协作, 工程化]
---

面试时被问到「你平时怎么用 Git」，如果回答只有 `git add .` 和 `git commit -m "update"`，会显得像只用过单人仓库。其实不需要学多复杂的分支模型，把三件事做好就够了。

## 一、提交信息：写清楚「为什么」

约定式提交（Conventional Commits）的核心不是格式，而是**让每个提交只说一件事**：

```
feat(post): 文章页支持代码块一键复制
fix(cache): 修正 index.html 被强缓存导致的不更新
docs(readme): 补充部署到 Vercel 的步骤
refactor(utils): 把 frontmatter 解析抽成独立函数
style(css): 统一标签色板，去掉三处硬编码色值
perf(build): 只注册用到的 highlight 语言，chunk 减少 780KB
```

三个要点：

- **类型前缀**：`feat` / `fix` / `docs` / `refactor` / `style` / `perf` / `test` / `chore`。
- **作用域**：括号里写模块名，方便按模块过滤日志。
- **正文说明动机**：如果一句话说不清「为什么改」，就在第二行空一格后补充。三个月后你自己也需要这段信息。

反例是那种一次提交改了 20 个文件、信息写「修改」的记录。它让 `git log` 失去价值，也让出问题时无法用 `git bisect` 定位。

## 二、分支：一条主线加短命分支

小团队或个人项目用这套就够：

```
main ─────────●────────●────────●──→
        \    /          /
         feat/a       fix/b
```

- `main` 保持随时可部署。
- 每个功能或修复开一条分支，命名 `feat/xxx`、`fix/xxx`。
- 完成后合并回 `main`，分支立刻删掉，不留长命分支。

长命分支（比如 `dev` 和 `release` 长期并存）在人多、发版周期长时才需要。个人项目搞多分支只会制造合并冲突。

## 三、冲突真的发生了怎么办

冲突不是错误，是「两个人改了同一处」。处理的顺序：

```bash
git switch feat/my-work
git fetch origin
git rebase origin/main      # 把自己的提交挪到最新 main 之上
# 解决冲突后
git add <冲突文件>
git rebase --continue
```

选 `rebase` 还是 `merge`，判断标准是**这条分支有没有别人在用**：

- 只有自己在用 → `rebase`，历史是一条直线，`git log` 好看。
- 已经推给同事 → `merge`，千万别对公共分支做 rebase，会改写别人的历史。

**冲突解决时最容易犯的错**是直接把文件改成「我的版本」或者「他的版本」，把对方的改动全丢掉。正确做法是逐个冲突块看上下文，两侧逻辑都要保住。

## 四、让仓库看起来「像样」

面试官打开你的仓库，往往只花 30 秒。这 30 秒里他会看：

1. **README 第一屏**：项目是什么、怎么跑起来、截图或链接。三行命令能本地启动，比十段介绍有用。
2. **提交记录的时间分布**：连续几个月有提交，说明是真的在做；一周内 200 个提交然后半年没有，说明是赶出来的。
3. **目录结构**：有没有 `.gitignore`、有没有把 `node_modules` 传上去。
4. **有没有 release / Actions**：加一个 GitHub Actions 跑构建，成本很低，但能体现工程意识。

`.gitignore` 至少包含：

```gitignore
node_modules/
dist/
.vite/
*.local
.DS_Store
```

把 `node_modules` 提交上去是新手最常见的减分项，仓库体积能到几百 MB。

## 五、几个救命的命令

- `git log --oneline --graph --all` —— 一眼看清分支结构。
- `git reset --soft HEAD~1` —— 撤销最近一次提交但保留改动，改完信息重新提交。
- `git stash` / `git stash pop` —— 切分支前暂存没写完的代码。
- `git reflog` —— 误删分支、误 reset 后的后悔药，几乎能找回任何一次 HEAD 移动。
- `git diff --stat` —— 提交前确认改了哪些文件，避免把调试代码发上去。

`git reflog` 尤其值得记住。它记录本地所有 HEAD 变化，比 `git log` 的覆盖面大得多，误操作后先想到它。

## 小结

不需要背完整的分支模型。把提交信息写清楚、分支保持短命、冲突时两边逻辑都保住、README 能让人三分钟跑起来——做到这四条，你的仓库在面试官眼里就已经过了及格线。
