/**
 * Global auth middleware.
 * Redirects unauthenticated users to /login.
 * Dev bypass mode skips the check entirely.
 *
 * Client-only: localStorage is not available during SSR, so we skip the check
 * on the server and let the client hydration handle it.
 */
export default defineNuxtRouteMiddleware((to) => {
  // SSR: localStorage unavailable — let the client handle the check
  if (import.meta.server) return

  // Skip middleware for the login page itself
  if (to.path === '/login') return

  const config = useRuntimeConfig()
  const devBypass = config.public.devBypass === 'true'
  if (devBypass) return

  const authStore = useAuthStore()
  authStore.init()

  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
})
