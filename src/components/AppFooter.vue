<script setup>
import { site } from '../site.config'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="foot">
    <div class="wrap foot__inner">
      <div>© {{ year }} {{ site.name }} · 用 Vue 3 + Vite 手写</div>
      <div>
        <a :href="`mailto:${site.email}`">邮箱</a>
        &nbsp;·&nbsp;
        <a :href="site.github" target="_blank" rel="noopener">GitHub</a>
        &nbsp;·&nbsp;
        <a href="/rss.xml" target="_blank" rel="noopener">RSS</a>
      </div>
    </div>
  </footer>
</template>
