<script setup lang="ts">
import { avatarUrl } from '../utils/avatar'
import type {
  AuthedPlayerInfo,
  PagedQueryResponse,
  PlayerProfile,
  PlayerRecentPlay,
  PlayerStatus
} from '../utils/api-types'

const { request } = useApi()
const auth = useAuthStore()
const toast = useToast()
const { ensureMeta, serverName } = useServerMeta()

const me = ref<AuthedPlayerInfo | null>(null)
const profile = ref<PlayerProfile | null>(null)
const status = ref<PlayerStatus | null>(null)
const plays = ref<PlayerRecentPlay[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 10
const loading = ref(true)
const loadingPlays = ref(false)

const avatarSource = ref<'qq' | 'mc_skin'>('qq')
const onlineSuffix = ref('')
const offlineSuffix = ref('')
const saving = ref(false)

const newPassword = ref('')
const confirmPassword = ref('')
const passwordDialog = ref(false)
const changingPassword = ref(false)
const logoutDialog = ref(false)

const permissionNames: Record<number, string> = {
  0: '封禁',
  1: '未知',
  2: '用户',
  3: '信任者',
  4: '协管员',
  5: '管理员',
  6: '拥有者'
}

const playColumns = [
  { accessorKey: 'server_id', header: '服务器' },
  { accessorKey: 'online_date', header: '最近在线时间' },
  { accessorKey: 'total_time', header: '累计时长' },
  { accessorKey: 'ip', header: 'IP' }
]

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : '未知错误')

const formatDuration = (seconds: number) => {
  const minutes = Math.round(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours > 0 ? `${hours}小时${rest}分钟` : `${rest}分钟`
}

/** QQ名片后缀预览: {s} 替换为示例服务器名Minecraft */
const suffixPreview = (template: string, online: boolean) => {
  const value = template.trim()
  if (!value) {
    return online ? '| Minecraft在线' : '| Minecraft离线'
  }
  return value.replaceAll('{s}', 'Minecraft')
}

const onlinePreview = computed(() => suffixPreview(onlineSuffix.value, true))
const offlinePreview = computed(() => suffixPreview(offlineSuffix.value, false))

const loadPlays = async (targetPage: number = page.value) => {
  page.value = targetPage
  loadingPlays.value = true
  try {
    const data = await request<PagedQueryResponse<PlayerRecentPlay>>(
      `/players/me/plays?page=${targetPage}&page_size=${pageSize}&order=desc`
    )
    plays.value = data.items
    total.value = data.total
    if (plays.value.length) {
      await ensureMeta(plays.value.map((p) => p.server_id))
    }
  } finally {
    loadingPlays.value = false
  }
}

const load = async () => {
  loading.value = true
  try {
    me.value = await request<AuthedPlayerInfo>('/players/me')
    profile.value = await request<PlayerProfile>('/players/me/profile')
    avatarSource.value = profile.value.avatar_source
    onlineSuffix.value = profile.value.online_qq_suffix
    offlineSuffix.value = profile.value.offline_qq_suffix
    status.value = await request<PlayerStatus>('/players/me/status')
    if (status.value?.online_servers?.length) {
      await ensureMeta(status.value.online_servers)
    }
    await loadPlays()
  } finally {
    loading.value = false
  }
}

const saveProfile = async () => {
  saving.value = true
  try {
    await request<null>('/players/me/profile', {
      method: 'PATCH',
      body: {
        avatar_source: avatarSource.value,
        online_qq_suffix: onlineSuffix.value,
        offline_qq_suffix: offlineSuffix.value
      }
    })
    toast.add({ title: '已保存', color: 'success' })
    await load()
  } catch (e) {
    toast.add({ title: '保存失败', description: errorMessage(e), color: 'error' })
  } finally {
    saving.value = false
  }
}

const changePassword = async () => {
  if (newPassword.value.length <= 8) {
    toast.add({ title: '密码至少需要9个字符', color: 'error' })
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    toast.add({ title: '两次输入的密码不一致', color: 'error' })
    return
  }
  changingPassword.value = true
  try {
    await request<null>('/players/me/password', {
      method: 'POST',
      body: { password: newPassword.value }
    })
    toast.add({ title: '密码已修改', description: '请使用新密码重新登录', color: 'success' })
    passwordDialog.value = false
    newPassword.value = ''
    confirmPassword.value = ''
    auth.clearSession()
    await navigateTo('/login')
  } catch (e) {
    toast.add({ title: '修改失败', description: errorMessage(e), color: 'error' })
  } finally {
    changingPassword.value = false
  }
}

const closePasswordDialog = () => {
  passwordDialog.value = false
  newPassword.value = ''
  confirmPassword.value = ''
}

const logout = async () => {
  await auth.logout()
  await navigateTo('/login')
}

onMounted(() => {
  load().catch((e) => {
    toast.add({ title: '加载失败', description: errorMessage(e), color: 'error' })
  })
})
</script>

<template>
  <div
    class="mx-auto flex max-w-4xl flex-col gap-6"
    :class="loading ? 'pointer-events-none' : ''"
  >
    <h1 class="text-2xl font-bold">个人中心</h1>

    <LoadingState v-if="loading" />

    <template v-else>
      <UCard v-if="me">
        <div class="flex items-center gap-4">
          <img
            :src="avatarUrl(me.avatar)"
            class="h-16 w-16 rounded-full"
            alt=""
          />
          <div>
            <div class="text-lg font-bold">{{ me.name }}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              {{ permissionNames[me.permission] ?? me.permission }} · {{ me.uuid }}
            </div>
          </div>
        </div>
        <div
          v-if="status"
          class="mt-4 flex items-center gap-2 text-sm"
        >
          <span class="text-gray-500 dark:text-gray-400">当前在线服务器:</span>
          <template v-if="status.online_servers.length">
            <UBadge
              v-for="sid in status.online_servers"
              :key="sid"
              color="success"
              variant="subtle"
            >
              {{ serverName(sid) }}
            </UBadge>
          </template>
          <span
            v-else
            class="text-gray-400 dark:text-gray-500"
            >不在线</span
          >
        </div>
      </UCard>

      <UCard v-if="profile">
        <template #header>
          <div class="font-semibold">账户配置</div>
        </template>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-sm">头像源</label>
            <USelect
              v-model="avatarSource"
              :items="[
                { label: 'QQ头像', value: 'qq' },
                { label: 'MC皮肤', value: 'mc_skin' }
              ]"
            />
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="flex flex-col gap-1.5">
              <label class="text-sm">在线QQ名片后缀模板</label>
              <UPopover
                mode="hover"
                :content="{ side: 'bottom', align: 'end' }"
              >
                <UInput
                  v-model="onlineSuffix"
                  placeholder="留空使用默认, 支持 {s} 占位符"
                  class="w-full"
                />
                <template #content>
                  <div class="px-3 py-2 text-xs text-gray-600 dark:text-gray-300">
                    预览: {{ onlinePreview }}
                  </div>
                </template>
              </UPopover>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-sm">离线QQ名片后缀模板</label>
              <UPopover
                mode="hover"
                :content="{ side: 'bottom', align: 'end' }"
              >
                <UInput
                  v-model="offlineSuffix"
                  placeholder="留空使用默认, 支持 {s} 占位符"
                  class="w-full"
                />
                <template #content>
                  <div class="px-3 py-2 text-xs text-gray-600 dark:text-gray-300">
                    预览: {{ offlinePreview }}
                  </div>
                </template>
              </UPopover>
            </div>
          </div>
          <div class="flex justify-end">
            <UButton
              :loading="saving"
              @click="saveProfile"
              >保存</UButton
            >
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="font-semibold">游玩记录</div>
            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              icon="i-heroicons-arrow-path"
              @click="loadPlays()"
            />
          </div>
        </template>
        <DataTable
          :data="plays"
          :columns="playColumns"
          :total="total"
          :page-size="pageSize"
          :loading="loadingPlays"
          empty="暂无游玩记录"
          @change="loadPlays"
        >
          <template #server_id-cell="{ row }">
            {{ serverName(row.original.server_id) }}
          </template>
          <template #online_date-cell="{ row }">
            {{ new Date(row.original.online_date).toLocaleString() }}
          </template>
          <template #total_time-cell="{ row }">
            {{ formatDuration(row.original.total_time) }}
          </template>
          <template #ip-cell="{ row }">
            {{ row.original.ip === '127.0.0.1' ? '' : row.original.ip }}
          </template>
        </DataTable>
      </UCard>

      <div class="flex gap-2">
        <UButton
          color="neutral"
          variant="soft"
          icon="i-heroicons-key"
          @click="passwordDialog = true"
        >
          修改密码
        </UButton>
        <UButton
          color="error"
          variant="soft"
          icon="i-heroicons-arrow-right-on-rectangle"
          @click="logoutDialog = true"
        >
          登出
        </UButton>
      </div>

      <ConfirmDialog
        v-model:open="logoutDialog"
        title="确认登出"
        message="登出后需要重新登录才能继续使用面板。"
        confirm-text="登出"
        @confirm="logout"
      />
    </template>

    <UModal v-model:open="passwordDialog">
      <template #content>
        <div class="flex flex-col gap-4 p-4">
          <h3 class="font-semibold">修改密码</h3>
          <div class="flex flex-col gap-2">
            <UInput
              v-model="newPassword"
              type="password"
              placeholder="新密码(至少9个字符)"
            />
            <UInput
              v-model="confirmPassword"
              type="password"
              placeholder="再次输入新密码"
            />
          </div>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              @click="closePasswordDialog"
            >
              取消
            </UButton>
            <UButton
              :loading="changingPassword"
              color="error"
              @click="changePassword"
            >
              确认修改
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
