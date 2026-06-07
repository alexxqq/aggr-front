<template>
  <aside
    :class="[
      'flex flex-col bg-white border-r border-gray-200 transition-all duration-200 shrink-0',
      collapsed ? 'w-16' : 'w-60',
    ]"
  >
    <!-- Brand -->
    <div class="flex items-center h-16 px-4 border-b border-gray-200 shrink-0">
      <div class="flex items-center gap-3 overflow-hidden">
        <div class="shrink-0 w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
          <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <span v-if="!collapsed" class="font-semibold text-gray-900 text-sm whitespace-nowrap">
          Merchant Portal
        </span>
      </div>
    </div>

    <!-- Nav links -->
    <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :class="['nav-item', { active: isActive(item.to) }]"
        :title="collapsed ? item.label : undefined"
      >
        <component :is="item.icon" class="w-5 h-5 shrink-0" />
        <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <!-- Bottom: toggle + user -->
    <div class="p-3 border-t border-gray-200 space-y-1">
      <button
        class="nav-item w-full"
        :title="collapsed ? 'Expand' : 'Collapse'"
        @click="$emit('toggle')"
      >
        <IconChevronLeft :class="['w-5 h-5 transition-transform', collapsed ? 'rotate-180' : '']" />
        <span v-if="!collapsed">Collapse</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import IconDashboard from '~/components/icons/IconDashboard.vue'
import IconProducts from '~/components/icons/IconProducts.vue'
import IconPaywalls from '~/components/icons/IconPaywalls.vue'
import IconPayments from '~/components/icons/IconPayments.vue'
import IconProfile from '~/components/icons/IconProfile.vue'
import IconChevronLeft from '~/components/icons/IconChevronLeft.vue'

defineProps<{ collapsed: boolean }>()
defineEmits<{ toggle: [] }>()

const route = useRoute()

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: IconDashboard },
  { to: '/products', label: 'Products', icon: IconProducts },
  { to: '/paywalls', label: 'Paywalls', icon: IconPaywalls },
  { to: '/payment-intents', label: 'Payments', icon: IconPayments },
  { to: '/profile', label: 'Profile & Settings', icon: IconProfile },
]

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>
