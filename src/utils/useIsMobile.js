import { onBeforeUnmount, ref } from 'vue'

// 响应式窄屏判断，默认断点 760px（与 AdminLayout 侧栏收进抽屉的断点一致）
export function useIsMobile(breakpoint = 760) {
  const mql = window.matchMedia(`(max-width: ${breakpoint}px)`)
  const isMobile = ref(mql.matches)
  const onChange = (e) => {
    isMobile.value = e.matches
  }
  mql.addEventListener('change', onChange)
  onBeforeUnmount(() => mql.removeEventListener('change', onChange))
  return isMobile
}
