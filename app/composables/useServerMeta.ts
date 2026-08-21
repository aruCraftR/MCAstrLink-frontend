import type { PanelGameMeta } from '../utils/api-types'

const META_CACHE_KEY = 'panel-meta-cache'

function loadCache(): Record<string, PanelGameMeta> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(META_CACHE_KEY) || '{}')
  } catch {
    return {}
  }
}

/** 服务器元数据缓存与按需批量拉取 */
export function useServerMeta() {
  const { request } = useApi()
  const metaCache = ref<Record<string, PanelGameMeta>>(loadCache())

  const saveCache = () => {
    localStorage.setItem(META_CACHE_KEY, JSON.stringify(metaCache.value))
  }

  /**
   * 批量拉取缺失或摘要不一致的元数据.
   * digests: 服务器ID -> 当前元数据摘要, 摘要一致时跳过
   */
  async function ensureMeta(ids: string[], digests?: Record<string, string>) {
    const missing = ids.filter((id) => {
      if (digests && digests[id]) {
        return metaCache.value[id]?.blake3 !== digests[id]
      }
      return !metaCache.value[id]
    })
    if (!missing.length) return
    try {
      const metas = await request<PanelGameMeta[]>(
        `/servers?ids=${missing.map(encodeURIComponent).join(',')}`
      )
      for (const meta of metas) {
        metaCache.value[meta.server_id] = meta
      }
      saveCache()
    } catch {
      // 元数据拉取失败不阻塞展示
    }
  }

  /** 服务器显示名: 中文名→英文名→短ID→节点ID */
  function serverName(id: string): string {
    const meta = metaCache.value[id]
    return meta?.zh_cn_name || meta?.en_ww_name || meta?.short_id || id
  }

  return { metaCache, ensureMeta, serverName }
}
