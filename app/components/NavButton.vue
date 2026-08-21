<script setup lang="ts">
type NavColor = 'green' | 'blue' | 'purple' | 'amber' | 'red'

const props = withDefaults(
  defineProps<{
    to: string
    icon?: string
    label?: string
    color?: NavColor
  }>(),
  { color: 'green' }
)

const route = useRoute()
const isActive = computed(() => route.path === props.to)

const styles: Record<NavColor, { active: string; bar: string; icon: string }> = {
  green: {
    active: 'bg-green-500/10 text-green-600 dark:text-green-400',
    bar: 'bg-green-500',
    icon: 'text-green-500'
  },
  blue: {
    active: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    bar: 'bg-blue-500',
    icon: 'text-blue-500'
  },
  purple: {
    active: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    bar: 'bg-purple-500',
    icon: 'text-purple-500'
  },
  amber: {
    active: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    bar: 'bg-amber-500',
    icon: 'text-amber-500'
  },
  red: {
    active: 'bg-red-500/10 text-red-600 dark:text-red-400',
    bar: 'bg-red-500',
    icon: 'text-red-500'
  }
}
</script>

<template>
  <NuxtLink
    :to="to"
    class="relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-200 ease-out"
    :class="
      isActive
        ? styles[color].active
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
    "
  >
    <span
      class="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r-full transition-all duration-200"
      :class="[styles[color].bar, isActive ? 'scale-y-100 opacity-100' : 'scale-y-50 opacity-0']"
    />
    <UIcon
      v-if="icon"
      :name="icon"
      class="shrink-0 text-lg transition-all duration-200"
      :class="[isActive ? styles[color].icon : '', isActive ? 'scale-110' : '']"
    />
    <span>{{ label }}</span>
  </NuxtLink>
</template>
