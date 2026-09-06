#!/usr/bin/env python3
"""Monitor de treino - salva status a cada 10 minutos"""
import time
import json
import os
from datetime import datetime

LOG_FILE = r"D:\BRANPY-AI\from_scratch\weights\bran9bpy_fast\train_log.txt"
STATUS_FILE = r"D:\BRANPY-AI\from_scratch\weights\bran9bpy_fast\status_monitor.json"
MONITOR_LOG = r"D:\BRANPY-AI\from_scratch\weights\bran9bpy_fast\monitor_log.txt"

def log(msg):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {msg}"
    print(line)
    with open(MONITOR_LOG, 'a', encoding='utf-8') as f:
        f.write(line + '\n')

def get_training_status():
    try:
        with open(LOG_FILE, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        last_lines = [l.strip() for l in lines[-20:] if 'Step' in l]
        if not last_lines:
            return None
        
        last_line = last_lines[-1]
        # Parse: Step 100/13200 (0.8%) | Loss: 0.7489 | Tempo: 9.1s | ETA: 126.7h | LR: 0.000021
        parts = last_line.split('|')
        step_part = parts[0].strip().split(' ')[1]
        step_num = int(step_part.split('/')[0])
        total_steps = int(step_part.split('/')[1].replace('(', '').replace(')', ''))
        
        loss_part = parts[1].strip().split(':')[1].strip()
        loss = float(loss_part)
        
        eta_part = parts[3].strip().split(':')[1].strip().replace('h', '')
        eta_hours = float(eta_part)
        
        progress = (step_num / total_steps) * 100
        
        return {
            'step': step_num,
            'total_steps': total_steps,
            'progress': round(progress, 1),
            'loss': loss,
            'eta_hours': eta_hours,
            'eta_days': round(eta_hours / 24, 1),
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        return {'error': str(e), 'timestamp': datetime.now().isoformat()}

def main():
    log("Monitor de treino iniciado. Verificando a cada 10 minutos.")
    
    start_time = time.time()
    max_runtime = 7 * 3600  # 7 horas
    
    while True:
        elapsed = time.time() - start_time
        if elapsed > max_runtime:
            log("Tempo de monitoramento esgotado (7h). Saindo.")
            break
        
        status = get_training_status()
        
        if status and 'error' not in status:
            log(f"Step {status['step']}/{status['total_steps']} ({status['progress']}%) | Loss: {status['loss']} | ETA: {status['eta_days']} dias")
        else:
            log(f"Status: {status}")
        
        # Salvar status
        with open(STATUS_FILE, 'w', encoding='utf-8') as f:
            json.dump(status, f, indent=2, ensure_ascii=False)
        
        time.sleep(600)  # 10 minutos

if __name__ == "__main__":
    main()
