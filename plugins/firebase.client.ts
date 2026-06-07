/**
 * Firebase client plugin — initializes the Firebase app and Auth instance.
 *
 * Client-only: the `.client.ts` suffix ensures it never runs during SSR.
 *
 * Provides:
 *   $firebaseAuth — the Firebase Auth instance, accessible via useNuxtApp().$firebaseAuth
 *
 * Skipped (no-op) when NUXT_PUBLIC_DEV_BYPASS=true so local dev without a
 * real Firebase API key still works.
 */
import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // In dev bypass mode we never call Firebase — skip initialization.
  if (config.public.devBypass === 'true') {
    return { provide: { firebaseAuth: null } }
  }

  const apiKey = config.public.firebaseApiKey as string
  if (!apiKey) {
    console.warn('[firebase] NUXT_PUBLIC_FIREBASE_API_KEY is not set — auth will not work.')
    return { provide: { firebaseAuth: null } }
  }

  // Avoid re-initializing if hot-reload triggers this plugin twice
  const app = getApps().length
    ? getApps()[0]!
    : initializeApp({
        apiKey,
        authDomain: config.public.firebaseAuthDomain as string,
        projectId: config.public.firebaseProjectId as string,
      })

  const auth = getAuth(app)

  return {
    provide: {
      firebaseAuth: auth,
    },
  }
})
