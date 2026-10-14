<template>
  <img
    :src="resolvedSrc"
    :alt="alt"
    class="ai-avatar"
    :class="[
      shape,
      { 'is-full': isFull, 'is-glow': effectiveGlow, 'animate-hover': hoverAnimate }
    ]"
    :style="computedStyle"
    draggable="false"
  />
</template>

<script setup>
import { computed } from 'vue'
import aiFace from '../assets/images/ai-avatar.png'
import aiFull from '../assets/images/ai-chibi-full.png'
import fHappy    from '../assets/images/ai-frame-happy.png'
import fSad      from '../assets/images/ai-frame-sad.png'
import fWink     from '../assets/images/ai-frame-wink.png'
import fConfused from '../assets/images/ai-frame-confused.png'
import fCalm     from '../assets/images/ai-frame-calm.png'
import fSurprised from '../assets/images/ai-frame-surprised.png'
import fExcited  from '../assets/images/ai-frame-excited.png'
import fSmile    from '../assets/images/ai-frame-smile.png'
import fLove     from '../assets/images/ai-frame-love.png'

const FRAMES = {
  happy: fHappy, sad: fSad, wink: fWink,
  confused: fConfused, calm: fCalm, surprised: fSurprised,
  excited: fExcited, smile: fSmile, love: fLove,
}
const VALID_EXPR = Object.keys(FRAMES)

const props = defineProps({
  size: { type: [Number, String], default: 32 },
  /** 指定表情帧：happy/sad/wink/confused/calm/surprised/excited/smile/love；null 则按尺寸自动 */
  expression: {
    type: String,
    default: null,
    validator: v => v == null ||
      ['happy','sad','wink','confused','calm','surprised','excited','smile','love'].includes(v)
  },
  shape: { type: String, default: 'circle', validator: v => ['circle', 'rounded'].includes(v) },
  /** 强制使用完整少女形象（覆盖 expression 逻辑） */
  full: { type: Boolean, default: false },
  /** 深色模式自动发光（小尺寸默认关，防外溢） */
  glow: { type: Boolean, default: false },
  /** hover 微动效（浮动 + 心跳） */
  hoverAnimate: { type: Boolean, default: true },
  alt: { type: String, default: '小心光 · AI 陪伴者' },
})

const sizeNum = computed(() => Number(props.size) || 32)
const isFull  = computed(() => props.full)
const glowMode = computed(() => props.glow)

// ===== 核心：决定用哪张图 =====
const resolvedSrc = computed(() => {
  // 1) full 强制完整形象
  if (props.full) return aiFull

  // 2) expression 明确指定表情帧
  if (props.expression && VALID_EXPR.includes(props.expression)) {
    return FRAMES[props.expression]
  }

  // 3) 自动模式：按尺寸选
  const s = sizeNum.value
  if (s <= 24) return aiFace           // 极小 → 主脸
  if (s <= 64) return FRAMES.happy    // 中 → 最亲切的 happy 表情
  return aiFull                        // 大 → 完整少女形象
})

// ===== 完整形象特殊 object-fit =====
const computedStyle = computed(() => {
  const s = sizeNum.value
  const objFit = props.full || s > 64 ? 'contain' : 'cover'
  // 圆形用 clip-path 真裁切（切住 filter/hover 的外溢）
  const clip = props.shape === 'circle' ? 'clip-path: circle(50% at 50% 50%);' : ''
  const overflow = props.shape === 'circle' || props.shape === 'rounded' ? 'overflow: hidden;' : ''
  return {
    width: s + 'px',
    height: s + 'px',
    objectFit: objFit,
    ...(props.shape === 'circle' ? {} : {}),
  }
})

// ===== 智能 glow：大尺寸（≥48px）自动开，小尺寸靠调用方显式传 =====
const effectiveGlow = computed(() => {
  if (props.glow) return true              // 显式传 true 尊重
  if (props.full || sizeNum.value >= 48) return true  // 大尺寸自动开
  return false                             // 小尺寸默认关
})
</script>

<style scoped>
.ai-avatar {
  display: block;
  user-select: none;
  -webkit-user-drag: none;
  background: transparent;
  transition: transform .25s cubic-bezier(.2,.9,.3,1.4), filter .25s ease;
  /* isolation + overflow 双保险：clip-path 切住 filter/hover 外溢 */
  isolation: isolate;
}
.ai-avatar.circle {
  border-radius: 50%;
  overflow: hidden;
  clip-path: circle(50% at 50% 50%);
}
.ai-avatar.rounded {
  border-radius: 8px;
  overflow: hidden;
  clip-path: inset(0 round 8px);
}
/* 完整立绘：不裁切 */
.ai-avatar.is-full.circle {
  clip-path: none;
  border-radius: 0;
}

/* 发光：只在大尺寸/显式开启时生效，避免小尺寸外溢 */
.ai-avatar.is-glow {
  filter: drop-shadow(0 0 3px rgba(246, 166, 187, .35))
          drop-shadow(0 2px 6px rgba(109, 92, 224, .20));
}
:global(html.dark) .ai-avatar.is-glow {
  filter: drop-shadow(0 0 6px rgba(246, 166, 187, .55))
          drop-shadow(0 0 14px rgba(109, 92, 224, .35))
          drop-shadow(0 2px 8px rgba(0, 0, 0, .5));
}

/* Hover 微动效 */
.ai-avatar.animate-hover:hover {
  transform: translateY(-2px) scale(1.05);
  filter: drop-shadow(0 4px 14px rgba(109, 92, 224, .25));
}
@keyframes pulse-heart {
  0%, 100% { transform: scale(1); }
  30%      { transform: scale(1.08); }
  60%      { transform: scale(1.03); }
}
.ai-avatar.animate-hover:active {
  animation: pulse-heart .6s ease;
}
</style>
