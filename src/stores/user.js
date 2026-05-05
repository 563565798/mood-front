import { defineStore } from 'pinia'
import { login, getCurrentUser, logout as logoutApi } from '@/api/auth'

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
    async logout() {
      // 先调用后端接口将Token加入黑名单
      try {
        if (this.token) {
          await logoutApi()
        }
      } catch (error) {
        console.error('后端登出请求失败', error)
      }
      // 无论后端是否成功，都清除本地状态
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('token')
    }
  }
})




