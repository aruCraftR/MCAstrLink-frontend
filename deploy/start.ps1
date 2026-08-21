# MCAstrLink 玩家面板前端 启动脚本 (Windows)
# 用法: .\start.ps1 [port]
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

# 读取 .env (若存在) 设置环境变量
$envFile = Join-Path $root '.env'
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
      $key, $value = $line -split '=', 2
      [Environment]::SetEnvironmentVariable($key.Trim(), $value.Trim())
    }
  }
}

$port = if ($args.Count -gt 0) { $args[0] } else { $env:PORT }
if (-not $port) { $port = 3000 }

$env:PORT = $port
$env:HOST = if ($env:HOST) { $env:HOST } else { '0.0.0.0' }
$env:NITRO_HOST = $env:HOST
$env:NITRO_PORT = $port

Write-Host "启动 MCAstrLink 前端: http://$($env:HOST):$port"
node (Join-Path $root '.output\server\index.mjs')
