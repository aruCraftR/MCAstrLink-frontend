<script setup lang="ts">
type NavColor = 'green' | 'blue' | 'purple' | 'amber' | 'red'

const colorMode = useColorMode()
const emit = defineEmits<{
  (e: 'logout'): void
}>()

// 基于preference判断(SSR与客户端一致): system=跟随系统, dark=深色, light=浅色
const modeLabel = computed(() => {
  switch (colorMode.preference) {
    case 'dark':
      return '浅色模式'
    case 'light':
      return '深色模式'
    default:
      return '跟随系统'
  }
})

const toggleColorMode = () => {
  colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'
}

const navItems: { label: string; icon: string; to: string; color: NavColor }[] = [
  { label: '服务器状态', icon: 'i-heroicons-server-stack', to: '/', color: 'green' },
  { label: '个人中心', icon: 'i-heroicons-user-circle', to: '/player', color: 'blue' }
]
</script>

<template>
  <div class="flex h-full flex-col">
    <nav class="no-scrollbar flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
      <template
        v-for="(item, index) in navItems"
        :key="item.to"
      >
        <div
          v-if="index === 1"
          class="my-1 border-t border-gray-200 dark:border-gray-800"
        />
        <NavButton
          :to="item.to"
          :icon="item.icon"
          :label="item.label"
          :color="item.color"
        />
      </template>
    </nav>
    <div class="mt-4 flex shrink-0 flex-col gap-2">
      <div class="border-t border-gray-200 dark:border-gray-800" />
      <UButton
        :icon="colorMode.preference === 'dark' ? 'i-heroicons-sun' : 'i-heroicons-moon'"
        color="neutral"
        variant="ghost"
        :label="modeLabel"
        class="justify-start"
        @click="toggleColorMode"
      />
      <UButton
        icon="i-heroicons-arrow-right-on-rectangle"
        color="neutral"
        variant="ghost"
        label="登出"
        class="justify-start"
        @click="emit('logout')"
      />
    </div>
  </div>
</template>
