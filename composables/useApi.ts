/**
 * useApi — thin fetch wrapper that always targets the API Gateway.
 *
 * All requests include an Authorization header when a token is available.
 * Local dev bypass is supported via NUXT_PUBLIC_DEV_BYPASS / NUXT_PUBLIC_DEV_BYPASS_TOKEN.
 */
import type { ApiError } from '~/types'

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  params?: Record<string, string | number | boolean | undefined>
}

interface ApiResponse<T> {
  data: T | null
  error: ApiError | null
}

export function useApi() {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  const baseUrl = config.public.apiBaseUrl as string
  const devBypass = config.public.devBypass === 'true'
  const devBypassToken = config.public.devBypassToken as string

  // Build the Authorization header value
  function resolveToken(): string | null {
    if (devBypass && devBypassToken) {
      return devBypassToken
    }
    return authStore.token
  }

  /**
   * Extra headers required only in dev bypass mode.
   * The gateway uses X-Dev-Firebase-Uid + X-Dev-Email to bootstrap the merchant
   * without live Firebase token verification.
   */
  function devBypassHeaders(): Record<string, string> {
    if (!devBypass || !devBypassToken) return {}
    const uid = (config.public.devBypassUid as string | undefined) || 'dev-uid'
    const email = (config.public.devBypassEmail as string | undefined) || ''
    return {
      'X-Dev-Firebase-Uid': uid,
      ...(email ? { 'X-Dev-Email': email } : {}),
    }
  }

  function buildUrl(path: string, params?: RequestOptions['params']): string {
    const url = new URL(path.startsWith('http') ? path : `${baseUrl}${path}`)
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value))
        }
      }
    }
    return url.toString()
  }

  async function request<T>(
    method: string,
    path: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const { body, params, headers: extraHeaders, ...rest } = options

    const token = resolveToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...devBypassHeaders(),
      ...(extraHeaders as Record<string, string>),
    }

    try {
      const res = await fetch(buildUrl(path, params), {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        ...rest,
      })

      if (!res.ok) {
        let message = `HTTP ${res.status}`
        let detail: string | undefined
        try {
          const errJson = await res.json()
          message = errJson.detail ?? errJson.message ?? message
          detail = errJson.detail
        } catch {
          // non-JSON error body — keep default message
        }
        return { data: null, error: { statusCode: res.status, message, detail } }
      }

      // 204 No Content
      if (res.status === 204) {
        return { data: null, error: null }
      }

      const data: T = await res.json()
      return { data, error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error'
      return { data: null, error: { statusCode: 0, message } }
    }
  }

  return {
    get: <T>(path: string, options?: RequestOptions) =>
      request<T>('GET', path, options),
    post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>('POST', path, { ...options, body }),
    put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>('PUT', path, { ...options, body }),
    patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>('PATCH', path, { ...options, body }),
    del: <T>(path: string, options?: RequestOptions) =>
      request<T>('DELETE', path, options),
  }
}
