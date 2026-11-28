<template>
  <div class="regulate-page">
    <section class="page-hero mhop-card">
      <div class="hero-text">
        <span class="hero-badge">慢一点 · 先让身体松下来</span>
        <h1>调节</h1>
        <p>情绪上来时，先不用急着解决它。跟着呼吸把节奏放慢，或者做一次接地练习，让自己回到此刻。</p>
      </div>
      <div class="hero-emoji">🌬️</div>
    </section>

    <section class="breath-card mhop-card">
      <div class="section-head">
        <h2>呼吸练习</h2>
        <el-radio-group v-model="patternKey" size="small" :disabled="running" @change="reset">
          <el-radio-button v-for="p in PATTERNS" :key="p.key" :value="p.key">{{ p.name }}</el-radio-button>
        </el-radio-group>
      </div>

      <div class="breath-stage">
        <div class="breath-halo" :class="{ on: running }"></div>
        <div class="breath-circle" :class="running ? phase : 'idle'" :style="{ transitionDuration: phaseSeconds + 's' }">
          <strong>{{ running ? PHASE_LABEL[phase] : '准备好了吗' }}</strong>
          <span v-if="running" class="breath-count">{{ left }}s</span>
          <span v-else class="breath-count">点下方开始</span>
        </div>
      </div>

      <p class="breath-tip text-sub">
        {{ running ? `已完成 ${cycles} 轮，跟着圆圈一起呼吸` : '用鼻子吸气、用嘴呼气，感觉不适随时停下' }}
      </p>
      <el-button :type="running ? 'default' : 'primary'" size="large" round @click="toggle">
        <el-icon><component :is="running ? 'VideoPause' : 'VideoPlay'" /></el-icon>
        {{ running ? '暂停' : '开始练习' }}
      </el-button>
    </section>

    <section class="grounding-card mhop-card">
      <div class="section-head">
        <h2>5-4-3-2-1 接地练习</h2>
        <span class="text-sub">心慌、解离时按顺序做一遍</span>
      </div>
      <div class="grounding-grid">
        <div v-for="g in GROUNDING" :key="g.n" class="ground-item">
          <span class="ground-num" :style="{ background: g.color + '1f', color: g.color }">{{ g.n }}</span>
          <div>
            <strong>{{ g.title }}</strong>
            <p class="text-sub">{{ g.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <div class="quick-grid">
      <router-link to="/journal" class="quick-card mhop-card">
        <span class="quick-emoji">📖</span>
        <div>
          <strong>把感受写下来</strong>
          <p class="text-sub">情绪记录会帮你看见变化</p>
        </div>
      </router-link>
      <router-link to="/companion" class="quick-card mhop-card">
        <span class="quick-emoji">🤝</span>
        <div>
          <strong>找人说一说</strong>
          <p class="text-sub">匿名进入互助论坛</p>
        </div>
      </router-link>
      <router-link to="/rescue" class="quick-card mhop-card">
        <span class="quick-emoji">🆘</span>
        <div>
          <strong>撑不住了</strong>
          <p class="text-sub">查看 24 小时援助热线</p>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { computed, onUnmounted, ref } from 'vue'

const PATTERNS = [
  { key: '446', name: '舒缓 4-4-6', inhale: 4, hold: 4, exhale: 6 },
  { key: '478', name: '助眠 4-7-8', inhale: 4, hold: 7, exhale: 8 },
]
const PHASE_LABEL = { inhale: '吸气', hold: '屏息', exhale: '呼气' }
const GROUNDING = [
  { n: 5, title: '看见 5 样东西', desc: '环顾四周，说出你看到的五件物品', color: '#4e9e5f' },
  { n: 4, title: '触摸 4 样东西', desc: '感受衣服、桌面、椅子、皮肤的触感', color: '#3a78c2' },
  { n: 3, title: '听见 3 种声音', desc: '风声、脚步声、空调声，都可以', color: '#6a6fd0' },
  { n: 2, title: '闻到 2 种气味', desc: '空气、衣物的味道，或身边任何气味', color: '#e8933c' },
  { n: 1, title: '说出 1 件此刻安全的事', desc: '比如：我现在在房间里，没有人会伤害我', color: '#d6668f' },
]

const patternKey = ref('446')
const pattern = computed(() => PATTERNS.find((p) => p.key === patternKey.value) || PATTERNS[0])
const running = ref(false)
const phase = ref('idle')
const left = ref(0)
const cycles = ref(0)
const phaseSeconds = computed(() => pattern.value[phase.value] || 0.6)

let timer = null
let pendingResolve = null

function phaseFor(name, seconds) {
  return new Promise((resolve) => {
    pendingResolve = resolve
    phase.value = name
    left.value = seconds
    timer = window.setInterval(() => {
      left.value -= 1
      if (left.value <= 0) {
        window.clearInterval(timer)
        timer = null
        pendingResolve = null
        resolve()
      }
    }, 1000)
  })
}

async function run() {
  const p = pattern.value
  while (running.value) {
    await phaseFor('inhale', p.inhale)
    if (!running.value) break
    await phaseFor('hold', p.hold)
    if (!running.value) break
    await phaseFor('exhale', p.exhale)
    if (!running.value) break
    cycles.value += 1
  }
}

function toggle() {
  if (running.value) {
    stop()
  } else {
    running.value = true
    cycles.value = 0
    run()
  }
}

function stop() {
  running.value = false
  if (timer) window.clearInterval(timer)
  timer = null
  // 唤醒挂起的 phaseFor，避免暂停后循环卡在半途
  if (pendingResolve) {
    const resolve = pendingResolve
    pendingResolve = null
    resolve()
  }
  phase.value = 'idle'
  left.value = 0
}

function reset() {
  stop()
  cycles.value = 0
}

onUnmounted(stop)
</script>

<style scoped>
.page-hero {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 34px 38px;
  background: linear-gradient(120deg, #ffffff 0%, #edf4fb 100%);
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
  background: var(--mhop-link-light);
  color: var(--mhop-link-dark);
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
  margin-bottom: 16px;
}
.section-head h2 {
  margin: 0;
  font-size: 19px;
}
.breath-card {
  margin-top: 18px;
  padding: 22px 24px 28px;
  text-align: center;
}
.breath-stage {
  position: relative;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 6px 0 12px;
}
.breath-halo {
  position: absolute;
  width: 210px;
  height: 210px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(63, 105, 145, 0.16), transparent 68%);
  opacity: 0;
  transition: opacity 0.4s;
}
.breath-halo.on {
  opacity: 1;
  animation: haloPulse 6s ease-in-out infinite;
}
@keyframes haloPulse {
  0%, 100% { transform: scale(0.92); }
  50% { transform: scale(1.08); }
}
.breath-circle {
  width: 190px;
  height: 190px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #fff;
  background: linear-gradient(140deg, #5b8fbc, #2f8f83);
  box-shadow: 0 14px 34px rgba(47, 143, 131, 0.24);
  transition-property: transform;
  transition-timing-function: ease-in-out;
}
.breath-circle strong {
  font-size: 21px;
  letter-spacing: 2px;
}
.breath-count {
  font-size: 13px;
  opacity: 0.85;
}
.breath-circle.idle {
  transform: scale(1);
  transition-duration: 0.6s;
}
.breath-circle.inhale {
  transform: scale(1.32);
}
.breath-circle.hold {
  transform: scale(1.32);
}
.breath-circle.exhale {
  transform: scale(0.82);
}
.breath-tip {
  margin: 0 0 16px;
  font-size: 13.5px;
}
.grounding-card {
  margin-top: 18px;
  padding: 22px 24px 24px;
}
.grounding-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 12px;
}
.ground-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border-radius: 12px;
  background: var(--mhop-sand);
}
.ground-num {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
}
.ground-item strong {
  font-size: 14.5px;
}
.ground-item p {
  margin: 4px 0 0;
  font-size: 12.5px;
  line-height: 1.6;
}
.quick-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 14px;
  margin-top: 18px;
}
.quick-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  transition: transform 0.15s, box-shadow 0.15s;
}
.quick-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--mhop-shadow-hover);
}
.quick-emoji {
  font-size: 30px;
  line-height: 1;
}
.quick-card strong {
  font-size: 15px;
}
.quick-card p {
  margin: 3px 0 0;
  font-size: 12.5px;
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
  .breath-stage {
    height: 240px;
  }
  .breath-circle {
    width: 160px;
    height: 160px;
  }
  .quick-grid {
    gap: 10px;
  }
}
</style>
