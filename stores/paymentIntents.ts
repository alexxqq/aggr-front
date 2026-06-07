import { defineStore } from 'pinia'
import type { PaymentEvent, PaymentIntent, PaymentIntentCreate, PaymentIntentStatus } from '~/types'

interface PaymentIntentsState {
  items: PaymentIntent[]
  current: PaymentIntent | null
  events: PaymentEvent[]
  loading: boolean
  loadingOne: boolean
  loadingEvents: boolean
  error: string | null
}

export const usePaymentIntentsStore = defineStore('paymentIntents', {
  state: (): PaymentIntentsState => ({
    items: [],
    current: null,
    events: [],
    loading: false,
    loadingOne: false,
    loadingEvents: false,
    error: null,
  }),

  actions: {
    async fetchAll(status?: PaymentIntentStatus | 'all') {
      const api = useApi()
      this.loading = true
      this.error = null

      const params = status && status !== 'all' ? { status } : {}
      const { data, error } = await api.get<PaymentIntent[]>('/v1/payment-intents', { params })

      if (error) {
        this.error = error.message
      } else {
        this.items = data ?? []
      }
      this.loading = false
    },

    async fetchOne(id: string) {
      const api = useApi()
      this.loadingOne = true
      this.error = null

      const { data, error } = await api.get<PaymentIntent>(`/v1/payment-intents/${id}`)

      if (error) {
        this.error = error.message
      } else {
        this.current = data
        // Keep items list in sync if this item is already there
        if (data) {
          const idx = this.items.findIndex((i) => i.id === id)
          if (idx !== -1) this.items[idx] = data
        }
      }
      this.loadingOne = false
    },

    async fetchEvents(id: string) {
      const api = useApi()
      this.loadingEvents = true

      const { data, error } = await api.get<PaymentEvent[]>(`/v1/payment-intents/${id}/events`)

      if (!error && data) {
        this.events = data
      }
      this.loadingEvents = false
    },

    async create(body: PaymentIntentCreate): Promise<PaymentIntent | null> {
      const api = useApi()
      const { data, error } = await api.post<PaymentIntent>('/v1/payment-intents', body)
      if (error) throw new Error(error.message)
      if (data) this.items.unshift(data)
      return data
    },

    /**
     * Trigger stub execution for a pending payment intent.
     * Calls POST /v1/payment-intents/{id}/execute → Payment Service →
     * Blockchain Core stub executor.
     * Updates `current` with the returned (post-execution) intent.
     * Throws on error.
     */
    async execute(id: string): Promise<PaymentIntent | null> {
      const api = useApi()
      const { data, error } = await api.post<PaymentIntent>(`/v1/payment-intents/${id}/execute`)
      if (error) throw new Error(error.message)
      if (data) {
        this.current = data
        const idx = this.items.findIndex((i) => i.id === id)
        if (idx !== -1) this.items[idx] = data
      }
      return data
    },

    clearCurrent() {
      this.current = null
      this.events = []
      this.error = null
    },
  },
})
