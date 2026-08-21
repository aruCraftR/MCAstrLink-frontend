# Build and package the Windows production bundle
# Usage: .\scripts\build-windows.ps1
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

Write-Host "==> Installing dependencies"
pnpm install --frozen-lockfile

Write-Host "==> Lint"
pnpm run lint

Write-Host "==> Typecheck"
pnpm run typecheck

Write-Host "==> Building Nuxt"
pnpm run build

$stage = Join-Path $root '.dist-stage'
$outDir = Join-Path $root '.output'
if (Test-Path $stage) { Remove-Item -Recurse -Force $stage }
New-Item -ItemType Directory -Path $stage | Out-Null

Write-Host "==> Assembling release bundle"
Copy-Item -Recurse (Join-Path $outDir '*') $stage
Copy-Item (Join-Path $root 'deploy\start.ps1') $stage
Copy-Item (Join-Path $root 'deploy\start.bat') $stage
Copy-Item (Join-Path $root 'deploy\.env.example') (Join-Path $stage '.env.example')

$archive = Join-Path $root 'mcastrlink-frontend-windows-x64.zip'
if (Test-Path $archive) { Remove-Item -Force $archive }
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $archive

Remove-Item -Recurse -Force $stage
Write-Host "==> Build complete: $archive"
