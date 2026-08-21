export default defineNuxtRouteMiddleware(async (to) => {
  // SSR阶段没有持久化的登录状态, 跳转交给客户端水合后处理
  if (import.meta.server) return

  const auth = useAuthStore()
  await auth.bootstrap()
  if (to.path !== '/login' && !auth.isLoggedIn) return navigateTo('/login')
  if (to.path === '/login' && auth.isLoggedIn) return navigateTo('/')
})
