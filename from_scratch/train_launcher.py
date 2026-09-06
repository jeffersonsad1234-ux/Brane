"""BranPy Training Launcher — Roda treinos como processos independentes do Windows.
Sobrevive a reinícios do servidor, fechamentos, qualquer coisa.
Usa Task Scheduler pra garantir que NUNCA para.

100% branpy.com.br — Todos os direitos reservados.
"""
import subprocess
import sys
import os
import time


PYTHON = sys.executable
TRAIN_DIR = os.path.dirname(os.path.abspath(__file__))
WEIGHTS_DIR = os.path.join(TRAIN_DIR, 'weights')

TASKS = [
    {
        'name': 'BranPy-VQVAE-128',
        'script': 'train_vqvae.py',
        'log': os.path.join(WEIGHTS_DIR, 'vqvae_128', 'train_log.txt'),
    },
    {
        'name': 'BranPy-150M-Text',
        'script': 'train_fast.py',
        'log': os.path.join(WEIGHTS_DIR, 'bran9bpy_fast', 'train_log.txt'),
    },
]


def is_running(name):
    for p in subprocess.run(
        ['wmic', 'process', 'where',
         f"CommandLine like '%{name}%'", 'get', 'ProcessId,CommandLine'],
        capture_output=True, text=True, creationflags=0x08000000
    ).stdout.strip().split('\n'):
        if 'python' in p.lower():
            return True
    return False


def launch_train(task):
    name = task['name']
    script = os.path.join(TRAIN_DIR, task['script'])

    if is_running(name):
        print(f"  [SKIP] {name} ja esta rodando")
        return

    log_dir = os.path.dirname(task['log'])
    os.makedirs(log_dir, exist_ok=True)

    cmd = f'start "TRAIN_{name}" /min cmd /c "{PYTHON} {script} >> {task["log"]} 2>&1"'
    subprocess.run(cmd, shell=True, cwd=TRAIN_DIR)
    print(f"  [OK] {name} iniciado — log: {task['log']}")


def create_schtasks(task):
    name = task['name']
    script = os.path.join(TRAIN_DIR, task['script'])

    xml = f"""<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <Triggers>
    <LogonTrigger>
      <Enabled>true</Enabled>
    </LogonTrigger>
  </Triggers>
  <Principals>
    <Principal>
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>HighestAvailable</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>false</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
  </Settings>
  <Actions>
    <Exec>
      <Command>{PYTHON}</Command>
      <Arguments>{script}</Arguments>
      <WorkingDirectory>{TRAIN_DIR}</WorkingDirectory>
    </Exec>
  </Actions>
</Task>"""

    xml_path = os.path.join(TRAIN_DIR, f'task_{name}.xml')
    with open(xml_path, 'w', encoding='utf-16') as f:
        f.write(xml)

    result = subprocess.run(
        ['schtasks', '/create', '/tn', f'BranPy\\{name}', '/xml', xml_path, '/f'],
        capture_output=True, text=True
    )
    if result.returncode == 0:
        print(f"  [OK] Task Scheduler: {name}")
    else:
        print(f"  [ERRO] {name}: {result.stderr}")


if __name__ == '__main__':
    print("=" * 60)
    print("BRANPY Training Launcher")
    print("100% branpy.com.br")
    print("=" * 60)

    print("\n[1] Registrando no Task Scheduler (sobrevive reinicios)...")
    for task in TASKS:
        create_schtasks(task)

    print("\n[2] Iniciando treinos agora...")
    for task in TASKS:
        launch_train(task)

    print("\n[3] Status:")
    for task in TASKS:
        running = is_running(task['name'])
        status = "RODANDO" if running else "PARADO"
        print(f"  {task['name']}: {status}")

    print("\nPronto! Treinos vao rodar sempre que o PC ligar.")
    print("Para verificar: python train_launcher.py")
    print("Para parar: schtasks /end /tn BranPy\\<nome>")
