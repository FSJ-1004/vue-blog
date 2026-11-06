import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

// 首页直接引入（首屏必需），其余路由懒加载，打包时会被拆成独立 chunk。
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    {
      path: '/post/:slug',
      name: 'post',
      component: () => import('../views/PostView.vue')
    },
    {
      path: '/archive',
      name: 'archive',
      component: () => import('../views/ArchiveView.vue')
    },
    {
      path: '/tags',
      name: 'tags',
      component: () => import('../views/TagsView.vue')
    },
    {
      path: '/tag/:tag',
      name: 'tag',
      component: () => import('../views/TagView.vue')
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue')
    },
    // 兜底：不存在的路径回首页，避免用户看到白屏
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  }
})

export default router
