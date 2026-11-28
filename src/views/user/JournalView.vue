<template>
  <div class="journal-page">
    <section class="page-hero mhop-card">
      <div class="hero-text">
        <span class="hero-badge">只保存在本机 · 不上传</span>
        <h1>记录</h1>
        <p>每天花一分钟，记下此刻的心情。写下来的感受，会慢慢变成看得见的轨迹。</p>
      </div>
      <div class="hero-emoji">📖</div>
    </section>

    <section class="compose-card mhop-card">
      <h2>今天的心情</h2>
      <p class="text-sub compose-tip">此刻你最接近哪种感受？</p>
      <div class="mood-grid">
        <button
          v-for="m in MOODS"
          :key="m.key"
          type="button"
          class="mood-btn"
          :class="{ active: mood === m.key }"
          :style="mood === m.key ? { borderColor: m.color, background: m.color + '16' } : {}"
          @click="mood = m.key"
        >
          <span class="mood-emoji">{{ m.emoji }}</span>
          <span class="mood-label">{{ m.label }}</span>
        </button>
      </div>
      <el-input
        v-model="note"
        type="textarea"
        :rows="3"
        maxlength="500"
        show-word-limit
        placeholder="想写点什么就写点什么，也可以只选一个心情（选填）"
      />
      <div class="compose-actions">
        <span v-if="todayCount" class="text-sub today-tip">今天已记录 {{ todayCount }} 次</span>
        <el-button type="primary" round :disabled="!mood" @click="save">
          <el-icon><EditPen /></el-icon> 保存这次记录
        </el-button>
      </div>
    </section>

    <div class="stats-grid">
      <div class="stat-card mhop-card">
        <strong>{{ streak }}</strong>
        <span>连续记录天数</span>
      </div>
      <div class="stat-card mhop-card">
        <strong>{{ entries.length }}</strong>
        <span>累计记录条数</span>
      </div>
      <div class="stat-card mhop-card">
        <strong>{{ topMood ? topMood.emoji : '—' }}</strong>
        <span>{{ topMood ? `最常出现：${topMood.label}` : '还没有足够的数据' }}</span>
      </div>
    </div>

    <section class="week-card mhop-card">
      <div class="section-head">
        <h2>最近 7 天</h2>
        <span class="text-sub">记录越多，越能看见规律</span>
      </div>
      <div class="week-strip">
        <div v-for="d in week" :key="d.key" class="week-cell" :class="{ today: d.isToday }">
          <span class="week-emoji">{{ d.mood ? d.mood.emoji : '·' }}</span>
          <span class="week-day">{{ d.label }}</span>
        </div>
      </div>
    </section>

    <section class="list-card mhop-card">
      <div class="section-head">
        <h2>我的记录</h2>
        <span class="text-sub">共 {{ entries.length }} 条</span>
      </div>
      <div v-if="entries.length === 0" class="empty-box">
        <span class="empty-emoji">🌱</span>
        <p class="text-sub">还没有记录，从今天开始吧</p>
      </div>
      <div v-for="(e, i) in entries" :key="e.id" class="entry-row">
        <span class="entry-emoji">{{ moodOf(e.mood).emoji }}</span>
        <div class="entry-main">
          <div class="entry-meta">
            <strong>{{ moodOf(e.mood).label }}</strong>
            <span class="text-sub">{{ e.day }} {{ e.time }}</span>
          </div>
          <p v-if="e.note" class="entry-note">{{ e.note }}</p>
        </div>
        <el-button text size="small" class="entry-del" @click="remove(i)">删除</el-button>
      </div>
    </section>

    <p class="foot-tip text-sub">
      如果低落、焦虑持续两周以上并影响生活，建议做一次
      <router-link to="/assessment">心理测评</router-link>，或查看
      <router-link to="/rescue">援助热线</router-link>。
    </p>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../../stores/auth'

const MOODS = [
  { key: 'low', emoji: '😔', label: '低落·空虚', color: '#6a7bb0' },
  { key: 'anxious', emoji: '😰', label: '焦虑·紧张', color: '#e8933c' },
  { key: 'angry', emoji: '😤', label: '愤怒·烦躁', color: '#d6668f' },
  { key: 'tired', emoji: '😴', label: '疲惫·失眠', color: '#6a6fd0' },
  { key: 'numb', emoji: '😶', label: '麻木·解离', color: '#8a8f99' },
  { key: 'ok', emoji: '🌤', label: '平静·还好', color: '#4e9e5f' },
]

const auth = useAuthStore()
const storageKey = computed(() => `mhop_journal_${auth.user?.id ?? auth.user?.username ?? 'guest'}`)

const entries = ref([])
const mood = ref('')
const note = ref('')

function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function moodOf(key) {
  return MOODS.find((m) => m.key === key) || MOODS[5]
}
function load() {
  try {
    entries.value = JSON.parse(localStorage.getItem(storageKey.value) || '[]')
  } catch {
    entries.value = []
  }
}
function persist() {
  localStorage.setItem(storageKey.value, JSON.stringify(entries.value))
}
function save() {
  if (!mood.value) return
  const now = new Date()
  entries.value.unshift({
    id: Date.now(),
    day: dayKey(now),
    time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    mood: mood.value,
    note: note.value.trim(),
  })
  persist()
  note.value = ''
  ElMessage.success('已记录，愿今天被温柔对待')
}
async function remove(index) {
  try {
    await ElMessageBox.confirm('删除这条记录吗？删除后无法恢复。', '提示', { type: 'warning' })
  } catch {
    return
  }
  entries.value.splice(index, 1)
  persist()
}

const todayCount = computed(() => entries.value.filter((e) => e.day === dayKey()).length)

const week = computed(() => {
  const list = []
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = dayKey(d)
    const hit = entries.value.find((e) => e.day === key)
    list.push({
      key,
      label: i === 0 ? '今天' : `${d.getMonth() + 1}/${d.getDate()}`,
      isToday: i === 0,
      mood: hit ? moodOf(hit.mood) : null,
    })
  }
  return list
})

const streak = computed(() => {
  const days = new Set(entries.value.map((e) => e.day))
  const cursor = new Date()
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let count = 0
  while (days.has(dayKey(cursor))) {
    count += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return count
})

const topMood = computed(() => {
  const counter = {}
  entries.value.forEach((e) => { counter[e.mood] = (counter[e.mood] || 0) + 1 })
  const top = Object.entries(counter).sort((a, b) => b[1] - a[1])[0]
  return top ? moodOf(top[0]) : null
})

onMounted(load)
</script>

<style scoped>
.page-hero {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 34px 38px;
  background: linear-gradient(120deg, #ffffff 0%, #fbf4ea 100%);
}
.hero-text h1 {
  margin: 10px 0 10px;
  font-size: 30px;
}
.hero-text p {
  margin: 0;
  color: var(--mhop-text-sub);
  line-height: 1.8;
  max-width: 620px;
}
.hero-badge {
  display: inline-block;
  background: var(--mhop-amber-light);
  color: var(--mhop-amber);
  font-size: 12.5px;
  padding: 4px 12px;
  border-radius: 999px;
}
.hero-emoji {
  margin-left: auto;
  font-size: 76px;
  line-height: 1;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.section-head h2 {
  margin: 0;
  font-size: 19px;
}
.compose-card {
  margin-top: 18px;
  padding: 22px 24px 24px;
}
.compose-card h2 {
  margin: 0;
  font-size: 19px;
}
.compose-tip {
  margin: 6px 0 14px;
  font-size: 13.5px;
}
.mood-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}
.mood-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 13px 8px;
  border: 1px solid var(--mhop-border);
  border-radius: 12px;
  background: var(--mhop-card);
  color: var(--mhop-text);
  cursor: pointer;
  transition: all 0.15s;
}
.mood-btn:hover {
  border-color: var(--mhop-border-strong);
  transform: translateY(-2px);
}
.mood-btn.active {
  font-weight: 600;
}
.mood-emoji {
  font-size: 24px;
  line-height: 1;
}
.mood-label {
  font-size: 13px;
}
.compose-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
  margin-top: 14px;
}
.today-tip {
  font-size: 12.5px;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  margin-top: 18px;
}
.stat-card {
  padding: 20px;
  text-align: center;
}
.stat-card strong {
  display: block;
  font-size: 26px;
  line-height: 1.2;
}
.stat-card span {
  display: block;
  margin-top: 6px;
  font-size: 12.5px;
  color: var(--mhop-text-sub);
}
.week-card,
.list-card {
  margin-top: 18px;
  padding: 22px 24px;
}
.week-strip {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}
.week-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 4px;
  border-radius: 12px;
  background: var(--mhop-sand);
}
.week-cell.today {
  background: var(--mhop-link-light);
}
.week-emoji {
  font-size: 21px;
  line-height: 1;
}
.week-day {
  font-size: 11.5px;
  color: var(--mhop-text-sub);
}
.empty-box {
  padding: 26px 0;
  text-align: center;
}
.empty-emoji {
  font-size: 32px;
}
.empty-box p {
  margin: 8px 0 0;
  font-size: 13.5px;
}
.entry-row {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  padding: 14px 2px;
  border-bottom: 1px solid var(--mhop-border);
}
.entry-row:last-child {
  border-bottom: none;
}
.entry-emoji {
  font-size: 24px;
  line-height: 1.3;
}
.entry-main {
  flex: 1;
  min-width: 0;
}
.entry-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.entry-meta strong {
  font-size: 14.5px;
}
.entry-meta span {
  font-size: 12px;
}
.entry-note {
  margin: 6px 0 0;
  font-size: 13.5px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}
.entry-del {
  flex-shrink: 0;
}
.foot-tip {
  margin: 18px 0 0;
  font-size: 12.5px;
  line-height: 1.8;
  text-align: center;
}
@media (max-width: 760px) {
  .page-hero {
    padding: 24px 20px;
  }
  .hero-emoji {
    display: none;
  }
  .hero-text h1 {
    font-size: 25px;
  }
  .mood-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .mood-btn {
    padding: 11px 4px;
  }
  .mood-label {
    font-size: 12px;
  }
  .compose-actions {
    justify-content: space-between;
  }
  .week-strip {
    gap: 5px;
  }
  .week-cell {
    padding: 10px 2px;
  }
}
</style>
