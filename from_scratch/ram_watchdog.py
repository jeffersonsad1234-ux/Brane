import subprocess, time, os, json
from datetime import datetime

STATUS_FILE = r"D:\BRANPY-AI\from_scratch\ram_status.json"

def get_ram():
    result = subprocess.run(
        ['wmic', 'OS', 'get', 'FreePhysicalMemory,TotalVisibleMemorySize'],
        capture_output=True, text=True, creationflags=0x08000000
    )
    lines = result.stdout.strip().split('\n')
    for line in lines[1:]:
        parts = line.strip().split()
        if len(parts) >= 2:
            try:
                free = int(parts[0])
                total = int(parts[1])
                return free // 1024, total // 1024
            except:
                pass
    return 0, 0

def is_training_running(script):
    result = subprocess.run(
        ['wmic', 'process', 'where', f"CommandLine like '%{script}%'", 'get', 'ProcessId'],
        capture_output=True, text=True, creationflags=0x08000000
    )
    lines = [l.strip() for l in result.stdout.strip().split('\n')
             if l.strip() and l.strip() != 'ProcessId']
    return len(lines) > 0

def clean_ram():
    # Kill junk processes
    kill_list = ['net_updater64','SearchApp','SearchIndexer','StartMenuExperienceHost',
                 'msedgewebview2','RuntimeBroker','PhoneExperienceHost','GameBarPresenceWriter',
                 'hola','iVCam','MonectServer','cowork-svc','ollama','M365Copilot','DTAgent']
    killed = 0
    for name in kill_list:
        result = subprocess.run(
            ['wmic', 'process', 'where', f"Name='{name}.exe'", 'get', 'ProcessId'],
            capture_output=True, text=True, creationflags=0x08000000
        )
        for line in result.stdout.strip().split('\n'):
            line = line.strip()
            if line and line.isdigit():
                subprocess.run(['taskkill', '/F', '/PID', line], 
                             capture_output=True, creationflags=0x08000000)
                killed += 1
    return killed

def check_and_clean():
    now = datetime.now().strftime('%H:%M:%S')
    free, total = get_ram()
    free_percent = (free / total * 100) if total > 0 else 0
    
    vqvae_running = is_training_running('train_vqvae')
    text_running = is_training_running('train_fast')
    
    status = {
        'time': now,
        'ram_free_mb': free,
        'ram_total_mb': total,
        'ram_free_percent': round(free_percent, 1),
        'vqvae_running': vqvae_running,
        'text_150m_running': text_running,
        'action': 'none'
    }
    
    if free_percent < 15 and (vqvae_running or text_150m_running):
        killed = clean_ram()
        import ctypes
        try:
            ctypes.windll.kernel32.SetProcessWorkingSetSize(-1, -1, -1)
        except:
            pass
        time.sleep(2)
        free2, _ = get_ram()
        status['action'] = f'cleaned_killed_{killed}_freed_{free2 - free}MB'
        status['ram_free_after'] = free2
    elif free_percent < 10:
        killed = clean_ram()
        status['action'] = f'emergency_killed_{killed}'
    
    with open(STATUS_FILE, 'w') as f:
        json.dump(status, f)
    
    return status

if __name__ == '__main__':
    while True:
        s = check_and_clean()
        print(f"[{s['time']}] RAM: {s['ram_free_mb']}MB ({s['ram_free_percent']}%) | "
              f"VQVAE: {s['vqvae_running']} | 150M: {s['text_150m_running']} | {s['action']}")
        time.sleep(120)
