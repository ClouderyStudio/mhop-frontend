// 后台模块权限码：与后端 AdminPermissions 一一对应，顺序即菜单顺序
export const ADMIN_PERMS = [
  { code: 'dashboard', name: '数据看板', desc: '查看全站统计、待办与趋势', path: '/admin/dashboard' },
  { code: 'review', name: '内容审核', desc: '审核帖子与回复、撤回 AI 回复、删除内容、重新生成 AI 回复', path: '/admin/review' },
  { code: 'users', name: '用户管理', desc: '管理用户状态、标识、密码，以及管理员角色与权限', path: '/admin/users' },
  { code: 'ai_logs', name: 'AI 交互日志', desc: '查看 AI 调用记录、撤回/恢复论坛 AI 回复', path: '/admin/ai-logs' },
]

export function permName(code) {
  return ADMIN_PERMS.find((p) => p.code === code)?.name || code
}
