<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      @mousedown.self="$emit('close')"
    >
      <div class="w-full max-w-md bg-white rounded-2xl shadow-xl">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 class="text-base font-semibold text-gray-900">New payment intent</h2>
            <p class="text-xs text-gray-400 mt-0.5">Backend validates chain/asset against merchant capabilities</p>
          </div>
          <button
            class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            @click="$emit('close')"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Form -->
        <form class="px-6 py-5 space-y-4" @submit.prevent="handleSubmit">
          <UiAlert v-if="submitError" variant="danger" dismissible>{{ submitError }}</UiAlert>

          <!-- Asset + Chain side by side -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" for="pi-asset">
                Asset <span class="text-red-500">*</span>
              </label>
              <input
                id="pi-asset"
                v-model="form.asset"
                type="text"
                required
                placeholder="USDC"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent uppercase"
                @input="form.asset = (form.asset as string).toUpperCase()"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" for="pi-chain">
                Chain <span class="text-red-500">*</span>
              </label>
              <input
                id="pi-chain"
                v-model="form.chain"
                type="text"
                required
                placeholder="ethereum"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          </div>

          <!-- Amount -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1" for="pi-amount">
              Amount <span class="text-red-500">*</span>
            </label>
            <input
              id="pi-amount"
              v-model="form.amount"
              type="text"
              required
              pattern="^\d+(\.\d+)?$"
              title="Enter a positive decimal number, e.g. 10.50"
              placeholder="10.00"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            <p class="text-xs text-gray-400 mt-1">Positive decimal, e.g. 10.50</p>
          </div>

          <!-- Payer address (optional) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1" for="pi-payer">
              Payer address
              <span class="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="pi-payer"
              v-model="form.payer_address"
              type="text"
              placeholder="0x…"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono
                     focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <!-- Product price ID (optional) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1" for="pi-price">
              Product price ID
              <span class="text-gray-400 font-normal">(optional UUID)</span>
            </label>
            <input
              id="pi-price"
              v-model="form.product_price_id"
              type="text"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono
                     focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-3 pt-2">
            <UiButton type="button" variant="secondary" @click="$emit('close')">Cancel</UiButton>
            <UiButton type="submit" :loading="loading">Create intent</UiButton>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { PaymentIntent } from '~/types'

const emit = defineEmits<{
  close: []
  created: [intent: PaymentIntent]
}>()

const store = usePaymentIntentsStore()
const router = useRouter()

const loading = ref(false)
const submitError = ref('')

const form = reactive({
  asset: '',
  chain: '',
  amount: '',
  payer_address: '',
  product_price_id: '',
})

async function handleSubmit() {
  submitError.value = ''
  loading.value = true
  try {
    const created = await store.create({
      asset: form.asset.trim().toUpperCase(),
      chain: form.chain.trim().toLowerCase(),
      amount: form.amount.trim(),
      payer_address: form.payer_address.trim() || null,
      product_price_id: form.product_price_id.trim() || null,
    })
    if (created) {
      emit('created', created)
      emit('close')
      await router.push(`/payment-intents/${created.id}`)
    }
  } catch (err) {
    submitError.value = err instanceof Error ? err.message : 'Something went wrong'
  } finally {
    loading.value = false
  }
}
</script>
