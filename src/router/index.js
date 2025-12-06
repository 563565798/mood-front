import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { title: '注册' }
  },
  {
    path: '/',
    component: () => import('@/layout/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '仪表盘', requiresAuth: true }
      },
      {
        path: 'record',
        name: 'Record',
        component: () => import('@/views/Record.vue'),
        meta: { title: '情绪记录', requiresAuth: true }
      },
      {
        path: 'analysis',
        name: 'Analysis',
        component: () => import('@/views/Analysis.vue'),
        meta: { title: '趋势分析', requiresAuth: true }
      },
      {
        path: 'share',
        name: 'Share',
        component: () => import('@/views/Share.vue'),
        meta: { title: '心情分享墙', requiresAuth: true }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '个人中心', requiresAuth: true }
      },
      {
        path: 'message',
        name: 'Message',
        component: () => import('@/views/Message.vue'),
        meta: { title: '私信', requiresAuth: true }
      }
    ]
  },
  {
    path: '/admin',
    component: () => import('@/layout/AdminLayout.vue'),
    redirect: '/admin/dashboard',
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/AdminDashboard.vue'),
        meta: { title: '数据概览', requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'users',
        name: 'UserManagement',
        component: () => import('@/views/admin/UserManagement.vue'),
        meta: { title: '用户管理', requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'posts',
        name: 'PostManagement',
        component: () => import('@/views/admin/PostManagement.vue'),
        meta: { title: '帖子管理', requiresAuth: true, requiresAdmin: true }
      },
      {
        path: 'comments',
        name: 'CommentManagement',
        component: () => import('@/views/admin/CommentManagement.vue'),
        meta: { title: '评论管理', requiresAuth: true, requiresAdmin: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 情绪记录系统` : '情绪记录系统'

  // 需要登录的页面
  if (to.meta.requiresAuth) {
    if (!userStore.isLoggedIn) {
      next('/login')
      return
    }

    // 需要管理员权限的页面
    if (to.meta.requiresAdmin && !userStore.isAdmin) {
      next('/dashboard')
      return
    }

    next()
  } else {
    // 已登录用户访问登录页，重定向到首页
    if (to.path === '/login' && userStore.isLoggedIn) {
      next('/dashboard')
    } else {
      next()
    }
  }
})

export default router




