<script setup lang="ts">
const auth = useAuthStore()
const route = useRoute()

const logoutDialog = ref(false)
const drawerOpen = ref(false)

const onLogout = async () => {
  await auth.logout()
  await navigateTo('/login')
}

// 移动端抽屉: 路由切换后自动关闭
watch(
  () => route.path,
  () => {
    drawerOpen.value = false
  }
)
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <!-- 移动端顶栏 -->
    <header
      class="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-2 border-b border-gray-200 bg-white px-4 md:hidden dark:border-gray-800 dark:bg-gray-950"
    >
      <UButton
        icon="i-heroicons-bars-3"
        color="neutral"
        variant="ghost"
        square
        aria-label="打开导航"
        @click="drawerOpen = true"
      />
      <span class="truncate font-bold">{{ $config.public.APP_NAME }}</span>
    </header>

    <!-- 桌面端侧边栏 -->
    <aside
      class="hidden w-56 shrink-0 flex-col gap-4 border-r border-gray-200 p-4 md:flex dark:border-gray-800"
    >
      <div class="flex shrink-0 items-center gap-2 text-lg font-bold">
        <UIcon
          name="i-mdi-server"
          class="text-green-500"
        />
        <span class="truncate">{{ $config.public.APP_NAME }}</span>
      </div>
      <AppNavContent
        class="min-h-0 flex-1"
        @logout="logoutDialog = true"
      />
    </aside>

    <!-- 移动端覆盖式抽屉 -->
    <UDrawer
      v-model:open="drawerOpen"
      direction="left"
      :handle="false"
      close
    >
      <template #content>
        <div class="flex h-full flex-col p-4">
          <div class="mb-4 flex items-center gap-2 text-lg font-bold">
            <UIcon
              name="i-mdi-server"
              class="text-green-500"
            />
            <span class="truncate">{{ $config.public.APP_NAME }}</span>
          </div>
          <AppNavContent @logout="logoutDialog = true" />
        </div>
      </template>
    </UDrawer>

    <main class="min-w-0 flex-1 overflow-y-auto p-6 pt-20 md:pt-6">
      <div class="mx-auto w-full max-w-7xl">
        <slot />
      </div>
    </main>
    <ConfirmDialog
      v-model:open="logoutDialog"
      title="确认登出"
      message="确定要登出当前账号吗？"
      confirm-text="登出"
      @confirm="onLogout"
    />
  </div>
</template>
