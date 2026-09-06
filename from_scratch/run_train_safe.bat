@echo off
title BRANPY AI - TREINO PROTEGIDO
echo ============================================
echo   BRANPY AI - Treino com protecao
echo   Nao feche esta janela!
echo ============================================
echo.

cd /d D:\BRANPY-AI\from_scratch

:: Verificar se ja esta rodando
set LOCK=weights\bran9bpy_fast\training.lock
if exist %LOCK% (
    set /p PID=<%LOCK%
    tasklist /FI "PID eq %PID%" 2>NUL | find /I "python" >NUL
    if not errorlevel 1 (
        echo ERRO: Treino ja esta rodando ^(PID %PID%^)
        echo Se nao estiver, delete o arquivo: %LOCK%
        pause
        exit /b 1
    )
    echo Lock antigo encontrado ^(processo morto^). Limpando...
    del %LOCK%
)

:: Criar lock
echo %PID% > %LOCK%

:: Rodar treino
echo Iniciando treino...
python -u train_fast.py

:: Limpar lock ao sair
del %LOCK% 2>NUL
echo.
echo Treino finalizado ou interrompido.
pause
