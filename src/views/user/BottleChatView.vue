<template>
  <div class="chat-page">
    <!-- 顶部栏 -->
    <div class="chat-header mhop-card">
      <router-link to="/bottles" class="back-link" aria-label="返回">
        <el-icon :size="19"><ArrowLeftBold /></el-icon>
      </router-link>
      <div class="chat-title">
        <strong>匿名对话</strong>
        <span class="chat-role">{{ iAmThrower ? '我是扔瓶人，对方是捞瓶人' : '我是捞瓶人，对方是扔瓶人' }}</span>
      </div>
      <div class="header-actions">
        <el-tag v-if="detail && isActive" size="small" type="success" effect="light">对话中</el-tag>
        <el-button text type="danger" :disabled="!detail || !isActive" @click="askEnd">
          <el-icon><SwitchButton /></el-icon><span class="btn-label">结束对话</span>
        </el-button>
        <el-button text :disabled="!canReport" @click="reportDialog = true">
          <el-icon><Warning /></el-icon><span class="btn-label">举报</span>
        </el-button>
      </div>
    </div>

    <!-- 危机横幅（瓶身或任一条消息命中危机词时展示） -->
    <div v-if="crisisActive" class="crisis-banner">
      <el-icon><WarningFilled /></el-icon>
      <span>如果你正出现伤害自己的念头，请立即拨打全国心理援助热线 <strong>12356</strong>（24 小时），你不是一个人。</span>
    </div>

    <!-- 404 / 下架 / 加载 -->
    <div v-if="notFound" class="state-card mhop-card">
      <el-empty description="会话不存在或你无权查看">
        <router-link to="/bottles"><el-button round>返回心光之海</el-button></router-link>
      </el-empty>
    </div>

    <template v-else-if="detail">
      <!-- 瓶身（对话的起点） -->
      <div :class="['bottle-card', iAmThrower ? 'mine' : 'other']">
        <div class="bottle-label">
          <el-icon><Promotion /></el-icon>
          {{ iAmThrower ? '我扔出的瓶子 · 瓶身留言' : '捞到的瓶子 · 对方的瓶身留言' }}
        </div>
        <p class="bottle-content">{{ detail.content }}</p>
        <div class="bottle-meta">
          <el-tag v-if="detail.crisis" size="small" type="danger" effect="light">危机关注</el-tag>
          <span class="bubble-time">{{ fmtTime(detail.created_at) }}</span>
        </div>
      </div>

      <!-- 消息气泡区 -->
      <div ref="scrollBox" class="msg-area">
        <div v-for="m in detail.messages" :key="m.id" :class="['bubble-row', m.mine ? 'mine' : 'other']">
          <div class="bubble">
            <span class="bubble-name">{{ m.mine ? '我' : otherName }}</span>
            <p class="bubble-text">{{ m.content }}</p>
            <span v-if="m.crisis" class="bubble-crisis"><WarningFilled /> 危机表达 · 已关注</span>
            <span class="bubble-time">{{ fmtTime(m.created_at) }}</span>
          </div>
        </div>
        <div v-if="detail.messages.length === 0 && isActive" class="chat-hint">
          瓶子已被捞起。打个招呼吧，所有消息都将完全匿名。
        </div>
      </div>

      <!-- 状态条：待审核 / 漂流中 / 结束 / 下架 / 超时 -->
      <div v-if="!isActive" class="ended-strip">
        <template v-if="detail.status === 0">
          <el-icon><Promotion /></el-icon>
          瓶子正在等待 AI 安全初筛，通过后会自动漂入大海，暂时还没有人能捞到它。
        </template>
        <template v-else-if="detail.status === 1">
          <el-icon><Promotion /></el-icon>
          瓶子还在海里漂流，等待一位陌生人偶然捞起；被捞起后，这里才会变成匿名对话。
        </template>
        <template v-else-if="detail.status === 4">
          <el-icon><CircleCloseFilled /></el-icon> 该内容因违规已被下架，仅可查看此提示。
        </template>
        <template v-else-if="detail.end_reason === 1">
          <el-icon><Clock /></el-icon> 对话因连续 7 天没有新消息已自动结束，瓶子不会重新漂流。
        </template>
        <template v-else>
          <el-icon><CircleCheckFilled /></el-icon>
          {{ detail.ended_by_me ? '你已结束这段对话' : '对方已结束这段对话' }}，内容仅可查看。
        </template>
      </div>

      <!-- 输入区 -->
      <div v-if="isActive" class="composer mhop-card">
        <el-input v-model="draft" type="textarea" :rows="2" maxlength="1000" show-word-limit resize="none"
          placeholder="说点什么…（Enter 发送，Shift+Enter 换行）" @keydown.enter.exact.prevent="onSend" />
        <el-button type="primary" round :loading="sending" :disabled="!draft.trim()" @click="onSend">
          <el-icon><Promotion /></el-icon> 发送
        </el-button>
      </div>
    </template>

    <div v-else class="state-card mhop-card" v-loading="loading" style="min-height: 320px"></div>

    <!-- 结束确认 -->
    <el-dialog v-model="endDialog" title="结束这段匿名对话？" width="420px">
      <p class="dialog-text">
        结束后双方都只能查看历史内容、不能再发消息，瓶子也不会重新漂回海里。此操作无法撤销。
      </p>
      <template #footer>
        <el-button @click="endDialog = false">再想想</el-button>
        <el-button type="danger" :loading="ending" @click="confirmEnd">确认结束</el-button>
      </template>
    </el-dialog>

    <!-- 举报弹窗 -->
    <el-dialog v-model="reportDialog" title="举报这个瓶子" width="460px">
      <p class="dialog-text text-sub">
        审核员会看到瓶身与全部对话记录。同一账号对同瓶仅计一次举报，举报不会暴露你的身份。
      </p>
      <el-input v-model="reportReason" type="textarea" :rows="4" maxlength="200" show-word-limit resize="none"
        placeholder="请简述举报原因，如：骚扰、色情、诈骗、引战、其他危险信息…" />
      <template #footer>
        <el-button @click="reportDialog = false">取消</el-button>
        <el-button type="warning" :loading="reporting" @click="confirmReport">提交举报</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { bottlesApi, BOTTLE_STATUS } from '../../api/bottles'
import { useBottleStore } from '../../stores/bottles'
import { fmtTime } from '../../utils/format'

const route = useRoute()
const store = useBottleStore()
const bottleId = Number(route.params.id)

const detail = ref(null)
const loading = ref(false)
const notFound = ref(false)
const draft = ref('')
const sending = ref(false)
const ending = ref(false)
const endDialog = ref(false)
const reportDialog = ref(false)
const reportReason = ref('')
const reporting = ref(false)
const scrollBox = ref(null)
let pollTimer = null

const iAmThrower = computed(() => detail.value?.role === 'thrower')
const otherName = computed(() => (iAmThrower.value ? '捞瓶人' : '扔瓶人'))
const isActive = computed(() => detail.value?.status === BOTTLE_STATUS.PICKED)
// 审核中 / 漂流中的瓶子还没有对话对方，不提供举报（后端也会以 409 拒绝）
const canReport = computed(() =>
  Boolean(detail.value) && detail.value.status !== BOTTLE_STATUS.PENDING
  && detail.value.status !== BOTTLE_STATUS.DRIFTING
  && detail.value.status !== BOTTLE_STATUS.REMOVED
)
// 瓶身或任意可见消息命中危机词，即展示热线横幅
const crisisActive = computed(() =>
  Boolean(detail.value?.crisis || detail.value?.messages?.some((m) => m.crisis))
)

async function loadDetail(markRead) {
  try {
    const data = await bottlesApi.detail(bottleId, { afterId: 0, markRead })
    detail.value = data
    notFound.value = false
    await scrollToBottom()
  } catch (e) {
    if (e.response?.status === 404) notFound.value = true
  }
}

async function poll() {
  if (!detail.value || !isActive.value) {
    // 非活动态也轻量轮询一次状态（极端情况下对端刚结束），但不再拉消息
    if (detail.value) await syncStateOnly()
    return
  }
  const lastId = Math.max(0, ...detail.value.messages.map((m) => m.id))
  try {
    const data = await bottlesApi.detail(bottleId, { afterId: lastId, markRead: true })
    mergeDetail(data)
    if (data.messages.length > 0) await scrollToBottom()
  } catch {
    // 静默：轮询失败等下一轮
  }
}

async function syncStateOnly() {
  try {
    const data = await bottlesApi.detail(bottleId, { afterId: 1 << 30, markRead: false })
    mergeDetail(data)
  } catch {
    // ignore
  }
}

function mergeDetail(data) {
  if (!detail.value) {
    detail.value = data
    return
  }
  const known = new Set(detail.value.messages.map((m) => m.id))
  const merged = detail.value.messages.concat(data.messages.filter((m) => !known.has(m.id)))
  detail.value = { ...data, messages: merged }
}

async function scrollToBottom() {
  await nextTick()
  const box = scrollBox.value
  if (box) box.scrollTop = box.scrollHeight
}

async function onSend() {
  const content = draft.value.trim()
  if (!content || sending.value) return
  sending.value = true
  try {
    const msg = await bottlesApi.sendMessage(bottleId, content)
    detail.value.messages.push(msg)
    detail.value.last_message_at = msg.created_at
    draft.value = ''
    await scrollToBottom()
    store.refresh(true)
  } catch {
    // 429/422 等提示由拦截器弹出
  } finally {
    sending.value = false
  }
}

function askEnd() {
  endDialog.value = true
}

async function confirmEnd() {
  ending.value = true
  try {
    await bottlesApi.endConversation(bottleId)
    ElMessage.success('对话已结束')
    endDialog.value = false
    detail.value = { ...detail.value, status: BOTTLE_STATUS.ENDED, end_reason: 0, ended_by_me: true }
    store.refresh(true)
  } catch {
    // ignore
  } finally {
    ending.value = false
  }
}

async function confirmReport() {
  reporting.value = true
  try {
    await bottlesApi.report(bottleId, reportReason.value.trim())
    ElMessage.success('举报已提交，审核员会尽快处理')
    reportDialog.value = false
    reportReason.value = ''
  } catch {
    // ignore
  } finally {
    reporting.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await loadDetail(true)
  } finally {
    loading.value = false
    pollTimer = window.setInterval(poll, 5000)
  }
})

onUnmounted(() => {
  if (pollTimer) window.clearInterval(pollTimer)
  // 离开后刷新导航角标
  store.refresh(true)
})
</script>

<style scoped>
.chat-page {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 顶部栏 */
.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
}
.back-link {
  color: var(--mhop-text-sub);
  display: inline-flex;
  padding: 4px;
}
.chat-title {
  display: flex;
  flex-direction: column;
}
.chat-title strong {
  font-size: 16px;
}
.chat-role {
  font-size: 12px;
  color: var(--mhop-text-sub);
}
.header-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 危机横幅 */
.crisis-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fdecea;
  color: #b83227;
  border: 1px solid #f5c6c0;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 13px;
  line-height: 1.6;
}
.crisis-banner strong {
  font-size: 15px;
}

/* 瓶身 */
.bottle-card {
  border-radius: 14px;
  padding: 14px 16px;
  max-width: 82%;
  position: relative;
}
.bottle-card.mine {
  align-self: flex-end;
  background: linear-gradient(135deg, #d7efe9, #c5e6de);
  color: #1d5b50;
}
.bottle-card.other {
  align-self: flex-start;
  background: #fff;
  border: 1px solid #e7e2d8;
}
.bottle-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  opacity: 0.75;
  margin-bottom: 6px;
}
.bottle-content {
  margin: 0 0 8px;
  font-size: 14.5px;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}
.bottle-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 消息区 */
.msg-area {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 280px;
  max-height: 46vh;
  overflow-y: auto;
  padding: 6px 4px;
}
.bubble-row {
  display: flex;
}
.bubble-row.mine {
  justify-content: flex-end;
}
.bubble {
  max-width: 78%;
  border-radius: 14px;
  padding: 9px 13px 6px;
  position: relative;
}
.bubble-row.other .bubble {
  background: #fff;
  border: 1px solid #e7e2d8;
  border-top-left-radius: 4px;
}
.bubble-row.mine .bubble {
  background: linear-gradient(135deg, #3aa79a, #2f8f83);
  color: #fff;
  border-top-right-radius: 4px;
}
.bubble-name {
  display: block;
  font-size: 11.5px;
  opacity: 0.72;
  margin-bottom: 2px;
}
.bubble-text {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;
}
.bubble-crisis {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-top: 5px;
  font-size: 11.5px;
  color: #c05a4b;
  background: rgba(226, 109, 90, 0.12);
  border-radius: 6px;
  padding: 1px 7px;
}
.bubble-row.mine .bubble-crisis {
  color: #ffe2dc;
  background: rgba(255, 255, 255, 0.18);
}
.bubble-time {
  display: block;
  margin-top: 3px;
  font-size: 11px;
  opacity: 0.6;
  text-align: right;
}
.chat-hint {
  text-align: center;
  color: var(--mhop-text-sub);
  font-size: 13px;
  padding: 30px 0;
}

/* 结束条 */
.ended-strip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #f6f3ec;
  color: var(--mhop-text-sub);
  border: 1px dashed #d9d2c3;
  border-radius: 12px;
  padding: 12px;
  font-size: 13px;
  text-align: center;
}

/* 输入区 */
.composer {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 12px 14px;
  position: sticky;
  bottom: 10px;
}
.composer .el-button {
  flex-shrink: 0;
}

.state-card {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
}
.dialog-text {
  font-size: 14px;
  line-height: 1.8;
  color: var(--mhop-text);
  margin: 0 0 12px;
}

@media (max-width: 760px) {
  .chat-page {
    margin-top: 10px;
    gap: 10px;
  }
  .chat-header {
    padding: 10px 12px;
    gap: 8px;
  }
  .chat-role {
    display: none;
  }
  .header-actions {
    gap: 0;
  }
  .bottle-card,
  .bubble {
    max-width: 88%;
  }
  .msg-area {
    max-height: 48vh;
  }
  .composer {
    padding: 10px;
    bottom: 6px;
  }
}

/* 390px 级窄屏：顶栏操作按钮仅保留图标，避免挤压换行 */
@media (max-width: 420px) {
  .header-actions .btn-label {
    display: none;
  }
  .header-actions .el-button {
    padding: 6px;
  }
}
</style>
