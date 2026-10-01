<template>
  <div v-loading="loading">
    <h2 class="page-title">漂流瓶审核</h2>

    <!-- 统计 -->
    <div class="stat-grid">
      <div class="stat-card stat-pending" style="cursor: pointer" @click="filterPending">
        <el-icon :size="22"><Clock /></el-icon>
        <div><strong>{{ stats.pending }}</strong><span>待审核（AI 未放行）</span></div>
      </div>
      <div class="stat-card stat-crisis">
        <el-icon :size="22"><WarningFilled /></el-icon>
        <div><strong>{{ stats.crisis }}</strong><span>危机关注（漂流/对话中）</span></div>
      </div>
      <div class="stat-card stat-suspect">
        <el-icon :size="22"><Aim /></el-icon>
        <div><strong>{{ stats.suspect }}</strong><span>AI 初筛疑似/违规</span></div>
      </div>
      <div class="stat-card stat-reported">
        <el-icon :size="22"><Flag /></el-icon>
        <div><strong>{{ stats.reported }}</strong><span>被举报（未下架）</span></div>
      </div>
    </div>

    <!-- 筛选 -->
    <div class="filter-bar">
      <el-radio-group v-model="statusFilter" size="small" @change="reload">
        <el-radio-button :value="null">全部</el-radio-button>
        <el-radio-button :value="0">待审核</el-radio-button>
        <el-radio-button :value="1">漂流中</el-radio-button>
        <el-radio-button :value="2">对话中</el-radio-button>
        <el-radio-button :value="3">已结束</el-radio-button>
        <el-radio-button :value="4">已下架</el-radio-button>
      </el-radio-group>
      <el-select v-model="flagFilter" size="small" placeholder="AI 标记" clearable style="width: 130px"
        @change="reload">
        <el-option label="疑似违规" value="suspect" />
        <el-option label="违规" value="violation" />
      </el-select>
      <el-checkbox v-model="reportedOnly" @change="reload">仅看被举报</el-checkbox>
    </div>

    <!-- 窄屏卡片 -->
    <div v-if="isMobile" class="admin-mobile-list">
      <div v-for="b in list" :key="b.id" class="admin-mobile-card mhop-card">
        <div class="am-head">
          <el-tag size="small" :type="statusType(b.status)" effect="dark">{{ statusLabel(b.status) }}</el-tag>
          <el-tag v-if="b.crisis" size="small" type="danger" effect="light">危机</el-tag>
          <el-tag v-if="b.ai_flag" size="small" :type="b.ai_flag === 'violation' ? 'danger' : 'warning'" effect="plain">
            {{ AI_FLAG_LABEL[b.ai_flag] }}
          </el-tag>
          <span class="am-id">#{{ b.id }} · {{ fmtTime(b.created_at) }}</span>
        </div>
        <p class="am-content">{{ b.content }}</p>
        <div class="am-tags">
          <el-tag size="small" type="info" effect="plain">扔：{{ b.thrower_name }} #{{ b.thrower_id }}</el-tag>
          <el-tag v-if="b.picker_id" size="small" type="info" effect="plain">捞：{{ b.picker_name }} #{{ b.picker_id }}</el-tag>
          <el-tag v-if="b.reported_count > 0" size="small" type="danger" effect="light">
            举报 {{ b.reported_count }}
          </el-tag>
          <span class="am-id">消息 {{ b.message_count }}</span>
        </div>
        <p v-if="b.ai_review_note" class="am-report">AI 初筛理由：{{ b.ai_review_note }}</p>
        <p v-if="b.report_reason" class="am-report">举报理由：{{ b.report_reason }}</p>
        <div class="am-actions">
          <el-button size="small" type="primary" @click="openDetail(b.id)">查看对话</el-button>
          <el-button v-if="b.status !== 4" size="small" type="danger" @click="openDetail(b.id, true)">下架</el-button>
          <el-button v-else size="small" type="success" @click="restore(b)">恢复</el-button>
        </div>
      </div>
      <el-empty v-if="!loading && list.length === 0" description="暂无符合条件的瓶子" />
    </div>

    <!-- 宽屏表格 -->
    <el-table v-else :data="list" stripe>
      <el-table-column label="瓶身内容" min-width="300">
        <template #default="{ row }">
          <p class="cell-content">{{ row.content }}</p>
          <div class="row-tags">
            <el-tag v-if="row.crisis" size="small" type="danger" effect="light">危机信号</el-tag>
            <el-tag v-if="row.ai_flag" size="small"
              :type="row.ai_flag === 'violation' ? 'danger' : 'warning'" effect="plain">
              {{ AI_FLAG_LABEL[row.ai_flag] || row.ai_flag }}
            </el-tag>
            <el-tag v-if="row.reported_count > 0" size="small" type="danger" effect="light">
              举报 {{ row.reported_count }}
            </el-tag>
            <el-tag v-if="row.review_note" size="small" type="info" effect="plain">备注：{{ row.review_note }}</el-tag>
          </div>
          <p v-if="row.ai_review_note" class="row-report">AI 初筛理由：{{ row.ai_review_note }}</p>
          <p v-if="row.report_reason" class="row-report">最近举报理由：{{ row.report_reason }}</p>
        </template>
      </el-table-column>
      <el-table-column label="扔瓶人" width="150">
        <template #default="{ row }">
          <div class="person-cell">{{ row.thrower_name }}</div>
          <div class="person-id">#{{ row.thrower_id }}</div>
        </template>
      </el-table-column>
      <el-table-column label="捞瓶人" width="150">
        <template #default="{ row }">
          <template v-if="row.picker_id">
            <div class="person-cell">{{ row.picker_name }}</div>
            <div class="person-id">#{{ row.picker_id }}</div>
          </template>
          <span v-else class="text-sub">—</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="95">
        <template #default="{ row }">
          <el-tag size="small" :type="statusType(row.status)" effect="dark">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="message_count" label="消息" width="60" />
      <el-table-column label="时间" width="160">
        <template #default="{ row }">{{ fmtTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="openDetail(row.id)">查看对话</el-button>
          <el-button v-if="row.status !== 4" size="small" type="danger" @click="openDetail(row.id, true)">下架</el-button>
          <el-button v-else size="small" type="success" @click="restore(row)">恢复</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination background layout="total, prev, pager, next" :total="total"
        :page-size="pageSize" :current-page="page" @current-change="onPageChange" />
    </div>

    <!-- 详情抽屉 -->
    <el-drawer v-model="detailVisible" :title="`漂流瓶 #${detail?.id ?? ''}`" size="600px"
      :destroy-on-close="false">
      <div v-if="detail" class="detail-wrap">
        <div class="detail-head">
          <el-tag :type="statusType(detail.status)" effect="dark">{{ statusLabel(detail.status) }}</el-tag>
          <el-tag v-if="detail.crisis" type="danger" effect="light">危机信号</el-tag>
          <el-tag v-if="detail.ai_flag" :type="detail.ai_flag === 'violation' ? 'danger' : 'warning'" effect="plain">
            AI：{{ AI_FLAG_LABEL[detail.ai_flag] || detail.ai_flag }}
          </el-tag>
          <span class="text-sub" style="font-size: 12.5px">{{ fmtTime(detail.created_at) }}</span>
        </div>
        <p v-if="detail.ai_review_note" class="detail-ai">AI 初筛理由：{{ detail.ai_review_note }}</p>

        <div class="detail-bottle">
          <p>{{ detail.content }}</p>
          <div class="detail-people">
            <span>扔瓶人：<strong>{{ detail.thrower_name }}</strong>（#{{ detail.thrower_id }}）</span>
            <span v-if="detail.picker_id">捞瓶人：<strong>{{ detail.picker_name }}</strong>（#{{ detail.picker_id }}，{{ fmtTime(detail.picked_at) }} 捞起）</span>
            <span v-if="detail.reported_count > 0" class="report-line">
              被举报 {{ detail.reported_count }} 次，最近：{{ fmtTime(detail.last_reported_at) }}
            </span>
            <span v-if="detail.report_reason" class="report-line">理由：{{ detail.report_reason }}</span>
          </div>
        </div>

        <h4 class="msg-title">对话记录（{{ detail.messages.length }} 条）</h4>
        <div class="detail-messages">
          <div v-for="m in detail.messages" :key="m.id" :class="['dm-item', m.status === 2 ? 'is-hidden' : '']">
            <div class="dm-head">
              <el-tag size="small" :type="m.sender_role === 'thrower' ? 'warning' : 'primary'" effect="plain">
                {{ m.sender_role === 'thrower' ? '扔瓶人' : '捞瓶人' }} · {{ m.sender_name }} #{{ m.sender_id }}
              </el-tag>
              <el-tag v-if="m.crisis" size="small" type="danger" effect="light">危机</el-tag>
              <el-tag v-if="m.ai_flag" size="small"
                :type="m.ai_flag === 'violation' ? 'danger' : 'warning'" effect="plain">
                {{ AI_FLAG_LABEL[m.ai_flag] || m.ai_flag }}
              </el-tag>
              <el-tag v-if="m.status === 2" size="small" type="info" effect="dark">已隐藏</el-tag>
              <span class="text-sub" style="font-size: 12px; margin-left: auto">{{ fmtTime(m.created_at) }}</span>
            </div>
            <p class="dm-content">{{ m.content }}</p>
            <div class="dm-actions">
              <el-button v-if="m.status === 1" size="small" type="danger" plain @click="hideMessage(m)">隐藏消息</el-button>
              <el-button v-else size="small" type="success" plain @click="restoreMessage(m)">恢复消息</el-button>
            </div>
          </div>
          <el-empty v-if="detail.messages.length === 0" description="还没有对话消息" :image-size="70" />
        </div>
      </div>

      <template #footer>
        <div class="drawer-footer">
          <el-input v-model="note" size="small" placeholder="处置备注（可选，最多 255 字）"
            maxlength="255" style="flex: 1" />
          <el-button v-if="detail && detail.status !== 4" type="danger" :loading="acting" @click="removeBottle">
            下架瓶子
          </el-button>
          <el-button v-else-if="detail" type="success" :loading="acting" @click="restoreBottle">恢复瓶子</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { bottlesApi, AI_FLAG_LABEL, BOTTLE_STATUS_LABEL } from '../../api/bottles'
import { fmtTime } from '../../utils/format'
import { useIsMobile } from '../../utils/useIsMobile'

const isMobile = useIsMobile()
const loading = ref(false)
const acting = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const statusFilter = ref(null)
const flagFilter = ref('')
const reportedOnly = ref(false)
const stats = ref({ crisis: 0, suspect: 0, reported: 0, pending: 0 })

const detailVisible = ref(false)
const detail = ref(null)
const note = ref('')

function statusLabel(s) {
  return BOTTLE_STATUS_LABEL[s] || String(s)
}
function statusType(s) {
  return { 0: 'warning', 1: 'info', 2: 'success', 3: 'warning', 4: 'danger' }[s] || 'info'
}
function filterPending() {
  statusFilter.value = 0
  reload()
}

async function loadStats() {
  try {
    stats.value = await bottlesApi.adminStats()
  } catch {
    // 列表页错误已由拦截器提示
  }
}

async function reload() {
  page.value = 1
  await loadList()
}

async function loadList() {
  loading.value = true
  try {
    const data = await bottlesApi.adminList({
      page: page.value,
      size: pageSize,
      status: statusFilter.value,
      flag: flagFilter.value || undefined,
      reported: reportedOnly.value || undefined,
    })
    list.value = data.items
    total.value = data.total
  } finally {
    loading.value = false
  }
}

function onPageChange(p) {
  page.value = p
  loadList()
}

async function openDetail(id, focusRemove = false) {
  try {
    detail.value = await bottlesApi.adminDetail(id)
    note.value = detail.value.review_note || ''
    detailVisible.value = true
    if (focusRemove) {
      // 打开即聚焦处置区（移动端抽屉自动滚到底部）
      setTimeout(() => {
        const footer = document.querySelector('.el-drawer__footer')
        footer?.scrollIntoView({ behavior: 'smooth' })
      }, 300)
    }
  } catch {
    // ignore
  }
}

async function refreshDetail() {
  if (!detail.value) return
  detail.value = await bottlesApi.adminDetail(detail.value.id)
}

async function removeBottle() {
  try {
    await ElMessageBox.confirm('下架后双方都无法继续对话，瓶身将不可见。确定下架该瓶子？', '下架确认', {
      type: 'warning',
      confirmButtonText: '确认下架',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }
  acting.value = true
  try {
    await bottlesApi.adminRemove(detail.value.id, note.value.trim())
    ElMessage.success('瓶子已下架')
    detailVisible.value = false
    await Promise.all([loadList(), loadStats()])
  } catch {
    // ignore
  } finally {
    acting.value = false
  }
}

async function restore(row) {
  try {
    await bottlesApi.adminRestore(row.id)
    ElMessage.success('已恢复')
    await Promise.all([loadList(), loadStats()])
  } catch {
    // ignore
  }
}

async function restoreBottle() {
  acting.value = true
  try {
    await bottlesApi.adminRestore(detail.value.id, note.value.trim())
    ElMessage.success('瓶子已恢复')
    await Promise.all([refreshDetail(), loadList(), loadStats()])
  } catch {
    // ignore
  } finally {
    acting.value = false
  }
}

async function hideMessage(m) {
  try {
    await bottlesApi.adminHideMessage(m.id)
    ElMessage.success('消息已隐藏')
    await refreshDetail()
  } catch {
    // ignore
  }
}

async function restoreMessage(m) {
  try {
    await bottlesApi.adminRestoreMessage(m.id)
    ElMessage.success('消息已恢复')
    await refreshDetail()
  } catch {
    // ignore
  }
}

onMounted(() => {
  loadStats()
  loadList()
})
</script>

<style scoped>
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 16px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border-radius: 12px;
  padding: 16px 18px;
  border-left: 4px solid #909399;
}
.stat-card strong {
  display: block;
  font-size: 22px;
  line-height: 1.2;
}
.stat-card span {
  font-size: 12.5px;
  color: var(--mhop-text-sub);
}
.stat-pending { border-left-color: #3a7bd5; color: #3a7bd5; }
.stat-crisis { border-left-color: #d83a2e; color: #d83a2e; }
.stat-suspect { border-left-color: #d98a2b; color: #d98a2b; }
.stat-reported { border-left-color: #8a5cf6; color: #8a5cf6; }

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.cell-content {
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.6;
}
.row-tags {
  margin-top: 6px;
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}
.row-report {
  margin: 6px 0 0;
  font-size: 12.5px;
  color: #b06a3a;
}
.person-cell {
  font-size: 13px;
  font-weight: 600;
}
.person-id {
  font-size: 11.5px;
  color: var(--mhop-text-sub);
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.am-head {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}
.am-id {
  font-size: 12px;
  color: var(--mhop-text-sub);
}
.am-content {
  margin: 8px 0;
  line-height: 1.7;
}
.am-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
}
.am-report {
  margin: 8px 0 0;
  font-size: 12.5px;
  color: #b06a3a;
}
.am-actions {
  margin-top: 10px;
}

/* 抽屉详情 */
.detail-wrap {
  padding: 0 4px;
}
.detail-head {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.detail-bottle {
  background: #f6f3ec;
  border-radius: 12px;
  padding: 14px 16px;
}
.detail-bottle p {
  margin: 0 0 10px;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}
.detail-ai {
  margin: 0 0 12px;
  font-size: 12.5px;
  color: #b06a3a;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
.detail-people {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: var(--mhop-text-sub);
}
.report-line {
  color: #b05a3a;
}
.msg-title {
  margin: 18px 0 10px;
  font-size: 14.5px;
}
.detail-messages {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dm-item {
  border: 1px solid #ebe6dc;
  border-radius: 10px;
  padding: 10px 12px;
}
.dm-item.is-hidden {
  background: #faf8f4;
  opacity: 0.75;
}
.dm-head {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}
.dm-content {
  margin: 7px 0;
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;
}
.dm-actions {
  display: flex;
  justify-content: flex-end;
}
.drawer-footer {
  display: flex;
  gap: 10px;
  align-items: center;
}

@media (max-width: 760px) {
  .stat-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .filter-bar {
    gap: 8px;
  }
}
</style>
