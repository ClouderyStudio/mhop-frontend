// 密码白名单：仅可打印 ASCII（英文字母大小写、数字、常见英文符号），
// 不含中文、全角符号、空格、Emoji 等。
export const PASSWORD_REGEX = /^[\x21-\x7E]{6,64}$/
export const PASSWORD_HINT = '6-64 位，仅可使用英文字母、数字与常见英文符号（不含中文、空格与特殊符号）'

// 输入时实时过滤掉非可打印 ASCII 字符，防止中文输入法误触粘进密码框
export function sanitizePassword(v) {
  if (!v) return ''
  let out = ''
  for (const ch of String(v)) {
    const code = ch.charCodeAt(0)
    if (code >= 0x21 && code <= 0x7e) out += ch
  }
  return out
}
