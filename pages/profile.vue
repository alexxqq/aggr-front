<template>
  <div>
    <div class="mb-6">
      <h1 class="page-title">Profile & Settings</h1>
      <p class="page-subtitle">Manage your merchant account</p>
    </div>

    <div v-if="store.loading" class="flex items-center gap-3 py-8">
      <UiSpinner />
      <span class="text-sm text-gray-500">Loading…</span>
    </div>

    <UiAlert v-else-if="store.error" variant="danger" class="mb-4">{{ store.error }}</UiAlert>

    <div v-else class="max-w-2xl space-y-6">

      <!-- Profile card -->
      <UiCard title="Merchant profile">
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Email</label>
            <p class="text-sm text-gray-900">{{ store.profile?.email ?? '—' }}</p>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Display name</label>
            <p class="text-sm text-gray-900">{{ store.profile?.display_name ?? '—' }}</p>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <UiBadge :variant="store.profile?.status === 'active' ? 'success' : 'default'">
              {{ store.profile?.status ?? '—' }}
            </UiBadge>
          </div>
        </div>
      </UiCard>

      <!-- Payment settings card -->
      <UiCard title="Payment settings" subtitle="Configure which chains and assets you accept">
        <UiAlert v-if="settingsError" variant="danger" class="mb-4" dismissible>{{ settingsError }}</UiAlert>

        <form class="space-y-4" @submit.prevent="saveSettings">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Allowed chains
              <span class="text-gray-400 font-normal text-xs ml-1">comma-separated, e.g. ethereum, bsc, tron</span>
            </label>
            <input
              v-model="settingsForm.chainsRaw"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="ethereum, bsc, tron"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Allowed assets
              <span class="text-gray-400 font-normal text-xs ml-1">comma-separated, e.g. USDT, ETH, BNB</span>
            </label>
            <input
              v-model="settingsForm.assetsRaw"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="USDT, ETH, BNB, TRX"
            />
          </div>

          <div class="flex items-center gap-3 pt-1">
            <UiButton type="submit" :loading="savingSettings">Save settings</UiButton>
            <span v-if="settingsSaved" class="text-sm text-green-600">Saved!</span>
          </div>
        </form>
      </UiCard>

      <!-- Withdrawal addresses -->
      <UiCard title="Withdrawal addresses" subtitle="Your wallets where we send your earnings after confirmation">
        <UiAlert v-if="walletError" variant="danger" class="mb-4" dismissible>{{ walletError }}</UiAlert>

        <!-- Existing wallets -->
        <div v-if="store.wallets.length" class="space-y-2 mb-4">
          <div
            v-for="wallet in store.wallets"
            :key="wallet.id"
            class="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-3"
          >
            <div class="min-w-0">
              <div class="flex items-center gap-2 mb-0.5">
                <span class="text-sm font-medium text-gray-900 capitalize">{{ wallet.chain }}</span>
                <UiBadge v-if="wallet.is_default" variant="success" size="sm">Default</UiBadge>
                <span v-if="wallet.label" class="text-xs text-gray-400">· {{ wallet.label }}</span>
              </div>
              <p class="font-mono text-xs text-gray-600 truncate max-w-xs">{{ wallet.address }}</p>
            </div>
            <UiButton
              variant="ghost"
              size="sm"
              class="!text-red-500 hover:!bg-red-50 shrink-0 ml-3"
              :loading="removingWalletId === wallet.id"
              @click="removeWallet(wallet.id)"
            >
              Remove
            </UiButton>
          </div>
        </div>
        <p v-else class="text-sm text-gray-400 mb-4">No wallets added yet.</p>

        <!-- Add wallet form -->
        <form class="space-y-3 border-t border-gray-100 pt-4" @submit.prevent="addWallet">
          <p class="text-sm font-medium text-gray-700">Add a wallet</p>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Chain</label>
              <input
                v-model="walletForm.chain"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="ethereum"
                @input="walletForm.chain = walletForm.chain.toLowerCase()"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Label (optional)</label>
              <input
                v-model="walletForm.label"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                placeholder="My ETH wallet"
              />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Address</label>
            <input
              v-model="walletForm.address"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono
                     focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="0x…"
            />
          </div>
          <div class="flex items-center justify-between">
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input v-model="walletForm.is_default" type="checkbox" class="rounded text-brand-600" />
              <span class="text-sm text-gray-700">Set as default for this chain</span>
            </label>
            <UiButton type="submit" size="sm" :loading="addingWallet">Add wallet</UiButton>
          </div>
        </form>
      </UiCard>

      <!-- API credentials -->
      <UiCard title="API credentials" subtitle="Use these in your backend integration">
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Merchant ID</label>
          <div class="flex items-center gap-2">
            <code class="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 font-mono truncate">
              {{ store.profile?.id ?? '—' }}
            </code>
            <UiButton variant="secondary" size="sm" @click="copyId">Copy</UiButton>
          </div>
        </div>
      </UiCard>

      <!-- Webhook -->
      <UiCard title="Webhook" subtitle="Receive real-time notifications when payment status changes">
        <UiAlert v-if="webhookError" variant="danger" class="mb-4" dismissible @dismiss="webhookError = ''">
          {{ webhookError }}
        </UiAlert>

        <!-- New secret banner (shown once after create / rotate) -->
        <div v-if="newSecret" class="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p class="text-xs font-semibold text-amber-800 mb-1">
            Save this secret — it will not be shown again
          </p>
          <div class="flex items-center gap-2">
            <code class="flex-1 text-xs font-mono text-amber-900 break-all">{{ newSecret }}</code>
            <UiButton variant="secondary" size="sm" @click="copySecret">
              {{ secretCopied ? 'Copied!' : 'Copy' }}
            </UiButton>
          </div>
          <p class="text-xs text-amber-600 mt-2">
            Use this to verify webhook signatures:
            <code class="bg-amber-100 px-1 rounded">HMAC-SHA256(secret, request_body)</code>
          </p>
        </div>

        <form class="space-y-4" @submit.prevent="saveWebhook">
          <!-- URL -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
            <input
              v-model="webhookForm.url"
              type="url"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              placeholder="https://your-site.com/webhook"
            />
          </div>

          <!-- Enabled toggle -->
          <label class="flex items-center gap-3 cursor-pointer select-none">
            <div
              class="relative w-10 h-6 rounded-full transition-colors"
              :class="webhookForm.enabled ? 'bg-brand-600' : 'bg-gray-300'"
              @click="webhookForm.enabled = !webhookForm.enabled"
            >
              <div
                class="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform"
                :class="webhookForm.enabled ? 'translate-x-5' : 'translate-x-1'"
              />
            </div>
            <span class="text-sm text-gray-700">{{ webhookForm.enabled ? 'Enabled' : 'Disabled' }}</span>
          </label>

          <div class="flex items-center gap-3">
            <UiButton type="submit" :loading="savingWebhook">
              {{ store.data?.webhook_config ? 'Update webhook' : 'Save webhook' }}
            </UiButton>
            <UiButton
              v-if="store.data?.webhook_config"
              variant="secondary"
              :loading="rotatingSecret"
              type="button"
              @click="rotateSecret"
            >
              Rotate secret
            </UiButton>
            <span v-if="webhookSaved" class="text-sm text-green-600">Saved!</span>
          </div>
        </form>

        <!-- Current status (if configured) -->
        <div v-if="store.data?.webhook_config && !newSecret" class="mt-4 pt-4 border-t border-gray-100">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500">Current URL</span>
            <span class="font-mono text-xs text-gray-700 truncate max-w-xs">
              {{ store.data.webhook_config.webhook_url }}
            </span>
          </div>
          <div class="flex items-center justify-between text-sm mt-2">
            <span class="text-gray-500">Status</span>
            <UiBadge :variant="store.data.webhook_config.is_enabled ? 'success' : 'default'">
              {{ store.data.webhook_config.is_enabled ? 'Active' : 'Disabled' }}
            </UiBadge>
          </div>
          <p class="text-xs text-gray-400 mt-3">
            Secret was set at creation. To see it again, use <strong>Rotate secret</strong>.
          </p>
        </div>
      </UiCard>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const store = useMerchantStore()

onMounted(() => {
  if (!store.data) store.fetchProfile()
})

// ---- Settings form ----
const settingsError = ref('')
const savingSettings = ref(false)
const settingsSaved = ref(false)

const settingsForm = reactive({
  chainsRaw: '',
  assetsRaw: '',
})

// Populate form when store loads
watch(() => store.settings, (s) => {
  if (s) {
    settingsForm.chainsRaw = s.allowed_chains.join(', ')
    settingsForm.assetsRaw = s.allowed_assets.join(', ')
  }
}, { immediate: true })

async function saveSettings() {
  settingsError.value = ''
  settingsSaved.value = false
  savingSettings.value = true
  try {
    const chains = settingsForm.chainsRaw.split(',').map((s) => s.trim()).filter(Boolean)
    const assets = settingsForm.assetsRaw.split(',').map((s) => s.trim()).filter(Boolean)
    await store.updateSettings({ allowed_chains: chains, allowed_assets: assets })
    settingsSaved.value = true
    setTimeout(() => { settingsSaved.value = false }, 2000)
  } catch (err) {
    settingsError.value = err instanceof Error ? err.message : 'Save failed'
  } finally {
    savingSettings.value = false
  }
}

// ---- Wallets ----
const walletError = ref('')
const addingWallet = ref(false)
const removingWalletId = ref<string | null>(null)

const walletForm = reactive({
  chain: 'ethereum',
  address: '',
  label: '',
  is_default: true,
})

async function addWallet() {
  walletError.value = ''
  addingWallet.value = true
  try {
    await store.addWallet({
      chain: walletForm.chain.trim().toLowerCase(),
      address: walletForm.address.trim(),
      label: walletForm.label.trim() || null,
      is_default: walletForm.is_default,
    })
    walletForm.address = ''
    walletForm.label = ''
  } catch (err) {
    walletError.value = err instanceof Error ? err.message : 'Failed to add wallet'
  } finally {
    addingWallet.value = false
  }
}

async function removeWallet(id: string) {
  walletError.value = ''
  removingWalletId.value = id
  try {
    await store.removeWallet(id)
  } catch (err) {
    walletError.value = err instanceof Error ? err.message : 'Failed to remove wallet'
  } finally {
    removingWalletId.value = null
  }
}

// ---- Copy merchant ID ----
async function copyId() {
  const id = store.profile?.id
  if (id) await navigator.clipboard.writeText(id)
}

// ---- Webhook ----
const webhookError   = ref('')
const savingWebhook  = ref(false)
const webhookSaved   = ref(false)
const rotatingSecret = ref(false)
const newSecret      = ref<string | null>(null)
const secretCopied   = ref(false)

const webhookForm = reactive({ url: '', enabled: true })

watch(() => store.data?.webhook_config, (cfg) => {
  if (cfg) {
    webhookForm.url     = cfg.webhook_url
    webhookForm.enabled = cfg.is_enabled
  }
}, { immediate: true })

async function saveWebhook() {
  if (!webhookForm.url) { webhookError.value = 'URL is required'; return }
  webhookError.value = ''
  savingWebhook.value = true
  newSecret.value = null
  try {
    const api = useApi()
    const { data, error } = await api.put<WebhookConfig>('/v1/me/webhook', {
      webhook_url: webhookForm.url,
      is_enabled:  webhookForm.enabled,
    })
    if (error) throw new Error(error.message)
    if (data) {
      if (store.data) store.data.webhook_config = data
      if (data.secret) newSecret.value = data.secret
      webhookSaved.value = true
      setTimeout(() => { webhookSaved.value = false }, 2000)
    }
  } catch (err) {
    webhookError.value = err instanceof Error ? err.message : 'Save failed'
  } finally {
    savingWebhook.value = false
  }
}

async function rotateSecret() {
  rotatingSecret.value = true
  newSecret.value = null
  try {
    const api = useApi()
    const { data, error } = await api.post<{ secret: string; webhook_url: string; is_enabled: boolean }>(
      '/v1/me/webhook/rotate'
    )
    if (error) throw new Error(error.message)
    if (data?.secret) newSecret.value = data.secret
  } catch (err) {
    webhookError.value = err instanceof Error ? err.message : 'Rotate failed'
  } finally {
    rotatingSecret.value = false
  }
}

async function copySecret() {
  if (newSecret.value) {
    await navigator.clipboard.writeText(newSecret.value)
    secretCopied.value = true
    setTimeout(() => { secretCopied.value = false }, 2000)
  }
}

// Import type for local use
import type { WebhookConfig } from '~/types'
</script>
