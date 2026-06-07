// ---------------------------------------------------------------------------
// Shared domain types for the Merchant Portal
// ---------------------------------------------------------------------------

// --- Auth ------------------------------------------------------------------

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  token: string
}

// --- Merchant --------------------------------------------------------------

/** Matches UserProfileResponse from User Service. */
export interface MerchantProfile {
  id: string
  firebase_uid: string
  email: string | null
  display_name: string | null
  status: string
  created_at: string
  updated_at: string
}

/** Matches MerchantSettingsResponse from User Service. */
export interface MerchantSettings {
  id: string
  user_id: string
  allowed_chains: string[]
  allowed_assets: string[]
  default_chain: string | null
  timezone: string | null
  created_at: string
  updated_at: string
}

export interface WebhookConfig {
  id: string
  webhook_url: string
  is_enabled: boolean
  created_at: string
  updated_at: string
  secret?: string | null  // only returned on create / rotate
}

/** Matches MeResponse from User Service (GET /v1/me). */
export interface Merchant {
  profile: MerchantProfile
  merchant_settings: MerchantSettings | null
  wallets: MerchantWallet[]
  webhook_config: WebhookConfig | null
}

export interface MerchantWallet {
  id: string
  chain: string
  address: string
  label: string | null
  is_default: boolean
}

export interface WalletCreate {
  chain: string
  address: string
  label?: string | null
  is_default?: boolean
}

export interface MerchantSettingsUpdate {
  allowed_chains?: string[] | null
  allowed_assets?: string[] | null
  default_chain?: string | null
}

// --- Product ---------------------------------------------------------------

/** Matches ProductResponse from Payment Service. */
export interface Product {
  id: string
  merchant_id: string
  name: string
  description: string | null
  is_active: boolean
  base_amount?: string | null     // auto-pricing base USD amount
  base_currency?: string          // auto-pricing base currency (default "USD")
  auto_pricing_enabled?: boolean  // enable auto-pricing from base_amount
  created_at: string
  updated_at: string
}

export interface ProductCreate {
  name: string
  description?: string | null
  base_amount?: string | null
  base_currency?: string
  auto_pricing_enabled?: boolean
}

export interface ProductUpdate {
  name?: string | null
  description?: string | null
  is_active?: boolean | null
}

// --- Product Price ---------------------------------------------------------

export interface ProductPrice {
  id: string
  product_id: string
  asset: string
  chain: string
  amount: number | string  // Decimal from backend
  is_active: boolean
  created_at: string
  updated_at: string
}

// --- Paywall ---------------------------------------------------------------

// --- Paywall ---------------------------------------------------------------

export type PaywallType = 'quick' | 'product'

/** Matches PaywallResponse from Payment Service. */
export interface Paywall {
  id: string
  merchant_id: string
  name: string
  description: string | null
  is_active: boolean
  paywall_type: PaywallType
  /** Resolved price — always populated for usable paywalls regardless of type. */
  asset: string | null
  chain: string | null
  amount: string | null   // decimal string, e.g. "10.50"
  /** Set for product paywalls — ID of the linked ProductPrice. */
  product_price_id: string | null
  /** Auto-pricing enabled flag */
  auto_payment_options_enabled?: boolean
  /** Allowed chains for auto-pricing */
  allowed_chains?: string[] | null
  /** Allowed assets for auto-pricing */
  allowed_assets?: string[] | null
  created_at: string
  updated_at: string
}

export interface PaywallCreate {
  name: string
  description?: string | null
  paywall_type: PaywallType
  // Quick paywall
  asset?: string | null
  chain?: string | null
  amount?: string | null
  // Product paywall
  product_price_id?: string | null
  // Product paywall auto-pricing
  product_ids?: string[] | null
  auto_payment_options_enabled?: boolean
  allowed_chains?: string[] | null
  allowed_assets?: string[] | null
}

export interface PaywallUpdate {
  name?: string | null
  description?: string | null
  is_active?: boolean | null
  // Quick paywall price
  asset?: string | null
  chain?: string | null
  amount?: string | null
  // Product paywall link
  product_price_id?: string | null
}

// --- Payment Options -------------------------------------------------------

export interface PaymentOptionItem {
  option_id: string
  product_price_id: string | null
  chain: string
  chain_display_name: string
  asset: string
  amount: string
  transfer_type: string        // "native" | "erc20"
  token_contract_address: string | null
  token_decimals: number
  estimated_fee_wei: string | null
  estimated_fee_native: string | null
  estimated_fee_usd?: string | null        // auto-pricing: fee in USD
  total_estimated_cost_usd?: string | null // auto-pricing: total cost in USD
  source: string               // "rpc" | "fallback" | "error" | "disabled"
  recommended: boolean
  executable: boolean
  reason: string | null
  disabled_reason: string | null
  pricing_mode?: string        // "manual" | "auto" (default "manual")
  savings?: string | null      // formatted savings amount compared to most expensive
}

export interface PaymentOptionWithSavings extends PaymentOptionItem {
  savings: string | null
}

export interface PaymentOptionsResponse {
  paywall_id: string
  product_name: string | null
  cost_optimization_enabled: boolean
  recommended_option_id: string | null
  options: PaymentOptionItem[]
  pricing_mode?: string        // "manual" | "auto"
  base_amount?: string | null  // auto-pricing: base USD amount
  base_currency?: string | null // auto-pricing: base currency
}

// --- Payment Intent --------------------------------------------------------

/** Matches the backend ALLOWED_TRANSITIONS keys + terminal states. */
export type PaymentIntentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'failed'
  | 'expired'

/** Matches PaymentIntentResponse from Payment Service. */
export interface PaymentIntent {
  id: string
  merchant_id: string
  product_price_id: string | null
  asset: string
  chain: string
  amount: string          // decimal string, e.g. "10.50"
  status: PaymentIntentStatus
  payer_address: string | null
  recipient_address: string | null
  metadata: Record<string, unknown> | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface PaymentIntentCreate {
  asset: string
  chain: string
  amount: string
  product_price_id?: string | null
  payer_address?: string | null
  metadata?: Record<string, unknown> | null
}

// --- Payment Event ---------------------------------------------------------

/** Matches PaymentEventResponse from Payment Service. */
export interface PaymentEvent {
  id: string
  payment_intent_id: string
  event_type: string
  from_status: string | null
  to_status: string | null
  data_json: string | null
  created_at: string
}

// --- API -------------------------------------------------------------------

export interface ApiError {
  statusCode: number
  message: string
  detail?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
