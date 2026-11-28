<template>
  <div>
    <!-- 公告条（公开，无需登录） -->
    <section v-if="announcements.length" class="announce-bar mhop-card">
      <div class="announce-inner" @click="openDetail">
        <span class="announce-icon"><el-icon><Bell /></el-icon></span>
        <span class="announce-title">{{ announcements[current].title }}</span>
        <span class="announce-more">查看详情</span>
      </div>
      <div v-if="announcements.length > 1" class="announce-nav">
        <el-button text size="small" @click.stop="prevAnnouncement"><el-icon><ArrowLeft /></el-icon></el-button>
        <span class="announce-count">{{ current + 1 }}/{{ announcements.length }}</span>
        <el-button text size="small" @click.stop="nextAnnouncement"><el-icon><ArrowRight /></el-icon></el-button>
      </div>
    </section>

    <!-- 主视觉 -->
    <section class="hero mhop-card">
      <div class="hero-text">
        <div class="hero-badge">
          <AiAvatar :size="20" /> 全国性 · 匿名优先 · 免费公益
        </div>
        <h1>在这里，你不必独自承受</h1>
        <p class="hero-sub">
          当情绪有重量，说出来就是改变的开始。小心光 7×24 小时温柔回应你，
          社区里有相似经历的人彼此陪伴，专业援助热线始终为你待命。
        </p>
        <div class="hero-actions">
          <template v-if="auth.isLoggedIn">
            <router-link to="/forum"><el-button type="primary" size="large" round><el-icon><EditPen /></el-icon>我想倾诉</el-button></router-link>
            <router-link to="/assessment"><el-button size="large" round plain><el-icon><DataAnalysis /></el-icon>做一次心理评估</el-button></router-link>
          </template>
          <template v-else>
            <router-link to="/register"><el-button type="primary" size="large" round><el-icon><EditPen /></el-icon>注册</el-button></router-link>
            <router-link to="/login"><el-button size="large" round plain><el-icon><User /></el-icon>登录</el-button></router-link>
          </template>
        </div>
        <div class="hero-tips">
          <span><el-icon><Lock /></el-icon> 匿名发布，保护隐私</span>
          <span><el-icon><ChatDotRound /></el-icon> AI 秒级回应</span>
          <span><el-icon><PhoneFilled /></el-icon> 危机一键转热线</span>
        </div>
      </div>
      <div class="hero-illu">
          <BrandMark :size="170" />
        </div>
    </section>

    <!-- 情绪入口（登录后可见） -->
    <section v-if="auth.isLoggedIn" class="mood-section">
      <div class="section-head">
        <h2><el-icon><Sunny /></el-icon> 此刻你最接近哪种感受？</h2>
        <span class="text-sub">点一下，带你去更合适的地方</span>
      </div>
      <div class="mood-entry-grid">
        <router-link
          v-for="m in MOOD_ENTRIES"
          :key="m.key"
          :to="m.to"
          class="mood-entry mhop-card"
          :style="{ borderColor: m.color + '55' }"
        >
          <span class="mood-entry-emoji">{{ m.emoji }}</span>
          <strong :style="{ color: m.color }">{{ m.label }}</strong>
          <small class="text-sub">{{ m.hint }}</small>
        </router-link>
      </div>
    </section>

    <!-- 随手就能用（登录后可见） -->
    <section v-if="auth.isLoggedIn" class="tools-section">
      <div class="section-head">
        <h2><el-icon><Lightning /></el-icon> 随手就能用</h2>
        <span class="text-sub">不用想，点一下就开始</span>
      </div>
      <div class="tool-row">
        <router-link v-for="t in QUICK_TOOLS" :key="t.label" :to="t.to" class="tool-item mhop-card">
          <span class="tool-emoji">{{ t.emoji }}</span>
          <span class="tool-text">
            <strong>{{ t.label }}</strong>
            <small class="text-sub">{{ t.desc }}</small>
          </span>
        </router-link>
      </div>
    </section>

    <!-- 更多功能（登录后可见） -->
    <section v-if="auth.isLoggedIn" class="feature-grid">
      <router-link to="/companion" class="feature-card mhop-card">
        <span class="feature-icon" style="background: var(--mhop-link-light); color: var(--mhop-link)"><el-icon :size="26"><ChatLineSquare /></el-icon></span>
        <h3>互助论坛</h3>
        <p class="text-sub">按感受选择板块，匿名说出困扰，AI 即时回应，社区温暖陪伴。</p>
      </router-link>
      <router-link to="/bottles" class="feature-card mhop-card">
        <span class="feature-icon" style="background: var(--mhop-ocean-light); color: var(--mhop-ocean)"><el-icon :size="26"><Promotion /></el-icon></span>
        <h3>漂流瓶</h3>
        <p class="text-sub">把心事封进瓶子投入大海，被一位陌生人捞起后，开始一段匿名的持续对话。</p>
      </router-link>
      <router-link to="/assessment" class="feature-card mhop-card">
        <span class="feature-icon" style="background: var(--mhop-violet-light); color: var(--mhop-violet)"><el-icon :size="26"><DocumentChecked /></el-icon></span>
        <h3>心理测评</h3>
        <p class="text-sub">DASS-21 与 PANAS 标准量表（抑郁 / 焦虑 / 压力 / 正负情绪）+ 自由倾诉，生成个性化解读。</p>
      </router-link>
      <router-link to="/regulate" class="feature-card mhop-card">
        <span class="feature-icon" style="background: var(--mhop-teal-light); color: var(--mhop-teal-dark)"><el-icon :size="26"><WindPower /></el-icon></span>
        <h3>情绪调节</h3>
        <p class="text-sub">4-4-6 呼吸练习与 5-4-3-2-1 接地练习，情绪上头时先让身体慢下来。</p>
      </router-link>
      <router-link to="/journal" class="feature-card mhop-card">
        <span class="feature-icon" style="background: var(--mhop-amber-light); color: var(--mhop-amber)"><el-icon :size="26"><Notebook /></el-icon></span>
        <h3>情绪记录</h3>
        <p class="text-sub">每天一分钟记下心情，只保存在本机，慢慢看见自己的情绪轨迹。</p>
      </router-link>
      <router-link to="/rescue" class="feature-card mhop-card">
        <span class="feature-icon" style="background: #fdecea; color: #d83a2e"><el-icon :size="26"><PhoneFilled /></el-icon></span>
        <h3>紧急求助</h3>
        <p class="text-sub">全国心理援助热线 12356、危机干预 010-82951332，生命优先，时刻在线。</p>
      </router-link>
    </section>

    <!-- 最新倾诉（登录后可见） -->
    <section v-if="auth.isLoggedIn" style="margin-top: 26px">
      <div class="section-head">
        <h2><el-icon><ChatDotSquare /></el-icon> 最新倾诉</h2>
        <router-link to="/forum" class="text-sub">进入论坛 →</router-link>
      </div>
      <div v-loading="loading">
        <div v-for="p in posts" :key="p.id" class="post-item mhop-card" @click="$router.push(`/forum/${p.id}`)">
          <div class="post-meta">
            <span class="board-chip" :style="chipStyle(p.board)">{{ boardOf(p.board).name }}</span>
            <el-tag size="small" :type="p.is_anonymous ? 'info' : 'success'" effect="plain">
              {{ p.is_anonymous ? '匿名朋友' : p.author }}
            </el-tag>
            <el-tag v-if="p.crisis" size="small" type="danger" effect="light">危机关注</el-tag>
            <el-tag v-if="p.ai_replied" size="small" type="success" effect="light">AI 已回应</el-tag>
            <span class="text-sub time-tag" style="margin-left: auto; font-size: 12.5px">{{ fromNow(p.created_at) }}</span>
          </div>
          <p class="post-content">{{ p.content }}</p>
          <div class="text-sub" style="font-size: 13px">
            <el-icon><ChatLineRound /></el-icon> {{ p.reply_count }} 条回应
          </div>
        </div>
        <el-empty v-if="!loading && posts.length === 0" description="还没有帖子，来发出第一份倾诉吧" />
      </div>
    </section>

    <!-- 公告详情弹窗 -->
    <el-dialog v-model="detailVisible" :title="announcements[current]?.title" width="560px" align-center>
      <p class="announce-detail">{{ announcements[current]?.content }}</p>
      <template #footer>
        <el-button type="primary" @click="detailVisible = false">知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import http from '../../api'
import { listAnnouncements } from '../../api/announcements'
import { fromNow } from '../../utils/format'
import { boardOf } from '../../utils/boards'
import { useAuthStore } from '../../stores/auth'
import BrandMark from '../../components/BrandMark.vue'
import AiAvatar from '../../components/AiAvatar.vue'

const auth = useAuthStore()
const posts = ref([])
const loading = ref(false)

// 情绪分类入口（心晴式「此刻你最接近哪种感受」）
const MOOD_ENTRIES = [
  { key: 'low', emoji: '😔', label: '低落·空虚', hint: '去情绪树洞说说', color: '#6a7bb0', to: { path: '/forum', query: { board: 'mood' } } },
  { key: 'anxious', emoji: '😰', label: '焦虑·紧张', hint: '先做一次呼吸', color: '#e8933c', to: '/regulate' },
  { key: 'angry', emoji: '😤', label: '愤怒·烦躁', hint: '跟着呼吸慢下来', color: '#d6668f', to: '/regulate' },
  { key: 'tired', emoji: '😴', label: '疲惫·失眠', hint: '看看睡眠板块', color: '#6a6fd0', to: { path: '/forum', query: { board: 'sleep' } } },
  { key: 'numb', emoji: '😶', label: '麻木·解离', hint: '做一次接地练习', color: '#8a8f99', to: '/regulate' },
  { key: 'crisis', emoji: '🆘', label: '想消失', hint: '立刻查看援助热线', color: '#d83a2e', to: '/rescue' },
]

const QUICK_TOOLS = [
  { emoji: '🌬️', label: '呼吸', desc: '30 秒平静', to: '/regulate' },
  { emoji: '📖', label: '记录', desc: '写下此刻心情', to: '/journal' },
  { emoji: '🧠', label: '测评', desc: '了解自己的状态', to: '/assessment' },
  { emoji: '🤝', label: '陪伴', desc: '匿名说一说', to: '/companion' },
  { emoji: '🆘', label: '求助', desc: '24 小时热线', to: '/rescue' },
]

// 公告（公开，无需登录）
const announcements = ref([])
const current = ref(0)
const detailVisible = ref(false)

function prevAnnouncement() {
  current.value = (current.value - 1 + announcements.value.length) % announcements.value.length
}
function nextAnnouncement() {
  current.value = (current.value + 1) % announcements.value.length
}
function openDetail() {
  detailVisible.value = true
}
async function loadAnnouncements() {
  try {
    announcements.value = await listAnnouncements()
  } catch (e) {
    // 公告加载失败不影响首页其余内容
  }
}

function chipStyle(slug) {
  const b = boardOf(slug || 'mood')
  return {
    background: `${b.color}1a`,
    color: b.color,
    border: `1px solid ${b.color}55`,
  }
}

onMounted(async () => {
  loadAnnouncements()
  if (!auth.isLoggedIn) return
  loading.value = true
  try {
    const data = await http.get('/forum/posts', { params: { page: 1, size: 5 } })
    posts.value = data.items
  } finally {
    loading.value = false
  }
})


</script>

<style scoped>
.announce-bar {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  background: linear-gradient(90deg, #fff7e6 0%, #ffffff 100%);
  border-left: 3px solid var(--mhop-link);
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.announce-bar:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
.announce-inner {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}
.announce-icon {
  color: var(--mhop-link);
  display: inline-flex;
  flex-shrink: 0;
}
.announce-title {
  font-weight: 600;
  font-size: 14.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.announce-more {
  color: var(--mhop-link);
  font-size: 13px;
  margin-left: 4px;
  flex-shrink: 0;
}
.announce-nav {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  margin-left: 12px;
}
.announce-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  min-width: 34px;
  text-align: center;
}
.announce-detail {
  white-space: pre-wrap;
  line-height: 1.9;
  font-size: 14.5px;
  color: var(--el-text-color-primary);
  margin: 0;
}
.hero {
  margin-top: 22px;
  padding: 44px 48px;
  background: linear-gradient(120deg, #ffffff 0%, #edf2f8 100%);
  display: flex;
  align-items: center;
  gap: 30px;
  overflow: hidden;
}
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--mhop-link-light);
  color: var(--mhop-link-dark);
  font-size: 13px;
  padding: 5px 14px;
  border-radius: 999px;
  margin-bottom: 16px;
}
.hero h1 {
  font-size: 34px;
  margin: 0 0 14px;
  letter-spacing: 1px;
}
.hero-sub {
  color: var(--mhop-text-sub);
  font-size: 15.5px;
  line-height: 1.9;
  max-width: 620px;
}
.hero-actions {
  display: flex;
  gap: 14px;
  margin: 24px 0 18px;
}
.hero-actions .el-icon {
  margin-right: 4px;
}
.hero-tips {
  display: flex;
  gap: 22px;
  color: var(--mhop-text-sub);
  font-size: 13.5px;
}
.hero-tips span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.hero-illu {
  margin-left: auto;
  color: #d6dee8;
  animation: floaty 4s ease-in-out infinite;
}
@keyframes floaty {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
.mood-section,
.tools-section {
  margin-top: 26px;
}
.mood-entry-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
}
.mood-entry {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 15px 8px;
  text-align: center;
  border: 1px solid transparent;
  transition: transform 0.15s, box-shadow 0.15s;
}
.mood-entry:hover {
  transform: translateY(-2px);
  box-shadow: var(--mhop-shadow-hover);
}
.mood-entry-emoji {
  font-size: 26px;
  line-height: 1;
}
.mood-entry strong {
  font-size: 13.5px;
}
.mood-entry small {
  font-size: 11.5px;
  line-height: 1.5;
}
.tool-row {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
}
.tool-item {
  flex: 1 0 150px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  transition: transform 0.15s, box-shadow 0.15s;
}
.tool-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--mhop-shadow-hover);
}
.tool-emoji {
  font-size: 24px;
  line-height: 1;
}
.tool-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
}
.tool-text strong {
  font-size: 14px;
}
.tool-text small {
  font-size: 11.5px;
}
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(215px, 1fr));
  gap: 18px;
  margin-top: 22px;
}
.feature-card {
  display: block;
  padding: 24px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.feature-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--mhop-shadow-hover);
}
.feature-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}
.feature-card h3 {
  margin: 0 0 8px;
  font-size: 17px;
}
.feature-card p {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.75;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 14px;
}
.section-head h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 19px;
  margin: 0;
}
.post-item {
  padding: 16px 20px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: box-shadow 0.15s;
}
.post-item:hover {
  box-shadow: var(--mhop-shadow-hover);
}
.post-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.post-meta .time-tag {
  margin-left: auto;
}
.board-chip {
  font-size: 12px;
  padding: 1px 9px;
  border-radius: 999px;
  font-weight: 600;
}
.post-content {
  margin: 10px 0;
  line-height: 1.75;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
@media (max-width: 980px) {
  .mood-entry-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 760px) {
  .mood-entry-grid {
    gap: 8px;
  }
  .mood-entry {
    padding: 12px 4px;
  }
  .mood-entry small {
    display: none;
  }
  .mood-section,
  .tools-section {
    margin-top: 20px;
  }
  .hero {
    flex-direction: column-reverse;
    padding: 26px 20px;
  }
  .hero-illu {
    margin: 0;
  }
  .hero-illu .el-icon {
    font-size: 96px !important;
  }
  .hero h1 {
    font-size: 25px;
    letter-spacing: 0;
  }
  .hero-sub {
    font-size: 14px;
  }
  .hero-actions {
    flex-wrap: wrap;
  }
  .hero-actions .el-button {
    margin-left: 0 !important;
  }
  .feature-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .hero-tips {
    flex-wrap: wrap;
    gap: 10px;
  }
  .post-item {
    padding: 14px 15px;
  }
  .post-meta .time-tag {
    margin-left: 0;
  }
  .feature-card {
    padding: 20px;
  }
}
</style>
