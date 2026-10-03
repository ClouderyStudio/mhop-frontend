import { ref } from 'vue'

// 全站日夜模式：<html class="dark"> 同时驱动 Element Plus 官方暗色变量与自定义 CSS 变量。
// 持久化 key 与 index.html 中的首屏引导脚本保持一致，避免刷新时白屏闪烁。
const STORAGE_KEY = 'mhop-theme'

const isDark = ref(false)

function systemPrefersDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

function applyTheme() {
  document.documentElement.classList.toggle('dark', isDark.value)
}

/** 应用启动时（挂载前）调用：优先读取用户选择，否则跟随系统偏好。 */
export function initTheme() {
  let saved = null
  try {
    saved = localStorage.getItem(STORAGE_KEY)
  } catch {
    // 隐私模式等场景下 localStorage 可能不可用，退化为系统偏好
  }
  isDark.value = saved === null ? systemPrefersDark() : saved === 'dark'
  applyTheme()
}

export function toggleTheme() {
  isDark.value = !isDark.value
  try {
    localStorage.setItem(STORAGE_KEY, isDark.value ? 'dark' : 'light')
  } catch {
    // 忽略持久化失败，本次会话内仍然生效
  }
  applyTheme()
}

export function useTheme() {
  return { isDark, toggleTheme }
}
