<template>
  <div class="companion-page">
    <section class="page-hero mhop-card">
      <div class="hero-text">
        <span class="hero-badge">匿名 · 免费 · 有人回应</span>
        <h1>陪伴</h1>
        <p>把心事说出来，不用一个人扛。这里有相似的经历，也有愿意听你说话的人。</p>
      </div>
      <div class="hero-emoji">🤝</div>
    </section>

    <div class="entry-grid">
      <router-link to="/forum" class="entry-card mhop-card">
        <span class="entry-icon" style="background: var(--mhop-link-light); color: var(--mhop-link)">
          <el-icon :size="28"><ChatLineSquare /></el-icon>
        </span>
        <div>
          <h3>互助论坛</h3>
          <p class="text-sub">按感受选择板块，匿名发帖，AI 与社区一起回应你。</p>
        </div>
        <span class="entry-more">进入论坛 →</span>
      </router-link>
      <router-link to="/bottles" class="entry-card mhop-card">
        <span class="entry-icon" style="background: var(--mhop-ocean-light); color: var(--mhop-ocean)">
          <el-icon :size="28"><Promotion /></el-icon>
        </span>
        <div>
          <h3>漂流瓶</h3>
          <p class="text-sub">把心事装进瓶子投入海里，等一位陌生人捞起，开启匿名对话。</p>
        </div>
        <span class="entry-more">去看看 →</span>
      </router-link>
    </div>

    <section class="boards-card mhop-card">
      <div class="section-head">
        <h2>按感受找板块</h2>
        <router-link to="/forum" class="text-sub">全部主题 →</router-link>
      </div>
      <div class="board-grid">
        <router-link
          v-for="b in BOARDS"
          :key="b.slug"
          :to="{ path: '/forum', query: { board: b.slug } }"
          class="board-item"
          :style="{ borderColor: b.color + '55', background: b.color + '12' }"
        >
          <span class="board-dot" :style="{ background: b.color }" />
          <strong :style="{ color: b.color }">{{ b.name }}</strong>
          <small class="text-sub">{{ b.desc }}</small>
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import { BOARDS } from '../../utils/boards'
</script>

<style scoped>
.page-hero {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 34px 38px;
  background: linear-gradient(120deg, #ffffff 0%, #eef6f4 100%);
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
  background: var(--mhop-teal-light);
  color: var(--mhop-teal-dark);
  font-size: 12.5px;
  padding: 4px 12px;
  border-radius: 999px;
}
.hero-emoji {
  margin-left: auto;
  font-size: 78px;
  line-height: 1;
  animation: floaty 4s ease-in-out infinite;
}
@keyframes floaty {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-9px); }
}
.entry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 18px;
  margin-top: 18px;
}
.entry-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  transition: transform 0.15s, box-shadow 0.15s;
}
.entry-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--mhop-shadow-hover);
}
.entry-icon {
  width: 54px;
  height: 54px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.entry-card h3 {
  margin: 0 0 6px;
  font-size: 17px;
}
.entry-card p {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.7;
}
.entry-more {
  margin-left: auto;
  color: var(--mhop-link);
  font-size: 13px;
  flex-shrink: 0;
}
.boards-card {
  margin-top: 18px;
  padding: 22px 24px 24px;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.section-head h2 {
  margin: 0;
  font-size: 19px;
}
.board-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}
.board-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid transparent;
  transition: transform 0.15s;
}
.board-item:hover {
  transform: translateY(-2px);
}
.board-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}
.board-item strong {
  font-size: 15px;
}
.board-item small {
  font-size: 12.5px;
  line-height: 1.65;
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
  .entry-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .entry-card {
    padding: 18px;
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .entry-more {
    margin-left: 70px;
  }
  .board-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
