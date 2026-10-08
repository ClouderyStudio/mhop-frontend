<template>
  <div class="app-shell" :class="{ 'has-tabbar': auth.isLoggedIn }" style="min-height: 100vh; display: flex; flex-direction: column">
    <header class="nav-header">
      <div class="mhop-container nav-inner">
        <router-link to="/" class="brand">
          <span class="brand-mark"><BrandMark :size="34" /></span>
          <span>
            <strong>心光 MHOP</strong>
            <small>公益心理辅助平台</small>
          </span>
        </router-link>
        <nav class="nav-links">
          <router-link to="/">首页</router-link>
          <router-link to="/breathe">呼吸练习</router-link>
          <router-link v-if="auth.isLoggedIn" to="/forum">互助论坛</router-link>
          <router-link v-if="auth.isLoggedIn" to="/bottles" class="bottle-link">
            漂流瓶
            <span v-if="bottleStore.unreadTotal > 0" class="bottle-badge">
              {{ bottleStore.unreadTotal > 99 ? '99+' : bottleStore.unreadTotal }}
            </span>
          </router-link>
          <router-link v-if="auth.isLoggedIn" to="/assessment">AI 心理评估</router-link>
        </nav>
        <div class="nav-right">
          <el-dropdown trigger="click" class="theme-dropdown" @command="onDisplayCommand">
            <button
              class="theme-toggle"
              type="button"
              :title="`外观与显示：${displayLabel}`"
              :aria-label="`外观与显示：${displayLabel}`"
            >
              <el-icon :size="20"><Moon v-if="!isDark" /><Sunny v-else /></el-icon>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="opt in THEME_OPTIONS"
                  :key="opt.value"
                  :command="opt.value"
                  :class="{ 'theme-opt-on': mode === opt.value }"
                >
                  <el-icon><component :is="opt.icon" /></el-icon>{{ opt.label }}
                  <el-icon v-if="mode === opt.value" class="theme-opt-check"><Check /></el-icon>
                </el-dropdown-item>
                <!-- 显示偏好：与日夜模式同处一个菜单，选项太多容易找不到入口 -->
                <el-dropdown-item
                  divided
                  command="toggle-motion"
                  :class="{ 'theme-opt-on': reduceMotion }"
                >
                  <el-icon><VideoPause /></el-icon>减弱动效
                  <el-icon v-if="reduceMotion" class="theme-opt-check"><Check /></el-icon>
                </el-dropdown-item>
                <el-dropdown-item command="toggle-contrast" :class="{ 'theme-opt-on': highContrast }">
                  <el-icon><View /></el-icon>高对比度
                  <el-icon v-if="highContrast" class="theme-opt-check"><Check /></el-icon>
                </el-dropdown-item>
                <!-- 主题色：单独隔一段，避免和上面两组开关混在一起看不清归属 -->
                <el-dropdown-item
                  v-for="opt in ACCENT_OPTIONS"
                  :key="opt.value"
                  :divided="opt.value === ACCENT_OPTIONS[0].value"
                  :command="`accent:${opt.value}`"
                  :class="{ 'theme-opt-on': accent === opt.value }"
                >
                  <span class="accent-dot" :style="{ background: opt.color }"></span>{{ opt.label }}
                  <el-icon v-if="accent === opt.value" class="theme-opt-check"><Check /></el-icon>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-tag type="success" effect="light" round class="online-tag">
            <el-icon style="vertical-align: -2px"><Connection /></el-icon>
            {{ online.count }} 人在线
          </el-tag>
          <template v-if="auth.isLoggedIn">
            <el-dropdown @command="onCommand" class="user-dropdown">
              <span class="user-trigger">
                <img v-if="auth.user?.avatar" :src="assetUrl(auth.user.avatar)" class="nav-avatar" />
                <el-icon v-else><UserFilled /></el-icon>
                {{ auth.displayName }}
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>个人主页
                  </el-dropdown-item>
                  <el-dropdown-item v-if="auth.isAdmin" command="admin">
                    <el-icon><Setting /></el-icon>管理后台
                  </el-dropdown-item>
                  <el-dropdown-item command="logout">
                    <el-icon><SwitchButton /></el-icon>退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <router-link to="/login" class="login-link"><el-button text>登录</el-button></router-link>
            <router-link to="/register" class="register-link"><el-button type="primary" round>注册</el-button></router-link>
          </template>
          <span class="nav-burger" @click="drawer = true" role="button" aria-label="打开菜单">
            <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor"
              stroke-width="2.2" stroke-linecap="round">
              <line x1="3.5" y1="6.5" x2="20.5" y2="6.5" />
              <line x1="3.5" y1="12" x2="20.5" y2="12" />
              <line x1="3.5" y1="17.5" x2="20.5" y2="17.5" />
            </svg>
          </span>
        </div>
      </div>
    </header>

    <!-- 移动端抽屉菜单 -->
    <el-drawer v-model="drawer" title="菜单" direction="rtl" size="72%" class="nav-drawer">
      <div class="drawer-online">
        <el-icon style="color: #4e9e5f"><Connection /></el-icon>
        {{ online.count }} 人在线
      </div>
      <nav class="drawer-links" @click="drawer = false">
        <router-link to="/"><el-icon><HomeFilled /></el-icon> 首页</router-link>
        <router-link to="/breathe"><el-icon><WindPower /></el-icon> 呼吸放松练习</router-link>
        <router-link v-if="auth.isLoggedIn" to="/forum"><el-icon><ChatLineSquare /></el-icon> 互助论坛</router-link>
        <router-link v-if="auth.isLoggedIn" to="/bottles">
          <el-icon><Promotion /></el-icon> 漂流瓶
          <span v-if="bottleStore.unreadTotal > 0" class="drawer-badge">
            {{ bottleStore.unreadTotal > 99 ? '99+' : bottleStore.unreadTotal }}
          </span>
        </router-link>
        <router-link v-if="auth.isLoggedIn" to="/assessment"><el-icon><DataAnalysis /></el-icon> AI 心理评估</router-link>
        <router-link v-if="auth.isLoggedIn" to="/profile"><el-icon><User /></el-icon> 个人主页</router-link>
      </nav>
      <div class="drawer-theme">
        <span class="drawer-theme-label">外观</span>
        <el-segmented
          block
          size="small"
          :model-value="mode"
          :options="THEME_OPTIONS"
          @change="setTheme"
        />
        <div class="drawer-prefs">
          <label class="drawer-pref">
            <span>减弱动效</span>
            <el-switch
              size="small"
              :model-value="reduceMotion"
              @change="toggleReduceMotion"
            />
          </label>
          <label class="drawer-pref">
            <span>高对比度</span>
            <el-switch
              size="small"
              :model-value="highContrast"
              @change="toggleHighContrast"
            />
          </label>
        </div>
        <div class="drawer-accents" role="group" aria-label="主题色">
          <button
            v-for="opt in ACCENT_OPTIONS"
            :key="opt.value"
            class="drawer-accent"
            :class="{ on: accent === opt.value }"
            type="button"
            :style="{ background: opt.color }"
            :title="opt.label"
            :aria-label="`主题色：${opt.label}`"
            :aria-pressed="accent === opt.value"
            @click="setAccent(opt.value)"
          ></button>
        </div>
      </div>
      <div class="drawer-actions">
        <template v-if="auth.isLoggedIn">
          <el-button v-if="auth.isAdmin" round @click="go('/admin/dashboard')">
            <el-icon><Setting /></el-icon> 管理后台
          </el-button>
          <el-button type="danger" plain round @click="logoutMobile">
            <el-icon><SwitchButton /></el-icon> 退出登录
          </el-button>
          <p class="drawer-user">当前账号：{{ auth.displayName }}</p>
        </template>
        <template v-else>
          <el-button type="primary" round style="width: 100%" @click="go('/login')">登 录</el-button>
          <el-button round style="width: 100%" @click="go('/register')">注 册</el-button>
        </template>
      </div>
    </el-drawer>

    <main class="mhop-container" style="flex: 1; width: 100%; padding-top: 22px; padding-bottom: 40px">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <footer class="site-footer">
      <div class="mhop-container">
        <p>心光 MHOP · 全国性匿名优先公益心理辅助平台</p>
        <p class="text-sub" style="font-size: 12.5px; line-height: 1.8">
          本平台提供的 AI 评估与回复仅供心理自助参考，不能替代专业医学诊断与治疗。若症状持续或加重，请及时前往正规医疗机构就诊。
          <br />紧急情况请立即拨打 12356 / 010-82951332 / 110 / 120。
          <router-link to="/admin/login" style="margin-left: 8px">运营入口</router-link>
        </p>
      </div>
      <!-- 紧急热线横幅：从顶部移至页脚最底部，限宽收窄，不干扰正常浏览 -->
      <div class="mhop-container footer-hotline">
        <EmergencyBanner />
      </div>
    </footer>

    <!-- 移动端底部导航：≤760px 且已登录时显示；未登录移动端靠顶栏/汉堡 -->
    <nav class="mobile-tabbar" v-if="auth.isLoggedIn" aria-label="主导航">
      <router-link to="/" class="tb-item" :class="{ active: tabActive('/') }">
        <el-icon :size="22"><HomeFilled /></el-icon>
        <span>首页</span>
      </router-link>
      <router-link to="/forum" class="tb-item" :class="{ active: tabActive('/forum') }"
        @click="(e) => goAuthTab(e, '/forum')">
        <el-icon :size="22"><ChatLineSquare /></el-icon>
        <span>论坛</span>
      </router-link>
      <router-link to="/bottles" class="tb-item" :class="{ active: tabActive('/bottles') }"
        @click="(e) => goAuthTab(e, '/bottles')">
        <span class="tb-icon">
          <el-icon :size="22"><Promotion /></el-icon>
          <span v-if="bottleStore.unreadTotal > 0" class="tb-badge">
            {{ bottleStore.unreadTotal > 99 ? '99+' : bottleStore.unreadTotal }}
          </span>
        </span>
        <span>漂流瓶</span>
      </router-link>
      <router-link to="/assessment" class="tb-item" :class="{ active: tabActive('/assessment') }"
        @click="(e) => goAuthTab(e, '/assessment')">
        <el-icon :size="22"><DataAnalysis /></el-icon>
        <span>评估</span>
      </router-link>
      <router-link to="/profile" class="tb-item" :class="{ active: tabActive('/profile') }">
        <el-icon :size="22"><User /></el-icon>
        <span>我的</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import EmergencyBanner from '../components/EmergencyBanner.vue'
import BrandMark from '../components/BrandMark.vue'
import { useAuthStore } from '../stores/auth'
import { useOnlineStore } from '../stores/online'
import { useBottleStore } from '../stores/bottles'
import { assetUrl } from '../utils/asset'
import { useA11y } from '../utils/a11y'
import { ACCENT_OPTIONS, THEME_OPTIONS, useTheme } from '../utils/theme'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const online = useOnlineStore()
const bottleStore = useBottleStore()
const { mode, isDark, accent, setTheme, setAccent } = useTheme()
const { reduceMotion, highContrast, toggleReduceMotion, toggleHighContrast } = useA11y()
// 当前外观的中文名，用于圆钮的 title / aria-label
const themeLabel = computed(
  () => THEME_OPTIONS.find((opt) => opt.value === mode.value)?.label ?? '跟随系统'
)
const accentLabel = computed(
  () => ACCENT_OPTIONS.find((opt) => opt.value === accent.value)?.label ?? '青绿'
)
const displayLabel = computed(() => `${themeLabel.value} · ${accentLabel.value}`)

// 一个下拉承载三组设置：外观三态、显示偏好开关、主题色预设，用 command 前缀区分
function onDisplayCommand(cmd) {
  if (cmd === 'toggle-motion') return toggleReduceMotion()
  if (cmd === 'toggle-contrast') return toggleHighContrast()
  if (typeof cmd === 'string' && cmd.startsWith('accent:')) return setAccent(cmd.slice(7))
  return setTheme(cmd)
}
const drawer = ref(false)
let bottleTimer = null

// 底部 tab 激活态：首页精确匹配，其余前缀匹配（如 /bottles/12 仍高亮漂流瓶）
function tabActive(prefix) {
  if (prefix === '/') return route.path === '/'
  return route.path.startsWith(prefix)
}

// 论坛/漂流瓶/评估的路由守卫对未登录是弹回首页；底栏场景改为主动引导去登录
function goAuthTab(e, path) {
  if (!auth.isLoggedIn) {
    e.preventDefault()
    router.push('/login')
  }
}

onMounted(() => {
  if (!auth.isLoggedIn) return
  // 拉取我的瓶子摘要（导航未读角标），之后每 60 秒静默刷新
  bottleStore.refresh(true)
  bottleTimer = window.setInterval(() => bottleStore.refresh(true), 60000)
})

onUnmounted(() => {
  if (bottleTimer) window.clearInterval(bottleTimer)
})

function go(path) {
  drawer.value = false
  router.push(path)
}

function logoutMobile() {
  drawer.value = false
  auth.logout()
  router.push('/')
}

function onCommand(cmd) {
  if (cmd === 'profile') router.push('/profile')
  if (cmd === 'admin') router.push('/admin/dashboard')
  if (cmd === 'logout') {
    ElMessageBox.confirm('确定退出登录吗？', '提示', { type: 'warning' })
      .then(() => {
        auth.logout()
        router.push('/')
      })
      .catch(() => {})
  }
}
</script>

<style scoped>
.nav-header {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--mhop-border);
  position: sticky;
  top: 0;
  z-index: 100;
}
.nav-inner {
  height: 64px;
  display: flex;
  align-items: center;
  gap: 28px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.brand strong {
  display: block;
  font-size: 17px;
  line-height: 1.2;
}
.brand small {
  color: var(--mhop-text-sub);
  font-size: 11.5px;
}
.nav-links {
  display: flex;
  gap: 24px;
  font-size: 15px;
}
.nav-links a {
  color: var(--mhop-text-sub);
  padding: 4px 2px;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
}
.nav-links a.router-link-exact-active {
  color: var(--mhop-link);
  font-weight: 600;
  border-bottom-color: var(--mhop-link);
}
.bottle-link {
  position: relative;
}
.bottle-badge {
  position: absolute;
  top: -6px;
  right: -16px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border-radius: 9px;
  background: #e26d5a;
  color: #fff;
  font-size: 10.5px;
  line-height: 17px;
  text-align: center;
  font-weight: 600;
}
.drawer-badge {
  margin-left: auto;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: #e26d5a;
  color: #fff;
  font-size: 11.5px;
  line-height: 20px;
  text-align: center;
}
.nav-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 14px;
}
/* 外观三选一：圆钮作为 el-dropdown 的触发器，保持原有圆形按钮外观 */
.theme-dropdown {
  display: inline-flex;
  flex: none;
}
/* 日夜模式切换按钮（桌面顶栏 + 移动端均可见） */
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--mhop-text-sub);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.theme-toggle:hover {
  background: var(--mhop-sand);
  color: var(--mhop-link);
}
/* 抽屉内的显示偏好开关：两行右对齐 */
.drawer-prefs {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 4px;
}
.drawer-pref {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  font-size: 14px;
  color: var(--mhop-text);
  cursor: pointer;
}
.user-trigger {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  color: var(--mhop-text);
  outline: none;
}
.nav-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}
.site-footer {
  background: var(--mhop-sand);
  border-top: 1px solid var(--mhop-border);
  padding: 22px 0;
  text-align: center;
  font-size: 13.5px;
}
.site-footer p {
  margin: 4px 0;
}
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.18s ease;
}
.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}

/* 汉堡按钮：桌面端隐藏 */
.nav-burger {
  display: none;
  color: var(--mhop-text);
  cursor: pointer;
  padding: 4px;
  line-height: 0;
}
.nav-burger svg {
  display: block;
}

/* 抽屉菜单 */
.drawer-online {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13.5px;
  color: var(--mhop-text-sub);
  padding: 0 4px 14px;
  border-bottom: 1px solid var(--mhop-border);
}
.drawer-links {
  display: flex;
  flex-direction: column;
  padding: 10px 0;
}
.drawer-links a {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 8px;
  font-size: 16px;
  color: var(--mhop-text);
  border-radius: 10px;
}
.drawer-links a:active,
.drawer-links a.router-link-exact-active {
  background: var(--mhop-link-light);
  color: var(--mhop-link-dark);
  font-weight: 600;
}
.drawer-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}
.drawer-user {
  text-align: center;
  font-size: 12.5px;
  color: var(--mhop-text-sub);
  margin: 4px 0 0;
}

/* ============ 移动端底部 tab 导航（桌面端隐藏） ============ */
.mobile-tabbar {
  display: none;
}
.tb-icon {
  position: relative;
  display: inline-flex;
  line-height: 0;
}
.tb-badge {
  position: absolute;
  top: -7px;
  right: -11px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: #e26d5a;
  color: #fff;
  font-size: 10px;
  line-height: 16px;
  text-align: center;
  font-weight: 600;
}

@media (max-width: 760px) {
  /* 横屏时顶栏避开刘海/状态栏区域 */
  .nav-header {
    padding-top: env(safe-area-inset-top);
  }
  .nav-inner {
    height: 56px;
    gap: 12px;
  }
  .brand-mark {
    width: 34px;
    height: 34px;
    font-size: 18px;
  }
  .brand strong {
    font-size: 15.5px;
  }
  .brand small {
    display: none;
  }
  .nav-links,
  .online-tag,
  .user-dropdown,
  .login-link,
  .register-link,
  .nav-burger {
    display: none;
  }
  main.mhop-container {
    padding-top: 14px !important;
    padding-bottom: 20px !important;
  }
  /* 已登录才为固定底栏让出空间（含 iPhone 底部横条），未登录移动端无死区 */
  .app-shell.has-tabbar {
    padding-bottom: calc(60px + env(safe-area-inset-bottom));
  }
  .site-footer {
    padding-bottom: 22px;
  }

  /* 底部导航 */
  .mobile-tabbar {
    display: flex;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 200;
    height: calc(60px + env(safe-area-inset-bottom));
    padding-bottom: env(safe-area-inset-bottom);
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(8px);
    border-top: 1px solid var(--mhop-border);
  }
  .tb-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    font-size: 11px;
    color: var(--mhop-text-sub);
    -webkit-tap-highlight-color: transparent;
  }
  .tb-item.active {
    color: var(--mhop-link);
    font-weight: 600;
  }
}
</style>