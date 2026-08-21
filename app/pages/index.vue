<script setup lang="ts">
import type { OnlinePlayerInfo, ServerStatus } from '../utils/api-types'

const { request, apiBase, sameOrigin } = useApi()
const auth = useAuthStore()
const { metaCache, ensureMeta } = useServerMeta()

const statuses = ref<Record<string, ServerStatus>>({})
const connected = ref(false)
const loadError = ref('')
const loading = ref(true)
let eventSource: EventSource | null = null

/** 状态中只带元数据摘要, 摘要变化时按需拉取完整元数据 */
const refreshMeta = async () => {
  const servers = Object.values(statuses.value)
  await ensureMeta(
    servers.map((s) => s.id),
    Object.fromEntries(servers.map((s) => [s.id, s.meta_blake3]))
  )
}

const fetchStatuses = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const list = await request<ServerStatus[]>('/servers/status')
    statuses.value = Object.fromEntries(list.map((s) => [s.id, s]))
    await refreshMeta()
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

const reload = () => {
  fetchStatuses()
}

interface SseEvent {
  server?: string
  data?: ServerStatus
  status?: ServerStatus['status']
  player?: OnlinePlayerInfo
  name?: string
  meta_blake3?: string
}

const parseSse = (raw: string): SseEvent | null => {
  try {
    return JSON.parse(raw) as SseEvent | null
  } catch {
    return null
  }
}

const connectSSE = () => {
  if (!auth.isLoggedIn) return
  eventSource = new EventSource(
    sameOrigin
      ? `${apiBase}/servers/status/sse`
      : `${apiBase}/servers/status/sse?token=${encodeURIComponent(auth.token)}`
  )

  eventSource.addEventListener('add', (e) => {
    const data = parseSse((e as MessageEvent).data)
    if (data?.server && data?.data) {
      statuses.value[data.server] = data.data as ServerStatus
      refreshMeta()
    }
  })
  eventSource.addEventListener('remove', (e) => {
    const data = parseSse((e as MessageEvent).data)
    const serverId = data?.server
    if (serverId) {
      // 通过重建对象避免动态删除(no-dynamic-delete)
      const { [serverId]: _removed, ...rest } = statuses.value
      statuses.value = rest
    }
  })
  eventSource.addEventListener('update', (e) => {
    const data = parseSse((e as MessageEvent).data)
    const serverId = data?.server
    const status = serverId ? statuses.value[serverId] : undefined
    if (status && data?.status) status.status = data.status
  })
  eventSource.addEventListener('joined', (e) => {
    const data = parseSse((e as MessageEvent).data)
    const serverId = data?.server
    const status = serverId ? statuses.value[serverId] : undefined
    if (status && data?.player) {
      status.players.push(data.player)
      status.player_count += 1
    }
  })
  eventSource.addEventListener('left', (e) => {
    const data = parseSse((e as MessageEvent).data)
    const serverId = data?.server
    const status = serverId ? statuses.value[serverId] : undefined
    if (status) {
      status.players = status.players.filter((p) => p.name !== data?.name)
      status.player_count = Math.max(0, status.player_count - 1)
    }
  })
  eventSource.addEventListener('metaChanged', (e) => {
    const data = parseSse((e as MessageEvent).data)
    const serverId = data?.server
    const status = serverId ? statuses.value[serverId] : undefined
    if (status && data?.meta_blake3) {
      status.meta_blake3 = data.meta_blake3
      refreshMeta()
    }
  })

  eventSource.onopen = () => {
    connected.value = true
  }
  eventSource.onerror = () => {
    connected.value = false
  }
}

onMounted(() => {
  fetchStatuses()
  connectSSE()
})

onBeforeUnmount(() => {
  eventSource?.close()
})
</script>

<template>
  <div
    class="flex flex-col gap-6"
    :class="loading ? 'pointer-events-none' : ''"
  >
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">服务器状态</h1>
      <div class="flex items-center gap-2 text-sm">
        <UIcon
          :name="connected ? 'i-heroicons-signal' : 'i-heroicons-x-circle'"
          :class="connected ? 'text-green-500' : 'text-red-500'"
        />
        <span>{{ loading ? '连接中…' : connected ? '实时连接中' : '连接中断' }}</span>
      </div>
    </div>

    <LoadingState v-if="loading" />

    <div
      v-else-if="loadError"
      class="flex flex-col items-center justify-center gap-3 py-24 text-center"
    >
      <UIcon
        name="i-heroicons-cloud-arrow-down"
        class="text-5xl text-gray-300 dark:text-gray-600"
      />
      <p class="text-lg text-gray-500 dark:text-gray-400">{{ loadError }}</p>
      <UButton
        color="neutral"
        variant="soft"
        icon="i-heroicons-arrow-path"
        @click="reload"
      >
        重试
      </UButton>
    </div>

    <div
      v-else-if="Object.keys(statuses).length === 0"
      class="flex flex-col items-center justify-center gap-3 py-24 text-center"
    >
      <UIcon
        name="i-heroicons-server-stack"
        class="text-5xl text-gray-300 dark:text-gray-600"
      />
      <p class="text-xl text-gray-500 dark:text-gray-400">暂无在线服务器</p>
      <p class="text-sm text-gray-400 dark:text-gray-500">服务器上线后将自动显示在这里</p>
    </div>

    <div
      v-else
      class="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
    >
      <ServerCard
        v-for="s in Object.values(statuses)"
        :key="s.id"
        :status="s"
        :meta="metaCache[s.id]"
      />
    </div>
  </div>
</template>
