$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = (Get-Command python -ErrorAction SilentlyContinue)
if (-not $python) { throw 'Python 3.11 이상을 먼저 설치하세요.' }
$pyver = & python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"
Write-Host "Python $pyver 확인"
$startup = [Environment]::GetFolderPath('Startup')
$cmd = Join-Path $startup 'TeacherOSDesktopBridge.cmd'
$bridge = Join-Path $here 'bridge_v38.py'
if (-not (Test-Path $bridge)) { throw 'bridge_v38.py 파일이 없습니다.' }
$contents = "@echo off`r`nstart `"Teacher OS Desktop Bridge`" /min pythonw `"$bridge`"`r`n"
Set-Content -Path $cmd -Value $contents -Encoding ASCII
Write-Host "시작프로그램 등록: $cmd"
Write-Host 'Desktop Bridge v0.38을 지금 시작합니다.'
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
  Write-Host ''
  Write-Host 'NEIS는 학생 이름/원문을 보내지 않고 미입력·누락 건수만 집계합니다.' -ForegroundColor Green
  Write-Host 'K-에듀파인은 공문함·결재·예산/지출 상태를 원문 없이 집계합니다.' -ForegroundColor Green
} else {
  Write-Warning '설정파일 생성 확인이 필요합니다. bridge_v38.py를 직접 한 번 실행하세요.'
}
