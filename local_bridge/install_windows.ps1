$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = (Get-Command python -ErrorAction SilentlyContinue)
if (-not $python) { throw 'Python 3.11 이상을 먼저 설치하세요.' }
$pyver = & python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"
Write-Host "Python $pyver 확인"
& python (Join-Path $here 'bridge.py') --help 2>$null | Out-Null
$startup = [Environment]::GetFolderPath('Startup')
$cmd = Join-Path $startup 'TeacherOSDesktopBridge.cmd'
$bridge = Join-Path $here 'bridge.py'
$contents = "@echo off`r`nstart `"Teacher OS Desktop Bridge`" /min pythonw `"$bridge`"`r`n"
Set-Content -Path $cmd -Value $contents -Encoding ASCII
Write-Host "시작프로그램 등록: $cmd"
Write-Host 'Desktop Bridge를 지금 시작합니다.'
Start-Process -WindowStyle Minimized python -ArgumentList @($bridge)
Start-Sleep -Seconds 2
$config = Join-Path $HOME '.teacher-os\bridge-config.json'
if (Test-Path $config) {
  $json = Get-Content $config -Raw | ConvertFrom-Json
  Write-Host ''
  Write-Host 'Teacher OS에 아래 Pairing token을 한 번 저장하세요:' -ForegroundColor Yellow
  Write-Host $json.token -ForegroundColor Cyan
  Write-Host ''
  Write-Host '감시 폴더:'
  $json.watchDirs | ForEach-Object { Write-Host " - $_" }
} else {
  Write-Warning '설정파일 생성 확인이 필요합니다. bridge.py를 직접 한 번 실행하세요.'
}
