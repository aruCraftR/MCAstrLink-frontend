export type AvatarSource = 'qq' | 'mc_skin'

export interface Avatar {
  source: AvatarSource
  /** QQ头像: 请求方使用QQ号获取头像 */
  qq_id?: string
  /** MC皮肤头像: 请求方使用UUID获取头像 */
  uuid?: string
}

export interface PlayerInfo {
  uuid: string
  name: string
  avatar: Avatar
}

export interface AuthedPlayerInfo extends PlayerInfo {
  permission: number
}

export interface OnlinePlayerInfo extends PlayerInfo {
  servers: string[]
}

export interface PlayerSocialAccounts {
  qq?: string | null
}

export interface PlayerProfile {
  social_accounts: PlayerSocialAccounts
  online_qq_suffix: string
  offline_qq_suffix: string
  avatar_source: AvatarSource
}

export interface PagedQueryResponse<T> {
  items: T[]
  total: number
}

export interface PlayerRecentPlay {
  server_id: string
  online_date: string
  total_time: number
  ip?: string | null
}

export interface ServerRecentPlay {
  player: PlayerInfo
  online_date: string
  total_time: number
}

export interface PlayerStatus {
  online_servers: string[]
}

export type GameStatus = 'active' | 'starting' | 'stopping' | 'stopped' | 'unresponsive'

export interface ServerStatus {
  id: string
  meta_blake3: string
  status: GameStatus
  max_players: number
  player_count: number
  players: PlayerInfo[]
}

export interface PanelGameMeta {
  blake3: string
  server_id: string
  short_id?: string | null
  zh_cn_name?: string | null
  en_ww_name?: string | null
  minecraft_version?: string | null
  server_version?: string | null
  announcement?: string | null
  icon_url?: string | null
  status: 'planned' | 'active' | 'archived'
  recent_online?: number | null
}

export interface TokenResponse {
  access_token: string
  token_type: 'bearer'
  expires_in: number
  scope: string
}
