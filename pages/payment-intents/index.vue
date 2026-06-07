<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="page-title">Payments</h1>
      <p class="page-subtitle">Monitor incoming payments from your checkout pages</p>
    </div>

    <!-- Status filter tabs -->
    <div class="flex flex-wrap gap-2 mb-4">
      <button
        v-for="f in statusFilters"
        :key="f.value"
        :class="[
          'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
          activeStatus === f.value
            ? 'bg-brand-600 text-white shadow-sm'
            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50',
        ]"
        @click="setFilter(f.value)"
      >
        {{ f.label }}
      </button>
    </div>

    <!-- Error banner -->
    <UiAlert v-if="store.error" variant="danger" class="mb-4" dismissible>
      {{ store.error }}
    </UiAlert>

    <!-- Table card -->
    <UiCard :padding="false">
      <!-- Loading -->
      <div v-if="store.loading" class="flex items-center justify-center py-16">
        <UiSpinner />
      </div>

      <!-- Empty state -->
      <UiEmptyState
        v-else-if="!store.items.length"
        title="No payments yet"
        :description="activeStatus === 'all'
          ? 'Share a checkout link with your customers to start receiving payments.'
          : `No payments with status &quot;${activeStatus}&quot;.`"
      >
        <template v-if="activeStatus === 'all'" #action>
          <NuxtLink to="/paywalls">
            <UiButton size="sm">Go to Paywalls</UiButton>
          </NuxtLink>
        </template>
      </UiEmptyState>

      <!-- Table -->
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-100 bg-gray-50">
            <th class="text-left px-5 py-3 font-medium text-gray-500">ID</th>
            <th class="text-left px-5 py-3 font-medium text-gray-500">Asset / Chain</th>
            <th class="text-left px-5 py-3 font-medium text-gray-500">Amount</th>
            <th class="text-left px-5 py-3 font-medium text-gray-500">Status</th>
            <th class="text-left px-5 py-3 font-medium text-gray-500 hidden lg:table-cell">Created</th>
            <th class="px-5 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr
            v-for="intent in store.items"
            :key="intent.id"
            class="hover:bg-gray-50 transition-colors cursor-pointer"
            @click="navigateTo(`/payment-intents/${intent.id}`)"
          >
            <td class="px-5 py-4">
              <span class="font-mono text-xs text-gray-500">{{ shortId(intent.id) }}</span>
            </td>
            <td class="px-5 py-4">
              <span class="font-medium text-gray-900">{{ intent.asset }}</span>
              <span class="text-gray-400 mx-1">/</span>
              <span class="text-gray-600">{{ intent.chain }}</span>
            </td>
            <td class="px-5 py-4 font-medium text-gray-900">
              {{ intent.amount }}
            </td>
            <td class="px-5 py-4">
              <PaymentIntentStatusBadge :status="intent.status" />
            </td>
            <td class="px-5 py-4 text-gray-400 hidden lg:table-cell">
              {{ formatDate(intent.created_at) }}
            </td>
            <td class="px-5 py-4 text-right">
              <NuxtLink
                :to="`/payment-intents/${intent.id}`"
                class="text-brand-600 hover:underline text-xs font-medium"
                @click.stop
              >
                View
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </UiCard>

  </div>
</template>

<script setup lang="ts">
import type { PaymentIntentStatus } from '~/types'

definePageMeta({ middleware: 'auth' })

const store = usePaymentIntentsStore()
const activeStatus = ref<PaymentIntentStatus | 'all'>('all')

onMounted(() => store.fetchAll())

const statusFilters: { label: string; value: PaymentIntentStatus | 'all' }[] = [
  { label: 'All',       value: 'all' },
  { label: 'Pending',   value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed',    value: 'failed' },
  { label: 'Expired',   value: 'expired' },
]

function setFilter(value: PaymentIntentStatus | 'all') {
  activeStatus.value = value
  store.fetchAll(value)
}

function shortId(id: string) {
  return id.slice(0, 8) + '…'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}
</script>
