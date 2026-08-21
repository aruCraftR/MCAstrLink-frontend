<script setup lang="ts">
const auth = useAuthStore()

onMounted(() => {
  // 刷新后校验本地持久化的登录状态是否仍然有效
  auth.bootstrap()
})

useHead({
  htmlAttrs: { lang: 'zh-CN' },
  title: 'MCAstrLink 玩家面板'
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
