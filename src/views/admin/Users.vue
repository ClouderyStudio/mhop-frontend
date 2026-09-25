<template>
  <div v-loading="loading">
    <h2 class="page-title">用户管理</h2>

    <!-- 窄屏：卡片列表 -->
    <div v-if="isMobile" class="admin-mobile-list">
      <div v-for="row in users" :key="row.id" class="admin-mobile-card mhop-card">
        <div class="am-head">
          <span class="am-title">{{ row.username }}</span>
          <el-tag v-if="row.badge" size="small" type="success" effect="dark">{{ row.badge }}</el-tag>
          <el-tag :type="roleTagType(row)" effect="plain" size="small">{{ roleLabel(row) }}</el-tag>
          <span class="am-id">#{{ row.id }}</span>
        </div>
        <div class="am-meta">
          <div class="am-row"><span class="am-label">邮箱</span><span class="am-value">{{ row.email || '—' }}</span></div>
          <div class="am-row"><span class="am-label">手机</span><span class="am-value">{{ row.phone || '—' }}</span></div>
          <!-- 管理员账号展示已授权模块 -->
          <div v-if="isStaff(row)" class="am-row">
            <span class="am-label">权限</span>
            <span class="am-value">
              <template v-if="row.role === 'superadmin'">
                <el-tag size="small" type="danger" effect="dark">全部模块（超级管理员）</el-tag>
              </template>
              <template v-else-if="row.permissions?.length">
                <el-tag v-for="p in row.permissions" :key="p" size="small" effect="plain" style="margin: 0 6px 4px 0">
                  {{ permName(p) }}
                </el-tag>
              </template>
              <el-tag v-else size="small" type="info" effect="plain">未授权（无法进入后台）</el-tag>
            </span>
          </div>
          <div class="am-row">
            <span class="am-label">状态</span>
            <span class="am-value">
              <el-tag v-if="row.id === auth.user?.id" type="info" effect="plain" size="small">当前账号</el-tag>
              <el-switch
                v-else-if="canManage(row)"
                :model-value="row.status === 'active'"
                active-text="正常"
                inactive-text="停用"
                inline-prompt
                @change="(v) => toggleStatus(row, v)"
              />
              <el-tag v-else :type="row.status === 'active' ? 'success' : 'info'" effect="plain" size="small">
                {{ row.status === 'active' ? '正常' : '停用' }}
              </el-tag>
            </span>
          </div>
          <div class="am-row"><span class="am-label">内容</span><span class="am-value">帖子 {{ row.post_count ?? 0 }} · 回复 {{ row.reply_count ?? 0 }}</span></div>
          <div class="am-row"><span class="am-label">注册</span><span class="am-value">{{ fmtTime(row.created_at) }}</span></div>
        </div>
        <div class="am-actions">
          <el-button v-if="canManage(row)" size="small" @click="openBadgeDialog(row)">标识</el-button>
          <el-button v-if="canEditPerms(row)" size="small" type="primary" plain @click="openPermsDialog(row)">权限</el-button>
          <el-button v-if="canPromote(row)" size="small" type="warning" plain @click="openPromoteDialog(row)">设为管理员</el-button>
          <el-button v-if="canPromoteSuper(row)" size="small" type="danger" plain @click="promoteSuper(row)">设为超管</el-button>
          <el-button v-if="canDemoteSuper(row)" size="small" type="danger" plain @click="demoteSuper(row)">取消超管</el-button>
          <el-button v-if="canDemote(row)" size="small" type="info" plain @click="demote(row)">取消管理员</el-button>
          <el-button v-if="canManage(row)" size="small" @click="openResetDialog(row)">重置密码</el-button>
          <el-button v-if="canDelete(row)" size="small" type="danger" plain @click="removeUser(row)">删除</el-button>
        </div>
      </div>
      <el-empty v-if="!loading && users.length === 0" description="暂无用户" />
    </div>

    <!-- 宽屏：表格 -->
    <el-card v-else shadow="never">
      <el-table :data="users" stripe>
        <el-table-column label="ID" prop="id" min-width="70" />
        <el-table-column label="用户名" min-width="150">
          <template #default="{ row }">
            <span>{{ row.username }}</span>
            <el-tag v-if="row.badge" size="small" type="success" effect="dark" style="margin-left: 6px">{{ row.badge }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="邮箱" min-width="170">
          <template #default="{ row }">{{ row.email || '—' }}</template>
        </el-table-column>
        <el-table-column label="手机号" min-width="125">
          <template #default="{ row }">{{ row.phone || '—' }}</template>
        </el-table-column>
        <el-table-column label="角色" min-width="105">
          <template #default="{ row }">
            <el-tag :type="roleTagType(row)" effect="plain" size="small">{{ roleLabel(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="模块权限" min-width="200">
          <template #default="{ row }">
            <template v-if="row.role === 'superadmin'">
              <el-tag size="small" type="danger" effect="dark">全部模块</el-tag>
            </template>
            <template v-else-if="row.role === 'admin'">
              <template v-if="row.permissions?.length">
                <el-tag v-for="p in row.permissions" :key="p" size="small" effect="plain"
                  style="margin: 0 4px 4px 0">{{ permName(p) }}</el-tag>
              </template>
              <el-tag v-else size="small" type="info" effect="plain">未授权</el-tag>
            </template>
            <span v-else class="perm-na">—</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="120">
          <template #default="{ row }">
            <el-tag v-if="row.id === auth.user?.id" type="info" effect="plain" size="small">当前账号</el-tag>
            <el-switch
              v-else-if="canManage(row)"
              :model-value="row.status === 'active'"
              active-text="正常"
              inactive-text="停用"
              inline-prompt
              @change="(v) => toggleStatus(row, v)"
            />
            <el-tag v-else :type="row.status === 'active' ? 'success' : 'info'" effect="plain" size="small">
              {{ row.status === 'active' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="内容" width="120">
          <template #default="{ row }">
            <span class="count-chip">帖 {{ row.post_count ?? 0 }}</span>
            <span class="count-chip">回 {{ row.reply_count ?? 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" min-width="160">
          <template #default="{ row }">{{ fmtTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" min-width="440">
          <template #default="{ row }">
            <el-button v-if="canManage(row)" size="small" @click="openBadgeDialog(row)">标识</el-button>
            <el-button v-if="canEditPerms(row)" size="small" type="primary" plain @click="openPermsDialog(row)">权限</el-button>
            <el-button v-if="canPromote(row)" size="small" type="warning" plain @click="openPromoteDialog(row)">设为管理员</el-button>
            <el-button v-if="canPromoteSuper(row)" size="small" type="danger" plain @click="promoteSuper(row)">设为超管</el-button>
            <el-button v-if="canDemoteSuper(row)" size="small" type="danger" plain @click="demoteSuper(row)">取消超管</el-button>
            <el-button v-if="canDemote(row)" size="small" type="info" plain @click="demote(row)">取消管理员</el-button>
            <el-button v-if="canManage(row)" size="small" @click="openResetDialog(row)">重置密码</el-button>
            <el-button v-if="canDelete(row)" size="small" type="danger" plain @click="removeUser(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 标识设置弹窗 -->
    <el-dialog v-model="badgeDialog.visible" title="设置用户标识" width="420px">
      <p style="margin-bottom: 12px; color: #606266">
        为「{{ badgeDialog.username }}」设置标识标签，如：认证咨询师、志愿者、心理导师等。留空则清除标识。
      </p>
      <el-input v-model="badgeDialog.badge" placeholder="输入标识（最多64字符）" maxlength="64" show-word-limit />
      <template #footer>
        <el-button @click="badgeDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="badgeDialog.saving" @click="saveBadge">保存</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码弹窗 -->
    <el-dialog v-model="resetDialog.visible" title="重置用户密码" width="420px">
      <p style="margin-bottom: 12px; color: #606266">
        为「{{ resetDialog.username }}」设置新密码（至少 6 位）。
      </p>
      <el-input v-model="resetDialog.password" type="password" placeholder="新密码" show-password />
      <template #footer>
        <el-button @click="resetDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="resetDialog.saving" @click="saveReset">确认重置</el-button>
      </template>
    </el-dialog>

    <!-- 提升为管理员并授权弹窗 -->
    <el-dialog v-model="promoteDialog.visible" title="设为管理员并分配权限" width="480px">
      <p style="margin: 0 0 4px; color: #606266">
        将「<strong>{{ promoteDialog.username }}</strong>」提升为管理员，并勾选该账号可访问的后台模块。
      </p>
      <p style="margin: 0 0 12px; color: #e6a23c; font-size: 12.5px">
        未勾选任何模块时，该账号能登录但看不到任何后台页面，可稍后再授权。
      </p>
      <el-checkbox-group v-model="promoteDialog.perms" class="perm-group">
        <el-checkbox v-for="p in ADMIN_PERMS" :key="p.code" :value="p.code" class="perm-item" border>
          <div class="perm-name">{{ p.name }}</div>
          <div class="perm-desc">{{ p.desc }}</div>
        </el-checkbox>
      </el-checkbox-group>
      <div class="perm-quick">
        <el-button link type="primary" size="small" @click="promoteDialog.perms = allCodes">全选</el-button>
        <el-button link type="info" size="small" @click="promoteDialog.perms = []">清空</el-button>
      </div>
      <template #footer>
        <el-button @click="promoteDialog.visible = false">取消</el-button>
        <el-button type="warning" :loading="promoteDialog.saving" @click="savePromote">确认提升</el-button>
      </template>
    </el-dialog>

    <!-- 管理员权限配置弹窗 -->
    <el-dialog v-model="permDialog.visible" title="配置管理员模块权限" width="480px">
      <p style="margin: 0 0 12px; color: #606266">
        调整「<strong>{{ permDialog.username }}</strong>」可访问的后台模块，保存后对该账号立即生效。
      </p>
      <el-checkbox-group v-model="permDialog.perms" class="perm-group">
        <el-checkbox v-for="p in ADMIN_PERMS" :key="p.code" :value="p.code" class="perm-item" border>
          <div class="perm-name">{{ p.name }}</div>
          <div class="perm-desc">{{ p.desc }}</div>
        </el-checkbox>
      </el-checkbox-group>
      <div class="perm-quick">
        <el-button link type="primary" size="small" @click="permDialog.perms = allCodes">全选</el-button>
        <el-button link type="info" size="small" @click="permDialog.perms = []">清空</el-button>
      </div>
      <template #footer>
        <el-button @click="permDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="permDialog.saving" @click="savePerms">保存权限</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import http from '../../api'
import { useAuthStore } from '../../stores/auth'
import { fmtTime } from '../../utils/format'
import { useIsMobile } from '../../utils/useIsMobile'
import { ADMIN_PERMS, permName } from '../../utils/permissions'

const isMobile = useIsMobile()
const auth = useAuthStore()
const users = ref([])
const loading = ref(false)

const allCodes = ADMIN_PERMS.map((p) => p.code)

const badgeDialog = reactive({ visible: false, userId: 0, username: '', badge: '', saving: false })
const resetDialog = reactive({ visible: false, userId: 0, username: '', password: '', saving: false })
const promoteDialog = reactive({ visible: false, userId: 0, username: '', perms: [], saving: false })
const permDialog = reactive({ visible: false, userId: 0, username: '', perms: [], saving: false })

// 角色展示
function roleLabel(row) {
  return row.role === 'superadmin' ? '超级管理员' : row.role === 'admin' ? '管理员' : '普通用户'
}
function roleTagType(row) {
  return row.role === 'superadmin' ? 'danger' : row.role === 'admin' ? 'warning' : 'info'
}
function isStaff(row) {
  return row.role === 'admin' || row.role === 'superadmin'
}
// 管理员/超管账号的敏感操作仅超管本人可执行；普通用户不受限
function canManage(row) {
  return !isStaff(row) || auth.isSuperadmin
}
function canPromote(row) {
  return auth.isSuperadmin && row.role === 'user'
}
function canDemote(row) {
  return auth.isSuperadmin && row.role === 'admin'
}
// 指定/取消超级管理员：仅超管可操作，不能对自己执行（最后一个超管由后端兜底拦截）
function canPromoteSuper(row) {
  return auth.isSuperadmin && row.id !== auth.user?.id && row.role !== 'superadmin'
}
function canDemoteSuper(row) {
  return auth.isSuperadmin && row.id !== auth.user?.id && row.role === 'superadmin'
}
function canEditPerms(row) {
  return auth.isSuperadmin && row.role === 'admin'
}
function canDelete(row) {
  return row.id !== auth.user?.id && row.role !== 'superadmin' && canManage(row)
}

async function load() {
  loading.value = true
  try {
    users.value = await http.get('/admin/users')
  } finally {
    loading.value = false
  }
}

async function toggleStatus(row, active) {
  const status = active ? 'active' : 'disabled'
  try {
    await ElMessageBox.confirm(
      `确定${active ? '恢复' : '停用'}用户「${row.username}」吗？${active ? '' : '停用后该用户将无法登录。'}`,
      '账号状态',
      { type: 'warning' }
    )
    await http.post(`/admin/users/${row.id}/status`, { status })
    row.status = status
    ElMessage.success('已更新')
  } catch {
    load()
  }
}

function openPromoteDialog(row) {
  promoteDialog.userId = row.id
  promoteDialog.username = row.username
  promoteDialog.perms = []
  promoteDialog.visible = true
}

async function savePromote() {
  promoteDialog.saving = true
  try {
    await http.post(`/admin/users/${promoteDialog.userId}/role`, {
      action: 'promote',
      permissions: promoteDialog.perms,
    })
    ElMessage.success('已提升为管理员')
    promoteDialog.visible = false
    load()
  } finally {
    promoteDialog.saving = false
  }
}

async function demote(row) {
  try {
    await ElMessageBox.confirm(
      `确定取消「${row.username}」的管理员权限吗？取消后其模块授权将一并清空。`,
      '权限管理',
      { type: 'warning' }
    )
    await http.post(`/admin/users/${row.id}/role`, { action: 'demote' })
    ElMessage.success('已取消管理员权限')
    load()
  } catch { /* cancelled */ }
}

async function promoteSuper(row) {
  try {
    await ElMessageBox.confirm(
      `确定将「${row.username}」指定为超级管理员吗？超级管理员拥有全部后台模块权限，` +
      `并可分配其他管理员权限、管理管理员角色。该操作立即生效。`,
      '指定超级管理员',
      { type: 'error', confirmButtonText: '确认指定' }
    )
    await http.post(`/admin/users/${row.id}/role`, { action: 'promote_super' })
    ElMessage.success(`「${row.username}」已成为超级管理员`)
    load()
  } catch { /* cancelled */ }
}

async function demoteSuper(row) {
  try {
    await ElMessageBox.confirm(
      `确定取消「${row.username}」的超级管理员身份吗？取消后将降为普通管理员，` +
      `仅保留其此前被授予的模块权限（若无授权则无法进入后台）。系统必须始终保留至少一个超级管理员。`,
      '取消超级管理员',
      { type: 'warning', confirmButtonText: '确认取消' }
    )
    await http.post(`/admin/users/${row.id}/role`, { action: 'demote_super' })
    ElMessage.success('已降为普通管理员')
    load()
  } catch { /* cancelled */ }
}

async function openPermsDialog(row) {
  permDialog.userId = row.id
  permDialog.username = row.username
  permDialog.saving = false
  permDialog.visible = true
  try {
    // 以服务端记录为准拉取一次，避免列表数据过期
    const detail = await http.get(`/admin/users/${row.id}/permissions`)
    permDialog.perms = detail.permissions || []
  } catch {
    permDialog.perms = Array.isArray(row.permissions) ? [...row.permissions] : []
  }
}

async function savePerms() {
  permDialog.saving = true
  try {
    await http.put(`/admin/users/${permDialog.userId}/permissions`, { permissions: permDialog.perms })
    ElMessage.success('权限已更新，对该账号立即生效')
    permDialog.visible = false
    load()
  } finally {
    permDialog.saving = false
  }
}

function openBadgeDialog(row) {
  badgeDialog.userId = row.id
  badgeDialog.username = row.username
  badgeDialog.badge = row.badge || ''
  badgeDialog.visible = true
}

async function saveBadge() {
  badgeDialog.saving = true
  try {
    await http.post(`/admin/users/${badgeDialog.userId}/badge`, { badge: badgeDialog.badge })
    ElMessage.success('标识已更新')
    badgeDialog.visible = false
    load()
  } finally {
    badgeDialog.saving = false
  }
}

function openResetDialog(row) {
  resetDialog.userId = row.id
  resetDialog.username = row.username
  resetDialog.password = ''
  resetDialog.visible = true
}

async function saveReset() {
  if (resetDialog.password.length < 6) {
    ElMessage.warning('密码至少 6 位')
    return
  }
  resetDialog.saving = true
  try {
    await http.post(`/admin/users/${resetDialog.userId}/reset-password`, { password: resetDialog.password })
    ElMessage.success('密码已重置')
    resetDialog.visible = false
  } finally {
    resetDialog.saving = false
  }
}

async function removeUser(row) {
  const posts = row.post_count ?? 0
  const replies = row.reply_count ?? 0
  try {
    await ElMessageBox.confirm(
      '确定删除用户「' + row.username + '」吗？将同时删除该用户的 ' + posts + ' 篇帖子、' + replies +
        ' 条回复，以及相关点赞、图片与 AI 日志，操作不可恢复。',
      '删除用户',
      { type: 'error', confirmButtonText: '确认删除' }
    )
    const res = await http.delete('/admin/users/' + row.id)
    ElMessage.success('已删除，连带 ' + res.deleted_posts + ' 篇帖子、' + res.deleted_replies + ' 条回复')
    load()
  } catch {
    /* 用户取消 */
  }
}

onMounted(load)
</script>

<style scoped>
.page-title {
  margin: 0 0 14px;
  font-size: 20px;
}
.count-chip {
  display: inline-block;
  margin-right: 6px;
  font-size: 12px;
  color: var(--mhop-text-sub);
}
.perm-na {
  color: var(--mhop-text-sub);
}
.perm-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.perm-item {
  width: 100%;
  margin-right: 0;
  height: auto;
  padding: 10px 12px;
  align-items: flex-start;
  white-space: normal;
}
.perm-name {
  font-weight: 600;
  font-size: 14px;
  line-height: 1.4;
}
.perm-desc {
  font-size: 12px;
  color: var(--mhop-text-sub);
  line-height: 1.5;
  margin-top: 2px;
}
.perm-quick {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}
</style>
