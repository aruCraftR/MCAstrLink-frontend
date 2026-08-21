# 构建并打包 Windows 版生产包
# 用法: .\scripts\build-windows.ps1
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

Write-Host "==> 安装依赖"
pnpm install --frozen-lockfile

Write-Host "==> Lint"
pnpm run lint

Write-Host "==> Typecheck"
pnpm run typecheck

Write-Host "==> 构建 Nuxt"
pnpm run build

$stage = Join-Path $root '.dist-stage'
$outDir = Join-Path $root '.output'
if (Test-Path $stage) { Remove-Item -Recurse -Force $stage }
New-Item -ItemType Directory -Path $stage | Out-Null

Write-Host "==> 组装发布包"
Copy-Item -Recurse (Join-Path $outDir '*') $stage
Copy-Item (Join-Path $root 'deploy\start.ps1') $stage
Copy-Item (Join-Path $root 'deploy\start.bat') $stage
Copy-Item (Join-Path $root 'deploy\.env.example') (Join-Path $stage '.env.example')

$archive = Join-Path $root 'mcastrlink-frontend-windows-x64.zip'
if (Test-Path $archive) { Remove-Item -Force $archive }
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $archive

Remove-Item -Recurse -Force $stage
Write-Host "==> 构建完成: $archive"
