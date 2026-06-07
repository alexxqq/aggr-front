import { defineStore } from 'pinia'
import type { Paywall, PaywallCreate, PaywallUpdate } from '~/types'

interface PaywallsState {
  items: Paywall[]
  loading: boolean
  error: string | null
}

export const usePaywallsStore = defineStore('paywalls', {
  state: (): PaywallsState => ({
    items: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchAll() {
      const api = useApi()
      this.loading = true
      this.error = null

      const { data, error } = await api.get<Paywall[]>('/v1/paywalls')
      if (error) {
        this.error = error.message
      } else {
        this.items = data ?? []
      }
      this.loading = false
    },

    async create(body: PaywallCreate): Promise<Paywall | null> {
      const api = useApi()
      const { data, error } = await api.post<Paywall>('/v1/paywalls', body)
      if (error) throw new Error(error.message)
      if (data) this.items.unshift(data)
      return data
    },

    async update(id: string, body: PaywallUpdate): Promise<Paywall | null> {
      const api = useApi()
      const { data, error } = await api.patch<Paywall>(`/v1/paywalls/${id}`, body)
      if (error) throw new Error(error.message)
      if (data) {
        const idx = this.items.findIndex((p) => p.id === id)
        if (idx !== -1) this.items[idx] = data
      }
      return data
    },

    async remove(id: string): Promise<void> {
      const api = useApi()
      const { error } = await api.del(`/v1/paywalls/${id}`)
      if (error) throw new Error(error.message)
      this.items = this.items.filter((p) => p.id !== id)
    },
  },
})
