<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      @mousedown.self="$emit('close')"
    >
      <div class="w-full max-w-md bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 class="text-base font-semibold text-gray-900">
            {{ isEdit ? 'Edit paywall' : 'New paywall' }}
          </h2>
          <button
            class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            @click="$emit('close')"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <form class="px-6 py-5 space-y-4" @submit.prevent="handleSubmit">
          <UiAlert v-if="submitError" variant="danger" dismissible>{{ submitError }}</UiAlert>

          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1" for="paywall-name">
              Name <span class="text-red-500">*</span>
            </label>
            <input
              id="paywall-name"
              v-model="form.name"
              type="text"
              required
              maxlength="200"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="e.g. Premium Access"
              autofocus
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1" for="paywall-desc">
              Description
              <span class="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="paywall-desc"
              v-model="form.description"
              rows="2"
              maxlength="1000"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none
                     focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="Shown to customers on the checkout page"
            />
          </div>

          <!-- Type toggle — create only -->
          <div v-if="!isEdit" class="border-t border-gray-100 pt-4">
            <p class="text-sm font-medium text-gray-700 mb-3">Paywall type</p>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                :class="[
                  'flex flex-col items-start gap-1 rounded-xl border-2 px-4 py-3 text-left transition-colors',
                  form.paywall_type === 'quick'
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 hover:border-gray-300',
                ]"
                @click="form.paywall_type = 'quick'"
              >
                <span class="text-xs font-semibold" :class="form.paywall_type === 'quick' ? 'text-brand-700' : 'text-gray-700'">
                  Quick
                </span>
                <span class="text-xs text-gray-400 leading-tight">Fixed amount you define</span>
              </button>
              <button
                type="button"
                :class="[
                  'flex flex-col items-start gap-1 rounded-xl border-2 px-4 py-3 text-left transition-colors',
                  form.paywall_type === 'product'
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 hover:border-gray-300',
                ]"
                @click="form.paywall_type = 'product'"
              >
                <span class="text-xs font-semibold" :class="form.paywall_type === 'product' ? 'text-brand-700' : 'text-gray-700'">
                  Product
                </span>
                <span class="text-xs text-gray-400 leading-tight">Linked to a product price</span>
              </button>
            </div>
          </div>

          <!-- Quick paywall price -->
          <div v-if="form.paywall_type === 'quick'" class="space-y-3">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Price</p>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-1">
                  Asset <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="form.asset"
                  :required="form.paywall_type === 'quick'"
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
                  :required="form.paywall_type === 'quick'"
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
                :required="form.paywall_type === 'quick'"
                pattern="^\d+(\.\d+)?$"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="e.g. 10.00"
              />
            </div>
          </div>

          <!-- Product paywall price selection -->
          <div v-if="form.paywall_type === 'product'" class="space-y-3">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Linked product</p>

            <!-- Product select -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">
                Product <span class="text-red-500">*</span>
              </label>
              <select
                v-model="selectedProductId"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                @change="onProductChange"
              >
                <option value="">Select product</option>
                <option v-for="p in productsStore.items" :key="p.id" :value="p.id">
                  {{ p.name }}
                </option>
              </select>
            </div>

            <!-- Auto-pricing toggle (shown if product has auto_pricing_enabled) -->
            <div v-if="selectedProduct?.auto_pricing_enabled" class="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <button
                type="button"
                :class="[
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
                  'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
                  form.use_auto_pricing ? 'bg-blue-600' : 'bg-gray-300',
                ]"
                @click="form.use_auto_pricing = !form.use_auto_pricing"
              >
                <span
                  :class="[
                    'inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200',
                    form.use_auto_pricing ? 'translate-x-5' : 'translate-x-0',
                  ]"
                />
              </button>
              <div>
                <label class="text-sm font-medium text-gray-700">Auto-generate options</label>
                <p class="text-xs text-gray-500">Uses base price (${{ selectedProduct?.base_amount }}) to quote all chains</p>
              </div>
            </div>

            <!-- Price select (only if not using auto-pricing) -->
            <div v-if="!form.use_auto_pricing && selectedProductId">
              <label class="block text-xs font-medium text-gray-600 mb-1">
                Price <span class="text-red-500">*</span>
              </label>
              <div v-if="loadingPrices" class="flex items-center gap-2 text-xs text-gray-400 py-2">
                <UiSpinner size="sm" /> Loading prices…
              </div>
              <div v-else-if="availablePrices.length === 0" class="text-xs text-gray-400 py-2 italic">
                No active prices for this product. Add a price first, or enable auto-pricing if configured.
              </div>
              <select
                v-else
                v-model="form.product_price_id"
                :required="form.paywall_type === 'product' && !form.use_auto_pricing"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="">Select price</option>
                <option
                  v-for="price in availablePrices"
                  :key="price.id"
                  :value="price.id"
                >
                  {{ fmtAmount(price.amount) }} {{ price.asset }} — {{ price.chain }}
                </option>
              </select>
            </div>
          </div>

          <!-- Active toggle — edit only -->
          <div v-if="isEdit" class="flex items-center justify-between py-1 border-t border-gray-100 pt-4">
            <div>
              <p class="text-sm font-medium text-gray-700">Active</p>
              <p class="text-xs text-gray-400">Inactive paywalls are hidden from customers</p>
            </div>
            <button
              type="button"
              :class="[
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
                'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
                form.is_active ? 'bg-brand-600' : 'bg-gray-200',
              ]"
              @click="form.is_active = !form.is_active"
            >
              <span
                :class="[
                  'inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200',
                  form.is_active ? 'translate-x-5' : 'translate-x-0',
                ]"
              />
            </button>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-3 pt-2">
            <UiButton type="button" variant="secondary" @click="$emit('close')">Cancel</UiButton>
            <UiButton type="submit" :loading="loading">
              {{ isEdit ? 'Save changes' : 'Create paywall' }}
            </UiButton>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Paywall, ProductPrice } from '~/types'

const props = defineProps<{
  paywall?: Paywall
}>()

const emit = defineEmits<{
  close: []
  saved: [paywall: Paywall]
}>()

const store = usePaywallsStore()
const productsStore = useProductsStore()

const isEdit = computed(() => !!props.paywall)
const loading = ref(false)
const submitError = ref('')

const form = reactive({
  name: props.paywall?.name ?? '',
  description: props.paywall?.description ?? '',
  paywall_type: (props.paywall?.paywall_type ?? 'quick') as 'quick' | 'product',
  // Quick
  asset: props.paywall?.asset ?? '',
  chain: props.paywall?.chain ?? '',
  amount: props.paywall?.amount ?? '',
  // Product
  product_price_id: props.paywall?.product_price_id ?? '',
  use_auto_pricing: props.paywall?.auto_payment_options_enabled ?? false,
  is_active: props.paywall?.is_active ?? true,
})

const selectedProductId = ref('')
const loadingPrices = ref(false)
const availablePrices = ref<ProductPrice[]>([])
const selectedProduct = computed(() =>
  productsStore.items.find((p) => p.id === selectedProductId.value)
)

// Load products when modal opens (needed for the product mode dropdown)
onMounted(() => {
  if (productsStore.items.length === 0) productsStore.fetchAll()
})

async function onProductChange() {
  form.product_price_id = ''
  availablePrices.value = []
  if (!selectedProductId.value) return
  loadingPrices.value = true
  try {
    const prices = await productsStore.fetchPrices(selectedProductId.value)
    availablePrices.value = prices.filter((p) => p.is_active)
  } catch {
    availablePrices.value = []
  } finally {
    loadingPrices.value = false
  }
}

function fmtAmount(val: string): string {
  const n = parseFloat(val)
  return isNaN(n) ? val : n.toLocaleString('en-US', { maximumFractionDigits: 8, useGrouping: false })
}

async function handleSubmit() {
  submitError.value = ''
  loading.value = true
  try {
    let saved: Paywall | null

    if (isEdit.value && props.paywall) {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        is_active: form.is_active,
      }

      if (form.paywall_type === 'quick') {
        payload.asset = form.asset || null
        payload.chain = form.chain || null
        payload.amount = form.amount || null
      } else if (form.paywall_type === 'product') {
        if (form.use_auto_pricing) {
          payload.auto_payment_options_enabled = true
          payload.product_ids = [selectedProductId.value]
        } else {
          payload.product_price_id = form.product_price_id || null
        }
      }

      saved = await store.update(props.paywall.id, payload)
    } else {
      if (form.paywall_type === 'quick' && (!form.asset || !form.chain || !form.amount)) {
        submitError.value = 'Please fill in asset, network, and amount.'
        return
      }
      if (form.paywall_type === 'product' && !selectedProductId.value) {
        submitError.value = 'Please select a product.'
        return
      }
      if (form.paywall_type === 'product' && !form.use_auto_pricing && !form.product_price_id) {
        submitError.value = 'Please select a price or enable auto-pricing.'
        return
      }

      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        paywall_type: form.paywall_type,
      }

      if (form.paywall_type === 'quick') {
        payload.asset = form.asset || null
        payload.chain = form.chain || null
        payload.amount = form.amount || null
      } else if (form.paywall_type === 'product') {
        if (form.use_auto_pricing) {
          payload.auto_payment_options_enabled = true
          payload.product_ids = [selectedProductId.value]
        } else {
          payload.product_price_id = form.product_price_id || null
        }
      }

      saved = await store.create(payload)
    }

    if (saved) emit('saved', saved)
    emit('close')
  } catch (err) {
    submitError.value = err instanceof Error ? err.message : 'Something went wrong'
  } finally {
    loading.value = false
  }
}
</script>
