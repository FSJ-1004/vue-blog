<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { getPostsByTag } from '../utils/posts'
import PostList from '../components/PostList.vue'

const route = useRoute()
const tag = computed(() => String(route.params.tag || ''))
const posts = computed(() => getPostsByTag(tag.value))
</script>

<template>
  <div class="wrap">
    <header class="page-head">
      <h1># {{ tag }}</h1>
      <p>该标签下共 {{ posts.length }} 篇文章。</p>
    </header>

    <section class="list">
      <PostList v-if="posts.length" :posts="posts" />
      <p v-else class="empty">这个标签下还没有文章。</p>
    </section>
  </div>
</template>
