<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="w-full max-w-2xl">

      <!-- Loading -->
      <div v-if="phase === 'loading'" class="flex flex-col items-center gap-3 py-20">
        <UiSpinner />
        <p class="text-sm text-gray-400">Loading payment options…</p>
      </div>

      <!-- Not found -->
      <div v-else-if="phase === 'not-found'" class="text-center py-20">
        <p class="text-base font-semibold text-gray-700">Checkout not found</p>
        <p class="text-sm text-gray-400 mt-1">This link is invalid or has been deactivated.</p>
      </div>

      <!-- No price -->
      <div v-else-if="phase === 'no-price'" class="text-center py-20">
        <p class="text-base font-semibold text-gray-700">Checkout not ready</p>
        <p class="text-sm text-gray-400 mt-1">The merchant hasn't configured a price yet.</p>
      </div>

      <!-- SELECT OPTION ───────────────────────────────────────────────────── -->
      <div v-else-if="phase === 'select-option' && options" class="space-y-4">
        <div class="text-center mb-6">
          <!-- Show base USD price if auto-pricing -->
          <div v-if="options.pricing_mode === 'auto' && options.base_amount && options.base_currency" class="mb-4 text-2xl font-bold text-gray-900">
            {{ options.base_amount }} {{ options.base_currency }}
          </div>
          <h2 class="text-xl font-bold text-gray-900">Choose Payment Method</h2>
          <p class="text-sm text-gray-500 mt-1">Select your preferred chain and asset</p>
        </div>

        <!-- Option cards -->
        <div class="grid gap-3">
          <button
            v-for="option in optionsWithSavings"
            :key="option.option_id"
            class="p-4 rounded-xl border-2 transition-all text-left"
            :class="selectedOptionId === option.option_id
              ? 'border-brand-600 bg-brand-50'
              : option.executable
                ? 'border-gray-200 bg-white hover:border-gray-300'
                : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'"
            :disabled="!option.executable"
            @click="selectedOptionId = option.option_id"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <p class="font-semibold text-gray-900">
                    {{ option.amount }} {{ option.asset }}
                  </p>
                  <span v-if="option.recommended" class="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                    ✓ {{ options?.pricing_mode === 'auto' ? 'Lowest cost' : 'Cheapest' }}
                  </span>
                </div>
                <div class="flex items-center gap-2 text-sm text-gray-600">
                  <p>{{ option.chain_display_name }}</p>
                  <span :class="getChainSpeedClass(option.chain)" class="text-xs font-medium px-2 py-0.5 rounded">
                    {{ getChainSpeedLabel(option.chain) }}
                  </span>
                </div>
                <div class="flex flex-col gap-2 mt-2 text-xs text-gray-600">
                  <!-- Show USD cost estimate if available -->
                  <div v-if="option.total_estimated_cost_usd">
                    <span class="font-medium">Total (est):</span>
                    <span class="ml-1 text-gray-700">${{ option.total_estimated_cost_usd }}</span>
                  </div>
                  <div v-if="option.estimated_fee_usd">
                    <span class="font-medium">Fee (est):</span>
                    <span class="ml-1 text-gray-700">${{ option.estimated_fee_usd }}</span>
                  </div>
                  <div v-else-if="option.estimated_fee_native">
                    <span class="font-medium">Fee:</span>
                    <span class="ml-1 text-gray-700">{{ option.estimated_fee_native }} {{ option.asset === 'ETH' ? 'ETH' : option.asset }}</span>
                    <span v-if="option.source" class="ml-1 text-gray-400">({{ option.source }})</span>
                  </div>
                  <div v-if="option.savings && option.recommended === false" class="text-amber-600 font-medium">
                    +{{ option.savings }} {{ options?.pricing_mode === 'auto' ? 'USD' : 'ETH' }} vs cheapest
                  </div>
                  <!-- Confirmation time -->
                  <div class="text-gray-500 mt-1">
                    🕐 {{ getChainConfirmationTime(option.chain) }}
                  </div>
                </div>
              </div>
              <div v-if="!option.executable" class="text-right">
                <p class="text-xs text-red-600 font-medium">Unavailable</p>
                <p v-if="option.disabled_reason" class="text-xs text-gray-500 mt-0.5">
                  {{ formatDisabledReason(option.disabled_reason) }}
                </p>
              </div>
              <div v-else-if="selectedOptionId === option.option_id" class="ml-4 flex items-center justify-center w-6 h-6 rounded-full bg-brand-600">
                <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        <!-- Continue button -->
        <button
          class="w-full py-3 rounded-xl font-semibold text-sm text-white bg-brand-600 hover:bg-brand-700 active:scale-[0.98] transition-all disabled:opacity-60"
          :disabled="!selectedOptionId"
          @click="proceedWithSelectedOption"
        >
          Continue with selected payment
        </button>
      </div>

      <!-- FORM ──────────────────────────────────────────────────────────── -->
      <div v-else-if="phase === 'form' && selectedOption && (paywall || session)" class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <!-- Header -->
        <div class="px-6 py-5 border-b border-gray-100">
          <p class="text-xs font-medium text-gray-400 uppercase tracking-widest mb-0.5">Payment</p>
          <h1 class="text-lg font-bold text-gray-900">
            {{ checkoutType === 'paywall' ? paywall?.name : `Checkout ${session?.session_id?.slice(0, 8)}...` }}
          </h1>
          <p v-if="paywall?.description" class="text-sm text-gray-500 mt-0.5">{{ paywall.description }}</p>
          <p v-if="checkoutType === 'session'" class="text-sm text-gray-500 mt-0.5">{{ session?.currency }} {{ session?.amount }}</p>
        </div>

        <!-- Amount & chain -->
        <div class="px-6 py-6 text-center border-b border-gray-100">
          <p class="text-5xl font-bold text-gray-900 tracking-tight">{{ fmt(selectedOption.amount) }}</p>
          <p class="text-xl text-gray-500 mt-1">{{ selectedOption.asset }}</p>
          <p class="text-xs text-gray-400 mt-2">{{ selectedOption.chain_display_name }}</p>
        </div>


        <!-- Error -->
        <div v-if="payError" class="px-6 pt-4">
          <UiAlert variant="danger" dismissible>{{ payError }}</UiAlert>
        </div>

        <!-- Pay button -->
        <div class="px-6 py-5">
          <button
            type="button"
            class="w-full py-3.5 rounded-xl font-semibold text-sm text-white bg-brand-600 hover:bg-brand-700 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            :disabled="paying"
            @click="handlePay"
          >
            <UiSpinner v-if="paying" size="sm" class="!text-white" />
            <span>
              {{ paying ? 'Processing…' : `Pay ${fmt(selectedOption.amount)} ${selectedOption.asset}` }}
            </span>
          </button>
          <p class="text-center text-xs text-gray-400 mt-3">
            ✓ Confirm in {{ getChainConfirmationTime(selectedOption?.chain || '') }}
          </p>
        </div>
      </div>

      <!-- AWAITING ──────────────────────────────────────────────────────── -->
      <div v-else-if="phase === 'awaiting' && result && selectedOption" class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        <!-- Header -->
        <div class="px-6 pt-6 pb-4 text-center border-b border-gray-100">
          <p class="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Amount due</p>
          <p class="text-4xl font-bold text-gray-900">{{ fmt(result.amount) }}</p>
          <p class="text-lg text-gray-500 mt-0.5">{{ result.asset }}</p>
          <p class="text-xs text-gray-400 mt-1">{{ result.chain }}</p>
        </div>

        <!-- QR code (native only) -->
        <div v-if="selectedOption.transfer_type === 'native'" class="flex flex-col items-center px-6 py-6 border-b border-gray-100">
          <div class="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
            <img
              v-if="qrDataUrl"
              :src="qrDataUrl"
              alt="Payment QR code"
              class="w-48 h-48"
            />
            <div v-else class="w-48 h-48 flex items-center justify-center">
              <UiSpinner />
            </div>
          </div>
          <p class="text-xs text-gray-400 mt-3 text-center">Scan with any Ethereum wallet</p>
        </div>

        <!-- Address copy -->
        <div class="px-6 py-4 border-b border-gray-100">
          <p class="text-xs font-medium text-gray-500 mb-2">
            {{ selectedOption.transfer_type === 'erc20' ? 'Send to (Deposit Address)' : 'Send to' }}
          </p>
          <button
            class="w-full flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3 hover:bg-gray-100 transition-colors text-left"
            @click="copyAddress(result.recipient_address!)"
          >
            <p class="font-mono text-xs text-gray-700 break-all flex-1 leading-relaxed">
              {{ result.recipient_address }}
            </p>
            <div class="shrink-0 w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
              <svg v-if="!copied" class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <svg v-else class="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </button>
          <p v-if="copied" class="text-xs text-green-600 mt-1.5 text-center">Copied!</p>
        </div>

        <!-- ERC-20 token contract (if applicable) -->
        <div v-if="selectedOption.transfer_type === 'erc20' && selectedOption.token_contract_address" class="px-6 py-4 border-b border-gray-100">
          <p class="text-xs font-medium text-gray-500 mb-2">Token Contract</p>
          <button
            class="w-full flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3 hover:bg-gray-100 transition-colors text-left"
            @click="copyAddress(selectedOption.token_contract_address!)"
          >
            <p class="font-mono text-xs text-gray-700 break-all flex-1">
              {{ selectedOption.token_contract_address }}
            </p>
            <div class="shrink-0 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </button>
        </div>

        <!-- Network fee estimate -->
        <div v-if="result.estimated_fee_native" class="px-6 py-3 bg-gray-50 border-b border-gray-100">
          <p class="text-xs text-gray-500">
            <span class="font-medium">Estimated network fee:</span> {{ result.estimated_fee_native }} ETH
          </p>
        </div>

        <!-- Status -->
        <div class="px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span class="text-sm text-gray-500">Waiting for payment…</span>
          </div>
          <span v-if="pollSeconds > 0" class="text-xs text-gray-400">{{ pollSeconds }}s</span>
        </div>
      </div>

      <!-- CONFIRMED ──────────────────────────────────────────────────────── -->
      <div v-else-if="phase === 'confirmed' && result && selectedOption" class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="bg-green-500 px-6 py-8 text-center">
          <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-white">Payment Received</h2>
          <p class="text-green-100 text-sm mt-1">Transaction confirmed on-chain</p>
        </div>
        <div class="p-6">
          <div class="flex justify-between text-sm mb-2">
            <span class="text-gray-500">Amount</span>
            <span class="font-semibold">{{ fmt(result.amount) }} {{ result.asset }}</span>
          </div>
          <div class="flex justify-between text-sm mb-4">
            <span class="text-gray-500">Network</span>
            <span class="font-semibold capitalize">{{ result.chain }}</span>
          </div>
          <div class="border-t border-gray-100 pt-4">
            <p class="text-xs text-gray-400 mb-1">Reference</p>
            <p class="font-mono text-xs text-gray-600 break-all">{{ result.payment_intent_id }}</p>
          </div>
          <div v-if="successRedirectUrl" class="border-t border-gray-100 mt-4 pt-4">
            <button
              class="w-full py-3 rounded-xl font-semibold text-sm text-white bg-brand-600 hover:bg-brand-700 active:scale-[0.98] transition-all"
              @click="() => window.location.href = successRedirectUrl"
            >
              Continue
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import type { PaymentOptionItem, PaymentOptionsResponse } from '~/types'

definePageMeta({ layout: false })

const route = useRoute()
const config = useRuntimeConfig()
const id = route.params.id as string

type Phase = 'loading' | 'select-option' | 'form' | 'awaiting' | 'confirmed' | 'not-found' | 'no-price'
const phase = ref<Phase>('loading')

type CheckoutType = 'paywall' | 'session'
const checkoutType = ref<CheckoutType>('paywall')

interface PaywallInfo {
  id: string; name: string; description: string | null; asset: string | null; chain: string | null; amount: string | null
}

interface CheckoutSessionInfo {
  session_id: string
  amount: string
  currency: string
  asset: string | null
  chain: string | null
  expires_at: string
  created_at: string
}


interface PayResult {
  payment_intent_id: string
  amount: string
  asset: string
  chain: string
  transfer_type: string
  token_contract_address: string | null
  token_decimals: number
  status: string
  recipient_address: string | null
  estimated_fee_wei: string | null
  estimated_fee_native: string | null
}

const paywall = ref<PaywallInfo | null>(null)
const session = ref<CheckoutSessionInfo | null>(null)
const options = ref<PaymentOptionsResponse | null>(null)
const result = ref<PayResult | null>(null)
const paying = ref(false)
const payError = ref('')
const copied = ref(false)
const qrDataUrl = ref('')
const pollSeconds = ref(0)
const selectedOptionId = ref<string | null>(null)
const successRedirectUrl = ref<string | null>(null)

let pollTimer: ReturnType<typeof setInterval> | null = null
let countdown: ReturnType<typeof setInterval> | null = null
const POLL_S = 8

const selectedOption = computed(() => {
  if (!options.value || !selectedOptionId.value) return null
  return options.value.options.find(o => o.option_id === selectedOptionId.value) || null
})


const optionsWithSavings = computed(() => {
  if (!options.value) return []
  const executable = options.value.options.filter(o => o.executable && o.estimated_fee_wei)
  if (executable.length === 0) return options.value.options

  const maxFee = executable.reduce((max, o) => {
    const fee = BigInt(o.estimated_fee_wei || '0')
    return fee > max ? fee : max
  }, BigInt(0))

  return options.value.options.map(opt => {
    const optFee = opt.executable && opt.estimated_fee_wei ? BigInt(opt.estimated_fee_wei) : BigInt(0)
    const savingsWei = maxFee - optFee
    const savingsEth = savingsWei > BigInt(0)
      ? (Number(savingsWei) / 1e18).toLocaleString('en-US', { maximumFractionDigits: 9 }).replace(/0+$/, '').replace(/\.$/, '')
      : null

    return {
      ...opt,
      savings: savingsEth && savingsEth !== '0' ? savingsEth : null
    }
  })
})

function fmt(val: string | null | undefined): string {
  if (!val) return ''
  const n = parseFloat(val)
  return isNaN(n) ? val : n.toLocaleString('en-US', { maximumFractionDigits: 8, useGrouping: false })
}

function formatDisabledReason(reason: string): string {
  if (reason.includes('not_configured')) return 'Token not configured'
  if (reason.includes('estimation_failed')) return 'Fee estimation failed'
  return 'Unavailable'
}

async function copyAddress(addr: string) {
  await navigator.clipboard.writeText(addr)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const base = (config.public.apiBaseUrl as string).replace(/\/$/, '')
  return fetch(`${base}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers as Record<string, string>) },
  }).then(async res => {
    if (!res.ok) {
      const b = await res.json().catch(() => ({}))
      throw new Error(b?.detail ?? `HTTP ${res.status}`)
    }
    return res.json() as Promise<T>
  })
}

async function generateQr(address: string, amount: string) {
  try {
    const QRCode = (await import('qrcode')).default
    const chainId = '11155111'
    const valueWei = BigInt(Math.round(parseFloat(amount) * 1e18)).toString()
    const cleanAddress = address.replace(/^0x/i, '')
    const uri = `ethereum:${cleanAddress}@${chainId}?value=${valueWei}`
    qrDataUrl.value = await QRCode.toDataURL(uri, { width: 200, margin: 1 })
  } catch {
    try {
      const QRCode = (await import('qrcode')).default
      const cleanAddress = address.replace(/^0x/i, '')
      qrDataUrl.value = await QRCode.toDataURL(cleanAddress, { width: 200, margin: 1 })
    } catch { /* ignore */ }
  }
}

onMounted(async () => {
  // Load confirmation times for all chains
  await loadConfirmationTimes()

  try {
    // Try to load as session first
    try {
      const sess = await apiFetch<CheckoutSessionInfo>(`/public/checkout-sessions/${id}`)
      if (sess && sess.session_id) {
        checkoutType.value = 'session'
        session.value = sess

        // For session checkout, we need to generate payment options based on:
        // - Requested amount (in currency)
        // - Pre-selected asset/chain (if any)
        // Generate payment options dynamically
        const opts = await apiFetch<PaymentOptionsResponse>(
          `/public/checkout-sessions/${id}/payment-options`
        )
        options.value = opts

        if (!opts.options.length) {
          phase.value = 'no-price'
          return
        }

        if (opts.options.length === 1) {
          selectedOptionId.value = opts.options[0].option_id
          phase.value = 'form'
        } else {
          selectedOptionId.value = opts.recommended_option_id
          phase.value = 'select-option'
        }
        return
      }
    } catch {
      // Not a session, try as paywall
    }

    // Load as paywall
    const [pw, opts] = await Promise.all([
      apiFetch<PaywallInfo>(`/public/paywalls/${id}`),
      apiFetch<PaymentOptionsResponse>(`/public/paywalls/${id}/payment-options`),
    ])
    checkoutType.value = 'paywall'
    paywall.value = pw
    options.value = opts

    if (!opts.options.length) {
      phase.value = 'no-price'
      return
    }

    if (opts.options.length === 1) {
      selectedOptionId.value = opts.options[0].option_id
      phase.value = 'form'
    } else {
      selectedOptionId.value = opts.recommended_option_id
      phase.value = 'select-option'
    }
  } catch {
    phase.value = 'not-found'
  }
})

onUnmounted(() => {
  stopPolling()
})

function getChainSpeedLabel(chain: string): string {
  const speedMap: Record<string, string> = {
    arbitrum: '⚡ Fastest',
    polygon: '🚗 Medium',
    ethereum: '🐢 Slowest',
  }
  return speedMap[chain.toLowerCase()] || 'Standard'
}

function getChainSpeedClass(chain: string): string {
  const classMap: Record<string, string> = {
    arbitrum: 'bg-green-100 text-green-800',
    polygon: 'bg-blue-100 text-blue-800',
    ethereum: 'bg-orange-100 text-orange-800',
  }
  return classMap[chain.toLowerCase()] || 'bg-gray-100 text-gray-800'
}

const confirmationTimes = ref<Record<string, string>>({})

async function loadConfirmationTimes() {
  const chains = ['ethereum', 'arbitrum', 'polygon']
  try {
    for (const chain of chains) {
      const data = await apiFetch<any>(`/internal/confirmation-estimate?chain=${chain}`)
      const sec = data.estimated_confirmation_sec
      if (sec < 1) {
        confirmationTimes.value[chain] = `~${(sec * 1000).toFixed(0)}ms`
      } else if (sec < 60) {
        confirmationTimes.value[chain] = `~${Math.round(sec)}s`
      } else {
        const min = Math.floor(sec / 60)
        confirmationTimes.value[chain] = `~${min}m`
      }
    }
  } catch (err) {
    console.error('Failed to load confirmation times:', err)
  }
}

function getChainConfirmationTime(chain: string): string {
  const lower = chain.toLowerCase()
  return confirmationTimes.value[lower] || '...'
}

function proceedWithSelectedOption() {
  if (selectedOptionId.value) {
    phase.value = 'form'
  }
}

async function handlePay() {
  if (!selectedOption.value) return
  payError.value = ''
  paying.value = true
  try {
    const body: any = {}

    // Priority: option_id (auto-pricing or explicit selection)
    if (selectedOption.value.option_id) {
      body.option_id = selectedOption.value.option_id
    }
    // Fallback: product_price_id (manual pricing)
    else if (selectedOption.value.product_price_id) {
      body.product_price_id = selectedOption.value.product_price_id
    }

    // For sessions, include session_id
    if (checkoutType.value === 'session') {
      body.session_id = id
    }

    const endpoint = checkoutType.value === 'session'
      ? `/public/checkout-sessions/${id}/pay`
      : `/public/paywalls/${id}/pay`

    const data = await apiFetch<PayResult>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    result.value = data
    phase.value = 'awaiting'
    if (data.recipient_address && data.transfer_type === 'native') {
      generateQr(data.recipient_address, data.amount)
    }
    startPolling(data.payment_intent_id)
  } catch (err) {
    payError.value = err instanceof Error ? err.message : 'Failed to create payment'
  } finally {
    paying.value = false
  }
}

function startPolling(intentId: string) {
  pollSeconds.value = POLL_S
  countdown = setInterval(() => { pollSeconds.value = Math.max(0, pollSeconds.value - 1) }, 1000)
  pollTimer = setInterval(async () => {
    try {
      const data = await apiFetch<{ status: string; success_redirect_url?: string }>(
        `/public/payment-intents/${intentId}/status`
      )
      if (data.status === 'confirmed') {
        stopPolling()
        // Capture redirect URL from session (if available)
        if (data.success_redirect_url) {
          successRedirectUrl.value = data.success_redirect_url
        }
        phase.value = 'confirmed'
      } else {
        pollSeconds.value = POLL_S
      }
    } catch { pollSeconds.value = POLL_S }
  }, POLL_S * 1000)
}

function stopPolling() {
  clearInterval(pollTimer ?? undefined)
  clearInterval(countdown ?? undefined)
  pollTimer = null; countdown = null
}
</script>
