import { defineStore } from 'pinia'
import http from '../api'
import { bottlesApi } from '../api/bottles'

/**
 * 漂流瓶全局状态：维护「我的会话」摘要，供海洋主页与顶部导航未读角标共用。
 * 导航栏每 60 秒静默刷新一次（不弹错误提示）。
 */
export const useBottleStore = defineStore('bottles', {
  state: () => ({
    items: [],
    thrownToday: 0,
    pickedToday: 0,
    throwLimit: 3,
    pickLimit: 10,
    seaCount: 0,
    loaded: false,
  }),
  getters: {
    /** 所有会话的未读总数（导航红点） */
    unreadTotal: (s) => s.items.reduce((sum, b) => sum + (b.unread || 0), 0),
    /** 进行中的会话 */
    activeItems: (s) => s.items.filter((b) => b.status === 2),
    throwRemaining: (s) => Math.max(0, s.throwLimit - s.thrownToday),
    pickRemaining: (s) => Math.max(0, s.pickLimit - s.pickedToday),
  },
  actions: {
    async refresh(silent = true) {
      const data = await http.get('/bottles/mine', { silent })
      this.items = data.items || []
      this.thrownToday = data.thrown_today || 0
      this.pickedToday = data.picked_today || 0
      this.throwLimit = data.throw_limit || 3
      this.pickLimit = data.pick_limit || 10
      this.seaCount = data.sea_count || 0
      this.loaded = true
      return data
    },
    async refreshSea() {
      try {
        const data = await bottlesApi.seaCount()
        this.seaCount = data.count || 0
      } catch {
        // 角标级信息，失败静默
      }
    },
    /** 本地立即扣减今日投瓶计数（接口已成功时调用，避免等下次刷新） */
    bumpThrown() {
      this.thrownToday += 1
    },
    bumpPicked() {
      this.pickedToday += 1
    },
  },
})
