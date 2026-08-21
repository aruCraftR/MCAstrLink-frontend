# MCAstrLink 玩家面板前端

基于 Nuxt 4 + Nuxt UI 4 + Pinia 的玩家面板前端，对接 MCAstrLink API（玩家面板后端 API）。

> [!NOTE]
> 本项目在开发过程中大量使用了 AI 辅助编程工具（包括代码生成、重构与排错）。
> AI 生成的代码可能存在边界情况考虑不周或潜在安全问题，请在上线前进行人工审查与测试。

## 环境要求

- Node.js 22+
- pnpm

## 安装与运行

```bash
pnpm install
pnpm dev
```

开发环境默认以**非同源（跨域直连）**方式访问 `http://127.0.0.1:22565` 的本机后端。

构建生产版本：

```bash
pnpm build
```

## 部署模式

本项目支持两种部署模式，通过环境变量 `NUXT_PUBLIC_API_BASE` 切换，构建/启动时生效：

### 非同源部署（默认）

前端与 API 部署在不同域名，前端直接请求后端：

- `NUXT_PUBLIC_API_BASE=https://panel-api.arucraftr.org`
- 登录令牌由前端保存在内存中，通过 `Authorization: Bearer <token>` 请求头携带；
- SSE 使用 `?token=` 查询参数认证（浏览器 EventSource 无法携带请求头）；
- 需要在后端配置（`server.yml` 的 `panel_api.cors.allow_origins`）中加入前端实际域名，
  并将 `panel_api.same_origin_deployment` 保持为 `false`。

### 同源部署

前端与 API 同域名，前端请求 `/mcastrlink/*`，由 Nuxt 服务端代理转发到后端：

```bash
NUXT_PUBLIC_API_BASE=/mcastrlink
NUXT_API_PROXY_TARGET=http://127.0.0.1:22565   # 后端真实地址, 可按环境调整
```

- 登录后由后端下发 **httpOnly Cookie**，浏览器请求自动携带，前端不保存令牌；
- 无需配置 CORS；后端需将 `panel_api.same_origin_deployment` 设为 `true`；
- SSE 依赖 Cookie 认证，无需额外参数；
- 前端刷新后通过 `GET /oauth2/check` 校验登录态。

> 注意：`/mcastrlink` 前缀为 Nuxt 服务端代理专用路径，避免与 Nuxt Icon 等
> 模块占用的 `/api/_nuxt_icon` 冲突；反向代理部署时请勿把 `/mcastrlink` 直接交给后端。

## 部署说明

- 本项目启用 **SSR**：生产部署需要运行 Node 服务端（`node .output/server/index.mjs`），不能直接当纯静态文件托管。
- 非同源模式令牌保存在内存（Pinia），刷新页面后需重新登录；同源模式由 Cookie 保持登录态。
- 同源模式 Cookie 为 httpOnly，可缓解 XSS 窃取令牌；非同源模式仍建议配合 CSP 等缓解措施。

## 环境变量

- `NUXT_PUBLIC_API_BASE`：API 地址。完整 URL 为非同源直连模式；`/mcastrlink` 为同源代理模式。默认 `http://127.0.0.1:22565`。
- `NUXT_API_PROXY_TARGET`：同源模式下服务端代理转发的后端真实地址，默认 `http://127.0.0.1:22565`。
- `NUXT_PUBLIC_APP_NAME`：页面显示的应用名，默认 `MCAstrLink`。

## 已实现页面

- 登录（密码登录 / 游戏内验证码登录）
- 服务器状态（SSE 实时推送 + 元数据摘要缓存）
- 个人中心（资料、头像源、QQ 名片后缀、游玩记录、修改密码、登出）
