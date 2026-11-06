<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { getAllPosts, shortDate } from '../utils/posts'

const posts = getAllPosts()

// 按年份分组：{ 2026: [...], 2025: [...] }
const groups = computed(() => {
  const map = new Map()
  posts.forEach((p) => {
    const year = p.date.slice(0, 4)
    if (!map.has(year)) map.set(year, [])
    map.get(year).push(p)
  })
  return [...map.entries()].sort((a, b) => b[0] - a[0])
})
</script>

<template>
  <div class="wrap">
    <header class="page-head">
      <h1>归档</h1>
      <p>共 {{ posts.length }} 篇，按时间倒序排列。写作时间线本身也是学习路径的记录。</p>
    </header>

    <section class="archive">
      <div v-for="[year, items] in groups" :key="year" class="year-block">
        <div class="year-label">{{ year }}</div>
        <div class="year-items">
          <RouterLink
            v-for="post in items"
            :key="post.slug"
            :to="`/post/${post.slug}`"
            class="year-item"
          >
            <span class="year-item__date">{{ shortDate(post.date) }}</span>
            <span class="year-item__title">{{ post.title }}</span>
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>
