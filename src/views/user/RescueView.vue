<template>
  <div class="rescue-page">
    <section class="rescue-hero mhop-card">
      <div class="hero-text">
        <span class="hero-badge">生命优先 · 24 小时 · 免费保密</span>
        <h1>你现在安全吗？</h1>
        <p>
          如果此刻有伤害自己的念头，请先停一停，把危险的东西放远一点，
          然后拨打下面任意一个号码。你不需要解释太多，说“我现在很难受”就够了。
        </p>
        <a class="call-main" href="tel:12356">
          <el-icon :size="20"><PhoneFilled /></el-icon>
          立即拨打 12356
        </a>
      </div>
      <div class="hero-emoji">🆘</div>
    </section>

    <section class="steps-card mhop-card">
      <h2>现在可以做的三件事</h2>
      <div class="steps-grid">
        <div class="step-item">
          <span class="step-num">1</span>
          <div>
            <strong>离开危险环境</strong>
            <p class="text-sub">走到有人的地方，把药物、刀具等移出视线，让身体先安全。</p>
          </div>
        </div>
        <div class="step-item">
          <span class="step-num">2</span>
          <div>
            <strong>联系一个可信任的人</strong>
            <p class="text-sub">家人、朋友、老师都可以，只要说“你能陪我一会儿吗”。</p>
          </div>
        </div>
        <div class="step-item">
          <span class="step-num">3</span>
          <div>
            <strong>拨打援助热线</strong>
            <p class="text-sub">如果已经危及生命，请立即拨打 110 或 120，不要独自等待。</p>
          </div>
        </div>
      </div>
    </section>

    <section class="hotlines-card mhop-card">
      <div class="section-head">
        <h2>心理援助热线</h2>
        <span class="text-sub">点击即可拨号</span>
      </div>
      <div class="hotline-grid">
        <a
          v-for="h in hotlines"
          :key="h.name"
          class="hotline-item"
          :href="'tel:' + String(h.phone || '').replace(/[^0-9]/g, '')"
        >
          <span class="hotline-tag">{{ h.tag }}</span>
          <strong class="hotline-phone">{{ h.phone || '号码配置中' }}</strong>
          <span class="hotline-name">{{ h.name }}</span>
          <span class="hotline-desc text-sub">{{ h.description }}</span>
        </a>
      </div>
    </section>

    <div class="quick-grid">
      <router-link to="/regulate" class="quick-card mhop-card">
        <span class="quick-emoji">🌬️</span>
        <div>
          <strong>先跟着呼吸慢下来</strong>
          <p class="text-sub">4-4-6 呼吸 + 5-4-3-2-1 接地练习</p>
        </div>
      </router-link>
      <router-link :to="{ path: '/forum', query: { board: 'crisis' } }" class="quick-card mhop-card">
        <span class="quick-emoji">💬</span>
        <div>
          <strong>去危机求助板块</strong>
          <p class="text-sub">匿名说出此刻的感受，会有人回应</p>
        </div>
      </router-link>
      <router-link to="/journal" class="quick-card mhop-card">
        <span class="quick-emoji">📖</span>
        <div>
          <strong>把此刻写下来</strong>
          <p class="text-sub">记录情绪，帮自己看清发生了什么</p>
        </div>
      </router-link>
    </div>

    <p class="foot-tip text-sub">
      本平台提供的 AI 回复仅供心理自助参考，不能替代专业诊断与治疗。
      紧急情况请立即拨打 12356 / 010-82951332 / 110 / 120。
    </p>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import http from '../../api'

const hotlines = ref([
  { name: '全国心理援助热线', phone: '12356', tag: '全国通用 · 24 小时', description: '免费、保密' },
])

onMounted(async () => {
  try {
    const data = await http.get('/hotlines')
    if (Array.isArray(data) && data.length) hotlines.value = data
  } catch {
    /* 保留默认热线 */
  }
})
</script>

<style scoped>
.rescue-hero {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 34px 38px;
  background: linear-gradient(120deg, #fff7f5 0%, #fdeceb 100%);
  border-left: 4px solid var(--mhop-danger);
}
.hero-text h1 {
  margin: 10px 0 12px;
  font-size: 30px;
  color: var(--mhop-danger);
}
.hero-text p {
  margin: 0 0 18px;
  color: var(--mhop-text-sub);
  line-height: 1.85;
  max-width: 640px;
}
.hero-badge {
  display: inline-block;
  background: rgba(216, 58, 46, 0.1);
  color: var(--mhop-danger);
  font-size: 12.5px;
  padding: 4px 12px;
  border-radius: 999px;
}
.call-main {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--mhop-danger);
  color: #fff;
  font-weight: 600;
  font-size: 15px;
  padding: 12px 24px;
  border-radius: 999px;
  box-shadow: 0 8px 20px rgba(216, 58, 46, 0.26);
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
.steps-card,
.hotlines-card {
  margin-top: 18px;
  padding: 22px 24px;
}
.steps-card h2 {
  margin: 0 0 16px;
  font-size: 19px;
}
.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
}
.step-item {
  display: flex;
  gap: 12px;
  padding: 14px;
  border-radius: 12px;
  background: var(--mhop-sand);
}
.step-num {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(216, 58, 46, 0.12);
  color: var(--mhop-danger);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.step-item strong {
  font-size: 14.5px;
}
.step-item p {
  margin: 4px 0 0;
  font-size: 12.5px;
  line-height: 1.65;
}
.hotline-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 12px;
}
.hotline-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--mhop-border);
  background: var(--mhop-card);
  transition: transform 0.15s, box-shadow 0.15s;
}
.hotline-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--mhop-shadow-hover);
}
.hotline-tag {
  font-size: 11.5px;
  color: var(--mhop-danger);
}
.hotline-phone {
  font-size: 21px;
  color: var(--mhop-text);
  letter-spacing: 0.5px;
}
.hotline-name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--mhop-text);
}
.hotline-desc {
  font-size: 12px;
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
.foot-tip {
  margin: 18px 0 0;
  font-size: 12.5px;
  line-height: 1.8;
  text-align: center;
}
@media (max-width: 760px) {
  .rescue-hero {
    padding: 24px 20px;
  }
  .hero-emoji {
    display: none;
  }
  .hero-text h1 {
    font-size: 24px;
  }
  .quick-grid {
    gap: 10px;
  }
}
</style>
