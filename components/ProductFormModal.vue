<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      @mousedown.self="$emit('close')"
    >
      <div class="w-full max-w-md bg-white rounded-2xl shadow-xl">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 class="text-base font-semibold text-gray-900">
            {{ isEdit ? 'Edit product' : 'New product' }}
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
            <label class="block text-sm font-medium text-gray-700 mb-1" for="product-name">
              Name <span class="text-red-500">*</span>
            </label>
            <input
              id="product-name"
              v-model="form.name"
              type="text"
              required
              maxlength="200"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="e.g. Premium subscription"
              autofocus
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1" for="product-desc">
              Description
              <span class="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="product-desc"
              v-model="form.description"
              rows="3"
              maxlength="1000"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none
                     focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="Brief description shown on paywalls"
            />
          </div>

          <!-- Auto-pricing section -->
          <div class="pt-2 border-t border-gray-100">
            <button
              type="button"
              class="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
              @click="showAutoPricing = !showAutoPricing"
            >
              <span class="text-sm font-medium text-gray-700">Auto-pricing (optional)</span>
              <svg
                class="w-4 h-4 text-gray-400 transition-transform"
                :class="{ 'rotate-180': showAutoPricing }"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>

            <!-- Expanded auto-pricing fields -->
            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              leave-active-class="transition-all duration-150 ease-in"
              enter-from-class="opacity-0 max-h-0"
              enter-to-class="opacity-100"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0 max-h-0"
            >
              <div v-if="showAutoPricing" class="space-y-3 mt-3 pl-3 pr-2 py-2 bg-gray-50 rounded-lg overflow-hidden">
                <!-- Base Amount -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1" for="base-amount">
                    Base amount (USD)
                  </label>
                  <input
                    id="base-amount"
                    v-model="form.base_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    placeholder="e.g. 20.00"
                  />
                  <p class="text-xs text-gray-400 mt-1">Product price that will auto-generate checkout options</p>
                </div>

                <!-- Currency (locked to USD for MVP) -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <div class="px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-sm text-gray-600">
                    USD
                  </div>
                </div>

                <!-- Enable toggle -->
                <div class="flex items-center gap-3 py-1">
                  <button
                    type="button"
                    :class="[
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
                      'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
                      form.auto_pricing_enabled ? 'bg-brand-600' : 'bg-gray-300',
                    ]"
                    @click="form.auto_pricing_enabled = !form.auto_pricing_enabled"
                  >
                    <span
                      :class="[
                        'inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200',
                        form.auto_pricing_enabled ? 'translate-x-5' : 'translate-x-0',
                      ]"
                    />
                  </button>
                  <label class="text-sm font-medium text-gray-700">Enable auto-pricing</label>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Active toggle — only on edit -->
          <div v-if="isEdit" class="flex items-center justify-between py-1">
            <div>
              <p class="text-sm font-medium text-gray-700">Active</p>
              <p class="text-xs text-gray-400">Inactive products cannot be used in new paywalls</p>
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
              {{ isEdit ? 'Save changes' : 'Create product' }}
            </UiButton>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Product } from '~/types'

const props = defineProps<{
  /** Pass a product to edit; omit (undefined) for create mode. */
  product?: Product
}>()

const emit = defineEmits<{
  close: []
  saved: [product: Product]
}>()

const store = useProductsStore()

const isEdit = computed(() => !!props.product)
const loading = ref(false)
const submitError = ref('')
const showAutoPricing = ref(false)

const form = reactive({
  name: props.product?.name ?? '',
  description: props.product?.description ?? '',
  is_active: props.product?.is_active ?? true,
  base_amount: props.product?.base_amount ?? '',
  auto_pricing_enabled: props.product?.auto_pricing_enabled ?? false,
})

async function handleSubmit() {
  submitError.value = ''
  loading.value = true
  try {
    let saved: Product | null
    const basePayload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
    }

    const autoPricingPayload = {
      base_amount: form.base_amount ? String(form.base_amount) : null,
      base_currency: form.base_amount ? 'USD' : undefined,
      auto_pricing_enabled: form.auto_pricing_enabled,
    }

    if (isEdit.value && props.product) {
      saved = await store.update(props.product.id, {
        ...basePayload,
        is_active: form.is_active,
        ...autoPricingPayload,
      })
    } else {
      saved = await store.create({
        ...basePayload,
        ...autoPricingPayload,
      })
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
