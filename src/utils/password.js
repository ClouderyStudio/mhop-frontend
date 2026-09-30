/**
 * 密码强度规则（与后端 ClouderyApi.Services.Mhop.MhopPasswordPolicy 完全一致）：
 * 8-64 位，必须同时包含大写字母 + 小写字母 + 数字（三类）。特殊字符可选。
 */
export const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 64,
  requireUpper: true,
  requireLower: true,
  requireDigit: true,
}

export const PASSWORD_HINT = '密码 8-64 位，必须同时包含大写字母、小写字母和数字（三类）'

export function validatePassword(password) {
  if (!password) return '密码不能为空'
  if (password.length < PASSWORD_RULES.minLength) return `密码至少 ${PASSWORD_RULES.minLength} 位`
  if (password.length > PASSWORD_RULES.maxLength) return `密码最多 ${PASSWORD_RULES.maxLength} 位`

  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasDigit = /\d/.test(password)
  if (!hasUpper || !hasLower || !hasDigit) {
    return '密码需同时包含大写字母、小写字母和数字'
  }
  return null
}

/** 前端 ElForm rules 直接用。 */
export function passwordFormRules() {
  return [
    { required: true, message: '请输入密码', trigger: 'blur' },
    {
      validator: (_r, v, cb) => {
        const err = validatePassword(v)
        cb(err ? new Error(err) : null)
      },
      trigger: 'blur',
    },
  ]
}
