<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    message?: string
    confirmText?: string
    cancelText?: string
    loading?: boolean
    color?: 'primary' | 'error' | 'warning'
  }>(),
  {
    title: '确认操作',
    confirmText: '确认',
    cancelText: '取消',
    color: 'error'
  }
)

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'confirm'): void
}>()

const setOpen = (value: boolean) => emit('update:open', value)
</script>

<template>
  <UModal
    :open="props.open"
    @update:open="setOpen"
  >
    <template #content>
      <div class="flex flex-col gap-4 p-4">
        <h3 class="font-semibold">
          {{ props.title }}
        </h3>
        <p
          v-if="props.message"
          class="text-sm text-gray-500 dark:text-gray-400"
        >
          {{ props.message }}
        </p>
        <div class="flex justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="props.loading"
            @click="setOpen(false)"
          >
            {{ props.cancelText }}
          </UButton>
          <UButton
            :color="props.color"
            :loading="props.loading"
            @click="emit('confirm')"
          >
            {{ props.confirmText }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
