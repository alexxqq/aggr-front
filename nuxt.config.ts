// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  compatibilityDate: '2024-07-30',

  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/tailwindcss',
  ],

  // TypeScript
  typescript: {
    strict: true,
    typeCheck: false, // run manually with `npm run typecheck`
  },

  // Runtime config — values here are public (injected at build time).
  // Secrets must go in .env and be referenced under runtimeConfig.
  runtimeConfig: {
    public: {
      // Override via NUXT_PUBLIC_API_BASE_URL env var
      apiBaseUrl: 'http://localhost:8000',
      // Set NUXT_PUBLIC_DEV_BYPASS=true to skip real auth locally
      devBypass: '',
      devBypassToken: '',
      // Identity headers forwarded to gateway in dev bypass mode
      devBypassUid: 'dev-uid',
      devBypassEmail: '',
      // Firebase web app config (NUXT_PUBLIC_FIREBASE_* env vars)
      firebaseApiKey: '',
      firebaseAuthDomain: 'crypto-aggregator-73307.firebaseapp.com',
      firebaseProjectId: 'crypto-aggregator-73307',
    },
  },

  app: {
    head: {
      title: 'Merchant Portal',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Crypto Payment Aggregator – Merchant Portal' },
      ],
    },
  },
})
