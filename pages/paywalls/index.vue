<template>
  <div>
    <!-- Header -->
    <div class="flex items-start justify-between mb-6">
      <div>
        <h1 class="page-title">Paywalls</h1>
        <p class="page-subtitle">Configure checkout pages for your products</p>
      </div>
      <UiButton @click="openCreate">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        New paywall
      </UiButton>
    </div>

    <!-- Error banner -->
    <UiAlert v-if="store.error" variant="danger" class="mb-4" dismissible>
      {{ store.error }}
    </UiAlert>

    <!-- Paywall table -->
    <UiCard :padding="false">
      <!-- Loading -->
      <div v-if="store.loading" class="flex items-center justify-center py-16">
        <UiSpinner />
      </div>

      <!-- Empty state -->
      <UiEmptyState
        v-else-if="!store.items.length"
        title="No paywalls yet"
        description="Create a paywall linked to a product to start collecting payments."
      >
        <template #action>
          <UiButton size="sm" @click="openCreate">Create paywall</UiButton>
        </template>
      </UiEmptyState>

      <!-- Table -->
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-100 bg-gray-50">
            <th class="text-left px-5 py-3 font-medium text-gray-500">Name</th>
            <th class="text-left px-5 py-3 font-medium text-gray-500 hidden md:table-cell">Type</th>
            <th class="text-left px-5 py-3 font-medium text-gray-500">Price</th>
            <th class="text-left px-5 py-3 font-medium text-gray-500">Status</th>
            <th class="text-left px-5 py-3 font-medium text-gray-500 hidden lg:table-cell">Created</th>
            <th class="px-5 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr
            v-for="paywall in store.items"
            :key="paywall.id"
            class="hover:bg-gray-50 transition-colors"
          >
            <td class="px-5 py-4 font-medium text-gray-900">{{ paywall.name }}</td>
            <td class="px-5 py-4 hidden md:table-cell">
              <UiBadge :variant="paywall.paywall_type === 'product' ? 'info' : 'default'">
                {{ paywall.paywall_type === 'product' ? 'Product' : 'Quick' }}
              </UiBadge>
            </td>
            <td class="px-5 py-4">
              <span v-if="paywall.amount && paywall.asset" class="font-medium text-gray-900">
                {{ fmtAmount(paywall.amount) }} {{ paywall.asset }}
                <span class="text-gray-400 text-xs ml-1 capitalize">{{ paywall.chain }}</span>
              </span>
              <span v-else class="text-xs text-yellow-600 italic">No price set</span>
            </td>
            <td class="px-5 py-4">
              <UiBadge :variant="paywall.is_active ? 'success' : 'default'">
                {{ paywall.is_active ? 'Active' : 'Inactive' }}
              </UiBadge>
            </td>
            <td class="px-5 py-4 text-gray-400 hidden lg:table-cell">
              {{ formatDate(paywall.created_at) }}
            </td>
            <td class="px-5 py-4">
              <div class="flex items-center justify-end gap-2">
                <UiButton
                  variant="secondary"
                  size="sm"
                  :title="`Copy checkout link for ${paywall.name}`"
                  @click="copyLink(paywall.id)"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {{ copiedId === paywall.id ? 'Copied!' : 'Copy link' }}
                </UiButton>
                <NuxtLink :to="`/checkout/${paywall.id}`" target="_blank">
                  <UiButton variant="ghost" size="sm" title="Preview checkout page">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Preview
                  </UiButton>
                </NuxtLink>
                <UiButton variant="ghost" size="sm" @click="openEdit(paywall)">Edit</UiButton>
                <UiButton variant="ghost" size="sm" class="!text-red-500 hover:!bg-red-50" @click="openDelete(paywall)">
                  Delete
                </UiButton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </UiCard>

    <!-- Create / Edit modal -->
    <PaywallFormModal
      v-if="modal.open"
      :paywall="modal.paywall"
      @close="modal.open = false"
      @saved="onSaved"
    />

    <!-- Delete confirmation -->
    <ConfirmModal
      v-if="deleteTarget"
      title="Delete paywall"
      :message="`Are you sure you want to delete &quot;${deleteTarget.name}&quot;? This cannot be undone.`"
      :loading="deleting"
      @confirm="confirmDelete"
      @cancel="deleteTarget = null"
    />
  </div>
</template>

<script setup lang="ts">
import type { Paywall } from '~/types'

definePageMeta({ middleware: 'auth' })

const store = usePaywallsStore()

onMounted(() => store.fetchAll())

// ---- Modal state ----
const modal = reactive<{ open: boolean; paywall?: Paywall }>({ open: false })

function openCreate() {
  modal.paywall = undefined
  modal.open = true
}
function openEdit(paywall: Paywall) {
  modal.paywall = paywall
  modal.open = true
}
function onSaved(_paywall: Paywall) {
  modal.open = false
}

// ---- Delete state ----
const deleteTarget = ref<Paywall | null>(null)
const deleting = ref(false)

function openDelete(paywall: Paywall) {
  deleteTarget.value = paywall
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
function fmtAmount(val: string): string {
  const n = parseFloat(val)
  return isNaN(n) ? val : n.toLocaleString('en-US', { maximumFractionDigits: 8, useGrouping: false })
}

// ---- Copy link ----
const copiedId = ref<string | null>(null)

async function copyLink(id: string) {
  const url = `${window.location.origin}/checkout/${id}`
  await navigator.clipboard.writeText(url)
  copiedId.value = id
  setTimeout(() => { copiedId.value = null }, 2000)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}
</script>
