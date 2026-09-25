import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    component: () => import('../layouts/UserLayout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('../views/user/HomeView.vue') },
      { path: 'forum', name: 'forum', component: () => import('../views/user/ForumView.vue'), meta: { requiresAuth: true, guestRedirect: 'home' } },
      { path: 'forum/:id', name: 'post-detail', component: () => import('../views/user/PostDetailView.vue'), meta: { requiresAuth: true, guestRedirect: 'home' } },
      { path: 'assessment', name: 'assessment', component: () => import('../views/user/AssessmentView.vue'), meta: { requiresAuth: true, guestRedirect: 'home' } },
      { path: 'login', name: 'login', component: () => import('../views/user/LoginView.vue') },
      { path: 'register', name: 'register', component: () => import('../views/user/RegisterView.vue') },
      { path: 'auth/casdoor/callback', name: 'casdoor-callback', component: () => import('../views/user/CasdoorCallbackView.vue') },
      { path: 'profile', name: 'profile', component: () => import('../views/user/ProfileView.vue'), meta: { requiresAuth: true } },
    ],
  },
  { path: '/admin/login', name: 'admin-login', component: () => import('../views/admin/AdminLogin.vue') },
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { requiresAdmin: true },
    children: [
      { path: '', name: 'admin-home', redirect: () => useAuthStore().firstAdminPath || '/admin/login' },
      { path: 'dashboard', name: 'admin-dashboard', component: () => import('../views/admin/Dashboard.vue'), meta: { perm: 'dashboard' } },
      { path: 'review', name: 'admin-review', component: () => import('../views/admin/Review.vue'), meta: { perm: 'review' } },
      { path: 'users', name: 'admin-users', component: () => import('../views/admin/Users.vue'), meta: { perm: 'users' } },
      { path: 'ai-logs', name: 'admin-logs', component: () => import('../views/admin/AiLogs.vue'), meta: { perm: 'ai_logs' } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAdmin) {
    if (!auth.isAdmin) return { name: 'admin-login' }
    // 模块级权限：无权访问该模块时，跳到第一个有权限的模块；一个权限都没有则回登录页
    if (to.meta.perm && !auth.can(to.meta.perm)) {
      return auth.firstAdminPath
        ? { path: auth.firstAdminPath }
        : { name: 'admin-login', query: { reason: 'no-permission' } }
    }
  }
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: to.meta.guestRedirect || 'login' }
  }
  return true
})

export default router
