<template>
  <section class="mhop-card trend-card">
    <div class="trend-head">
      <h4><el-icon><TrendCharts /></el-icon> 分数变化趋势</h4>
      <span class="text-sub trend-scale">{{ scaleName }}</span>
    </div>

    <!-- 自由倾诉不产生量表分，画不出曲线 -->
    <div v-if="isScaleless" class="trend-empty text-sub">
      <el-icon :size="26"><DataLine /></el-icon>
      <p>自由倾诉评估不打量表分，所以没有趋势曲线。切到 PHQ-9 或 GAD-7，就能看到分数随时间的变化。</p>
    </div>

    <!-- 少于两次记录时给一句人话，而不是画一条没有意义的直线 -->
    <div v-else-if="points.length < 2" class="trend-empty text-sub">
      <el-icon :size="26"><DataLine /></el-icon>
      <p v-if="points.length === 0">
        还没有 {{ scaleName }} 的记录。完成两次以上评估后，这里会画出分数的变化曲线。
      </p>
      <p v-else>
        目前只有 1 次记录（{{ points[0].score }} 分，
        {{ points[0].level || bandLabel(points[0].score) }}）。再做一次，就能看到走向了。
      </p>
    </div>

    <template v-else>
      <div ref="wrap" class="trend-canvas">
        <svg :width="width" :height="HEIGHT" role="img"
          :aria-label="`${scaleName} 最近 ${coords.length} 次得分变化折线图`">
          <!-- 分档线：直接落在后端分档的临界分上，比等分刻度更有解读意义 -->
          <g>
            <line v-for="t in ticks" :key="`g${t.score}`" :x1="PAD.left" :x2="PAD.left + plotW" :y1="t.y" :y2="t.y"
              :stroke="t.score === 0 ? 'var(--mhop-border-strong)' : 'var(--mhop-border)'"
              :stroke-dasharray="t.score === 0 ? 'none' : '3 4'" stroke-width="1" />
            <text v-for="t in ticks" :key="`t${t.score}`" :x="PAD.left - 7" :y="t.y + 4" text-anchor="end"
              class="axis-text">{{ t.score }}</text>
          </g>

          <!-- 折线下方的浅色面积，让「整体走势」更容易一眼看出来 -->
          <path :d="areaPath" fill="var(--mhop-link)" opacity="0.1" />
          <path :d="linePath" fill="none" stroke="var(--mhop-link)" stroke-width="2.5"
            stroke-linejoin="round" stroke-linecap="round" />

          <!-- 点按分值档位上色；描边用卡片底色，点重叠时也能分开 -->
          <g v-for="(c, i) in coords" :key="c.id ?? `p${i}`">
            <circle :cx="c.x" :cy="c.y" r="4.5" :style="{ fill: c.color }"
              stroke="var(--mhop-card)" stroke-width="2">
              <title>{{ c.full }} · {{ c.score }} 分 · {{ c.level || bandLabel(c.score) }}</title>
            </circle>
            <!-- 最新一次用外圈标出来 -->
            <circle v-if="i === coords.length - 1" :cx="c.x" :cy="c.y" r="9" fill="none"
              :style="{ stroke: c.color }" stroke-width="1.7" opacity="0.55" />
          </g>

          <text v-for="l in xLabels" :key="l.key" :x="l.x" :y="PAD.top + plotH + 20" text-anchor="middle"
            class="axis-text">{{ l.text }}</text>
        </svg>
      </div>

      <div class="trend-sum">
        <el-tag :type="delta.tag" effect="light" size="small">
          {{ delta.text }}
        </el-tag>
        <span class="text-sub trend-sum-text">
          最近一次 {{ delta.latest.score }} 分（{{ delta.latest.level || bandLabel(delta.latest.score) }}），
          {{ coords.length }} 次记录
        </span>
      </div>

      <div class="trend-legend">
        <span v-for="b in legend" :key="b.code" class="lg-item">
          <i class="lg-dot" :style="{ background: colorOf(b.code) }"></i>{{ b.label }}
        </span>
        <span class="text-sub lg-note">分数越低表示症状越轻</span>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps({
  // 本地 + 云端的全部评估记录，组件内部按量表筛选
  records: { type: Array, default: () => [] },
  // 当前量表 key：phq9 / gad7 / free
  scale: { type: String, default: 'phq9' },
  // 量表中文名，用于标题与空态文案
  scaleName: { type: String, default: '' },
  // 量表满分，作为纵轴顶端
  maxScore: { type: Number, default: 27 },
  // 后端分档表 [[临界分, 档位名, 档位码], ...]，用于画分档线与上色
  bands: { type: Array, default: () => [] },
})

// 只画最近这么多次，再多点就会糊成一团
const MAX_POINTS = 12
const HEIGHT = 220
const PAD = { top: 16, right: 22, bottom: 34, left: 38 }
const PLOT_H = HEIGHT - PAD.top - PAD.bottom

// 档位配色统一走主题令牌，日夜模式与高对比模式都会自动跟着变
const CODE_COLOR = {
  normal: 'var(--mhop-leaf)',
  mild: 'var(--mhop-teal)',
  moderate: 'var(--mhop-amber)',
  severe: 'var(--mhop-danger-2)',
  danger: 'var(--mhop-danger)',
}

const isScaleless = computed(() => props.scale === 'free')

const points = computed(() => {
  const sorted = props.records
    .filter((r) => r.assessment_type === props.scale && Number.isFinite(r.score))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  // 同一次评估可能本地与云端各存一条，按「时间 + 分数」去重，避免折线出现假拐点
  const out = []
  const seen = new Set()
  for (const r of sorted) {
    const key = `${r.created_at}|${r.score}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(r)
  }
  return out.slice(-MAX_POINTS)
})

/* ---------- 画布尺寸：跟随容器宽度，字号与线宽不被拉伸 ---------- */
const wrap = ref(null)
const width = ref(680)
let observer = null

onMounted(() => {
  if (!wrap.value) return
  if (typeof ResizeObserver === 'undefined') {
    width.value = wrap.value.clientWidth || 680
    return
  }
  observer = new ResizeObserver((entries) => {
    const measured = entries[0]?.contentRect?.width
    if (measured) width.value = Math.max(280, Math.round(measured))
  })
  observer.observe(wrap.value)
})

onUnmounted(() => observer?.disconnect())

const plotW = computed(() => Math.max(40, width.value - PAD.left - PAD.right))

function xAt(index) {
  const n = points.value.length
  if (n <= 1) return PAD.left + plotW.value / 2
  return PAD.left + (index / (n - 1)) * plotW.value
}

function yAt(score) {
  const ratio = Math.min(1, Math.max(0, score / props.maxScore))
  return PAD.top + PLOT_H * (1 - ratio)
}

/* ---------- 分档 ---------- */
function bandOf(score) {
  return props.bands.find((b) => score <= Number(b[0])) ?? props.bands[props.bands.length - 1]
}

function bandLabel(score) {
  return bandOf(score)?.[1] ?? ''
}

function colorOf(code) {
  return CODE_COLOR[code] ?? 'var(--mhop-link)'
}

const legend = computed(() => {
  const seen = new Set()
  return props.bands
    .map(([ceiling, label, code]) => ({ ceiling, label, code }))
    .filter((b) => {
      if (!b.code || seen.has(b.code)) return false
      seen.add(b.code)
      return true
    })
})

const ticks = computed(() => {
  const max = props.maxScore
  const ceilings = [
    ...new Set(props.bands.map((b) => Number(b[0])).filter((n) => Number.isFinite(n) && n > 0 && n < max)),
  ].sort((a, b) => a - b)
  const scores = [0, ...ceilings]
  if (scores[scores.length - 1] !== max) scores.push(max)
  return scores.map((score) => ({ score, y: yAt(score) }))
})

/* ---------- 折线 ---------- */
function fmtDay(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function fmtFull(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

const coords = computed(() =>
  points.value.map((p, i) => ({
    id: p.id,
    score: p.score,
    level: p.level,
    x: xAt(i),
    y: yAt(p.score),
    color: colorOf(bandOf(p.score)?.[2]),
    label: fmtDay(p.created_at),
    full: fmtFull(p.created_at),
  }))
)

const linePath = computed(() =>
  coords.value.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
)

const areaPath = computed(() => {
  const list = coords.value
  if (!list.length) return ''
  const base = PAD.top + PLOT_H
  const first = list[0]
  const last = list[list.length - 1]
  const body = list.map((c) => `L${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
  return `M${first.x.toFixed(1)},${base} ${body} L${last.x.toFixed(1)},${base} Z`
})

const xLabels = computed(() => {
  const list = coords.value
  const n = list.length
  if (!n) return []
  // 点多时隔几个标一个，避免日期互相压住
  const step = n <= 6 ? 1 : Math.ceil(n / 5)
  return list
    .map((c, i) => ({ key: c.id ?? `x${i}`, x: c.x, text: c.label, index: i }))
    .filter((l) => l.index % step === 0 || l.index === n - 1)
})

/* ---------- 与上一次的对比 ---------- */
const delta = computed(() => {
  const list = coords.value
  const latest = list[list.length - 1]
  const prev = list[list.length - 2]
  const diff = latest.score - prev.score
  const abs = Math.abs(diff)
  if (diff === 0) {
    return { latest, tag: 'info', text: `与上次持平（${latest.score} 分）` }
  }
  // 这类量表分数越低越好，所以下降才是改善
  const down = diff < 0
  return {
    latest,
    tag: down ? 'success' : 'danger',
    text: `较上次${down ? '下降' : '上升'} ${abs} 分`,
  }
})
</script>

<style scoped>
.trend-card {
  padding: 18px 20px 16px;
  margin-bottom: 16px;
}
.trend-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.trend-head h4 {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 15px;
}
.trend-scale {
  font-size: 12.5px;
}

.trend-empty {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 18px 4px 10px;
  font-size: 13px;
  line-height: 1.8;
}
.trend-empty .el-icon {
  flex: none;
  margin-top: 2px;
  color: var(--mhop-link);
}
.trend-empty p {
  margin: 0;
}

.trend-canvas {
  width: 100%;
  overflow: hidden;
}
.trend-canvas svg {
  display: block;
}
.axis-text {
  font-size: 11px;
  fill: var(--mhop-text-sub);
}

.trend-sum {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 6px;
}
.trend-sum-text {
  font-size: 12.5px;
}

.trend-legend {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--mhop-border);
  font-size: 12px;
  color: var(--mhop-text-sub);
}
.lg-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.lg-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.lg-note {
  margin-left: auto;
  font-size: 12px;
}

@media (max-width: 640px) {
  .trend-card {
    padding: 15px 13px 13px;
  }
  .lg-note {
    margin-left: 0;
  }
}
</style>
