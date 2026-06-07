import { defineStore } from 'pinia'
import type { Merchant, MerchantSettingsUpdate, MerchantWallet, WalletCreate } from '~/types'

interface MerchantState {
  data: Merchant | null
  loading: boolean
  error: string | null
}

export const useMerchantStore = defineStore('merchant', {
  state: (): MerchantState => ({
    data: null,
    loading: false,
    error: null,
  }),

  getters: {
    /** Convenience: the nested profile object. */
    profile: (state) => state.data?.profile ?? null,
    settings: (state) => state.data?.merchant_settings ?? null,
    wallets: (state) => state.data?.wallets ?? [],
  },

  actions: {
    async fetchProfile() {
      const api = useApi()
      this.loading = true
      this.error = null

      const { data, error } = await api.get<Merchant>('/v1/me')

      if (error) {
        this.error = error.message
      } else {
        this.data = data
      }

      this.loading = false
    },

    async updateSettings(payload: MerchantSettingsUpdate): Promise<void> {
      const api = useApi()
      const { data, error } = await api.patch<Merchant['merchant_settings']>('/v1/me/settings', payload)
      if (error) throw new Error(error.message)
      if (data && this.data) {
        this.data.merchant_settings = data
      }
    },

    async addWallet(payload: WalletCreate): Promise<void> {
      const api = useApi()
      const { data, error } = await api.post<MerchantWallet>('/v1/me/wallets', payload)
      if (error) throw new Error(error.message)
      if (data && this.data) {
        this.data.wallets.push(data)
      }
    },

    async removeWallet(walletId: string): Promise<void> {
      const api = useApi()
      const { error } = await api.del(`/v1/me/wallets/${walletId}`)
      if (error) throw new Error(error.message)
      if (this.data) {
        this.data.wallets = this.data.wallets.filter((w) => w.id !== walletId)
      }
    },

    clear() {
      this.data = null
      this.error = null
    },
  },
})
