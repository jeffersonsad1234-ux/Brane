@echo off
title BRANPY AI - Status do Treino
echo ============================================
echo   STATUS DO TREINO BRANPY AI
echo ============================================
echo.

set LOG=weights\bran9bpy_fast\train_log.txt
set LOCK=weights\bran9bpy_fast\training.lock

:: Verificar se esta rodando
if exist %LOCK% (
    set /p PID=<%LOCK%
    tasklist /FI "PID eq %PID%" 2>NUL | find /I "python" >NUL
    if not errorlevel 1 (
        echo [OK] Treino RODANDO (PID %PID%)
    ) else (
        echo [!!] Treino PARADO (lock orfao)
    )
) else (
    echo [!!] Treino NAO esta rodando (sem lock)
)

echo.
echo --- Ultimas 15 linhas do log ---
echo.
if exist %LOG% (
    powershell -Command "Get-Content '%LOG%' -Tail 15"
) else (
    echo Log nao encontrado: %LOG%
)

echo.
echo --- Checkpoints ---
echo.
if exist "weights\bran9bpy_fast\model_epoch*.pt" (
    powershell -Command "Get-ChildItem 'weights\bran9bpy_fast\model_epoch*.pt' | Sort-Object Name | Select-Object Name, @{L='MB';E={[math]::Round($_.Length/1048576,1)}}, LastWriteTime | Format-Table -AutoSize"
) else (
    echo Nenhum checkpoint encontrado
)

echo.
pause
