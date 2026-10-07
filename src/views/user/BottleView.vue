<template>
  <div class="bottle-page">
    <!-- 海洋场景 -->
    <section class="sea-card">
      <div class="wave wave-1"></div>
      <div class="wave wave-2"></div>
      <div class="sea-inner">
        <div class="sea-head">
          <h1><el-icon><Promotion /></el-icon> 心光之海</h1>
          <p class="sea-sub">
            把此刻的心事封进瓶子投入大海，它会被一位陌生人偶然捞起。
            <br />没有头像、没有昵称，只有一段可以持续的匿名对话。
          </p>
        </div>

        <div class="sea-stats">
          <div class="sea-stat">
            <strong>{{ store.seaCount }}</strong>
            <span>个瓶子正在漂流</span>
          </div>
          <div class="sea-stat">
            <strong>{{ store.thrownToday }}/{{ store.throwLimit }}</strong>
            <span>今日已扔</span>
          </div>
          <div class="sea-stat">
            <strong>{{ store.pickedToday }}/{{ store.pickLimit }}</strong>
            <span>今日已捞</span>
          </div>
        </div>

        <div class="sea-actions">
          <el-button type="primary" size="large" round :disabled="store.throwRemaining <= 0"
            :loading="throwing" @click="openThrow">
            <el-icon><Promotion /></el-icon> 扔一个瓶子
          </el-button>
          <el-button size="large" round plain class="pick-btn" :loading="picking"
            @click="onPick">
            <el-icon><Search /></el-icon> 捞一个瓶子
          </el-button>
        </div>
        <p v-if="store.throwRemaining <= 0" class="quota-tip">今天的瓶子已经扔完啦，明天（UTC 0 点）再来吧</p>
      </div>
    </section>

    <!-- 我的会话 -->
    <section class="mine-section">
      <div class="section-head">
        <h2><el-icon><ChatDotRound /></el-icon> 我的瓶子</h2>
        <el-button text @click="loadData">
          <el-icon><Refresh /></el-icon> 刷新
        </el-button>
      </div>

      <div v-loading="loading" class="conv-list">
        <div v-for="b in store.items" :key="b.id" class="conv-item mhop-card" @click="openChat(b.id)">
          <div class="conv-top">
            <el-tag size="small" :type="b.role === 'thrower' ? 'warning' : 'primary'" effect="light">
              {{ b.role === 'thrower' ? '我扔的' : '我捞的' }}
            </el-tag>
            <el-tag size="small" :type="statusTag(b.status)" effect="plain">{{ statusText(b) }}</el-tag>
            <el-tag v-if="b.crisis" size="small" type="danger" effect="light">危机关注</el-tag>
            <span v-if="b.unread > 0" class="unread-dot">{{ b.unread > 99 ? '99+' : b.unread }}</span>
            <span class="conv-time">{{ fromNow(b.last_message_at) }}</span>
          </div>
          <p class="conv-preview">{{ b.preview }}</p>
          <p class="conv-last">
            <el-icon><ChatLineRound /></el-icon>
            {{ b.message_count > 0 ? b.last_message : '还没有消息，等待对方开口吧' }}
          </p>
        </div>
        <el-empty v-if="!loading && store.items.length === 0" description="还没有瓶子，扔出第一个，或去海里碰碰运气" />
      </div>
    </section>

    <!-- 玩法说明 -->
    <section class="rules mhop-card">
      <h3><el-icon><InfoFilled /></el-icon> 玩法说明</h3>
      <ul>
        <li>全程匿名：双方都看不到对方的账号、昵称与头像。</li>
        <li>瓶子被一人捞起后进入持续对话，任一方都可以随时结束；结束后内容仅可查看，瓶子不会再漂回海里。</li>
        <li>对话连续 7 天没有新消息将自动结束。</li>
        <li>每个自然日（UTC）最多扔 3 个瓶子、捞 10 个瓶子；发消息不超过 20 条/分钟。</li>
        <li>瓶身与消息都会经过关键词检测与 AI 安全初筛，违规内容将被人工处置；遇到不适内容请使用会话内举报。</li>
        <li>若你或对方正处于强烈的自伤/危机念头中，请立即拨打全国心理援助热线 <strong>12356</strong>。</li>
      </ul>
    </section>

    <!-- 扔瓶子弹窗 -->
    <el-dialog v-model="throwDialog" title="扔一个漂流瓶" width="520px" :close-on-click-modal="false">
      <el-input v-model="draft" type="textarea" :rows="6" maxlength="500" show-word-limit resize="none"
        placeholder="写下你此刻想说的话（1-500 字）。它会被一位陌生人捞起，也许会收到一个温柔的回应。" />
      <div class="throw-tip">
        <el-icon><InfoFilled /></el-icon>
        内容仅支持纯文字；请勿留下联系方式或个人隐私信息。
      </div>
      <template #footer>
        <el-button @click="throwDialog = false">取消</el-button>
        <el-button type="primary" :loading="throwing" @click="onThrow">扔进大海</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { bottlesApi, BOTTLE_STATUS } from '../../api/bottles'
import { useBottleStore } from '../../stores/bottles'
import { useAuthStore } from '../../stores/auth'
import { fromNow } from '../../utils/format'

const router = useRouter()
const store = useBottleStore()
const auth = useAuthStore()
const loading = ref(false)
const throwing = ref(false)
const picking = ref(false)
const throwDialog = ref(false)
const draft = ref('')

async function loadData() {
  loading.value = true
  try {
    await store.refresh(false)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

// 漂流瓶写操作（投瓶 / 捞瓶 / 发消息）要求邮箱已验证，与后端门槛一致
async function ensureEmailVerified(action) {
  if (!auth.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return false
  }
  if (!auth.user?.email_verified) {
    try {
      await ElMessageBox.confirm(
        `${action}前需要先完成邮箱验证码验证（在个人主页绑定邮箱并填入验证码），现在去验证？`,
        `${action}前请先完成邮箱验证`,
        { confirmButtonText: '去验证', cancelButtonText: '取消', type: 'warning' }
      )
      router.push('/profile')
    } catch { /* 用户取消 */ }
    return false
  }
  return true
}

async function openThrow() {
  if (!await ensureEmailVerified('投瓶')) return
  throwDialog.value = true
}

async function onThrow() {
  const content = draft.value.trim()
  if (content.length === 0) {
    ElMessage.warning('先写点什么再扔出去吧')
    return
  }
  throwing.value = true
  try {
    const data = await bottlesApi.throwBottle(content)
    ElMessage.success('已提交，AI 审核通过后将漂入大海')
    throwDialog.value = false
    draft.value = ''
    store.bumpThrown()
    await store.refresh(false)
    // AI 审核在后台异步完成，稍后再拉一次，让「审核中」自动变为「漂流中」
    setTimeout(() => { store.refresh(false) }, 4000)
    if (data.crisis) {
      ElMessageBox.alert(
        '你写下的内容里出现了与危机相关的表达。我们很担心你。\n如果你正处于伤害自己的危险念头中，请立即拨打全国心理援助热线 12356，或联系身边可信任的人陪伴你。',
        '请优先照顾好自己',
        { type: 'warning', confirmButtonText: '我知道了' }
      ).catch(() => {})
    }
  } catch {
    // 错误提示由拦截器统一给出
  } finally {
    throwing.value = false
  }
}

async function onPick() {
  if (!await ensureEmailVerified('捞瓶')) return
  if (store.pickRemaining <= 0) {
    ElMessage.warning('今天已经捞了足够多瓶子，明天再来吧')
    return
  }
  picking.value = true
  try {
    const data = await bottlesApi.pickBottle()
    store.bumpPicked()
    ElMessage.success('捞到了一个瓶子！')
    router.push(`/bottles/${data.id}`)
  } catch {
    // 409「海里暂时没有瓶子」等提示已由拦截器弹出
  } finally {
    picking.value = false
  }
}

function openChat(id) {
  router.push(`/bottles/${id}`)
}

function statusTag(status) {
  switch (status) {
    case BOTTLE_STATUS.PENDING: return 'warning'
    case BOTTLE_STATUS.DRIFTING: return 'info'
    case BOTTLE_STATUS.PICKED: return 'success'
    case BOTTLE_STATUS.ENDED: return 'warning'
    case BOTTLE_STATUS.REMOVED: return 'danger'
    default: return 'info'
  }
}

function statusText(b) {
  if (b.status === BOTTLE_STATUS.ENDED) {
    return b.end_reason === 1 ? '已结束（超时）' : '对话已结束'
  }
  if (b.status === BOTTLE_STATUS.REMOVED) return '已下架'
  if (b.status === BOTTLE_STATUS.PENDING) return 'AI 审核中'
  if (b.status === BOTTLE_STATUS.PICKED) return '对话中'
  return '漂流中'
}
</script>

<style scoped>
.bottle-page {
  margin-top: 22px;
}

/* 海洋场景卡 */
.sea-card {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  background: linear-gradient(180deg, #9fd6e8 0%, #5aa9c9 46%, #357fa6 100%);
  color: #fff;
  box-shadow: 0 10px 28px rgba(53, 127, 166, 0.28);
}
.sea-inner {
  position: relative;
  z-index: 2;
  padding: 38px 32px 30px;
  text-align: center;
}
.sea-head h1 {
  margin: 0 0 10px;
  font-size: 27px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.sea-sub {
  margin: 0 auto;
  max-width: 560px;
  font-size: 14px;
  line-height: 1.9;
  color: rgba(255, 255, 255, 0.92);
}
.sea-stats {
  display: flex;
  justify-content: center;
  gap: 14px;
  margin: 22px 0;
  flex-wrap: wrap;
}
.sea-stat {
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 14px;
  padding: 10px 22px;
  min-width: 118px;
  backdrop-filter: blur(4px);
}
.sea-stat strong {
  display: block;
  font-size: 22px;
  line-height: 1.3;
}
.sea-stat span {
  font-size: 12.5px;
  color: rgba(255, 255, 255, 0.88);
}
.sea-actions {
  display: flex;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
}
.sea-actions .el-button {
  padding: 12px 26px;
  font-size: 15px;
}
.pick-btn {
  background: rgba(255, 255, 255, 0.92);
  border-color: transparent;
  color: #2a6e94;
}
.quota-tip {
  margin: 14px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
}

/* 波浪装饰 */
.wave {
  position: absolute;
  left: -50%;
  bottom: -34px;
  width: 200%;
  height: 90px;
  border-radius: 46%;
  z-index: 1;
}
.wave-1 {
  background: rgba(255, 255, 255, 0.13);
  animation: wave-move 12s linear infinite;
}
.wave-2 {
  bottom: -44px;
  background: rgba(255, 255, 255, 0.09);
  animation: wave-move 18s linear infinite reverse;
}
@keyframes wave-move {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 会话列表 */
.mine-section {
  margin-top: 28px;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.section-head h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 19px;
  margin: 0;
}
.conv-item {
  padding: 14px 18px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.1s;
}
.conv-item:hover {
  box-shadow: 0 6px 18px rgba(38, 58, 55, 0.1);
  transform: translateY(-1px);
}
.conv-top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.conv-time {
  margin-left: auto;
  font-size: 12.5px;
  color: var(--mhop-text-sub);
}
.unread-dot {
  background: #e26d5a;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  min-width: 19px;
  height: 19px;
  line-height: 19px;
  text-align: center;
  padding: 0 5px;
  border-radius: 10px;
}
.conv-preview {
  margin: 9px 0 4px;
  font-weight: 600;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.conv-last {
  margin: 0;
  font-size: 13px;
  color: var(--mhop-text-sub);
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 玩法说明 */
.rules {
  margin-top: 26px;
  padding: 18px 22px;
}
.rules h3 {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0 0 10px;
  font-size: 15.5px;
}
.rules ul {
  margin: 0;
  padding-left: 20px;
  color: var(--mhop-text-sub);
  font-size: 13.5px;
  line-height: 2;
}
.throw-tip {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  color: var(--mhop-text-sub);
}

@media (max-width: 760px) {
  .sea-inner {
    padding: 28px 18px 24px;
  }
  .sea-head h1 {
    font-size: 23px;
  }
  .sea-sub {
    font-size: 13.5px;
  }
  .sea-stat {
    min-width: 96px;
    padding: 8px 14px;
  }
  .sea-actions .el-button {
    padding: 11px 20px;
  }
  .conv-item {
    padding: 13px 14px;
  }
}
</style>
