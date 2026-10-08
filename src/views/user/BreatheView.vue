<template>
  <div class="breathe">
    <!-- 说明 + 节律选择 -->
    <section class="mhop-card breathe-head">
      <div class="head-text">
        <h1><el-icon><WindPower /></el-icon> 呼吸放松练习</h1>
        <p class="text-sub">
          跟着圆圈的缩放节奏吸气、屏息、呼气。三到五分钟就能让心跳慢下来——考试前、失眠时、
          情绪快要失控的那一刻，都可以来这里坐一会儿。不需要登录，数据也不会上传。
        </p>
      </div>
      <el-segmented v-model="rhythm" :options="rhythmOptions" />
      <p class="rhythm-hint text-sub">{{ current.hint }}</p>
    </section>

    <!-- 练习舞台 -->
    <section class="mhop-card stage">
      <div class="pacer">
        <div class="pacer-halo"></div>
        <div class="pacer-bubble" :style="pacerStyle"></div>
        <div class="pacer-text">
          <strong class="pacer-phase">{{ phaseLabel }}</strong>
          <span class="pacer-count">{{ phaseCount }}</span>
          <span class="pacer-unit">秒</span>
        </div>
      </div>

      <div class="stage-meta">
        <div class="meta-item">
          <span class="meta-label">已完成</span>
          <strong>{{ rounds }}</strong>
          <span class="meta-unit">轮</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">本次时长</span>
          <strong>{{ clock }}</strong>
        </div>
      </div>

      <div class="stage-actions">
        <el-button v-if="!running" type="primary" size="large" round @click="start">
          <el-icon><VideoPlay /></el-icon>{{ elapsedMs > 0 ? '继 续' : '开 始' }}
        </el-button>
        <el-button v-else size="large" round @click="pause">
          <el-icon><VideoPause /></el-icon>暂 停
        </el-button>
        <el-button size="large" round plain :disabled="elapsedMs === 0" @click="reset">
          <el-icon><Refresh /></el-icon>重 置
        </el-button>
      </div>

      <p v-if="reduceMotion" class="motion-note text-sub">
        <el-icon><View /></el-icon>
        已开启「减弱动效」，圆圈不再缩放，请只跟着数字节拍呼吸。
      </p>
    </section>

    <!-- 使用提示与求助指引 -->
    <section class="mhop-card tips">
      <h2>几个小提示</h2>
      <ul>
        <li>用鼻子吸气、用嘴呼气。呼气比吸气更慢，是让身体松开的关键，所以三套节律的呼气都不短于吸气。</li>
        <li>屏息时若感到胸闷、头晕，直接跳过屏息继续呼气就行，不必硬撑。孕妇、心肺疾病患者建议只做「舒缓呼吸」。</li>
        <li>走神很正常，也不必数得绝对精准。发现注意力跑掉了，轻轻把它带回呼吸上，这本身就是练习。</li>
      </ul>
      <p class="crisis">
        <el-icon><FirstAidKit /></el-icon>
        <span>
          呼吸练习能缓解紧张，但替代不了诊断与治疗。如果情绪持续低落两周以上、或出现伤害自己的念头，
          请立即拨打 <strong>12356</strong>（全国心理援助热线）或 <strong>010-82951332</strong>（北京危机干预中心），
          也可以联系一位你信任的人，请 TA 陪着你。
        </span>
      </p>
    </section>
  </div>
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { useA11y } from '../../utils/a11y'

// 圆圈的缩放范围：吸气涨到 1，呼气缩回 0.56，视觉上刚好能感知「肺被充满 / 被排空」
const MIN_SCALE = 0.56

// 每段呼吸预先算好起止缩放。方块呼吸里「屏息」出现两次（吸后、呼后），
// 落点一个是满、一个是空，所以只能靠上一段的终点推，不能只看 key。
function buildScales(phases) {
  let cursor = MIN_SCALE
  return phases.map((phase) => {
    const from = cursor
    if (phase.key === 'inhale') cursor = 1
    else if (phase.key === 'exhale') cursor = MIN_SCALE
    return { from, to: cursor }
  })
}

// 只保留经过验证的几套节律：用户不需要自己配时间，选择成本为零
const RHYTHMS = [
  {
    value: '478',
    label: '4-7-8 助眠',
    hint: '吸气 4 秒 · 屏息 7 秒 · 呼气 8 秒。呼气最长，躯体唤醒度降得最快，睡前躺在床上做最合适。',
    phases: [
      { key: 'inhale', label: '吸 气', seconds: 4 },
      { key: 'hold', label: '屏 息', seconds: 7 },
      { key: 'exhale', label: '呼 气', seconds: 8 },
    ],
  },
  {
    value: 'box',
    label: '方块呼吸',
    hint: '吸气、屏息、呼气、屏息各 4 秒。四段等长，最容易跟上节拍，紧张、心慌时可以随时用。',
    phases: [
      { key: 'inhale', label: '吸 气', seconds: 4 },
      { key: 'hold', label: '屏 息', seconds: 4 },
      { key: 'exhale', label: '呼 气', seconds: 4 },
      { key: 'hold', label: '屏 息', seconds: 4 },
    ],
  },
  {
    value: 'calm',
    label: '舒缓呼吸',
    hint: '吸气 4 秒、呼气 6 秒，只有两段。第一次尝试、或屏息会让你不适时，从这个开始。',
    phases: [
      { key: 'inhale', label: '吸 气', seconds: 4 },
      { key: 'exhale', label: '呼 气', seconds: 6 },
    ],
  },
]

const rhythms = RHYTHMS.map((item) => ({ ...item, scales: buildScales(item.phases) }))
const rhythmOptions = rhythms.map(({ value, label }) => ({ value, label }))

const { reduceMotion } = useA11y()

const rhythm = ref(rhythms[0].value)
const current = computed(() => rhythms.find((item) => item.value === rhythm.value) ?? rhythms[0])

const running = ref(false)
const elapsedMs = ref(0)
let rafId = null
let lastTs = 0

const cycleMs = computed(
  () => current.value.phases.reduce((sum, phase) => sum + phase.seconds, 0) * 1000
)

// 当前处于第几段、这段还剩几秒、这段走了多少（0→1）
const state = computed(() => {
  const phases = current.value.phases
  const ms = elapsedMs.value % cycleMs.value
  let acc = 0
  for (let i = 0; i < phases.length; i += 1) {
    const duration = phases[i].seconds * 1000
    if (ms < acc + duration) {
      const done = ms - acc
      return {
        index: i,
        label: phases[i].label,
        progress: done / duration,
        remain: Math.max(1, Math.ceil((duration - done) / 1000)),
      }
    }
    acc += duration
  }
  // 浮点误差导致落到末尾时的兜底
  const last = phases[phases.length - 1]
  return { index: phases.length - 1, label: last.label, progress: 1, remain: 1 }
})

const rounds = computed(() => Math.floor(elapsedMs.value / cycleMs.value))

const phaseLabel = computed(() => {
  if (running.value) return state.value.label
  return elapsedMs.value > 0 ? '已暂停' : '准 备'
})
const phaseCount = computed(() =>
  running.value ? state.value.remain : current.value.phases[0].seconds
)

// 余弦缓入缓出：起步和收尾都柔和，比匀速更接近真实呼吸
function easeInOut(t) {
  const clamped = Math.min(1, Math.max(0, t))
  return (1 - Math.cos(Math.PI * clamped)) / 2
}

const scale = computed(() => {
  // 开启减弱动效时不缩放，只留文字节拍，避免前庭敏感与眩晕用户不适
  if (reduceMotion.value) return 1
  if (!running.value && elapsedMs.value === 0) return MIN_SCALE
  const { index, progress } = state.value
  const { from, to } = current.value.scales[index]
  return from + (to - from) * easeInOut(progress)
})

const pacerStyle = computed(() => ({ transform: `scale(${scale.value.toFixed(3)})` }))

const clock = computed(() => {
  const total = Math.floor(elapsedMs.value / 1000)
  const minutes = String(Math.floor(total / 60)).padStart(2, '0')
  const seconds = String(total % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
})

function tick(ts) {
  if (!running.value) return
  if (!lastTs) lastTs = ts
  elapsedMs.value += ts - lastTs
  lastTs = ts
  rafId = requestAnimationFrame(tick)
}

function start() {
  if (running.value) return
  running.value = true
  lastTs = 0
  rafId = requestAnimationFrame(tick)
}

function pause() {
  running.value = false
  if (rafId) cancelAnimationFrame(rafId)
  rafId = null
  lastTs = 0
}

function reset() {
  pause()
  elapsedMs.value = 0
}

// 中途换节律则从头开始，否则会停在上一套节奏的半相位上，看着莫名其妙
watch(rhythm, () => {
  elapsedMs.value = 0
})

onUnmounted(pause)
</script>

<style scoped>
.breathe {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 22px;
}

/* ---------- 头部 ---------- */
.breathe-head {
  padding: 26px 28px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}
.head-text {
  flex: 1 1 340px;
  min-width: 0;
}
.head-text h1 {
  margin: 0 0 10px;
  font-size: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.head-text p {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.85;
}
.rhythm-hint {
  flex-basis: 100%;
  margin: 0;
  font-size: 13px;
  line-height: 1.75;
}

/* ---------- 舞台 ---------- */
.stage {
  padding: 34px 24px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
}
.pacer {
  position: relative;
  width: 250px;
  height: 250px;
  display: grid;
  place-items: center;
}
.pacer-halo {
  position: absolute;
  inset: -15px;
  border-radius: 50%;
  border: 1px dashed var(--mhop-border-strong);
}
.pacer-bubble {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid var(--mhop-teal);
  /* 中心用卡片底色、边缘过渡到品牌浅青，中间压文字才不会糊 */
  background: radial-gradient(circle at 50% 36%, var(--mhop-card) 0%, var(--mhop-teal-light) 100%);
  box-shadow: var(--mhop-shadow);
  will-change: transform;
}
.pacer-text {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--mhop-teal-dark);
  text-align: center;
}
.pacer-phase {
  font-size: 17px;
  letter-spacing: 3px;
}
.pacer-count {
  font-size: 52px;
  font-weight: 700;
  line-height: 1.05;
  font-variant-numeric: tabular-nums;
}
.pacer-unit {
  font-size: 12.5px;
  opacity: 0.8;
}

.stage-meta {
  display: flex;
  gap: 44px;
}
.meta-item {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 13px;
  color: var(--mhop-text-sub);
}
.meta-item strong {
  font-size: 22px;
  color: var(--mhop-text);
  font-variant-numeric: tabular-nums;
}
.meta-unit {
  font-size: 12.5px;
}
.stage-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}
.motion-note {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

/* ---------- 提示 ---------- */
.tips {
  padding: 22px 26px;
}
.tips h2 {
  margin: 0 0 12px;
  font-size: 17px;
}
.tips ul {
  margin: 0;
  padding-left: 20px;
}
.tips li {
  font-size: 14px;
  line-height: 1.9;
  color: var(--mhop-text-sub);
}
.crisis {
  margin: 16px 0 0;
  padding: 12px 14px;
  border-radius: var(--mhop-radius-sm);
  background: var(--mhop-sand);
  font-size: 13px;
  line-height: 1.8;
  color: var(--mhop-text-sub);
  display: flex;
  gap: 8px;
  align-items: flex-start;
}
.crisis .el-icon {
  margin-top: 3px;
  flex: none;
  color: var(--mhop-danger);
}
.crisis strong {
  color: var(--mhop-danger);
}

@media (max-width: 760px) {
  .breathe {
    margin-top: 14px;
    gap: 14px;
  }
  .breathe-head {
    padding: 20px 18px;
    gap: 12px;
  }
  .head-text h1 {
    font-size: 20px;
  }
  .head-text p {
    font-size: 13.5px;
  }
  .stage {
    padding: 26px 18px 22px;
    gap: 18px;
  }
  .pacer {
    width: 200px;
    height: 200px;
  }
  .pacer-halo {
    inset: -11px;
  }
  .pacer-count {
    font-size: 42px;
  }
  .stage-meta {
    gap: 26px;
  }
  .tips {
    padding: 18px;
  }
}
</style>
