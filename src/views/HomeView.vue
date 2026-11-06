<script setup>
import { computed, ref } from 'vue'
import { site } from '../site.config'
import { getAllPosts, getAllTags } from '../utils/posts'
import PostList from '../components/PostList.vue'

const posts = getAllPosts()
const keyword = ref('')

// 关键词过滤：标题、摘要、标签三处命中就算
const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return posts
  return posts.filter((p) => {
    return (
      p.title.toLowerCase().includes(kw) ||
      p.summary.toLowerCase().includes(kw) ||
      p.tags.some((t) => t.toLowerCase().includes(kw))
    )
  })
})

const totalWords = computed(() =>
  posts.reduce((sum, p) => sum + p.readingTime, 0)
)
</script>

<template>
  <section class="hero">
    <div class="wrap hero__grid">
      <div>
        <div class="hero__eyebrow">Notes on the web</div>
        <h1 class="hero__title">
          把学过的前端<br />写成<em>可验证的笔记</em>
        </h1>
        <p class="hero__desc">{{ site.description }}</p>
      </div>

      <div class="hero__side">
        <div class="status">
          <span class="status__pulse" aria-hidden="true"></span>
          <span>{{ site.status }}</span>
        </div>
        <div class="hero__meta">
          <span><strong>{{ posts.length }}</strong>篇文章</span>
          <span><strong>{{ getAllTags().length }}</strong>个标签</span>
          <span><strong>{{ totalWords }}</strong>分钟阅读</span>
        </div>
      </div>
    </div>
  </section>

  <div class="wrap">
    <div class="search-row">
      <label class="search">
        <svg
          class="search__icon"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" stroke-width="1.6" />
          <path d="M15.5 15.5L20 20" stroke="currentColor" stroke-width="1.6" />
        </svg>
        <input
          v-model="keyword"
          class="search__input"
          type="search"
          placeholder="搜索标题、摘要或标签…"
          aria-label="搜索文章"
        />
      </label>
      <span v-if="keyword" class="search__count">命中 {{ filtered.length }} 篇</span>
    </div>

    <section class="list">
      <div class="list__head">
        <span class="list__title">最新文章</span>
        <span class="search__count">{{ filtered.length }} / {{ posts.length }}</span>
      </div>

      <PostList v-if="filtered.length" :posts="filtered" />
      <p v-else class="empty">没有匹配的文章，换个关键词试试。</p>
    </section>
  </div>
</template>
