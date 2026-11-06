<script setup>
import { site } from '../site.config'

// 技能条只是视觉呈现，levels 按自己的真实掌握程度改（0-100）
const skills = [
  { name: 'Vue 3 / 组件化', level: 82, label: '熟练' },
  { name: 'JavaScript / ES6+', level: 78, label: '熟练' },
  { name: 'CSS / 响应式布局', level: 80, label: '熟练' },
  { name: 'Vite / 构建工具', level: 70, label: '掌握' },
  { name: 'Node.js / Express', level: 65, label: '掌握' },
  { name: 'MySQL / SQL', level: 62, label: '掌握' },
  { name: 'Git / 协作流程', level: 68, label: '掌握' }
]

const projects = [
  {
    name: '非遗数字化展示平台',
    role: '前端 + 接口联调',
    desc: 'Vue 3 + Vite + Element Plus + Express + MySQL。实现用户系统、个人中心、购物车与后台管理，部署于阿里云。',
    tags: ['Vue 3', 'Element Plus', 'Express', 'MySQL']
  },
  {
    name: '本博客（vue-blog）',
    role: '独立开发',
    desc: '手写 Markdown 解析与路由体系，实现标签、归档、全文搜索、代码高亮、暗色主题与 RSS 输出。',
    tags: ['Vue 3', 'Vite', 'markdown-it']
  }
]
</script>

<template>
  <div class="wrap">
    <header class="page-head">
      <h1>关于我</h1>
      <p>{{ site.status }}</p>
    </header>

    <section class="about">
      <p class="about__lead">
        我是 {{ site.name }}，计算机（移动互联应用技术）专业学生，2027 届。喜欢把学到的东西写成能跑起来的代码，
        也喜欢把踩过的坑写清楚——这份笔记就是产物。
      </p>

      <div class="section">
        <div class="section__title">基本信息</div>
        <div class="kv-list">
          <div class="kv">
            <span class="kv__k">方向</span>
            <span class="kv__v">前端开发（Vue 技术栈），兼顾 Node 接口联调</span>
          </div>
          <div class="kv">
            <span class="kv__k">学校</span>
            <span class="kv__v">北京工业职业技术学院 · 移动互联应用技术</span>
          </div>
          <div class="kv">
            <span class="kv__k">毕业</span>
            <span class="kv__v">2027 年 6 月</span>
          </div>
          <div class="kv">
            <span class="kv__k">荣誉</span>
            <span class="kv__v">北京市职业院校技能大赛二等奖 · “挑战杯”三等奖</span>
          </div>
          <div class="kv">
            <span class="kv__k">联系</span>
            <span class="kv__v">
              <a :href="`mailto:${site.email}`">{{ site.email }}</a>
              ·
              <a :href="site.github" target="_blank" rel="noopener">GitHub</a>
            </span>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section__title">技术栈</div>
        <div class="skills">
          <div v-for="s in skills" :key="s.name" class="skill">
            <span>{{ s.name }}</span>
            <span class="skill__bar">
              <span class="skill__fill" :style="{ width: s.level + '%' }"></span>
            </span>
            <span class="skill__level">{{ s.label }}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section__title">项目</div>
        <div class="kv-list">
          <div v-for="p in projects" :key="p.name" class="kv">
            <span class="kv__k">{{ p.role }}</span>
            <span class="kv__v">
              <strong>{{ p.name }}</strong> —— {{ p.desc }}
            </span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
