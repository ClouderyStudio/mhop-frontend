import http from './index'

// 公开：获取已启用公告（首页展示用，无需登录）
export function listAnnouncements() {
  return http.get('/announcements')
}

// 管理端：获取全部公告（含未启用）
export function listAllAnnouncements() {
  return http.get('/admin/announcements')
}

// 管理端：创建公告
export function createAnnouncement(data) {
  return http.post('/admin/announcements', data)
}

// 管理端：更新公告
export function updateAnnouncement(id, data) {
  return http.put(`/admin/announcements/${id}`, data)
}

// 管理端：删除公告
export function deleteAnnouncement(id) {
  return http.delete(`/admin/announcements/${id}`)
}
