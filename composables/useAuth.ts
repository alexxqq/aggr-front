/**
 * useAuth — auth abstraction for the merchant portal.
 *
 * Supports two modes:
 *   1. Real Bearer-token flow  — NUXT_PUBLIC_DEV_BYPASS != "true"
 *      The token must be obtained externally (e.g. Firebase client SDK) and
 *      stored via authStore.setToken(token).
 *   2. Local dev bypass        — NUXT_PUBLIC_DEV_BYPASS == "true"
 *      The static NUXT_PUBLIC_DEV_BYPASS_TOKEN is used automatically.
 *      The auth guard is skipped so you can develop without a real backend.
 *
 * This composable is the single place that knows which mode is active.
 */
import { useAuthStore } from '~/stores/auth'

export function useAuth() {
  const config = useRuntimeConfig()
  const store = useAuthStore()
  const router = useRouter()

  const devBypass = computed(() => config.public.devBypass === 'true')

  /**
   * Call after obtaining a token (e.g. from Firebase signInWithEmailAndPassword).
   * Stores token in Pinia and persists it in localStorage.
   */
  function setToken(token: string, user?: { uid: string; email: string | null; displayName: string | null }) {
    store.setToken(token, user)
  }

  /**
   * Clear auth state and redirect to login.
   */
  async function logout() {
    store.clear()
    await router.push('/login')
  }

  /**
   * Returns true if the user is considered authenticated.
   * In dev bypass mode this always returns true.
   */
  const isAuthenticated = computed(() => {
    if (devBypass.value) return true
    return store.isAuthenticated
  })

  /**
   * Returns the active token (bypass token or real token).
   */
  const token = computed(() => {
    if (devBypass.value) return config.public.devBypassToken as string
    return store.token
  })

  return {
    devBypass,
    isAuthenticated,
    token,
    user: computed(() => store.user),
    setToken,
    logout,
  }
}
