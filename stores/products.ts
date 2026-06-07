import { defineStore } from 'pinia'
import type { Product, ProductCreate, ProductPrice, ProductUpdate } from '~/types'

interface ProductsState {
  items: Product[]
  prices: Record<string, ProductPrice[]>   // keyed by product id
  loading: boolean
  error: string | null
}

export const useProductsStore = defineStore('products', {
  state: (): ProductsState => ({
    items: [],
    prices: {},
    loading: false,
    error: null,
  }),

  actions: {
    async fetchAll() {
      const api = useApi()
      this.loading = true
      this.error = null

      const { data, error } = await api.get<Product[]>('/v1/products')
      if (error) {
        this.error = error.message
      } else {
        this.items = data ?? []
      }
      this.loading = false
    },

    async create(body: ProductCreate): Promise<Product | null> {
      const api = useApi()
      const { data, error } = await api.post<Product>('/v1/products', body)
      if (error) throw new Error(error.message)
      if (data) this.items.unshift(data)
      return data
    },

    async update(id: string, body: ProductUpdate): Promise<Product | null> {
      const api = useApi()
      const { data, error } = await api.patch<Product>(`/v1/products/${id}`, body)
      if (error) throw new Error(error.message)
      if (data) {
        const idx = this.items.findIndex((p) => p.id === id)
        if (idx !== -1) this.items[idx] = data
      }
      return data
    },

    async remove(id: string): Promise<void> {
      const api = useApi()
      const { error } = await api.del(`/v1/products/${id}`)
      if (error) throw new Error(error.message)
      this.items = this.items.filter((p) => p.id !== id)
    },

    async fetchPrices(productId: string): Promise<ProductPrice[]> {
      const api = useApi()
      const { data, error } = await api.get<ProductPrice[]>(`/v1/products/${productId}/prices`)
      if (error) throw new Error(error.message)
      this.prices[productId] = data ?? []
      return this.prices[productId]
    },
  },
})
