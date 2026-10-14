<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 108 108"
    aria-label="心光 MHOP"
    role="img"
  >
    <!-- 冷灰白底 -->
    <rect x="0" y="0" width="108" height="108" fill="#F3F5F8" />

    <!-- 后山（深蓝灰） -->
    <path fill="#32557A" d="M10,98 C16,66 14,38 22,28 C30,22 40,32 54,48 C68,32 78,22 86,28 C94,38 92,66 98,98 Z" />

    <!-- 中山（品牌蓝灰） -->
    <path fill="#3F6991" d="M10,98 C24,78 34,64 54,58 C74,64 84,78 98,98 Z" />

    <!-- 前山（浅蓝灰） -->
    <path fill="#6D8AA8" d="M10,98 C22,92 38,86 54,82 C70,86 86,92 98,98 Z" />

    <!-- 白色太阳 -->
    <circle cx="54" cy="52" r="12" fill="#FFFFFF" />

    <!-- 暖粉心（品牌点睛，贴合 AI 粉发少女） -->
    <path fill="#F6A6BB" d="M54,80 C49,74 40,78 43,86 C46,92 54,98 54,98 C54,98 62,92 65,86 C68,78 59,74 54,80 Z" />
  </svg>
</template>

<script setup>
defineProps({
  size: { type: [String, Number], default: 32 }
})
</script>
