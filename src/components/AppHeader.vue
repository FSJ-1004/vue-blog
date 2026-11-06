<script setup>
import { RouterLink, useRoute } from 'vue-router'
import { site } from '../site.config'

defineProps({
  theme: { type: String, default: 'light' }
})
const emit = defineEmits(['toggle-theme'])
const route = useRoute()

// 当前路由是否命中导航项（文章详情页也归到「文章」）
function isActive(to) {
  if (to === '/') return route.path === '/' || route.name === 'post' || route.name === 'tag'
  return route.path === to
}
</script>

<template>
  <header class="masthead">
    <div class="wrap masthead__inner">
      <RouterLink to="/" class="brand" aria-label="返回首页">
        <span class="brand__name">{{ site.name }}</span>
        <span class="brand__dot" aria-hidden="true"></span>
      </RouterLink>

      <nav class="nav" aria-label="主导航">
        <RouterLink
          v-for="item in site.nav"
          :key="item.to"
          :to="item.to"
          :class="{ 'is-active': isActive(item.to) }"
        >
          {{ item.label }}
        </RouterLink>

        <button
          class="theme-toggle"
          type="button"
          :aria-label="theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'"
          @click="emit('toggle-theme')"
        >
          <svg v-if="theme === 'dark'" viewBox="0 0 24 24" width="16" height="16" fill="none">
            <circle cx="12" cy="12" r="4.2" stroke="currentColor" stroke-width="1.6" />
            <path
              d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"
              stroke="currentColor"
              stroke-width="1.6"
            />
          </svg>
          <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none">
            <path
              d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </nav>
    </div>
  </header>
</template>
