<script setup lang="ts">
import { avatarUrl } from '../utils/avatar'
import type {
  PagedQueryResponse,
  PanelGameMeta,
  ServerRecentPlay,
  ServerStatus
} from '../utils/api-types'

const props = defineProps<{
  status: ServerStatus
  meta?: PanelGameMeta
}>()

const { request } = useApi()
const auth = useAuthStore()
const toast = useToast()

const statusColors: Record<string, Color> = {
  active: 'success',
  starting: 'primary',
  stopping: 'warning',
  stopped: 'error',
  unresponsive: 'warning'
}

const statusText: Record<string, string> = {
  active: '运行中',
  starting: '启动中',
  stopping: '关闭中',
  stopped: '已关闭',
  unresponsive: '无响应'
}

// 状态对应的UI颜色. 各Nuxt UI组件的color变体类型由组件约束, 此处用断言透传
const statusColor = (status: string) => {
  return (statusColors[status] || 'neutral') as never
}

const serverName = computed(
  () => props.meta?.zh_cn_name || props.meta?.en_ww_name || props.meta?.short_id || props.status.id
)

const chatPlaceholder = () => {
  toast.add({ title: '聊天功能正在开发中', color: 'neutral' })
}

// 右键菜单项. 结构与UContextMenu的ContextMenuItem一致, 类型由组件运行时校验
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const menuItems = computed<any[]>(() => [
  {
    label: '进入聊天',
    icon: 'i-heroicons-chat-bubble-oval-left-ellipsis',
    onSelect: chatPlaceholder
  },
  {
    label: '上线记录',
    icon: 'i-heroicons-clock',
    onSelect: openPlays
  },
  ...(auth.user && auth.user.permission >= 5
    ? [
        { type: 'separator' },
        {
          label: '管理员',
          icon: 'i-heroicons-shield-check',
          children: [
            [
              {
                label: '修改属性',
                color: 'warning',
                icon: 'i-lucide-pencil',
                onSelect: () => toast.add({ title: '暂未开放', color: 'neutral' })
              },
              {
                label: '删除',
                color: 'error',
                icon: 'i-lucide-trash',
                onSelect: () => toast.add({ title: '暂未开放', color: 'neutral' })
              }
            ]
          ]
        }
      ]
    : [])
])

// 服务器最近上线记录
const playsModalOpen = ref(false)
const plays = ref<ServerRecentPlay[]>([])
const playsTotal = ref(0)
const playsPageSize = 8
const loadingPlays = ref(false)

const playsColumns = [
  { accessorKey: 'player', header: '玩家名' },
  { accessorKey: 'online_date', header: '最近上线时间' },
  { accessorKey: 'total_time', header: '总在线时长' }
]

const loadPlays = async (page: number) => {
  loadingPlays.value = true
  try {
    const data = await request<PagedQueryResponse<ServerRecentPlay>>(
      `/servers/${props.status.id}/plays?page=${page}&page_size=${playsPageSize}&order=desc`
    )
    plays.value = data.items
    playsTotal.value = data.total
  } finally {
    loadingPlays.value = false
  }
}

const openPlays = () => {
  playsModalOpen.value = true
  loadPlays(1)
}

const formatDate = (value: string) =>
  new Date(value).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })

const formatDuration = (seconds: number) => {
  const minutes = Math.round(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours > 0 ? `${hours}小时${rest}分钟` : `${rest}分钟`
}
</script>

<template>
  <UContextMenu :items="menuItems">
    <UCard class="transition-shadow duration-300 hover:shadow-lg">
      <div class="flex flex-col gap-3">
        <UPopover
          mode="click"
          :content="{ side: 'bottom', align: 'start' }"
        >
          <div class="flex cursor-pointer flex-col gap-3">
            <div class="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
              <div class="min-w-0 grow basis-0">
                <h3 class="truncate text-lg font-bold">{{ serverName }}</h3>
                <span
                  v-if="meta?.server_version"
                  class="text-sm text-gray-500 dark:text-gray-400"
                >
                  v{{ meta.server_version }}
                </span>
              </div>
              <UBadge
                class="h-min shrink-0"
                :color="statusColor(status.status)"
                variant="solid"
              >
                {{ statusText[status.status] || '状态未知' }}
              </UBadge>
            </div>

            <div
              class="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-sm text-gray-500 dark:text-gray-400"
            >
              <div class="flex min-w-0 items-center gap-1">
                <UIcon name="i-heroicons-users" />
                <span>{{ status.player_count }} / {{ status.max_players }}</span>
                <UAvatarGroup
                  v-if="status.players.length"
                  size="2xs"
                  :max="3"
                  class="ml-1"
                >
                  <UAvatar
                    v-for="p in status.players"
                    :key="p.uuid"
                    :alt="p.name"
                    :src="avatarUrl(p.avatar)"
                  />
                </UAvatarGroup>
              </div>
              <span
                v-if="meta?.minecraft_version"
                class="shrink-0"
              >
                MC {{ meta.minecraft_version }}
              </span>
            </div>
          </div>

          <template #content>
            <div
              v-if="status.players.length"
              class="grid grid-cols-2 gap-2 p-3"
            >
              <UUser
                v-for="p in status.players"
                :key="p.uuid"
                :name="p.name"
                :avatar="{ src: avatarUrl(p.avatar) }"
                size="sm"
              />
            </div>
            <div
              v-else
              class="p-3 text-sm text-gray-500 dark:text-gray-400"
            >
              没有玩家呢
            </div>
          </template>
        </UPopover>

        <UProgress
          size="xs"
          :color="statusColor(status.status)"
        />

        <div class="flex gap-2">
          <UButton
            block
            variant="soft"
            icon="i-heroicons-clock"
            @click="openPlays"
          >
            上线记录
          </UButton>
          <UButton
            block
            color="neutral"
            variant="soft"
            icon="i-heroicons-chat-bubble-oval-left-ellipsis"
            @click="chatPlaceholder"
          >
            进入聊天
          </UButton>
        </div>
      </div>
    </UCard>
  </UContextMenu>

  <UModal
    v-model:open="playsModalOpen"
    :ui="{ content: 'max-w-3xl' }"
  >
    <template #content>
      <div class="flex flex-col gap-4 p-4">
        <div>
          <h3 class="font-semibold">{{ serverName }} 最近上线记录</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">按最近上线时间排序</p>
        </div>
        <DataTable
          :data="plays"
          :columns="playsColumns"
          :total="playsTotal"
          :page-size="playsPageSize"
          :loading="loadingPlays"
          empty="没有记录呢"
          @change="loadPlays"
        >
          <template #player-cell="{ row }">
            <UUser
              :name="row.original.player.name"
              :avatar="{ src: avatarUrl(row.original.player.avatar) }"
              size="md"
            />
          </template>
          <template #online_date-cell="{ row }">
            {{ formatDate(row.original.online_date) }}
          </template>
          <template #total_time-cell="{ row }">
            {{ formatDuration(row.original.total_time) }}
          </template>
        </DataTable>
      </div>
    </template>
  </UModal>
</template>
