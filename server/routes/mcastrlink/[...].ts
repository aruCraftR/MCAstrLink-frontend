import { proxyRequest } from 'h3'

/**
 * 同源模式API代理.
 * 当 NUXT_PUBLIC_API_BASE=/mcastrlink 时, 前端所有API请求都会走到这里,
 * 由Nuxt服务端转发到后端真实地址, 浏览器视角为同源请求(自动携带Cookie, 无CORS).
 * 非同源模式(NUXT_PUBLIC_API_BASE为完整URL)下该路由不会被调用.
 */
export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const target = String(config.apiProxyTarget).replace(/\/+$/, '')
  const requestPath = event.path.replace(/^\/mcastrlink/, '')
  return proxyRequest(event, `${target}${requestPath}`)
})
