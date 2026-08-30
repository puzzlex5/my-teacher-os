$ErrorActionPreference = 'Stop'

$repoBase = 'https://raw.githubusercontent.com/puzzlex5/my-teacher-os/main/local_bridge'
$installDir = Join-Path $env:LOCALAPPDATA 'TeacherOS\bridge'
$config = Join-Path $HOME '.teacher-os\bridge-config.json'
$files = @('bridge.py','bridge_v37.py','bridge_v38.py','bridge_v44.py','pairing_v44.py','watchdog_v45.py','neis_adapter.py','kedufine_adapter.py')

$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) { throw 'Python 3.11 이상을 먼저 설치하세요.' }
$versionOk = & $python.Source -c "import sys; print('1' if sys.version_info >= (3,11) else '0')"
if ($versionOk.Trim() -ne '1') { throw 'Python 3.11 이상이 필요합니다.' }
Write-Host "Python $(& $python.Source -c 'import platform; print(platform.python_version())') 확인"

New-Item -ItemType Directory -Force -Path $installDir | Out-Null
Write-Host 'Teacher OS Desktop Bridge 최신 파일을 설치합니다.'
foreach ($name in $files) {
  $target = Join-Path $installDir $name
  Invoke-WebRequest -UseBasicParsing -Uri "$repoBase/$name" -OutFile $target
  if (-not (Test-Path $target) -or (Get-Item $target).Length -lt 20) { throw "$name 설치에 실패했습니다." }
}

# 이전 Bridge가 같은 loopback 포트를 사용 중이면 사용자 소유 프로세스만 종료를 시도합니다.
try {
  $connections = Get-NetTCPConnection -LocalAddress '127.0.0.1' -LocalPort 43135 -State Listen -ErrorAction SilentlyContinue
  foreach ($c in @($connections)) {
    if ($c.OwningProcess) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue }
  }
  Start-Sleep -Milliseconds 700
} catch { }

$startup = [Environment]::GetFolderPath('Startup')
$cmd = Join-Path $startup 'TeacherOSDesktopBridge.cmd'
$watchdog = Join-Path $installDir 'watchdog_v45.py'
$pythonDir = Split-Path -Parent $python.Source
$pythonw = Join-Path $pythonDir 'pythonw.exe'
if (-not (Test-Path $pythonw)) { $pythonw = $python.Source }
$contents = "@echo off`r`nstart `"Teacher OS Watchdog`" /min `"$pythonw`" `"$watchdog`"`r`n"
Set-Content -Path $cmd -Value $contents -Encoding ASCII
Write-Host "시작프로그램 등록: $cmd"

Write-Host 'Desktop Bridge v0.45 watchdog을 시작합니다.'
Start-Process -WindowStyle Minimized -FilePath $pythonw -ArgumentList @($watchdog)

$ready = $false
for ($i=0; $i -lt 40; $i++) {
  Start-Sleep -Milliseconds 500
  if (-not (Test-Path $config)) { continue }
  try {
    $h = Invoke-RestMethod -Method Get -Uri 'http://127.0.0.1:43135/v1/health' -Headers @{ Origin='https://puzzlex5.github.io' } -TimeoutSec 2
    if ($h.ok) { $ready = $true; break }
  } catch { }
}
if (-not $ready) { throw 'Desktop Bridge 시작 확인에 실패했습니다. watchdog 로그(%USERPROFILE%\.teacher-os\watchdog-v45.jsonl)를 확인하세요.' }

# 장기 토큰 자체를 URL/콘솔에 넣지 않고, 5분짜리 일회용 nonce만 브라우저에 전달합니다.
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
$nonce = [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+','-').Replace('/','_')
$expires = [DateTimeOffset]::UtcNow.AddMinutes(5).ToUnixTimeSeconds()
$j = Get-Content $config -Raw | ConvertFrom-Json
$j | Add-Member -NotePropertyName pairNonce -NotePropertyValue $nonce -Force
$j | Add-Member -NotePropertyName pairExpiresAt -NotePropertyValue $expires -Force
$j | ConvertTo-Json -Depth 8 | Set-Content -Path $config -Encoding UTF8

$pairUrl = 'https://puzzlex5.github.io/my-teacher-os/#teacheros-pair=' + [Uri]::EscapeDataString($nonce)
Write-Host ''
Write-Host '설치 완료. Teacher OS를 열어 자동 페어링합니다.' -ForegroundColor Green
Write-Host 'Bridge가 종료되면 watchdog이 자동으로 다시 시작합니다.' -ForegroundColor Green
Write-Host '장기 pairing token은 화면이나 URL에 출력하지 않습니다.' -ForegroundColor Green
Write-Host '감시 폴더와 상태 DB는 사용자 PC 안에만 저장됩니다.' -ForegroundColor Green
Start-Process $pairUrl
