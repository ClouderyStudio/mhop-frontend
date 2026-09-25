import { ASSET_BASE_URL } from '../config/runtime'

/**
 * 把后端返回的图片地址转换成浏览器可加载的地址。
 *
 * 仅用于展示，不要写回后端：后端本地存储返回相对路径（/mhop/uploads/xxx.webp），
 * 前端与 API 不同源时需要补上 API 的源；OSS 等返回绝对地址时原样返回。
 */
export function assetUrl(url) {
  if (typeof url !== 'string') return ''
  const value = url.trim()
  if (!value) return ''
  // 绝对地址、协议相对地址以及 data: / blob: 一律原样返回
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value)) return value
  if (!ASSET_BASE_URL) return value
  return ASSET_BASE_URL + (value.charAt(0) === '/' ? value : '/' + value)
}

export default assetUrl
