<script setup>
import { ref, onMounted, watch } from 'vue'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'

const theme = ref(document.documentElement.dataset.theme || 'light')

// 首帧的主题已由 index.html 里的内联脚本设好，这里只同步状态与切换
onMounted(() => {
  if (!document.documentElement.dataset.theme) applyTheme('light')
})

function applyTheme(value) {
  theme.value = value
  document.documentElement.dataset.theme = value
  localStorage.setItem('blog-theme', value)
}

function toggleTheme() {
  applyTheme(theme.value === 'dark' ? 'light' : 'dark')
}

watch(
  () => theme.value,
  (val) => {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', val === 'dark' ? '#14171a' : '#f7f4ee')
  }
)
</script>

<template>
  <AppHeader :theme="theme" @toggle-theme="toggleTheme" />
  <main>
    <RouterView />
  </main>
  <AppFooter />
</template>
