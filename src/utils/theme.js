import { computed, ref } from 'vue'

// 全站外观分三个互相独立的维度（可任意叠加）：
//   1. 日夜模式 mode   → <html class="dark">
//   2. 主题色   accent → <html data-accent="…">   品牌色与主色色阶
//   3. 界面风格 style  → <html data-style="…">    中性色阶 / 圆角 / 阴影 / 字体
// 三个持久化 key 都要与 index.html 中的首屏引导脚本保持一致，避免刷新时闪烁。
const STORAGE_KEY = 'mhop-theme'
const ACCENT_KEY = 'mhop-accent'
const STYLE_KEY = 'mhop-style'

/** 三种外观选项，顺序即下拉菜单与分段控件的展示顺序 */
export const THEME_OPTIONS = [
  { value: 'system', label: '跟随系统', icon: 'Monitor' },
  { value: 'light', label: '浅色', icon: 'Sunny' },
  { value: 'dark', label: '深色', icon: 'Moon' },
]

const VALUES = THEME_OPTIONS.map((option) => option.value)

/** 两种界面风格，顺序即下拉菜单与分段控件的展示顺序 */
export const STYLE_OPTIONS = [
  { value: 'default', label: '默认', icon: 'Brush' },
  { value: 'win11', label: 'Windows 11', icon: 'Monitor' },
]

const STYLE_VALUES = STYLE_OPTIONS.map((option) => option.value)
const DEFAULT_STYLE = STYLE_OPTIONS[0].value

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
  // 配合「Windows 11」风格最搭，但**没有**做成「选风格就自动切色」——
  // 那会覆盖用户自己选过的主题色，宁可让他自己挑。
  // label 只叫「蓝色」：它首先是色板里的一个蓝，不该绑死在某个风格名上。
  // value 仍保留 `winblue` —— 改名会让已存过 localStorage['mhop-accent'] 的用户被回落到默认青绿。
  { value: 'winblue', label: '蓝色', color: '#0f6cbd' },
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
/** 界面风格 */
const style = ref(DEFAULT_STYLE)

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

function readStoredStyle() {
  try {
    const saved = localStorage.getItem(STYLE_KEY)
    return STYLE_VALUES.includes(saved) ? saved : DEFAULT_STYLE
  } catch {
    return DEFAULT_STYLE
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
  root.dataset.style = style.value
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
  style.value = readStoredStyle()
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

/** 指定界面风格，取值见 STYLE_OPTIONS */
export function setStyle(next) {
  if (!STYLE_VALUES.includes(next)) return
  style.value = next
  try {
    localStorage.setItem(STYLE_KEY, next)
  } catch {
    // 忽略持久化失败，本次会话内仍然生效
  }
  applyTheme()
}

export function useTheme() {
  return { mode, isDark, accent, style, setTheme, toggleTheme, setAccent, setStyle }
}
