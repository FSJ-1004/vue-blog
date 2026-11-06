<script setup>
import { RouterLink } from 'vue-router'
import { shortDate } from '../utils/posts'

defineProps({
  posts: { type: Array, required: true }
})
</script>

<template>
  <article v-for="post in posts" :key="post.slug" class="post-row">
    <div class="post-row__meta">
      <time :datetime="post.date" class="post-row__date">{{ shortDate(post.date) }}</time>
      <span>{{ post.readingTime }} 分钟</span>
    </div>

    <div class="post-row__body">
      <RouterLink :to="`/post/${post.slug}`" class="post-row__title">{{ post.title }}</RouterLink>
      <p class="post-row__summary">{{ post.summary }}</p>

      <div v-if="post.tags.length" class="post-row__tags">
        <RouterLink
          v-for="tag in post.tags"
          :key="tag"
          :to="`/tag/${encodeURIComponent(tag)}`"
          class="tag"
        >
          {{ tag }}
        </RouterLink>
      </div>
    </div>
  </article>
</template>
