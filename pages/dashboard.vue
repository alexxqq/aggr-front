<template>
  <div>
    <div class="mb-6">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle">Monitor your merchant activity</p>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      <UiCard v-for="stat in stats" :key="stat.label" class="!p-5">
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">{{ stat.label }}</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">{{ stat.value }}</p>
        <p v-if="stat.sub" class="text-xs text-gray-400 mt-0.5">{{ stat.sub }}</p>
      </UiCard>
    </div>

    <!-- Recent payments -->
    <UiCard title="Recent Payments" subtitle="Latest 5 incoming payments">
      <template #header>
        <NuxtLink to="/payment-intents">
          <UiButton variant="ghost" size="sm">View all</UiButton>
        </NuxtLink>
      </template>

      <div v-if="piStore.loading" class="flex items-center justify-center py-10">
        <UiSpinner />
      </div>

      <UiEmptyState
        v-else-if="!recent.length"
        title="No payments yet"
        description="Create a paywall and share the checkout link with your customers to start receiving payments."
      >
        <template #action>
          <NuxtLink to="/paywalls">
            <UiButton size="sm">Go to Paywalls</UiButton>
          </NuxtLink>
        </template>
      </UiEmptyState>

      <table v-else class="w-full text-sm -mx-0">
        <tbody class="divide-y divide-gray-50">
          <tr
            v-for="intent in recent"
            :key="intent.id"
            class="hover:bg-gray-50 transition-colors cursor-pointer"
            @click="navigateTo(`/payment-intents/${intent.id}`)"
          >
            <td class="py-3 pr-4">
              <span class="font-mono text-xs text-gray-400">{{ shortId(intent.id) }}</span>
            </td>
            <td class="py-3 pr-4">
              <span class="font-medium text-gray-900">{{ intent.amount }}</span>
              <span class="text-gray-400 ml-1 text-xs">{{ intent.asset }}</span>
            </td>
            <td class="py-3 pr-4 text-gray-500 text-xs hidden sm:table-cell">
              {{ intent.chain }}
            </td>
            <td class="py-3 pr-4">
              <PaymentIntentStatusBadge :status="intent.status" />
            </td>
            <td class="py-3 text-gray-400 text-xs hidden md:table-cell">
              {{ formatDate(intent.created_at) }}
            </td>
          </tr>
        </tbody>
      </table>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const piStore = usePaymentIntentsStore()
const paywallsStore = usePaywallsStore()

onMounted(async () => {
  await Promise.all([
    piStore.fetchAll(),
    paywallsStore.fetchAll(),
  ])
})

const recent = computed(() => piStore.items.slice(0, 5))

const stats = computed(() => [
  {
    label: 'Total Payments',
    value: piStore.items.length || '—',
    sub: 'All time',
  },
  {
    label: 'Active Paywalls',
    value: paywallsStore.items.filter((p) => p.is_active).length || '—',
    sub: 'Currently live',
  },
  {
    label: 'Pending',
    value: piStore.items.filter((p) => p.status === 'pending').length || '—',
    sub: 'Awaiting confirmation',
  },
  {
    label: 'Completed',
    value: piStore.items.filter((p) => p.status === 'completed').length || '—',
    sub: 'Successfully settled',
  },
])

function shortId(id: string) {
  return id.slice(0, 8) + '…'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}
</script>
