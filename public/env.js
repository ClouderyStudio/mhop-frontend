/**
 * 运行时环境配置（部署后可直接修改本文件，无需重新构建前端）。
 *
 * 该文件位于 public/env.js，构建时会被原样复制到 dist/env.js。
 * 留空则回退到构建期变量（VITE_MHOP_API_BASE_URL / VITE_MHOP_ASSET_BASE_URL），
 * 再回退到内置默认值 /mhop。
 *
 * 建议在 Nginx 中为该文件关闭缓存，便于改完立即生效：
 *   location = /env.js { add_header Cache-Control "no-store"; }
 */
window.__MHOP_ENV__ = {
  // 后端 API 基地址。全部接口都在 /mhop 前缀下，必须写到 /mhop 为止。
  // 例：'https://api.example.com/mhop'；留空表示与前端同源。
  apiBaseUrl: '',

  // 图片等静态资源基地址（仅当图片与 API 不同源、或使用 CDN 时需要）。
  // 留空时：API 为绝对地址则自动取其源，同源部署则保持相对路径。
  // 例：'https://cdn.example.com'
  assetBaseUrl: '',
}
