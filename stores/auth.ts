import { defineStore } from 'pinia'
import type { AuthUser } from '~/types'

const TOKEN_KEY = 'mp_token'
const USER_KEY  = 'mp_user'

interface AuthState {
  token: string | null
  user: Omit<AuthUser, 'token'> | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: null,
    user: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    /** Call once on app boot to rehydrate from localStorage. */
    init() {
      if (import.meta.client) {
        const savedToken = localStorage.getItem(TOKEN_KEY)
        if (savedToken) this.token = savedToken

        const savedUser = localStorage.getItem(USER_KEY)
        if (savedUser) {
          try { this.user = JSON.parse(savedUser) } catch { /* ignore */ }
        }
      }
    },

    setToken(token: string, user?: { uid: string; email: string | null; displayName: string | null }) {
      this.token = token
      if (user) this.user = user
      if (import.meta.client) {
        localStorage.setItem(TOKEN_KEY, token)
        if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
      }
    },

    clear() {
      this.token = null
      this.user = null
      if (import.meta.client) {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
      }
    },
  },
})
