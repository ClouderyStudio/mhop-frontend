<template>
  <div class="auth-wrap">
    <div class="auth-card mhop-card">
      <h2>{{ error ? '登录失败' : '正在完成统一身份认证…' }}</h2>
      <p class="text-sub">{{ error || '请稍候，正在校验授权并建立会话' }}</p>
      <el-button v-if="error" type="primary" size="large" round style="width: 100%" @click="backToLogin">
        返回登录
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const error = ref('')

function backToLogin() {
  router.replace('/login')
}

onMounted(async () => {
  const code = route.query.code
  if (!code) {
    error.value = '缺少授权码，请重新发起统一身份认证登录'
    return
  }
  try {
    const user = await auth.completeCasdoorLogin(String(code), String(route.query.state || ''))
    ElMessage.success('统一身份认证登录成功')
    router.replace(user?.role === 'admin' ? '/admin/dashboard' : (route.query.redirect || '/forum'))
  } catch (e) {
    error.value = e?.response?.data?.detail || '统一身份认证登录失败，请重试'
  }
})
</script>

<style scoped>
.auth-wrap {
  max-width: 430px;
  margin: 50px auto;
  padding: 0 16px;
}
.auth-card {
  padding: 38px 36px 30px;
}
.auth-card h2 {
  margin: 0 0 6px;
}
.auth-card > p {
  margin: 0 0 20px;
  font-size: 13.5px;
}
</style>
