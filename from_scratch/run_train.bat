@echo off
cd /d D:\BRANPY-AI\from_scratch
echo %date% %time% > D:\BRANPY-AI\from_scratch\train_start.txt
python -u train.py --size small --epochs 20 --batch 4 --max-len 256 --vocab 8000 > D:\BRANPY-AI\from_scratch\train_output.txt 2>&1
echo %date% %time% > D:\BRANPY-AI\from_scratch\train_end.txt
