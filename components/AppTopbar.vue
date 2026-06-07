<template>
  <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
    <!-- Left: hamburger -->
    <button
      class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
      @click="$emit('toggle-sidebar')"
    >
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>

    <!-- Right: dev badge + user menu -->
    <div class="flex items-center gap-3">
      <!-- Dev bypass badge -->
      <UiBadge v-if="devBypass" variant="warning" size="sm">DEV MODE</UiBadge>

      <!-- User info -->
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-semibold select-none">
          {{ initials }}
        </div>
        <div class="hidden sm:block text-right">
          <p class="text-sm font-medium text-gray-900 leading-tight">{{ displayName }}</p>
          <p class="text-xs text-gray-500 leading-tight">{{ email }}</p>
        </div>

        <!-- Logout -->
        <button
          class="ml-1 p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          title="Sign out"
          @click="handleLogout"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const auth = useAuth()

defineEmits<{ 'toggle-sidebar': [] }>()

const devBypass = auth.devBypass

const displayName = computed(() =>
  auth.user.value?.displayName ?? auth.user.value?.email?.split('@')[0] ?? 'Merchant',
)
const email = computed(() => auth.user.value?.email ?? '')
const initials = computed(() =>
  displayName.value.slice(0, 2).toUpperCase(),
)

async function handleLogout() {
  await auth.logout()
}
</script>
