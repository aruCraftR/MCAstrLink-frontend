<script setup lang="ts">
withDefaults(defineProps<{ text?: string }>(), { text: '加载中...' })
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 py-20 text-center">
    <UIcon
      name="i-heroicons-arrow-path"
      class="animate-spin text-4xl text-gray-300 dark:text-gray-600"
    />
    <p class="text-gray-500 dark:text-gray-400">
      {{ text }}
    </p>
  </div>
</template>
