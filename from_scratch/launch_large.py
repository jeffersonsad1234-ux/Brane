"""Launcher — BranPy AI LARGE 500M (detached)."""
import subprocess
import sys
import os

script = os.path.join(os.path.dirname(__file__), "train_large.py")
log_file = os.path.join(os.path.dirname(__file__), "train_large_output.txt")

print("Iniciando BRANPY AI LARGE (500M)...")
print(f"Log: {log_file}")

proc = subprocess.Popen(
    [sys.executable, "-u", script],
    stdout=open(log_file, "w", encoding="utf-8"),
    stderr=subprocess.STDOUT,
    cwd=os.path.dirname(__file__),
    creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0,
)

print(f"PID: {proc.pid}")
print("Treino LARGE rodando em background!")
print("Cheque o log com: Get-Content train_large_output.txt -Tail 20")
