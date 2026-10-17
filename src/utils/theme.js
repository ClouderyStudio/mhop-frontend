import { computed, ref } from 'vue'

// 全站日夜模式：三态 'system' | 'light' | 'dark'。
// <html class="dark"> 同时驱动 Element Plus 官方暗色变量与自定义 CSS 变量。
// 持久化 key 与 index.html 中的首屏引导脚本保持一致，避免刷新时白屏闪烁。
const STORAGE_KEY = 'mhop-theme'

/** 三种外观选项，顺序即下拉菜单与分段控件的展示顺序 */
export const THEME_OPTIONS = [
  { value: 'system', label: '跟随系统', icon: 'Monitor' },
  { value: 'light', label: '浅色', icon: 'Sunny' },
  { value: 'dark', label: '深色', icon: 'Moon' },
]

const VALUES = THEME_OPTIONS.map((option) => option.value)

/** 浏览器地址栏 / 状态栏底色：浅色沿用既有青绿，深色取 --mhop-bg */
const THEME_COLOR = { light: '#2f8f83', dark: '#0f141a' }

/** 用户的选择（持久化）；'system' 表示交给系统偏好决定 */
const mode = ref('system')
/** 系统当前偏好，仅在 mode 为 'system' 时决定最终外观 */
const systemDark = ref(false)

let mediaQuery = null
let initialized = false

/** 最终生效的外观：跟随系统时取系统偏好，否则取用户显式选择 */
const isDark = computed(() =>
  mode.value === 'system' ? systemDark.value : mode.value === 'dark'
)

function readStored() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return VALUES.includes(saved) ? saved : 'system'
  } catch {
    // 隐私模式等场景下 localStorage 不可用，退化为跟随系统
    return 'system'
  }
}

function systemPrefersDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

function applyTheme() {
  const dark = isDark.value
  document.documentElement.classList.toggle('dark', dark)
  // 移动端地址栏/状态栏底色跟随外观；index.html 里的静态值只作首屏兜底
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', dark ? THEME_COLOR.dark : THEME_COLOR.light)
}

/** 系统偏好变化：处于「跟随系统」时需要立刻反映到页面上 */
function onSystemChange(event) {
  systemDark.value = event.matches
  if (mode.value === 'system') applyTheme()
}

/** 应用启动时（挂载前）调用：恢复用户选择，并开始监听系统偏好变化。 */
export function initTheme() {
  if (initialized) return
  initialized = true

  mode.value = readStored()
  systemDark.value = systemPrefersDark()

  if (window.matchMedia) {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    // Safari < 14 只实现了已废弃的 addListener
    if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', onSystemChange)
    else mediaQuery.addListener?.(onSystemChange)
  }

  applyTheme()
}

/** 指定外观：'system' | 'light' | 'dark' */
export function setTheme(next) {
  if (!VALUES.includes(next)) return
  mode.value = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // 忽略持久化失败，本次会话内仍然生效
  }
  applyTheme()
}

/** 在白天 / 黑夜之间快速对调（处于「跟随系统」时以当前实际外观为基准） */
export function toggleTheme() {
  setTheme(isDark.value ? 'light' : 'dark')
}

export function useTheme() {
  return { mode, isDark, setTheme, toggleTheme }
}
