import { ref } from 'vue'

// 显示偏好：减弱动效 / 高对比。
// 与日夜模式（utils/theme.js）同构：状态存 localStorage，最终以 <html> 上的类驱动 main.css。
// 持久化 key 与 index.html 的首屏内联脚本必须一致，否则刷新时会闪一下。
const MOTION_KEY = 'mhop-reduce-motion'
const CONTRAST_KEY = 'mhop-high-contrast'

/** 最终生效的动效偏好；未显式选择时跟随系统的 prefers-reduced-motion */
const reduceMotion = ref(false)
const highContrast = ref(false)

/** 用户是否显式选过减弱动效（选过就不再被系统偏好覆盖） */
let motionExplicit = false
let initialized = false

/** 读取三态：true / false / null（未记录） */
function readFlag(key) {
  try {
    const saved = localStorage.getItem(key)
    if (saved === 'on') return true
    if (saved === 'off') return false
  } catch {
    // 隐私模式等场景下 localStorage 不可用，退化为跟随系统
  }
  return null
}

function writeFlag(key, on) {
  try {
    localStorage.setItem(key, on ? 'on' : 'off')
  } catch {
    // 忽略持久化失败，本次会话内仍然生效
  }
}

function systemPrefersReduceMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

function apply() {
  const root = document.documentElement
  root.classList.toggle('reduce-motion', reduceMotion.value)
  root.classList.toggle('high-contrast', highContrast.value)
}

/** 应用启动时（挂载前）调用。 */
export function initA11y() {
  if (initialized) return
  initialized = true

  const motion = readFlag(MOTION_KEY)
  motionExplicit = motion !== null
  reduceMotion.value = motionExplicit ? motion : systemPrefersReduceMotion()
  highContrast.value = readFlag(CONTRAST_KEY) ?? false

  // 没显式选过时，系统偏好中途改变也跟着走
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (event) => {
      if (motionExplicit) return
      reduceMotion.value = event.matches
      apply()
    }
    if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', onChange)
    else mediaQuery.addListener?.(onChange) // Safari < 14
  }

  apply()
}

export function toggleReduceMotion() {
  reduceMotion.value = !reduceMotion.value
  motionExplicit = true
  writeFlag(MOTION_KEY, reduceMotion.value)
  apply()
}

export function toggleHighContrast() {
  highContrast.value = !highContrast.value
  writeFlag(CONTRAST_KEY, highContrast.value)
  apply()
}

export function useA11y() {
  return { reduceMotion, highContrast, toggleReduceMotion, toggleHighContrast }
}
