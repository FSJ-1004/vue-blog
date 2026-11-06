<script setup>
import { RouterLink } from 'vue-router'
import { getAllPosts, getAllTags } from '../utils/posts'

const tags = getAllTags()
const total = getAllPosts().length
</script>

<template>
  <div class="wrap">
    <header class="page-head">
      <h1>标签</h1>
      <p>{{ tags.length }} 个标签，覆盖 {{ total }} 篇文章。点任意标签看该主题下的全部内容。</p>
    </header>

    <div class="tag-cloud">
      <RouterLink
        v-for="tag in tags"
        :key="tag.name"
        :to="`/tag/${encodeURIComponent(tag.name)}`"
        class="tag tag--lg"
      >
        <span class="tag__dot" aria-hidden="true"></span>
        {{ tag.name }}
        <span class="search__count">{{ tag.count }}</span>
      </RouterLink>
    </div>
  </div>
</template>
