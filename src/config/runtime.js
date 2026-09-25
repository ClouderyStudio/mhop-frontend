/**
 * 运行时环境配置。
 *
 * 解析优先级（高 -> 低）：
 *   1. 运行时注入：部署后可直接修改 dist/env.js 里的 window.__MHOP_ENV__
 *   2. 构建期变量：VITE_MHOP_API_BASE_URL / VITE_MHOP_ASSET_BASE_URL
 *   3. 内置默认值：API 基地址 /mhop（同源反向代理部署）
 *
 * 注意：VITE_ 前缀的变量会被打包进前端产物，属于公开信息，请勿写入任何密钥。
 */

/** 默认 API 基地址：MHOP 全部接口都在 /mhop 前缀下。 */
const DEFAULT_API_BASE_URL = '/mhop'

// 构建期变量必须在源码里写成字面量成员访问，Vite 才能在构建时静态替换。
const BUILD_TIME_ENV = {
  apiBaseUrl: import.meta.env.VITE_MHOP_API_BASE_URL,
  assetBaseUrl: import.meta.env.VITE_MHOP_ASSET_BASE_URL,
}

/** 是否为绝对地址（含 //host 形式的协议相对地址）。 */
function isAbsoluteUrl(value) {
  return /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(value)
}

/** 取绝对地址的源（scheme + host）；相对地址返回空串。 */
function originOf(value) {
  if (!isAbsoluteUrl(value)) return ''
  const matched = /^((?:[a-z][a-z0-9+.-]*:)?\/\/[^/]+)/i.exec(value)
  return matched ? matched[1] : ''
}

/** 规范化基地址：去掉首尾空白与末尾斜杠；相对地址补上前导斜杠。 */
function normalizeBaseUrl(raw, fallback) {
  const value = typeof raw === 'string' ? raw.trim() : ''
  if (!value || value === '/') return fallback
  if (isAbsoluteUrl(value)) return value.replace(/\/+$/, '')
  return '/' + value.replace(/^\/+|\/+$/g, '')
}

/** 读取部署时注入的运行时配置（dist/env.js）。 */
function readInjectedEnv() {
  if (typeof window === 'undefined') return {}
  const injected = window.__MHOP_ENV__
  return injected && typeof injected === 'object' ? injected : {}
}

/** 运行时值优先，其次构建期值；都为空时交给调用方兜底。 */
function resolve(runtimeValue, buildValue) {
  const runtime = typeof runtimeValue === 'string' ? runtimeValue.trim() : ''
  if (runtime) return { value: runtime, source: 'runtime' }
  const build = typeof buildValue === 'string' ? buildValue.trim() : ''
  if (build) return { value: build, source: 'build' }
  return { value: '', source: 'default' }
}

const injected = readInjectedEnv()
const api = resolve(injected.apiBaseUrl, BUILD_TIME_ENV.apiBaseUrl)
const asset = resolve(injected.assetBaseUrl, BUILD_TIME_ENV.assetBaseUrl)

/** axios 的 baseURL：绝对地址直连后端，相对地址走同源反向代理或开发代理。 */
export const API_BASE_URL = normalizeBaseUrl(api.value, DEFAULT_API_BASE_URL)

/** API 基地址来源：runtime / build / default，便于部署时排查。 */
export const API_BASE_SOURCE = api.value ? api.source : 'default'

/**
 * 图片等静态资源的基地址。
 * 未显式配置时：API 为绝对地址则取其源，因为后端本地存储返回的是 /mhop/uploads/... 相对路径；
 * 同源部署时保持空串，继续使用相对路径。
 */
export const ASSET_BASE_URL = asset.value
  ? normalizeBaseUrl(asset.value, '')
  : originOf(API_BASE_URL)

/** 供启动日志使用的一行摘要。 */
export function runtimeSummary() {
  const sources = { runtime: '运行时注入', build: '构建期变量', default: '默认值' }
  return 'API 基地址 ' + API_BASE_URL + '（来源：' + (sources[API_BASE_SOURCE] || API_BASE_SOURCE) + '）'
}
