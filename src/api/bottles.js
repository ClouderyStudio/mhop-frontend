// 漂流瓶接口封装：baseURL 已含 /mhop 前缀
import http from './index'

export const bottlesApi = {
  // ---------------- 前台 ----------------
  /** 扔出瓶子 */
  throwBottle: (content) => http.post('/bottles', { content }),
  /** 随机捞瓶（海里为空时后端返回 409，调用方捕获处理） */
  pickBottle: () => http.post('/bottles/pick'),
  /** 我的会话 + 今日次数 + 海计数 */
  mine: () => http.get('/bottles/mine'),
  /** 海中漂流瓶数量（静默，不弹错误） */
  seaCount: () => http.get('/bottles/sea/count', { silent: true }),
  /**
   * 会话详情。afterId 仅返回增量消息（轮询用）；markRead=false 时不回写已读。
   */
  detail: (id, { afterId = 0, markRead = true } = {}) =>
    http.get(`/bottles/${id}`, { params: { after_id: afterId, mark_read: markRead } }),
  sendMessage: (id, content) => http.post(`/bottles/${id}/messages`, { content }),
  endConversation: (id) => http.post(`/bottles/${id}/end`),
  report: (id, reason) => http.post(`/bottles/${id}/report`, { reason }),

  // ---------------- 后台（bottles 权限） ----------------
  adminStats: () => http.get('/admin/bottles/stats'),
  adminList: (params) => http.get('/admin/bottles', { params }),
  adminDetail: (id) => http.get(`/admin/bottles/${id}`),
  adminRemove: (id, note = '') => http.post(`/admin/bottles/${id}/remove`, { note }),
  adminRestore: (id, note = '') => http.post(`/admin/bottles/${id}/restore`, { note }),
  adminHideMessage: (messageId) => http.post(`/admin/bottles/messages/${messageId}/hide`),
  adminRestoreMessage: (messageId) => http.post(`/admin/bottles/messages/${messageId}/restore`),
}

/** 瓶子状态码（与后端 MhopBottleStatus 一致） */
export const BOTTLE_STATUS = {
  PENDING: 0,
  DRIFTING: 1,
  PICKED: 2,
  ENDED: 3,
  REMOVED: 4,
}

export const BOTTLE_STATUS_LABEL = {
  0: '待审核',
  1: '漂流中',
  2: '对话中',
  3: '已结束',
  4: '已下架',
}

export const AI_FLAG_LABEL = {
  safe: '安全',
  suspect: '疑似违规',
  violation: '违规',
}
