export class ApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

/**
 * 是否为同源部署: NUXT_PUBLIC_API_BASE 以 / 开头表示相对路径(经Nuxt服务端代理),
 * 否则为直连后端. 直接读取环境变量, 避免在模块作用域调用 composable.
 */
export function isSameOriginDeployment(): boolean {
  const base = process.env.NUXT_PUBLIC_API_BASE
  return typeof base === 'string' && base.startsWith('/')
}

interface RequestOptions {
  method?: string
  body?: unknown
  form?: boolean
  timeout?: number
}

interface ErrorDetail {
  code?: string
  message?: string
}

/**
 * 后端API请求封装.
 * 非同源模式: Authorization请求头携带令牌; 同源模式: 自动携带httpOnly Cookie.
 */
export function useApi() {
  const config = useRuntimeConfig()
  const base = config.public.apiBase
  const sameOrigin = isSameOriginDeployment()

  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = {}
    let body: BodyInit | null | undefined

    if (!sameOrigin) {
      const auth = useAuthStore()
      if (auth.token) {
        headers.Authorization = `Bearer ${auth.token}`
      }
    } else if (import.meta.server) {
      // 同源模式下SSR请求: 转发浏览器携带的Cookie, 使服务端渲染时后端能识别登录态
      const requestHeaders = useRequestHeaders(['cookie'])
      if (requestHeaders.cookie) {
        headers.cookie = requestHeaders.cookie
      }
    }

    if (options.form) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded'
      const params = new URLSearchParams()
      const data = (options.body ?? {}) as Record<string, unknown>
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null) {
          params.set(key, String(value))
        }
      }
      body = params.toString()
    } else if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json'
      body = JSON.stringify(options.body)
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), options.timeout ?? 15000)

    let res: Response
    try {
      res = await fetch(`${base}${path}`, {
        method: options.method ?? 'GET',
        headers,
        body,
        credentials: sameOrigin ? 'include' : 'omit',
        signal: controller.signal
      })
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        throw new ApiError(0, 'timeout', '请求超时, 请检查后端服务是否已启动')
      }
      throw new ApiError(0, 'network_error', '无法连接服务器, 请检查网络或后端服务')
    } finally {
      clearTimeout(timer)
    }

    if (res.status === 204) {
      return undefined as T
    }

    let data: unknown = null
    const text = await res.text()
    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        data = text
      }
    }

    if (!res.ok) {
      if (res.status === 401) {
        const auth = useAuthStore()
        auth.clearSession()
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          await navigateTo('/login')
        }
      }
      const detail = (data as { detail?: ErrorDetail | string } | null)?.detail
      if (typeof detail === 'string') {
        throw new ApiError(res.status, String(res.status), detail)
      }
      if (detail && typeof detail === 'object') {
        throw new ApiError(
          res.status,
          detail.code ?? String(res.status),
          detail.message ?? '请求失败'
        )
      }
      const oauthError = data as { error?: string; error_description?: string } | null
      if (oauthError?.error) {
        throw new ApiError(res.status, oauthError.error, oauthError.error_description ?? '请求失败')
      }
      throw new ApiError(res.status, String(res.status), `请求失败 (HTTP ${res.status})`)
    }

    return data as T
  }

  return { request, apiBase: base, sameOrigin }
}
