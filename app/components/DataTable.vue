<script setup lang="ts" generic="T extends Record<string, unknown>">
const props = withDefaults(
  defineProps<{
    data?: T[]
    // 通用表格封装: 列定义透传给UTable, 类型与TanStack ColumnDef兼容
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- UTable列类型内部定义, 通用封装直接透传
    columns?: any[]
    pageSize?: number
    total?: number
    loading?: boolean
    empty?: string
  }>(),
  { pageSize: 10, empty: '暂无数据' }
)

const emit = defineEmits<{ (e: 'change', page: number): void }>()

const currentPage = ref(1)
const jumpInput = ref('')

const totalCount = computed(() => props.total ?? props.data?.length ?? 0)
const maxPage = computed(() => Math.max(1, Math.ceil(totalCount.value / props.pageSize)))

/** 跳转页码: 校验并限制在1..maxPage之间 */
const jump = () => {
  const value = Number.parseInt(jumpInput.value, 10)
  if (Number.isNaN(value)) {
    jumpInput.value = ''
    return
  }
  currentPage.value = Math.min(Math.max(value, 1), maxPage.value)
  jumpInput.value = ''
}

watch(currentPage, (page) => emit('change', page))
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="overflow-x-auto">
      <UTable
        :data="props.data"
        :columns="props.columns"
        :loading="props.loading"
        :empty="props.empty"
        class="min-w-140"
      >
        <template
          v-for="(_, name) in $slots"
          #[name]="slotData"
        >
          <slot
            :name="name"
            v-bind="slotData"
          />
        </template>
      </UTable>
    </div>

    <div
      class="flex flex-col items-end gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end sm:gap-4"
    >
      <UPagination
        v-model:page="currentPage"
        :items-per-page="props.pageSize"
        :total="totalCount"
        :disabled="props.loading"
        class="max-w-full"
      />

      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500 dark:text-gray-400">前往</span>
        <UInput
          v-model="jumpInput"
          type="number"
          min="1"
          :max="maxPage"
          :disabled="props.loading"
          placeholder="页码"
          class="w-16"
          size="sm"
          @keydown.enter="jump"
          @blur="jump"
        />
        <span class="text-sm text-gray-500 dark:text-gray-400">页</span>
      </div>
    </div>
  </div>
</template>
