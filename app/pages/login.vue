<script setup lang="ts">
definePageMeta({ layout: 'empty' })

const auth = useAuthStore()
const toast = useToast()

const mode = ref<'password' | 'captcha'>('password')
const name = ref('')
const password = ref('')
const captcha = ref('')
const loading = ref(false)
const cooldown = ref(0)
const loginError = ref('')
let timer: ReturnType<typeof setInterval> | null = null

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : '未知错误')

const startCooldown = () => {
  cooldown.value = 60
  timer = setInterval(() => {
    cooldown.value -= 1
    if (cooldown.value <= 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  }, 1000)
}

const submit = async () => {
  if (loading.value) return
  loginError.value = ''
  if (!name.value) {
    loginError.value = '请填写玩家ID'
    return
  }
  if (mode.value === 'password' && !password.value) {
    loginError.value = '请填写密码'
    return
  }
  if (mode.value === 'captcha' && !captcha.value) {
    loginError.value = '请填写验证码'
    return
  }
  loading.value = true
  try {
    if (mode.value === 'password') {
      await auth.loginPassword(name.value, password.value)
    } else {
      await auth.loginCaptcha(name.value, captcha.value)
    }
    toast.add({
      title: '登录成功',
      description: `欢迎, ${auth.user?.name ?? ''}`,
      color: 'success'
    })
    await navigateTo('/')
  } catch (e) {
    loginError.value = errorMessage(e)
    toast.add({ title: '登录失败', description: errorMessage(e), color: 'error' })
  } finally {
    loading.value = false
  }
}

const sendCaptcha = async () => {
  loginError.value = ''
  if (!name.value) {
    loginError.value = '请先填写玩家ID'
    return
  }
  const { request } = useApi()
  try {
    await request<null>('/auth/captcha/send', {
      method: 'POST',
      body: { player_id: name.value }
    })
    toast.add({ title: '验证码已发送', description: '请到游戏内查看', color: 'success' })
    startCooldown()
  } catch (e) {
    loginError.value = errorMessage(e)
    toast.add({ title: '发送失败', description: errorMessage(e), color: 'error' })
  }
}

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <UCard class="w-full max-w-md">
    <template #header>
      <div class="space-y-1 text-center">
        <div class="text-xl font-bold">MCAstrLink 玩家面板</div>
        <p class="text-sm text-gray-500 dark:text-gray-400">登录以继续</p>
      </div>
    </template>

    <UTabs
      v-model="mode"
      :items="[
        { label: '密码登录', value: 'password' },
        { label: '验证码登录', value: 'captcha' }
      ]"
      class="mb-5"
    />

    <form
      class="flex flex-col gap-4"
      @submit.prevent="submit"
    >
      <div class="flex flex-col gap-1.5">
        <label class="text-sm">玩家ID</label>
        <UInput
          v-model="name"
          placeholder="例如 is_name"
          autocomplete="username"
        />
      </div>

      <template v-if="mode === 'password'">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm">密码</label>
          <UInput
            v-model="password"
            type="password"
            autocomplete="current-password"
          />
        </div>
      </template>

      <template v-else>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm">验证码</label>
          <div class="flex gap-2">
            <UInput
              v-model="captcha"
              placeholder="6位数字验证码"
              class="flex-1"
            />
            <UButton
              type="button"
              :disabled="cooldown > 0"
              color="neutral"
              variant="soft"
              @click="sendCaptcha"
            >
              {{ cooldown > 0 ? `${cooldown}s` : '发送验证码' }}
            </UButton>
          </div>
        </div>
      </template>

      <UAlert
        v-if="loginError"
        color="error"
        variant="subtle"
        icon="i-heroicons-exclamation-triangle"
        :title="loginError"
      />

      <UButton
        type="submit"
        :loading="loading"
        block
        >登录</UButton
      >
    </form>
  </UCard>
</template>
