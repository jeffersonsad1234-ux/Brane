"""Lançador de treino V2 — background process"""
import subprocess, sys, os, time

script = r"D:\BRANPY-AI\from_scratch\train_v2.py"
log_out = r"D:\BRANPY-AI\from_scratch\train_v2_output.log"
log_err = r"D:\BRANPY-AI\from_scratch\train_v2_error.log"

env = os.environ.copy()
env["PYTHONUNBUFFERED"] = "1"

print(f"Iniciando treino V2...")
print(f"Log: {log_out}")
print(f"Erro: {log_err}")

proc = subprocess.Popen(
    [sys.executable, script],
    stdout=open(log_out, "w", encoding="utf-8"),
    stderr=open(log_err, "w", encoding="utf-8"),
    env=env,
    creationflags=0x00000008 | 0x00000200,  # DETACHED_PROCESS | CREATE_NO_WINDOW
)

print(f"PID: {proc.pid}")
print("Treino rodando em background!")
