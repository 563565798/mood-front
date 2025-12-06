import { defineStore } from 'pinia'
import { login, getCurrentUser } from '@/api/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: null
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.userInfo?.role === 1
  },

  actions: {
    // 登录
    async login(loginForm) {
      const data = await login(loginForm)
      this.token = data.token
      this.userInfo = data.user
      localStorage.setItem('token', data.token)
      return data
    },

    // 获取用户信息
    async getUserInfo() {
      const data = await getCurrentUser()
      this.userInfo = data
      return data
    },

    // 登出
    logout() {
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('token')
    }
  }
})




