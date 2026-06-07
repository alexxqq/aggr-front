<template>
  <div>
    <!-- Back link -->
    <NuxtLink
      to="/payment-intents"
      class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Payments
    </NuxtLink>

    <!-- Loading -->
    <div v-if="store.loadingOne" class="flex items-center justify-center py-24">
      <UiSpinner size="lg" />
    </div>

    <!-- Error -->
    <UiAlert v-else-if="store.error && !store.current" variant="danger">
      {{ store.error }}
    </UiAlert>

    <template v-else-if="store.current">
      <!-- Page header -->
      <div class="flex items-start justify-between mb-6">
        <div>
          <div class="flex items-center gap-3 mb-1">
            <h1 class="page-title">Payment Intent</h1>
            <PaymentIntentStatusBadge :status="store.current.status" />
          </div>
          <p class="text-xs text-gray-400 font-mono">{{ store.current.id }}</p>
        </div>

        <div class="flex items-center gap-2">
          <!-- Simulate execution — demo/testing tool for pending intents -->
          <UiButton
            v-if="store.current.status === 'pending'"
            size="sm"
            :loading="executing"
            :disabled="refreshing"
            @click="handleExecute"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Simulate execution (demo)
          </UiButton>

          <UiButton variant="secondary" size="sm" :loading="refreshing" :disabled="executing" @click="refresh">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </UiButton>
        </div>
      </div>

      <!-- Execution error -->
      <UiAlert v-if="executeError" variant="danger" dismissible class="mb-5">
        {{ executeError }}
      </UiAlert>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <!-- Left: main details -->
        <div class="lg:col-span-2 space-y-5">
          <!-- Payment details card -->
          <UiCard title="Payment details">
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt class="text-gray-500 mb-0.5">Asset</dt>
                <dd class="font-medium text-gray-900">{{ store.current.asset }}</dd>
              </div>
              <div>
                <dt class="text-gray-500 mb-0.5">Chain</dt>
                <dd class="font-medium text-gray-900">{{ store.current.chain }}</dd>
              </div>
              <div>
                <dt class="text-gray-500 mb-0.5">Amount</dt>
                <dd class="font-semibold text-gray-900 text-base">
                  {{ store.current.amount }} {{ store.current.asset }}
                </dd>
              </div>
              <div>
                <dt class="text-gray-500 mb-0.5">Status</dt>
                <dd><PaymentIntentStatusBadge :status="store.current.status" /></dd>
              </div>
              <div v-if="store.current.expires_at">
                <dt class="text-gray-500 mb-0.5">Expires at</dt>
                <dd class="font-medium" :class="isExpired ? 'text-red-600' : 'text-gray-900'">
                  {{ formatDateTime(store.current.expires_at) }}
                </dd>
              </div>
              <div v-if="store.current.product_price_id">
                <dt class="text-gray-500 mb-0.5">Product price ID</dt>
                <dd class="font-mono text-xs text-gray-700 break-all">
                  {{ store.current.product_price_id }}
                </dd>
              </div>
            </dl>
          </UiCard>

          <!-- Addresses card -->
          <UiCard v-if="store.current.payer_address" title="Addresses">
            <dl class="text-sm">
              <div>
                <dt class="text-gray-500 mb-1">Customer address</dt>
                <dd class="font-mono text-xs text-gray-800 break-all bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  {{ store.current.payer_address }}
                </dd>
              </div>
            </dl>
          </UiCard>

          <!-- Metadata card (if present) -->
          <UiCard v-if="store.current.metadata" title="Metadata">
            <pre class="text-xs text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-100 overflow-auto max-h-40">{{ JSON.stringify(store.current.metadata, null, 2) }}</pre>
          </UiCard>
        </div>

        <!-- Right: timeline -->
        <div class="space-y-5">
          <!-- Timestamps -->
          <UiCard title="Timeline">
            <dl class="space-y-3 text-sm">
              <div>
                <dt class="text-gray-500 mb-0.5">Created</dt>
                <dd class="font-medium text-gray-900">{{ formatDateTime(store.current.created_at) }}</dd>
              </div>
              <div>
                <dt class="text-gray-500 mb-0.5">Last updated</dt>
                <dd class="font-medium text-gray-900">{{ formatDateTime(store.current.updated_at) }}</dd>
              </div>
            </dl>
          </UiCard>

          <!-- Events -->
          <UiCard title="Events" :subtitle="store.events.length ? `${store.events.length} event${store.events.length === 1 ? '' : 's'}` : undefined">
            <div v-if="store.loadingEvents" class="flex justify-center py-6">
              <UiSpinner size="sm" />
            </div>

            <div v-else-if="!store.events.length" class="text-sm text-gray-400 py-2">
              No events recorded.
            </div>

            <!-- Event list -->
            <ol v-else class="relative border-l border-gray-200 space-y-4 ml-2">
              <li
                v-for="event in sortedEvents"
                :key="event.id"
                class="pl-4"
              >
                <!-- Dot -->
                <span class="absolute -left-1.5 w-3 h-3 rounded-full border-2 border-white" :class="eventDotClass(event)" />

                <p class="text-xs font-medium text-gray-900">{{ formatEventType(event.event_type) }}</p>

                <p v-if="event.from_status || event.to_status" class="text-xs text-gray-500 mt-0.5">
                  <template v-if="event.from_status">
                    <span class="font-mono">{{ event.from_status }}</span>
                    <span class="mx-1">→</span>
                  </template>
                  <span class="font-mono" :class="statusTextClass(event.to_status)">{{ event.to_status }}</span>
                </p>

                <p class="text-xs text-gray-400 mt-0.5">{{ formatDateTime(event.created_at) }}</p>
              </li>
            </ol>
          </UiCard>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { PaymentEvent } from '~/types'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const store = usePaymentIntentsStore()
const refreshing = ref(false)
const executing = ref(false)
const executeError = ref('')

const id = route.params.id as string

// Load on mount
onMounted(async () => {
  store.clearCurrent()
  await Promise.all([store.fetchOne(id), store.fetchEvents(id)])
})

onUnmounted(() => store.clearCurrent())

async function refresh() {
  refreshing.value = true
  await Promise.all([store.fetchOne(id), store.fetchEvents(id)])
  refreshing.value = false
}

async function handleExecute() {
  executeError.value = ''
  executing.value = true
  try {
    await store.execute(id)
    // Refresh events to show the new status_changed event from Blockchain Core callback
    await store.fetchEvents(id)
  } catch (err) {
    executeError.value = err instanceof Error ? err.message : 'Execution failed'
  } finally {
    executing.value = false
  }
}

const isExpired = computed(() => {
  const exp = store.current?.expires_at
  return exp ? new Date(exp) < new Date() : false
})

const sortedEvents = computed(() =>
  [...store.events].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  ),
)

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatEventType(t: string) {
  return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function eventDotClass(event: PaymentEvent) {
  const s = event.to_status
  if (s === 'completed') return 'bg-green-500'
  if (s === 'failed' || s === 'expired') return 'bg-red-400'
  if (s === 'confirmed') return 'bg-blue-400'
  return 'bg-gray-300'
}

function statusTextClass(status: string | null) {
  if (!status) return 'text-gray-500'
  const map: Record<string, string> = {
    completed: 'text-green-600',
    failed:    'text-red-600',
    expired:   'text-red-500',
    confirmed: 'text-blue-600',
    pending:   'text-yellow-600',
  }
  return map[status] ?? 'text-gray-700'
}
</script>
