import type { Avatar } from './api-types'

/** 根据头像来源生成头像URL. QQ头像使用QQ号, MC皮肤使用UUID */
export function avatarUrl(avatar: Avatar | null | undefined): string {
  if (!avatar) return ''
  if (avatar.source === 'qq' && avatar.qq_id) {
    return `https://q1.qlogo.cn/g?b=qq&nk=${encodeURIComponent(avatar.qq_id)}&s=640`
  }
  if (avatar.source === 'mc_skin' && avatar.uuid) {
    return `https://api.mcheads.org/head/${avatar.uuid}/64`
  }
  return ''
}
