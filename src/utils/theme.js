import { computed, ref } from 'vue'

// 全站外观：日夜模式三态 'system' | 'light' | 'dark' + 主题色（强调色）预设。
// <html class="dark"> 驱动 Element Plus 官方暗色变量与自定义令牌；
// <html data-accent="…"> 驱动品牌色与主色色阶。
// 两个持久化 key 都要与 index.html 中的首屏引导脚本保持一致，避免刷新时闪烁。
const STORAGE_KEY = 'mhop-theme'
const ACCENT_KEY = 'mhop-accent'

/** 三种外观选项，顺序即下拉菜单与分段控件的展示顺序 */
export const THEME_OPTIONS = [
  { value: 'system', label: '跟随系统', icon: 'Monitor' },
  { value: 'light', label: '浅色', icon: 'Sunny' },
  { value: 'dark', label: '深色', icon: 'Moon' },
]

const VALUES = THEME_OPTIONS.map((option) => option.value)

/**
 * 主题色预设。
 * `color` 只用于下拉菜单里的色点，取值须与 main.css 中对应 `html[data-accent=…]`
 * 段落的品牌色一致——改一处要顺手改另一处。
 */
export const ACCENT_OPTIONS = [
  { value: 'teal', label: '青绿', color: '#2f8f83' },
  { value: 'indigo', label: '靛蓝', color: '#3f4fb8' },
  { value: 'rose', label: '玫瑰', color: '#b03e63' },
  { value: 'amber', label: '琥珀', color: '#9c6510' },
  { value: 'leaf', label: '松绿', color: '#2f7f4d' },
]

const ACCENT_VALUES = ACCENT_OPTIONS.map((option) => option.value)
const DEFAULT_ACCENT = ACCENT_OPTIONS[0].value

/** 深色下地址栏取页面底色；浅色取当前主题色（运行时回读 CSS，见 applyTheme） */
const DARK_BAR = '#0f141a'

function accentColor(value) {
  return (
    ACCENT_OPTIONS.find((option) => option.value === value)?.color ??
    ACCENT_OPTIONS[0].color
  )
}

/** 用户的选择（持久化）；'system' 表示交给系统偏好决定 */
const mode = ref('system')
/** 系统当前偏好，仅在 mode 为 'system' 时决定最终外观 */
const systemDark = ref(false)
/** 主题色预设 */
const accent = ref(DEFAULT_ACCENT)

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

function readStoredAccent() {
  try {
    const saved = localStorage.getItem(ACCENT_KEY)
    return ACCENT_VALUES.includes(saved) ? saved : DEFAULT_ACCENT
  } catch {
    return DEFAULT_ACCENT
  }
}

function systemPrefersDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

function applyTheme() {
  const dark = isDark.value
  const root = document.documentElement
  root.classList.toggle('dark', dark)
  root.dataset.accent = accent.value
  // 主题色只维护在 CSS 里，这里回读真实生效值，避免在 JS 里再存一份色板。
  // 必须在写完 data-accent 之后再读，且 getComputedStyle 会强制一次样式重算。
  // 样式表尚未就绪时（首屏 link 还没应用）拿到空串，退化为该预设的色值。
  const primary =
    getComputedStyle(root).getPropertyValue('--mhop-teal').trim() ||
    accentColor(accent.value)
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', dark ? DARK_BAR : primary)
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
  accent.value = readStoredAccent()
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

/** 指定主题色预设，取值见 ACCENT_OPTIONS */
export function setAccent(next) {
  if (!ACCENT_VALUES.includes(next)) return
  accent.value = next
  try {
    localStorage.setItem(ACCENT_KEY, next)
  } catch {
    // 忽略持久化失败，本次会话内仍然生效
  }
  applyTheme()
}

export function useTheme() {
  return { mode, isDark, accent, setTheme, toggleTheme, setAccent }
}
