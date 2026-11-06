import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base 用 '/' 适合 Vercel / 自定义域名。
// 如果部署到 GitHub Pages 的仓库子路径（如 /blog/），改成 base: '/blog/'。
export default defineConfig({
  plugins: [vue()],
  base: '/',
  build: {
    outDir: 'dist',
    // 把 markdown 原文按文章拆成独立资源，首屏只加载首页需要的
    rollupOptions: {
      output: {
        manualChunks: {
          highlight: ['highlight.js']
        }
      }
    }
  }
})
