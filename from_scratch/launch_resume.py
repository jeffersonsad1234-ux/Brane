"""Launcher — resume training epochs 9-10."""
import subprocess
import sys
import os

script = os.path.join(os.path.dirname(__file__), "resume_training.py")
log_file = os.path.join(os.path.dirname(__file__), "resume_output.txt")

print("Iniciando RESUME epochs 9-10...")

proc = subprocess.Popen(
    [sys.executable, "-u", script],
    stdout=open(log_file, "w", encoding="utf-8"),
    stderr=subprocess.STDOUT,
    cwd=os.path.dirname(__file__),
    creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0,
)

print(f"PID: {proc.pid}")
print(f"Log: {log_file}")
