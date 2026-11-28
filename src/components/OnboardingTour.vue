<template>
  <el-dialog
    v-model="visible"
    :show-close="false"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="min(560px, 92vw)"
    align-center
    append-to-body
    class="onboarding-dialog"
  >
    <div class="ob-wrap">
      <div class="ob-top">
        <span class="ob-step">新手引导 · {{ index + 1 }} / {{ STEPS.length }}</span>
        <button type="button" class="ob-skip" @click="finish">跳过引导</button>
      </div>

      <div class="ob-emoji">{{ step.emoji }}</div>
      <h3>{{ step.title }}</h3>
      <p class="ob-desc">{{ step.desc }}</p>
      <ul class="ob-points">
        <li v-for="p in step.points" :key="p">{{ p }}</li>
      </ul>

      <div class="ob-dots">
        <span v-for="(s, i) in STEPS" :key="s.title" :class="{ on: i === index, done: i < index }" />
      </div>

      <div class="ob-actions">
        <el-button v-if="index > 0" round @click="index -= 1">上一步</el-button>
        <el-button v-if="index < STEPS.length - 1" type="primary" round @click="index += 1">下一步</el-button>
        <el-button v-else type="primary" round @click="startUsing">开始使用</el-button>
      </div>
      <p class="ob-hint">随时可在右上角头像菜单里重新打开新手引导</p>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const STEPS = [
  {
    emoji: '👋',
    title: '欢迎来到心光 MHOP',
    desc: '这里是一个匿名优先、免费公益的心理自助空间。用 1 分钟认识这里的六个入口，之后随时可以跳着用。',
    points: ['不必实名，发布时可随时选择匿名', 'AI 会即时回应，管理员持续巡检'],
  },
  {
    emoji: '🤝',
    title: '陪伴：不一个人扛',
    desc: '“陪伴”里聚合了互助论坛和漂流瓶。可以按感受选择板块发帖，也可以把心事装进瓶子，等一位陌生人捞起。',
    points: ['互助论坛：危机求助 / 情绪树洞 / 压力倾诉等 7 个板块', '漂流瓶：匿名投递，收到回应后持续对话'],
  },
  {
    emoji: '🧠',
    title: '测评：先了解自己的状态',
    desc: 'DASS-21 与 PANAS 标准量表，从抑郁、焦虑、压力与正负情绪几个维度给出分档解读，并附上对应的自助建议。',
    points: ['约 3-5 分钟完成，结果可回看', '测评不是诊断，只作为自我觉察的参考'],
  },
  {
    emoji: '🌬️',
    title: '调节：情绪上头时先慢下来',
    desc: '跟着 4-4-6 或 4-7-8 呼吸练习，或做一次 5-4-3-2-1 接地练习，把注意力带回身体和此刻。',
    points: ['呼吸圆圈会带你掌握节奏', '心慌、解离、失眠时都可以用'],
  },
  {
    emoji: '📖',
    title: '记录：看见情绪的变化',
    desc: '每天一分钟记下心情，连续天数与最近 7 天轨迹会慢慢呈现规律。记录只保存在你的本机，不会上传。',
    points: ['支持补写文字，随时删除', '更换设备或清除浏览器数据后无法恢复'],
  },
  {
    emoji: '🆘',
    title: '求助：撑不住时别硬撑',
    desc: '“求助”页有 24 小时心理援助热线，可一键拨号，也写了当下能做的三件事。生命优先，任何时候都可以直接打。',
    points: ['全国心理援助热线 12356', '危机干预 010-82951332，紧急情况拨 110 / 120'],
  },
]

const auth = useAuthStore()
const router = useRouter()

const visible = ref(false)
const index = ref(0)

const step = computed(() => STEPS[index.value])

function uid() {
  return auth.user?.id ?? auth.user?.username ?? ''
}
const pendingKey = () => `mhop_onboarding_pending_${uid()}`
const doneKey = () => `mhop_onboarding_done_${uid()}`

function checkNewUser() {
  if (!auth.isLoggedIn || !uid()) return
  if (visible.value) return
  if (localStorage.getItem(pendingKey()) && !localStorage.getItem(doneKey())) {
    index.value = 0
    visible.value = true
  }
}

function finish() {
  if (uid()) {
    localStorage.setItem(doneKey(), '1')
    localStorage.removeItem(pendingKey())
  }
  visible.value = false
}

function startUsing() {
  finish()
  router.push('/')
}

function replay() {
  if (!auth.isLoggedIn) return
  index.value = 0
  visible.value = true
}

let timer = null
watch(
  () => auth.isLoggedIn,
  (v) => {
    if (v) {
      // 注册成功后路由会跳转，稍等再弹，避免盖住跳转过程
      timer = window.setTimeout(checkNewUser, 700)
    }
  },
  { immediate: true }
)

onMounted(() => {
  window.addEventListener('mhop:onboarding', replay)
})
onBeforeUnmount(() => {
  window.removeEventListener('mhop:onboarding', replay)
  if (timer) window.clearTimeout(timer)
})
</script>

<style scoped>
.ob-wrap {
  text-align: center;
  padding: 4px 4px 0;
}
.ob-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.ob-step {
  font-size: 12.5px;
  color: var(--mhop-text-sub);
  letter-spacing: 0.3px;
}
.ob-skip {
  border: none;
  background: none;
  padding: 4px 2px;
  font-size: 12.5px;
  color: var(--mhop-text-sub);
  cursor: pointer;
}
.ob-skip:hover {
  color: var(--mhop-link);
}
.ob-emoji {
  font-size: 52px;
  line-height: 1.2;
  margin: 8px 0 6px;
}
.ob-wrap h3 {
  margin: 0 0 8px;
  font-size: 21px;
}
.ob-desc {
  margin: 0 auto;
  max-width: 440px;
  font-size: 14px;
  line-height: 1.85;
  color: var(--mhop-text-sub);
}
.ob-points {
  margin: 14px auto 0;
  padding: 12px 16px;
  max-width: 440px;
  list-style: none;
  text-align: left;
  background: var(--mhop-sand);
  border-radius: 12px;
}
.ob-points li {
  position: relative;
  padding-left: 16px;
  font-size: 12.8px;
  line-height: 1.8;
  color: var(--mhop-text-sub);
}
.ob-points li + li {
  margin-top: 4px;
}
.ob-points li::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 9px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--mhop-teal);
}
.ob-dots {
  display: flex;
  justify-content: center;
  gap: 7px;
  margin: 20px 0 16px;
}
.ob-dots span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--mhop-border-strong);
  transition: all 0.2s;
}
.ob-dots span.done {
  background: var(--mhop-teal-light);
}
.ob-dots span.on {
  width: 20px;
  border-radius: 999px;
  background: var(--mhop-teal);
}
.ob-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}
.ob-hint {
  margin: 14px 0 0;
  font-size: 11.8px;
  color: var(--mhop-text-sub);
}
</style>
