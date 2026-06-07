<template>
  <div>
    <!-- Header -->
    <div class="flex items-start justify-between mb-6">
      <div>
        <h1 class="page-title">Products</h1>
        <p class="page-subtitle">Manage the goods or services you sell</p>
      </div>
      <UiButton @click="openCreate">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        New product
      </UiButton>
    </div>

    <!-- Error banner -->
    <UiAlert v-if="store.error" variant="danger" class="mb-4" dismissible>
      {{ store.error }}
    </UiAlert>

    <!-- Product table -->
    <UiCard :padding="false">
      <!-- Loading -->
      <div v-if="store.loading" class="flex items-center justify-center py-16">
        <UiSpinner />
      </div>

      <!-- Empty state -->
      <UiEmptyState
        v-else-if="!store.items.length"
        title="No products yet"
        description="Add your first product to start building paywalls and accepting payments."
      >
        <template #action>
          <UiButton size="sm" @click="openCreate">Add product</UiButton>
        </template>
      </UiEmptyState>

      <!-- Table -->
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-100 bg-gray-50">
            <th class="text-left px-5 py-3 font-medium text-gray-500">Name</th>
            <th class="text-left px-5 py-3 font-medium text-gray-500 hidden md:table-cell">Description</th>
            <th class="text-left px-5 py-3 font-medium text-gray-500">Status</th>
            <th class="text-left px-5 py-3 font-medium text-gray-500 hidden lg:table-cell">Created</th>
            <th class="px-5 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr
            v-for="product in store.items"
            :key="product.id"
            class="hover:bg-gray-50 transition-colors"
          >
            <td class="px-5 py-4 font-medium text-gray-900">{{ product.name }}</td>
            <td class="px-5 py-4 text-gray-500 hidden md:table-cell max-w-xs truncate">
              {{ product.description ?? '—' }}
            </td>
            <td class="px-5 py-4">
              <UiBadge :variant="product.is_active ? 'success' : 'default'">
                {{ product.is_active ? 'Active' : 'Inactive' }}
              </UiBadge>
            </td>
            <td class="px-5 py-4 text-gray-400 hidden lg:table-cell">
              {{ formatDate(product.created_at) }}
            </td>
            <td class="px-5 py-4">
              <div class="flex items-center justify-end gap-2">
                <UiButton variant="ghost" size="sm" @click="openPrices(product)">Prices</UiButton>
                <UiButton variant="ghost" size="sm" @click="openEdit(product)">Edit</UiButton>
                <UiButton variant="ghost" size="sm" class="!text-red-500 hover:!bg-red-50" @click="openDelete(product)">
                  Delete
                </UiButton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </UiCard>

    <!-- Create / Edit modal -->
    <ProductFormModal
      v-if="modal.open"
      :product="modal.product"
      @close="modal.open = false"
      @saved="onSaved"
    />

    <!-- Prices modal -->
    <ProductPricesModal
      v-if="pricesTarget"
      :product="pricesTarget"
      @close="pricesTarget = null"
    />

    <!-- Delete confirmation -->
    <ConfirmModal
      v-if="deleteTarget"
      title="Delete product"
      :message="`Are you sure you want to delete &quot;${deleteTarget.name}&quot;? This cannot be undone.`"
      :loading="deleting"
      @confirm="confirmDelete"
      @cancel="deleteTarget = null"
    />
  </div>
</template>

<script setup lang="ts">
import type { Product } from '~/types'

definePageMeta({ middleware: 'auth' })

const store = useProductsStore()

onMounted(() => store.fetchAll())

// ---- Prices modal ----
const pricesTarget = ref<Product | null>(null)
function openPrices(product: Product) { pricesTarget.value = product }

// ---- Create/Edit modal ----
const modal = reactive<{ open: boolean; product?: Product }>({ open: false })

function openCreate() {
  modal.product = undefined
  modal.open = true
}
function openEdit(product: Product) {
  modal.product = product
  modal.open = true
}
function onSaved(_product: Product) {
  modal.open = false
}

// ---- Delete state ----
const deleteTarget = ref<Product | null>(null)
const deleting = ref(false)

function openDelete(product: Product) {
  deleteTarget.value = product
}
async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await store.remove(deleteTarget.value.id)
    deleteTarget.value = null
  } catch (err) {
    store.error = err instanceof Error ? err.message : 'Delete failed'
    deleteTarget.value = null
  } finally {
    deleting.value = false
  }
}

// ---- Helpers ----
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}
</script>
