import axios from 'axios'
import { ElMessage } from 'element-plus'
import { API_BASE_URL, runtimeSummary } from '../config/runtime'

// 部署排查用：启动时打印一次实际生效的 API 地址及来源
console.info('[MHOP] ' + runtimeSummary())

const http = axios.create({ baseURL: API_BASE_URL, timeout: 60000 })

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('mhop_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (resp) => resp.data,
  (error) => {
    const status = error.response?.status
    // 有响应时优先用后端 { detail }；没有响应（跨域被浏览器拦下、断网、超时）时
    // axios 的 message 是英文（"Network Error" / "timeout of 60000ms exceeded"），
    // 直接展示就是用户看到的英文报错，这里统一换成中文提示。
    const detail = error.response?.data?.detail || describeTransportError(error)
    if (!error.response) {
      // 排查用：无响应时把原始错误打到控制台，页面上只给中文提示。
      console.warn('[MHOP] 请求未拿到响应', error.code, error.message, error.config?.baseURL, error.config?.url)
    }
    if (status === 401) {
      localStorage.removeItem('mhop_token')
      localStorage.removeItem('mhop_user')
    }
    if (!error.config?.silent) ElMessage.error(typeof detail === 'string' ? detail : '请求失败')
    return Promise.reject(error)
  }
)

// 无响应错误（网络/跨域/超时）转成中文提示，避免把 axios 的英文 message 直接暴露给用户。
function describeTransportError(error) {
  if (error.code === 'ECONNABORTED' || /timeout/i.test(error.message || '')) return '请求超时，请稍后重试'
  if (error.response) return error.message || '请求失败'
  return '网络异常或服务暂时不可达，请稍后重试'
}

export default http
