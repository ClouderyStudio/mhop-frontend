<template>
  <div class="profile-page">
    <div class="mhop-card profile-card">
      <h2>个人主页</h2>
      <div class="profile-body">
        <div class="avatar-section">
          <div class="avatar-wrap" @click="pickAvatar">
            <img v-if="avatarUrl" :src="avatarUrl" class="avatar-img" alt="头像" />
            <span v-else class="avatar-placeholder">{{ form.username.charAt(0).toUpperCase() }}</span>
            <span class="avatar-overlay">更换</span>
          </div>
          <input ref="avatarInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif" style="display:none" @change="onAvatarChange" />
        </div>
        <div class="info-section">
          <el-form label-position="top" @submit.prevent>
            <el-form-item label="用户名">
              <el-input v-model="form.username" placeholder="用户名" maxlength="32" show-word-limit />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input :model-value="email || '未绑定'" disabled />
            </el-form-item>
            <el-form-item label="手机号">
              <div v-if="!phoneEditing" class="phone-row">
                <el-input :model-value="phone ? maskPhone(phone) : '未绑定（发帖前必须绑定）'" disabled />
                <el-button type="primary" link @click="startEditPhone">{{ phone ? '换绑' : '绑定' }}</el-button>
              </div>
              <div v-else class="phone-row">
                <el-input v-model="phoneInput" placeholder="请输入 11 位手机号" maxlength="11" />
                <el-button type="primary" :loading="phoneSaving" @click="savePhone">保存</el-button>
                <el-button @click="cancelEditPhone">取消</el-button>
              </div>
            </el-form-item>
            <el-form-item label="角色">
              <el-tag :type="isAdmin ? 'danger' : 'info'">{{ isAdmin ? '管理员' : '普通用户' }}</el-tag>
            </el-form-item>
            <el-form-item label="注册时间">
              <span class="text-sub">{{ createdAt }}</span>
            </el-form-item>
          </el-form>
          <el-button type="primary" round :loading="saving" @click="save">保存修改</el-button>
        </div>
      </div>
      <div class="my-stats" v-if="summary">
        <span>我的帖子 {{ summary.posts.total }}<em v-if="summary.posts.pending">（审核中 {{ summary.posts.pending }}）</em></span>
        <span>我的回复 {{ summary.replies.total }}<em v-if="summary.replies.pending">（审核中 {{ summary.replies.pending }}）</em></span>
        <span v-if="summary.posts.draft || summary.replies.draft">草稿 {{ summary.posts.draft + summary.replies.draft }}</span>
      </div>
    </div>

    <div class="mhop-card manage-card">
      <div class="manage-title">
        <h3>我的内容管理</h3>
        <span class="text-sub">审核中的内容可自行取消审核后重新编辑；已通过的内容不可修改，只能删除。</span>
      </div>

      <el-tabs v-model="contentTab">
        <el-tab-pane label="我的帖子" name="posts">
          <div class="filter-row">
            <el-radio-group v-model="postFilter" size="small" @change="onPostFilterChange">
              <el-radio-button value="">全部</el-radio-button>
              <el-radio-button value="0">审核中</el-radio-button>
              <el-radio-button value="1">已通过</el-radio-button>
              <el-radio-button value="2">已驳回</el-radio-button>
              <el-radio-button value="3">草稿</el-radio-button>
            </el-radio-group>
            <el-button size="small" text @click="loadPosts" :loading="postLoading">刷新</el-button>
          </div>

          <el-empty v-if="!postLoading && !myPosts.length" description="暂无帖子" :image-size="70" />
          <div v-for="p in myPosts" :key="p.id" class="manage-item">
            <div class="manage-head">
              <el-tag :type="statusTagType(p.status)" size="small">{{ statusText(p.status) }}</el-tag>
              <el-tag size="small" effect="plain">{{ boardName(p.board) }}</el-tag>
              <span class="text-sub">{{ fmtTime(p.created_at) }}</span>
            </div>
            <div class="manage-body">{{ p.content }}</div>
            <div v-if="p.status === 2 && p.review_note" class="reject-note">驳回原因：{{ p.review_note }}</div>
            <div v-if="p.images && p.images.length" class="img-strip">
              <img v-for="u in p.images" :key="u" :src="u" />
            </div>
            <div class="manage-meta">回复 {{ p.reply_count }} · 浏览 {{ p.view_count }} · 获赞 {{ p.like_count }}</div>
            <div class="manage-actions">
              <el-button size="small" :disabled="!p.editable" @click="openEditPost(p)">编辑</el-button>
              <el-button v-if="p.can_withdraw" size="small" type="warning" plain @click="withdrawPost(p)">取消审核</el-button>
              <el-button v-if="p.can_submit" size="small" type="success" plain @click="submitPost(p)">重新提交审核</el-button>
              <el-button size="small" type="danger" plain @click="removePost(p)">删除</el-button>
            </div>
          </div>
          <div class="pager" v-if="postTotal > pageSize">
            <el-pagination background layout="prev, pager, next" :total="postTotal"
              :page-size="pageSize" :current-page="postPage" @current-change="onPostPage" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="我的回复" name="replies">
          <div class="filter-row">
            <el-radio-group v-model="replyFilter" size="small" @change="onReplyFilterChange">
              <el-radio-button value="">全部</el-radio-button>
              <el-radio-button value="0">审核中</el-radio-button>
              <el-radio-button value="1">已通过</el-radio-button>
              <el-radio-button value="2">已驳回</el-radio-button>
              <el-radio-button value="3">草稿</el-radio-button>
            </el-radio-group>
            <el-button size="small" text @click="loadReplies" :loading="replyLoading">刷新</el-button>
          </div>

          <el-empty v-if="!replyLoading && !myReplies.length" description="暂无回复" :image-size="70" />
          <div v-for="r in myReplies" :key="r.id" class="manage-item">
            <div class="manage-head">
              <el-tag :type="statusTagType(r.status)" size="small">{{ statusText(r.status) }}</el-tag>
              <span class="text-sub">回复于「{{ r.post_excerpt || '已删除的帖子' }}」</span>
              <span class="text-sub">{{ fmtTime(r.created_at) }}</span>
            </div>
            <div class="manage-body">{{ r.content }}</div>
            <div v-if="r.status === 2 && r.review_note" class="reject-note">驳回原因：{{ r.review_note }}</div>
            <div v-if="r.images && r.images.length" class="img-strip">
              <img v-for="u in r.images" :key="u" :src="u" />
            </div>
            <div class="manage-meta">
              获赞 {{ r.like_count }}
              <template v-if="r.post_status !== 1 && r.status === 1">
                <el-tag type="info" size="small" effect="plain" style="margin-left:8px">帖子未公开</el-tag>
              </template>
            </div>
            <div class="manage-actions">
              <el-button size="small" :disabled="!r.editable" @click="openEditReply(r)">编辑</el-button>
              <el-button v-if="r.can_withdraw" size="small" type="warning" plain @click="withdrawReply(r)">取消审核</el-button>
              <el-button v-if="r.can_submit" size="small" type="success" plain @click="submitReply(r)">重新提交审核</el-button>
              <el-button size="small" type="danger" plain @click="removeReply(r)">删除</el-button>
            </div>
          </div>
          <div class="pager" v-if="replyTotal > pageSize">
            <el-pagination background layout="prev, pager, next" :total="replyTotal"
              :page-size="pageSize" :current-page="replyPage" @current-change="onReplyPage" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="editVisible" :title="editKind === 'post' ? '编辑帖子' : '编辑回复'" width="580px">
      <el-form label-position="top" @submit.prevent>
        <el-form-item v-if="editKind === 'post'" label="板块">
          <el-select v-model="editForm.board" style="width:100%">
            <el-option v-for="b in BOARDS" :key="b.slug" :label="b.name" :value="b.slug" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="editForm.content" type="textarea" :rows="7"
            :maxlength="editKind === 'post' ? 2000 : 1000" show-word-limit />
        </el-form-item>
        <el-form-item :label="'图片（最多 9 张，已选 ' + editForm.images.length + '）'">
          <div class="img-grid">
            <div v-for="(u, i) in editForm.images" :key="u" class="img-cell">
              <img :src="u" />
              <span class="img-del" @click="editForm.images.splice(i, 1)">×</span>
            </div>
            <label v-if="editForm.images.length < 9" class="img-add">
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" style="display:none" @change="onEditImage" />
              <span v-if="!imgUploading">＋</span>
              <span v-else class="text-sub">上传中</span>
            </label>
          </div>
        </el-form-item>
        <el-form-item label="匿名发布">
          <el-switch v-model="editForm.is_anonymous" />
        </el-form-item>
      </el-form>
      <el-alert v-if="editKind === 'post'" type="info" :closable="false"
        title="保存后会重新进入审核队列；若当前是草稿则仍保持草稿，需点击「重新提交审核」才会送审。" />
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="editSaving" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import http from '../../api'
import { useAuthStore } from '../../stores/auth'
import { BOARDS, boardOf } from '../../utils/boards'

const auth = useAuthStore()
const form = ref({ username: '' })
const avatarUrl = ref('')
const email = ref('')
const phone = ref('')
const phoneEditing = ref(false)
const phoneInput = ref('')
const phoneSaving = ref(false)
const createdAt = ref('')
const saving = ref(false)
const avatarInput = ref(null)
const isAdmin = computed(() => auth.user?.role === 'admin')
const summary = ref(null)

// ---- 我的内容管理 ----
const PAGE_SIZE = 5
const contentTab = ref('posts')
const myPosts = ref([])
const myReplies = ref([])
const postTotal = ref(0)
const replyTotal = ref(0)
const postPage = ref(1)
const replyPage = ref(1)
const postFilter = ref('')
const replyFilter = ref('')
const postLoading = ref(false)
const replyLoading = ref(false)

const editVisible = ref(false)
const editKind = ref('post')
const editId = ref(0)
const editSaving = ref(false)
const imgUploading = ref(false)
const editForm = ref({ content: '', board: 'mood', is_anonymous: true, images: [] })

const STATUS_TEXT = { 0: '审核中', 1: '已通过', 2: '已驳回', 3: '草稿' }
const STATUS_TAG = { 0: 'warning', 1: 'success', 2: 'danger', 3: 'info' }
function statusText(s) { return STATUS_TEXT[s] || '未知' }
function statusTagType(s) { return STATUS_TAG[s] || 'info' }
function boardName(slug) { return boardOf(slug).name }
function fmtTime(t) { return t ? new Date(t).toLocaleString('zh-CN') : '' }

onMounted(async () => {
  form.value.username = auth.user?.username || ''
  avatarUrl.value = auth.user?.avatar || ''
  email.value = auth.user?.email || ''
  phone.value = auth.user?.phone || ''
  createdAt.value = auth.user?.created_at ? new Date(auth.user.created_at).toLocaleString('zh-CN') : ''
  loadSummary()
  loadPosts()
  loadReplies()
})

async function loadSummary() {
  try {
    summary.value = await http.get('/forum/mine/summary')
  } catch { /* ignore */ }
}

async function loadPosts() {
  postLoading.value = true
  try {
    const params = { page: postPage.value, size: PAGE_SIZE }
    if (postFilter.value !== '') params.status = postFilter.value
    const data = await http.get('/forum/mine/posts', { params })
    myPosts.value = data.items || []
    postTotal.value = data.total || 0
  } finally {
    postLoading.value = false
  }
}

async function loadReplies() {
  replyLoading.value = true
  try {
    const params = { page: replyPage.value, size: PAGE_SIZE }
    if (replyFilter.value !== '') params.status = replyFilter.value
    const data = await http.get('/forum/mine/replies', { params })
    myReplies.value = data.items || []
    replyTotal.value = data.total || 0
  } finally {
    replyLoading.value = false
  }
}

function refreshAll() {
  loadSummary()
  loadPosts()
  loadReplies()
}

function onPostFilterChange() { postPage.value = 1; loadPosts() }
function onReplyFilterChange() { replyPage.value = 1; loadReplies() }
function onPostPage(p) { postPage.value = p; loadPosts() }
function onReplyPage(p) { replyPage.value = p; loadReplies() }

function openEditPost(p) {
  editKind.value = 'post'
  editId.value = p.id
  editForm.value = {
    content: p.content,
    board: p.board,
    is_anonymous: !!p.is_anonymous,
    images: [...(p.images || [])],
  }
  editVisible.value = true
}

function openEditReply(r) {
  editKind.value = 'reply'
  editId.value = r.id
  editForm.value = {
    content: r.content,
    board: 'mood',
    is_anonymous: !!r.is_anonymous,
    images: [...(r.images || [])],
  }
  editVisible.value = true
}

async function onEditImage(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('图片不能超过 5MB')
    return
  }
  imgUploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    const data = await http.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    editForm.value.images.push(data.url)
  } catch { /* 错误提示由拦截器处理 */ } finally {
    imgUploading.value = false
  }
}

async function saveEdit() {
  if (!editForm.value.content.trim()) {
    ElMessage.warning('内容不能为空')
    return
  }
  editSaving.value = true
  try {
    const payload = {
      content: editForm.value.content.trim(),
      is_anonymous: editForm.value.is_anonymous,
      images: editForm.value.images,
    }
    if (editKind.value === 'post') {
      payload.board = editForm.value.board
      await http.put('/forum/posts/' + editId.value, payload)
    } else {
      await http.put('/forum/replies/' + editId.value, payload)
    }
    ElMessage.success('已保存')
    editVisible.value = false
    refreshAll()
  } finally {
    editSaving.value = false
  }
}

async function withdrawPost(p) {
  await http.post('/forum/posts/' + p.id + '/withdraw')
  ElMessage.success('已取消审核，可在草稿中继续编辑')
  refreshAll()
}
async function submitPost(p) {
  await http.post('/forum/posts/' + p.id + '/submit')
  ElMessage.success('已重新提交审核')
  refreshAll()
}
async function withdrawReply(r) {
  await http.post('/forum/replies/' + r.id + '/withdraw')
  ElMessage.success('已取消审核，可在草稿中继续编辑')
  refreshAll()
}
async function submitReply(r) {
  await http.post('/forum/replies/' + r.id + '/submit')
  ElMessage.success('已重新提交审核')
  refreshAll()
}

async function removePost(p) {
  const ok = await ElMessageBox.confirm(
    p.status === 1 ? '该帖子已通过审核，删除后其全部回复与点赞也会一并移除，且无法恢复。' : '删除后无法恢复，确定删除这条帖子吗？',
    '删除帖子', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
  ).then(() => true).catch(() => false)
  if (!ok) return
  await http.delete('/forum/posts/' + p.id)
  ElMessage.success('帖子已删除')
  refreshAll()
}

async function removeReply(r) {
  const ok = await ElMessageBox.confirm(
    r.status === 1 ? '该回复已通过审核，删除后无法恢复。' : '删除后无法恢复，确定删除这条回复吗？',
    '删除回复', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
  ).then(() => true).catch(() => false)
  if (!ok) return
  await http.delete('/forum/replies/' + r.id)
  ElMessage.success('回复已删除')
  refreshAll()
}

function maskPhone(p) {
  return p.length === 11 ? p.slice(0, 3) + '****' + p.slice(7) : p
}
function startEditPhone() {
  phoneInput.value = phone.value || ''
  phoneEditing.value = true
}
function cancelEditPhone() {
  phoneEditing.value = false
  phoneInput.value = ''
}
async function savePhone() {
  const p = phoneInput.value.trim()
  if (!/^1[3-9]\d{9}$/.test(p)) {
    ElMessage.warning('请输入正确的 11 位手机号')
    return
  }
  phoneSaving.value = true
  try {
    const updated = await http.put('/auth/me/phone', { phone: p })
    phone.value = updated.phone || ''
    auth.user = { ...(auth.user || {}), phone: updated.phone || '' }
    localStorage.setItem('mhop_user', JSON.stringify(auth.user))
    phoneEditing.value = false
    ElMessage.success('手机号已绑定')
  } finally {
    phoneSaving.value = false
  }
}

function pickAvatar() {
  avatarInput.value?.click()
}

async function onAvatarChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('图片不能超过 5MB')
    return
  }
  try {
    const fd = new FormData()
    fd.append('file', file)
    const data = await http.post('/upload/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    avatarUrl.value = data.url
    ElMessage.success('头像已上传，点击保存修改生效')
  } catch {
    /* error toast handled by interceptor */
  }
  e.target.value = ''
}

async function save() {
  if (form.value.username.trim().length < 2) {
    ElMessage.warning('用户名至少 2 个字符')
    return
  }
  saving.value = true
  try {
    const updated = await http.put('/auth/profile', {
      username: form.value.username.trim(),
      avatar: avatarUrl.value,
    })
    auth.user = updated
    localStorage.setItem('mhop_user', JSON.stringify(updated))
    ElMessage.success('资料已更新')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.profile-page {
  max-width: 760px;
  margin: 24px auto;
}
.profile-card h2 {
  margin-bottom: 20px;
}
.profile-body {
  display: flex;
  gap: 28px;
  align-items: flex-start;
}
.avatar-section {
  flex-shrink: 0;
}
.avatar-wrap {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  background: var(--mhop-primary, #5b8def);
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-placeholder {
  font-size: 36px;
  color: #fff;
  font-weight: 600;
}
.avatar-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.5);
  color: #fff;
  text-align: center;
  font-size: 12px;
  padding: 2px 0;
  opacity: 0;
  transition: opacity 0.2s;
}
.avatar-wrap:hover .avatar-overlay {
  opacity: 1;
}
.info-section {
  flex: 1;
  min-width: 0;
}
.phone-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.phone-row .el-input {
  flex: 1;
}
.my-stats {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--mhop-border, #e8e8e8);
  color: var(--mhop-text, #333);
  font-size: 14px;
}
.my-stats em {
  font-style: normal;
  color: var(--el-color-warning);
}
.manage-card {
  margin-top: 20px;
  padding: 24px 26px 18px;
}
.manage-title h3 {
  margin: 0 0 4px;
}
.manage-title .text-sub {
  font-size: 12.5px;
}
.filter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.manage-item {
  border: 1px solid var(--mhop-border, #e8e8e8);
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 12px;
}
.manage-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
.manage-body {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
  line-height: 1.6;
  color: var(--mhop-text, #333);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.reject-note {
  margin-top: 8px;
  font-size: 12.5px;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  border-radius: 6px;
  padding: 6px 10px;
}
.manage-meta {
  margin-top: 8px;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
.manage-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.img-strip {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}
.img-strip img {
  width: 54px;
  height: 54px;
  object-fit: cover;
  border-radius: 6px;
}
.img-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.img-cell {
  position: relative;
  width: 72px;
  height: 72px;
}
.img-cell img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}
.img-del {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  line-height: 16px;
  text-align: center;
  border-radius: 50%;
  background: var(--el-color-danger);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}
.img-add {
  width: 72px;
  height: 72px;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
}
.pager {
  display: flex;
  justify-content: center;
  margin-top: 6px;
}
@media (max-width: 640px) {
  .profile-body { flex-direction: column; align-items: center; }
  .profile-page { margin: 12px; }
}
</style>
