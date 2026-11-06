<script setup>
import { computed, nextTick, ref, watch, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  getPostBySlug,
  getPostHtml,
  getAdjacentPosts,
  formatDate
} from '../utils/posts'

const route = useRoute()
const bodyRef = ref(null)

const post = computed(() => getPostBySlug(route.params.slug))
const html = computed(() => (post.value ? getPostHtml(route.params.slug) : ''))
const adjacent = computed(() => getAdjacentPosts(route.params.slug))

// 给每个代码块注入「复制」按钮
async function mountCopyButtons() {
  await nextTick()
  const root = bodyRef.value
  if (!root) return

  root.querySelectorAll('pre.code-block').forEach((pre) => {
    if (pre.querySelector('.copy-btn')) return
    const btn = document.createElement('button')
    btn.className = 'copy-btn'
    btn.type = 'button'
    btn.textContent = '复制'
    btn.addEventListener('click', async () => {
      const code = pre.querySelector('code')?.innerText ?? ''
      try {
        await navigator.clipboard.writeText(code)
        btn.textContent = '已复制'
        btn.classList.add('is-done')
        setTimeout(() => {
          btn.textContent = '复制'
          btn.classList.remove('is-done')
        }, 1600)
      } catch {
        btn.textContent = '复制失败'
        setTimeout(() => (btn.textContent = '复制'), 1600)
      }
    })
    pre.appendChild(btn)
  })
}

onMounted(mountCopyButtons)
watch(() => route.params.slug, mountCopyButtons)
</script>

<template>
  <div class="wrap">
    <article v-if="post" class="post">
      <header class="post__header">
        <RouterLink to="/" class="post__back">
          <span aria-hidden="true">←</span> 返回文章列表
        </RouterLink>

        <h1 class="post__title">{{ post.title }}</h1>

        <div class="post__meta">
          <time :datetime="post.date">{{ formatDate(post.date) }}</time>
          <span class="dot" aria-hidden="true"></span>
          <span>约 {{ post.readingTime }} 分钟读完</span>
        </div>

        <div v-if="post.tags.length" class="post__tags">
          <RouterLink
            v-for="tag in post.tags"
            :key="tag"
            :to="`/tag/${encodeURIComponent(tag)}`"
            class="tag"
          >
            {{ tag }}
          </RouterLink>
        </div>
      </header>

      <!-- 内容来自本地 markdown，作者可控，因此用 v-html 渲染 -->
      <div ref="bodyRef" class="prose" v-html="html"></div>

      <nav class="post-nav" aria-label="相邻文章">
        <RouterLink
          v-if="adjacent.prev"
          :to="`/post/${adjacent.prev.slug}`"
          class="post-nav__item"
        >
          <span class="post-nav__label">← 更新的一篇</span>
          <span class="post-nav__title">{{ adjacent.prev.title }}</span>
        </RouterLink>
        <span v-else></span>

        <RouterLink
          v-if="adjacent.next"
          :to="`/post/${adjacent.next.slug}`"
          class="post-nav__item"
        >
          <span class="post-nav__label">更早的一篇 →</span>
          <span class="post-nav__title">{{ adjacent.next.title }}</span>
        </RouterLink>
      </nav>
    </article>

    <div v-else class="empty">
      <p>这篇文章不存在，可能已经改名了。</p>
      <RouterLink to="/" class="tag tag--lg">回到首页</RouterLink>
    </div>
  </div>
</template>
