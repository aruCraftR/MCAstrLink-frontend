import { defineStore } from 'pinia'
import { ApiError, isSameOriginDeployment } from '../composables/useApi'
import type { AuthedPlayerInfo, TokenResponse } from '../utils/api-types'

async function loginRequest(body: Record<string, string>) {
  const { request } = useApi()
  return await request<TokenResponse>('/oauth2/token', {
    method: 'POST',
    form: true,
    body
  })
}

/**
 * 认证状态.
 * - 非同源部署: 令牌保存于Pinia状态(不持久化), 请求时通过Authorization请求头携带
 * - 同源部署: 登录后由后端设置httpOnly Cookie, 请求自动携带, 前端不保存令牌
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: '' as string,
    user: null as AuthedPlayerInfo | null
  }),

  getters: {
    isLoggedIn: (state) => (isSameOriginDeployment() ? state.user !== null : state.token !== ''),
    permission: (state) => state.user?.permission ?? 1
  },

  actions: {
    /**
     * 初始化登录态.
     * 非同源模式: 校验本地保存的令牌是否有效; 同源模式: 通过Cookie校验登录态.
     * 网络/后端暂时不可用时保留当前状态, 仅令牌确实失效时才清除.
     */
    async loginPassword(name: string, password: string) {
      const data = await loginRequest({ grant_type: 'password', username: name, password })
      if (!isSameOriginDeployment()) {
        this.token = data.access_token
      }
      await this.fetchMe()
    },
    async loginCaptcha(name: string, captcha: string) {
      const data = await loginRequest({ grant_type: 'captcha', username: name, captcha })
      if (!isSameOriginDeployment()) {
        this.token = data.access_token
      }
      await this.fetchMe()
    },
    async fetchMe() {
      const { request } = useApi()
      this.user = await request<AuthedPlayerInfo>('/players/me')
    },
    async logout() {
      const { request } = useApi()
      try {
        await request<null>('/oauth2/revoke', { method: 'POST' })
      } catch {
        // 即使吊销失败也清理本地状态
      }
      this.clearSession()
    },
    clearSession() {
      this.token = ''
      this.user = null
    },
    async bootstrap() {
      if (this.user) return
      // 非同源模式且无本地令牌时无需校验
      if (!isSameOriginDeployment() && !this.token) return
      try {
        await this.fetchMe()
      } catch (e) {
        // 仅当令牌确实失效时清除登录状态; 网络/后端暂时不可用则保留本地状态
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          this.clearSession()
        }
      }
    }
  },

  // 非同源模式将令牌持久化到localStorage(刷新后保持登录);
  // 同源模式依赖httpOnly Cookie, 不持久化任何令牌状态
  persist: !isSameOriginDeployment()
})
