# BRANE Development Launcher
# Starts both frontend (port 3001) and TTS backend (port 3200)

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "  BRANE Development Environment" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Resolve paths
$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$FrontendDir = Join-Path $RootDir "frontend"
$BackendDir = Join-Path $RootDir "backend"

# Start TTS backend
Write-Host "[TTS] Starting TTS server..." -ForegroundColor Green
$ttsJob = Start-Job -Name "brane-tts" -ScriptBlock {
    param($dir)
    Set-Location $dir
    $env:TTS_PORT = "3200"
    python tts_server.py
} -ArgumentList $BackendDir

# Start frontend
Write-Host "[FE] Starting React frontend..." -ForegroundColor Green
Set-Location $FrontendDir
$env:PORT = "3001"
$env:REACT_APP_AGENT_API = "http://localhost:3200"
$feProcess = Start-Process -FilePath "npx" -ArgumentList "craco start" -NoNewWindow -PassThru -WorkingDirectory $FrontendDir

Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "  Servers:" -ForegroundColor Cyan
Write-Host "  Frontend : http://localhost:3001" -ForegroundColor Yellow
Write-Host "  TTS API  : http://localhost:3200/api/tts" -ForegroundColor Yellow
Write-Host "  Health   : http://localhost:3200/api/health" -ForegroundColor Yellow
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Magenta

# Wait for frontend process
try {
    $feProcess.WaitForExit()
} finally {
    Write-Host "[TTS] Stopping TTS server..." -ForegroundColor Yellow
    Stop-Job $ttsJob -Force
    Remove-Job $ttsJob -Force
    Write-Host "All servers stopped." -ForegroundColor Cyan
}
