import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 绝对地址（http(s):// 或 //host）表示前端直连后端，此时不需要开发代理。
const ABSOLUTE_URL_RE = /^(?:[a-z][a-z0-9+.-]*:)?\/\//i

export default defineConfig(({ mode }) => {
  // 读取 .env* 与进程环境变量中 VITE_ 前缀的配置，与 src/config/runtime.js 共用同一套变量。
  const env = loadEnv(mode, __dirname, 'VITE_')
  const apiBase = (env.VITE_MHOP_API_BASE_URL || '').trim()
  const useProxy = !ABSOLUTE_URL_RE.test(apiBase)

  const proxyTarget = (env.VITE_MHOP_DEV_PROXY_TARGET || 'https://127.0.0.1:7288').trim()

  // 本地 HTTPS 自签证书目录：默认仓库根目录下的 certs/（可用 VITE_MHOP_CERT_DIR 覆盖）。
  // 证书不存在时回退 HTTP，保证未生成证书也能启动。
  const certDir = path.resolve(__dirname, (env.VITE_MHOP_CERT_DIR || 'certs').trim())
  const certFile = path.join(certDir, 'cert.pem')
  const keyFile = path.join(certDir, 'key.pem')
  const useHttps = fs.existsSync(certFile) && fs.existsSync(keyFile)

  return {
    plugins: [vue()],
    server: {
      host: '127.0.0.1',
      port: 5173,
      https: useHttps
        ? { key: fs.readFileSync(keyFile), cert: fs.readFileSync(certFile) }
        : undefined,
      // VITE_MHOP_API_BASE_URL 为绝对地址时前端直连后端，不再启用代理
      proxy: useProxy
        ? {
            '/mhop': {
              target: proxyTarget,
              changeOrigin: true,
              secure: false, // 容忍后端本地自签证书
            },
          }
        : undefined,
    },
  }
})
