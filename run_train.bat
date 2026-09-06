@echo off
cd /d D:\BRANPY-AI
echo %date% %time% > D:\BRANPY-AI\train_start.txt
python D:\BRANPY-AI\train_lora.py > D:\BRANPY-AI\train_output.txt 2>&1
echo %date% %time% > D:\BRANPY-AI\train_end.txt
