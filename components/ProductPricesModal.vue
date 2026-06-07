<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      @mousedown.self="$emit('close')"
    >
      <div class="w-full max-w-lg bg-white rounded-2xl shadow-xl">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 class="text-base font-semibold text-gray-900">Prices — {{ product.name }}</h2>
            <p class="text-xs text-gray-400 mt-0.5">Define what you charge per asset and network</p>
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

        <div class="px-6 py-5 space-y-5">
          <!-- Existing prices list -->
          <div v-if="loading" class="flex justify-center py-6">
            <UiSpinner />
          </div>

          <div v-else-if="prices.length === 0" class="text-sm text-gray-400 text-center py-4 italic">
            No prices yet. Add one below.
          </div>

          <table v-else class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100">
                <th class="text-left pb-2 font-medium text-gray-500 text-xs">Amount</th>
                <th class="text-left pb-2 font-medium text-gray-500 text-xs">Asset</th>
                <th class="text-left pb-2 font-medium text-gray-500 text-xs">Network</th>
                <th class="text-left pb-2 font-medium text-gray-500 text-xs">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="price in prices" :key="price.id">
                <td class="py-2.5 font-medium text-gray-900">{{ fmtAmount(price.amount) }}</td>
                <td class="py-2.5 text-gray-700">{{ price.asset }}</td>
                <td class="py-2.5 text-gray-500 capitalize">{{ price.chain }}</td>
                <td class="py-2.5">
                  <UiBadge :variant="price.is_active ? 'success' : 'default'" size="sm">
                    {{ price.is_active ? 'Active' : 'Inactive' }}
                  </UiBadge>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Add price form -->
          <div class="border-t border-gray-100 pt-4">
            <p class="text-sm font-medium text-gray-700 mb-3">Add a price</p>
            <UiAlert v-if="addError" variant="danger" dismissible class="mb-3">{{ addError }}</UiAlert>

            <form class="space-y-3" @submit.prevent="handleAdd">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">
                    Asset <span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="form.asset"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  >
                    <option value="">Select</option>
                    <option value="USDT">USDT</option>
                    <option value="USDC">USDC</option>
                    <option value="ETH">ETH</option>
                    <option value="BNB">BNB</option>
                    <option value="TRX">TRX</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">
                    Network <span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="form.chain"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  >
                    <option value="">Select</option>
                    <option value="ethereum">Ethereum</option>
                    <option value="bsc">BSC</option>
                    <option value="tron">Tron</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">
                  Amount <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.amount"
                  type="text"
                  required
                  pattern="^\d+(\.\d+)?$"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="e.g. 10.00"
                />
              </div>
              <div class="flex justify-end">
                <UiButton type="submit" size="sm" :loading="adding">Add price</UiButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Product, ProductPrice } from '~/types'

const props = defineProps<{ product: Product }>()
defineEmits<{ close: [] }>()

const store = useProductsStore()
const api = useApi()

const loading = ref(true)
const adding = ref(false)
const addError = ref('')
const prices = ref<ProductPrice[]>([])

const form = reactive({ asset: '', chain: '', amount: '' })

onMounted(async () => {
  try {
    prices.value = await store.fetchPrices(props.product.id)
  } finally {
    loading.value = false
  }
})

async function handleAdd() {
  addError.value = ''
  adding.value = true
  try {
    const { data, error } = await api.post<ProductPrice>(
      `/v1/products/${props.product.id}/prices`,
      { asset: form.asset, chain: form.chain, amount: form.amount },
    )
    if (error) throw new Error(error.message)
    if (data) {
      prices.value.push(data)
      // Update the cache in the store too
      store.prices[props.product.id] = prices.value
    }
    form.asset = ''
    form.chain = ''
    form.amount = ''
  } catch (err) {
    addError.value = err instanceof Error ? err.message : 'Failed to add price'
  } finally {
    adding.value = false
  }
}

function fmtAmount(val: string): string {
  const n = parseFloat(val)
  return isNaN(n) ? val : n.toLocaleString('en-US', { maximumFractionDigits: 8, useGrouping: false })
}
</script>
