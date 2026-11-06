// 站点全局配置：改这里就能改全站，不用翻遍组件
export const site = {
  name: '范帅杰',
  title: '范帅杰 · 技术笔记',
  subtitle: '前端开发 / Vue & 工程化',
  description:
    '记录 Vue、Vite、浏览器原理与前端工程化的学习过程，全部内容开源在 GitHub。',
  // 部署后改成你的真实域名，RSS 和分享卡片会用到
  url: 'https://example.com',
  email: 'fan@example.com',
  github: 'https://github.com/yourname',
  // 首页 hero 里的一句话状态，秋招/春招时可以随时改
  status: '2027 届 · 寻找前端开发实习 / 校招机会',
  nav: [
    { label: '文章', to: '/' },
    { label: '归档', to: '/archive' },
    { label: '标签', to: '/tags' },
    { label: '关于', to: '/about' }
  ]
}
