<template>
  <div class="agreement-check">
    <el-checkbox :model-value="modelValue" @update:model-value="(v) => emit('update:modelValue', v)">
      我已阅读并同意
      <a class="agree-link" @click.prevent.stop="open('user')">《用户协议》</a>
      和
      <a class="agree-link" @click.prevent.stop="open('privacy')">《隐私政策》</a>
    </el-checkbox>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="680px" append-to-body class="agreement-dialog">
      <div class="agreement-body">
        <p class="agreement-updated">更新日期：2026 年 11 月 28 日</p>
        <section v-for="s in dialogSections" :key="s.h">
          <h4>{{ s.h }}</h4>
          <p>{{ s.p }}</p>
        </section>
      </div>
      <template #footer>
        <el-button type="primary" round @click="dialogVisible = false">我已阅读</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const dialogVisible = ref(false)
const current = ref('user')

const USER_SECTIONS = [
  {
    h: '一、服务性质',
    p: '心光 MHOP 是面向公众的公益性心理自助平台，提供匿名倾诉、同伴陪伴、心理测评与情绪调节工具。平台内容与 AI 回复仅供心理自助参考，不构成医学诊断、治疗方案或专业心理咨询，不能替代医疗机构与执业人员的服务。',
  },
  {
    h: '二、账号与使用',
    p: '你可以匿名浏览部分内容；发布内容、参与测评等需要注册账号。请妥善保管账号与密码，因个人保管不当造成的损失由账号使用者承担。一个用户不应恶意注册多个账号用于刷量、攻击或规避处罚。',
  },
  {
    h: '三、社区行为规范',
    p: '禁止发布违法违规、侵犯他人隐私、侮辱诽谤、恶意引战、广告导流以及详细描述自伤自杀方法的内容。平台对内容进行 AI 与人工审核，并有权删除违规内容、限制功能或封禁账号。',
  },
  {
    h: '四、危急情况',
    p: '如果你或他人正处于生命危险中，请立即拨打 110、120 或全国心理援助热线 12356。平台不是急救机构，无法提供实时救援，请优先联系身边可信任的人与专业机构。',
  },
  {
    h: '五、协议变更',
    p: '平台可能根据法律法规与服务调整更新本协议，更新后会在站内公示。若你继续使用平台服务，即视为接受更新后的协议；如不同意，请停止使用并注销账号。',
  },
]

const PRIVACY_SECTIONS = [
  {
    h: '一、我们收集的信息',
    p: '注册与登录信息（用户名、密码加密摘要、可选绑定的手机号与邮箱）、你主动发布的内容与图片、测评作答结果、情绪记录以及必要的设备与访问日志（IP、浏览器类型、访问时间）。',
  },
  {
    h: '二、信息用途',
    p: '用于账号登录与安全校验、内容审核与危机识别、生成测评解读与 AI 回复、展示社区内容以及改进产品体验。我们不会将你的信息用于与心理自助无关的商业营销。',
  },
  {
    h: '三、匿名与本地存储',
    p: '发布内容时可选择匿名，其他用户看到的是匿名身份。情绪记录仅保存在你的浏览器本机，不会上传服务器；更换设备或清除浏览器数据后将无法恢复。',
  },
  {
    h: '四、存储与保护',
    p: '服务器数据存储在受访问控制的数据库中，传输过程使用加密通道，密码仅保存不可逆摘要。我们按最小必要原则保留数据，并在达到目的后删除或匿名化处理。',
  },
  {
    h: '五、共享与披露',
    p: '除法律法规要求、司法机关依法调取或为保护生命安全所必需的情形外，我们不会向第三方出售或共享你的个人信息。接入的第三方服务仅在其提供服务所必需的范围内处理数据。',
  },
  {
    h: '六、你的权利',
    p: '你可以在个人主页查看与修改账号资料、更换头像、退出登录；如需删除账号或导出个人数据，可通过站内反馈渠道联系运营团队，我们将在核验身份后处理。',
  },
  {
    h: '七、未成年人保护',
    p: '未满 18 周岁的用户应在监护人知情并同意的情况下使用本平台。我们会对涉及未成年人的内容采取更严格的审核与保护措施。',
  },
]

const dialogTitle = computed(() => (current.value === 'user' ? '用户协议' : '隐私政策'))
const dialogSections = computed(() => (current.value === 'user' ? USER_SECTIONS : PRIVACY_SECTIONS))

function open(type) {
  current.value = type
  dialogVisible.value = true
}
</script>

<style scoped>
.agreement-check {
  margin: 6px 0 16px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--mhop-text-sub);
}
.agree-link {
  color: var(--mhop-link);
  font-weight: 600;
  cursor: pointer;
}
.agreement-body {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 6px;
}
.agreement-updated {
  margin: 0 0 14px;
  font-size: 12.5px;
  color: var(--mhop-text-sub);
}
.agreement-body h4 {
  margin: 16px 0 6px;
  font-size: 14.5px;
  color: var(--mhop-text);
}
.agreement-body h4:first-of-type {
  margin-top: 0;
}
.agreement-body p {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.85;
  color: var(--mhop-text-sub);
}
@media (max-width: 640px) {
  .agreement-check :deep(.el-checkbox__label) {
    white-space: normal;
    line-height: 1.6;
  }
}
</style>
