@echo off
REM Configura Task Scheduler para rodar backup a cada 30 minutos
REM Execute como ADMINISTRADOR

schtasks /create /tn "BranPy_Backup_30min" ^
  /tr "D:\BRANPY-AI\backup_checkpoints.bat" ^
  /sc minute /mo 30 ^
  /ru SYSTEM ^
  /f

echo Task agendado: BranPy_Backup_30min (a cada 30 min)
echo Para remover: schtasks /delete /tn "BranPy_Backup_30min" /f
pause