"""BranPy Training Watchdog — Monitora e reinicia treinos se morrerem.
100% branpy.com.br"""
import subprocess
import sys
import os
import time
import json
from datetime import datetime

PYTHONW = r"C:\Users\jeffe\AppData\Local\Python\pythoncore-3.14-64\pythonw.exe"
TRAIN_DIR = r"D:\BRANPY-AI\from_scratch"

TASKS = [
    {
        'name': 'VQ-VAE',
        'script': 'train_vqvae.py',
        'lock': os.path.join(TRAIN_DIR, 'weights', 'vqvae_128', 'training.lock'),
        'log': os.path.join(TRAIN_DIR, 'weights', 'vqvae_128', 'train_log.txt'),
    },
    {
        'name': '150M-Text',
        'script': 'train_fast.py',
        'lock': os.path.join(TRAIN_DIR, 'weights', 'bran9bpy_fast', 'training.lock'),
        'log': os.path.join(TRAIN_DIR, 'weights', 'bran9bpy_fast', 'train_log.txt'),
    },
]

STATUS_FILE = os.path.join(TRAIN_DIR, 'watchdog_status.json')


def is_process_running(script_name):
    """Verifica se o script tá rodando."""
    result = subprocess.run(
        ['wmic', 'process', 'where',
         f"CommandLine like '%{script_name}%'", 'get', 'ProcessId'],
        capture_output=True, text=True, creationflags=0x08000000
    )
    lines = [l.strip() for l in result.stdout.strip().split('\n')
             if l.strip() and l.strip() != 'ProcessId']
    return len(lines) > 0


def start_task(task):
    """Inicia um treino."""
    script = os.path.join(TRAIN_DIR, task['script'])
    lock = task['lock']
    if os.path.exists(lock):
        os.remove(lock)
    subprocess.Popen(
        [PYTHONW, script],
        cwd=TRAIN_DIR,
        creationflags=0x08000000
    )


def get_log_tail(path, n=3):
    """Últimas N linhas do log."""
    try:
        with open(path, 'r', encoding='utf-8', errors='replace') as f:
            lines = f.readlines()
            return [l.rstrip() for l in lines[-n:]]
    except:
        return ['[sem log]']


def check_and_restart():
    """Verifica tudo e reinicia o que morreu."""
    now = datetime.now().strftime('%d/%m %H:%M:%S')
    status = {'time': now, 'tasks': []}
    restarted = []

    for task in TASKS:
        running = is_process_running(task['script'])
        log_lines = get_log_tail(task['log'], 2)

        entry = {
            'name': task['name'],
            'running': running,
            'log': log_lines,
        }

        if not running:
            start_task(task)
            entry['restarted'] = True
            restarted.append(task['name'])
        else:
            entry['restarted'] = False

        status['tasks'].append(entry)

    # Salvar status
    with open(STATUS_FILE, 'w', encoding='utf-8') as f:
        json.dump(status, f, indent=2, ensure_ascii=False)

    # Print resumo
    print(f"[{now}] STATUS:")
    for t in status['tasks']:
        icon = 'RODANDO' if t['running'] else 'MORTO -> REINICIADO'
        if t.get('restarted'):
            icon = 'MORTO -> REINICIADO'
        print(f"  {t['name']}: {icon}")
        for line in t['log']:
            print(f"    {line}")

    if restarted:
        print(f"\n  Reiniciados: {', '.join(restarted)}")
    else:
        print(f"\n  Todos vivos!")

    return status


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--loop':
        print("Watchdog em modo loop (verifica a cada 5 min)...")
        while True:
            check_and_restart()
            print("---")
            time.sleep(300)
    else:
        check_and_restart()
