@echo off
REM Backup automático checkpoints BranPy - roda a cada 30min via Task Scheduler
set SRC=D:\BRANPY-AI\from_scratch\weights
set DST=D:\BACKUP_BRAINPY
set LOG=%DST%\backup.log

if not exist "%DST%\brain_1" mkdir "%DST%\brain_1"
if not exist "%DST%\brain_2" mkdir "%DST%\brain_2"
if not exist "%DST%\brain_3" mkdir "%DST%\brain_3"
if not exist "%DST%\orchestrator" mkdir "%DST%\orchestrator"

echo [%date% %time%] Iniciando backup... >> "%LOG%"

copy "%SRC%\brain_01_conversation\model_epoch*.pt" "%DST%\brain_1\" /Y >> "%LOG%" 2>&1
copy "%SRC%\brain_01_conversation\model_best.pt" "%DST%\brain_1\" /Y >> "%LOG%" 2>&1
copy "%SRC%\brain_01_conversation\tokenizer.json" "%DST%\brain_1\" /Y >> "%LOG%" 2>&1

copy "%SRC%\brain_02_reasoning\model_epoch*.pt" "%DST%\brain_2\" /Y >> "%LOG%" 2>&1
copy "%SRC%\brain_02_reasoning\model_best.pt" "%DST%\brain_2\" /Y >> "%LOG%" 2>&1
copy "%SRC%\brain_02_reasoning\tokenizer.json" "%DST%\brain_2\" /Y >> "%LOG%" 2>&1

copy "%SRC%\brain_03_knowledge\model_epoch*.pt" "%DST%\brain_3\" /Y >> "%LOG%" 2>&1
copy "%SRC%\brain_03_knowledge\model_best.pt" "%DST%\brain_3\" /Y >> "%LOG%" 2>&1
copy "%SRC%\brain_03_knowledge\tokenizer.json" "%DST%\brain_3\" /Y >> "%LOG%" 2>&1

copy "%SRC%\brain_orchestrator\model_epoch*.pt" "%DST%\orchestrator\" /Y >> "%LOG%" 2>&1
copy "%SRC%\brain_orchestrator\model_best.pt" "%DST%\orchestrator\" /Y >> "%LOG%" 2>&1
copy "%SRC%\brain_orchestrator\tokenizer.json" "%DST%\orchestrator\" /Y >> "%LOG%" 2>&1

echo [%date% %time%] Backup concluido >> "%LOG%"