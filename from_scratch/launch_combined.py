"""Launcher detached — roda treino combinado em background."""
import subprocess
import sys
import os

script = os.path.join(os.path.dirname(__file__), "train_combined.py")
log_file = os.path.join(os.path.dirname(__file__), "train_combined_output.txt")

print("Iniciando treino COMBINADO em background...")
print(f"Log: {log_file}")

# Windows: detached process
proc = subprocess.Popen(
    [sys.executable, "-u", script, "--size", "medium", "--epochs", "15", "--batch", "4", "--lr", "2e-4"],
    stdout=open(log_file, "w", encoding="utf-8"),
    stderr=subprocess.STDOUT,
    cwd=os.path.dirname(__file__),
    creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0,
)

print(f"PID: {proc.pid}")
print("Treino rodando em background!")
print("Cheque o log com: Get-Content train_combined_output.txt -Tail 20")
