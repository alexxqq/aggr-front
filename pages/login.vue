<template>
  <div>
    <h2 class="text-xl font-semibold text-gray-900 mb-1">Sign in</h2>
    <p class="text-sm text-gray-500 mb-6">Access your merchant dashboard</p>

    <UiAlert v-if="error" variant="danger" dismissible class="mb-4">{{ error }}</UiAlert>

    <UiAlert v-if="devBypass" variant="warning" class="mb-4">
      Dev bypass active — redirecting automatically.
    </UiAlert>

    <form class="space-y-4" @submit.prevent="handleLogin">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="email">Email</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          autocomplete="email"
          required
          :disabled="loading || devBypass"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                 disabled:bg-gray-50 disabled:text-gray-400"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1" for="password">Password</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          autocomplete="current-password"
          required
          :disabled="loading || devBypass"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                 disabled:bg-gray-50 disabled:text-gray-400"
          placeholder="••••••••"
        />
      </div>

      <UiButton type="submit" class="w-full" :loading="loading" :disabled="devBypass">
        Sign in
      </UiButton>
    </form>

    <p class="text-xs text-gray-400 mt-6 text-center">
      Crypto Payment Aggregator · Thesis Demo
    </p>
  </div>
</template>

<script setup lang="ts">
import { signInWithEmailAndPassword } from 'firebase/auth'

definePageMeta({ layout: 'auth' })

const auth = useAuth()
const { $firebaseAuth } = useNuxtApp()
const config = useRuntimeConfig()

const devBypass = auth.devBypass
const loading = ref(false)
const error = ref('')
const form = reactive({ email: '', password: '' })

// Already authenticated → skip login
if (auth.isAuthenticated.value) {
  await navigateTo('/dashboard', { replace: true })
}

// Dev bypass → auto-redirect
if (devBypass.value) {
  await navigateTo('/dashboard', { replace: true })
}

async function handleLogin() {
  error.value = ''

  if (!$firebaseAuth) {
    error.value = 'Firebase is not configured. Set NUXT_PUBLIC_FIREBASE_API_KEY or enable dev bypass.'
    return
  }

  loading.value = true
  try {
    const credential = await signInWithEmailAndPassword(
      $firebaseAuth,
      form.email.trim(),
      form.password,
    )
    const token = await credential.user.getIdToken()
    auth.setToken(token, {
      uid: credential.user.uid,
      email: credential.user.email,
      displayName: credential.user.displayName,
    })
    await navigateTo('/dashboard', { replace: true })
  } catch (err: unknown) {
    error.value = firebaseErrorMessage(err)
  } finally {
    loading.value = false
  }
}

/** Map Firebase auth error codes to human-readable messages. */
function firebaseErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = (err as { code: string }).code
    const messages: Record<string, string> = {
      'auth/invalid-email':       'Invalid email address.',
      'auth/user-not-found':      'No account found with this email.',
      'auth/wrong-password':      'Incorrect password.',
      'auth/invalid-credential':  'Invalid email or password.',
      'auth/too-many-requests':   'Too many attempts. Please wait and try again.',
      'auth/network-request-failed': 'Network error. Check your connection.',
    }
    return messages[code] ?? `Sign in failed (${code}).`
  }
  return err instanceof Error ? err.message : 'Sign in failed.'
}
</script>
