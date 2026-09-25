import { defineStore } from 'pinia'
import http from '../api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('mhop_token') || '',
    user: JSON.parse(localStorage.getItem('mhop_user') || 'null'),
  }),
  getters: {
    isLoggedIn: (s) => !!s.token,
    isAdmin: (s) => s.user?.role === 'admin',
    displayName: (s) => s.user?.username || '',
  },
  actions: {
    setAuth(token, user) {
      this.token = token
      this.user = user
      localStorage.setItem('mhop_token', token)
      localStorage.setItem('mhop_user', JSON.stringify(user))
    },
    async login(username, password) {
      const data = await http.post('/auth/login', { username, password })
      this.setAuth(data.access_token, data.user)
      return data.user
    },
    async sendEmailCode(email) {
      return await http.post('/auth/email-code', { email }, { timeout: 20000 })
    },
    async loginByEmail(email, code) {
      const data = await http.post('/auth/login-email', { email, code })
      this.setAuth(data.access_token, data.user)
      return { user: data.user, newAccount: !!data.new_account }
    },
    async register(username, password) {
      const data = await http.post('/auth/register', { username, password })
      this.setAuth(data.access_token, data.user)
      return data.user
    },
    async casdoorConfig() {
      return await http.get('/auth/casdoor/config')
    },
    // 跳转 Casdoor 统一身份认证（OAuth2 授权码 + OIDC）
    async loginWithCasdoor(redirectUri) {
      const cfg = await this.casdoorConfig()
      if (!cfg.enabled) throw new Error('统一身份认证未启用')
      const state = (await http.get('/auth/casdoor/state')).state
      const target = redirectUri || cfg.redirect_uri
      sessionStorage.setItem('mhop_casdoor_redirect', target)
      const params = new URLSearchParams({
        client_id: cfg.client_id || '',
        response_type: 'code',
        redirect_uri: target,
        scope: cfg.scope || 'openid profile email',
        state,
      })
      const endpoint = String(cfg.endpoint || '').replace(/\/+$/, '')
      window.location.href = endpoint + '/login/oauth/authorize?' + params.toString()
    },
    // Casdoor 回调：用授权码换 MHOP 自己的 JWT，后续请求方式与密码登录完全一致
    async completeCasdoorLogin(code, state) {
      const redirectUri = sessionStorage.getItem('mhop_casdoor_redirect') ||
        window.location.origin + '/auth/casdoor/callback'
      const data = await http.post('/auth/casdoor/callback', {
        code,
        state,
        redirect_uri: redirectUri,
      })
      this.setAuth(data.access_token, data.user)
      sessionStorage.removeItem('mhop_casdoor_redirect')
      return data.user
    },
    async restore() {
      if (!this.token) return
      try {
        this.user = await http.get('/auth/me')
        localStorage.setItem('mhop_user', JSON.stringify(this.user))
      } catch {
        this.logout()
      }
    },
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('mhop_token')
      localStorage.removeItem('mhop_user')
    },
  },
})
