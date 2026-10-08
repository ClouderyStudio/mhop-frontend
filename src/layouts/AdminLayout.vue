<template>
  <el-container class="admin-shell">
    <el-aside width="220px" class="admin-aside">
      <div class="logo">
        <BrandMark :size="36" />
        <div>
          <strong>心光 MHOP</strong>
          <small>运营管理后台</small>
        </div>
      </div>
      <el-menu :default-active="route.path" router background-color="transparent" text-color="#c2cedb"
        active-text-color="#ffffff">
        <el-menu-item v-for="item in menus" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon><span>{{ item.name }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="admin-header">
        <div class="header-left">
          <span class="admin-burger" role="button" aria-label="打开菜单" @click="drawer = true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
              stroke-width="2.2" stroke-linecap="round">
              <line x1="3.5" y1="6.5" x2="20.5" y2="6.5" />
              <line x1="3.5" y1="12" x2="20.5" y2="12" />
              <line x1="3.5" y1="17.5" x2="20.5" y2="17.5" />
            </svg>
          </span>
          <strong class="brand-mini">心光 MHOP 后台</strong>
          <router-link to="/" class="back-site"><el-icon><Monitor /></el-icon> 访问前台</router-link>
          <el-dropdown trigger="click" class="theme-dropdown" @command="onDisplayCommand">
            <button
              class="admin-theme"
              type="button"
              :title="`外观与显示：${displayLabel}`"
              :aria-label="`外观与显示：${displayLabel}`"
            >
              <el-icon :size="18"><Moon v-if="!isDark" /><Sunny v-else /></el-icon>
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
        </div>
        <el-dropdown @command="onCommand">
          <span class="user-trigger">
            <el-icon><Avatar /></el-icon>
            {{ auth.displayName }}<span class="admin-role">（{{ auth.isSuperadmin ? '超级管理员' : '管理员' }}）</span>
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="site"><el-icon><Monitor /></el-icon>返回前台</el-dropdown-item>
              <el-dropdown-item command="logout"><el-icon><SwitchButton /></el-icon>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>
      <el-main class="admin-main">
        <router-view />
      </el-main>
    </el-container>

    <!-- 移动端抽屉菜单（桌面端隐藏侧栏，不显示汉堡） -->
    <el-drawer v-model="drawer" direction="ltr" size="72%" :with-header="false" class="admin-drawer">
      <div class="drawer-brand">
        <BrandMark :size="34" />
        <div>
          <strong>心光 MHOP</strong>
          <small>运营管理后台</small>
        </div>
      </div>
      <nav class="drawer-nav">
        <a v-for="item in menus" :key="item.path"
          :class="['drawer-nav-item', { active: route.path === item.path }]"
          @click="go(item.path)">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.name }}</span>
        </a>
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
            <el-switch size="small" :model-value="reduceMotion" @change="toggleReduceMotion" />
          </label>
          <label class="drawer-pref">
            <span>高对比度</span>
            <el-switch size="small" :model-value="highContrast" @change="toggleHighContrast" />
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
    </el-drawer>
  </el-container>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ADMIN_PERMS } from '../utils/permissions'
import { useA11y } from '../utils/a11y'
import { ACCENT_OPTIONS, THEME_OPTIONS, useTheme } from '../utils/theme'
import BrandMark from '../components/BrandMark.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
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
const drawer = ref(false)

// 一个下拉承载三组设置：外观三态、显示偏好开关、主题色预设，用 command 前缀区分
function onDisplayCommand(cmd) {
  if (cmd === 'toggle-motion') return toggleReduceMotion()
  if (cmd === 'toggle-contrast') return toggleHighContrast()
  if (typeof cmd === 'string' && cmd.startsWith('accent:')) return setAccent(cmd.slice(7))
  return setTheme(cmd)
}

// 菜单按被授予的模块权限过滤（超管拥有全部）
const iconOf = {
  dashboard: 'DataBoard',
  review: 'Checked',
  users: 'UserFilled',
  ai_logs: 'MagicStick',
  bottles: 'Promotion',
}
const menus = computed(() =>
  ADMIN_PERMS.filter((p) => auth.can(p.code)).map((p) => ({
    path: p.path,
    name: p.name,
    icon: iconOf[p.code],
  }))
)

function go(path) {
  drawer.value = false
  router.push(path)
}

function onCommand(cmd) {
  if (cmd === 'site' || cmd === 'logout') {
    if (cmd === 'logout') auth.logout()
    router.push('/')
  }
}
</script>

<style scoped>
.admin-shell {
  height: 100vh;
  /* 支持动态视口的浏览器用 dvh，避免移动端地址栏收起/展开造成底部留白或遮挡 */
  height: 100dvh;
}
.admin-aside {
  background: linear-gradient(180deg, #1d2835 0%, #16202b 100%);
  display: flex;
  flex-direction: column;
}
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  padding: 20px 18px 16px;
}
.logo strong {
  display: block;
  font-size: 16px;
}
.logo small {
  color: #8fa3b6;
  font-size: 11.5px;
}
.admin-aside :deep(.el-menu) {
  border-right: none;
}
.admin-aside :deep(.el-menu-item.is-active) {
  background: rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  margin: 4px 10px;
}
.admin-aside :deep(.el-menu-item) {
  border-radius: 8px;
  margin: 4px 10px;
}
.admin-header {
  background: var(--mhop-card);
  border-bottom: 1px solid var(--mhop-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.brand-mini {
  display: none;
  font-size: 15.5px;
  color: var(--mhop-text);
  white-space: nowrap;
}
.admin-burger {
  display: none;
  color: var(--mhop-text);
  cursor: pointer;
  padding: 4px;
  line-height: 0;
}
.back-site {
  color: var(--mhop-text-sub);
  font-size: 13.5px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
/* 外观三选一：圆钮作为 el-dropdown 的触发器，保持原有圆形按钮外观 */
.theme-dropdown {
  display: inline-flex;
  flex: none;
}
.admin-theme {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--mhop-text-sub);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.admin-theme:hover {
  background: var(--mhop-link-light);
  color: var(--mhop-link);
}
.user-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  outline: none;
  font-size: 14px;
  white-space: nowrap;
}
.admin-main {
  background: var(--mhop-bg);
  padding: 22px;
}

/* 移动端：侧栏收进抽屉，顶栏放汉堡 */
@media (max-width: 760px) {
  .admin-shell {
    height: auto;
    min-height: 100vh;
  }
  .admin-aside {
    display: none;
  }
  .admin-burger {
    display: inline-flex;
  }
  .brand-mini {
    display: block;
  }
  .back-site {
    display: none;
  }
  .admin-role {
    display: none;
  }
  .admin-header {
    height: 54px !important;
    padding: env(safe-area-inset-top) calc(12px + env(safe-area-inset-right)) 0
      calc(12px + env(safe-area-inset-left));
  }
  .admin-main {
    padding: 14px calc(10px + env(safe-area-inset-right)) calc(14px + env(safe-area-inset-bottom))
      calc(10px + env(safe-area-inset-left));
  }
}
</style>

<!-- 抽屉被 teleport 到 body，scoped 样式选不中，使用全局样式块 -->
<style>
.admin-drawer.el-drawer {
  background: linear-gradient(180deg, #1d2835 0%, #16202b 100%);
}
.admin-drawer .el-drawer__body {
  padding: 0;
  overflow-y: auto;
}
.admin-drawer .drawer-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  padding: 22px 18px 14px;
}
.admin-drawer .drawer-brand strong {
  display: block;
  font-size: 16px;
}
.admin-drawer .drawer-brand small {
  color: #8fa3b6;
  font-size: 11.5px;
}
.admin-drawer .drawer-nav {
  display: flex;
  flex-direction: column;
  padding: 6px 10px;
}
.admin-drawer .drawer-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 12px;
  margin: 3px 0;
  border-radius: 8px;
  color: #c2cedb;
  font-size: 15.5px;
  cursor: pointer;
}
.admin-drawer .drawer-nav-item.active {
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
  font-weight: 600;
}

/* 后台抽屉底色固定为深蓝灰（不随日夜模式变），外观分段控件需单独配成深色描边风格 */
.admin-drawer .drawer-theme {
  padding: 16px 12px 0;
}
.admin-drawer .drawer-theme-label {
  color: #8fa3b6;
}
.admin-drawer .el-segmented {
  --el-segmented-bg-color: rgba(255, 255, 255, 0.08);
  --el-segmented-color: #c2cedb;
  --el-segmented-item-hover-bg-color: rgba(255, 255, 255, 0.14);
  --el-segmented-item-hover-color: #ffffff;
  --el-segmented-item-selected-bg-color: rgba(255, 255, 255, 0.2);
  --el-segmented-item-selected-color: #ffffff;
}
/* 显示偏好开关：抽屉底色固定深蓝灰，文字与描边单独配 */
.admin-drawer .drawer-prefs {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 4px;
}
.admin-drawer .drawer-pref {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  font-size: 14px;
  color: #c2cedb;
  cursor: pointer;
}
/* 关闭态的开关在深底上默认太暗，抬一档描边与滑块 */
.admin-drawer .el-switch {
  --el-switch-off-color: rgba(255, 255, 255, 0.24);
}
/* 主题色色块的选中描边在深底上不能用 --mhop-text（浅色模式下是深色，会看不见） */
.admin-drawer .drawer-accent.on {
  outline-color: #ffffff;
}
</style>
