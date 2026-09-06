"""Lançador treino V3"""
import subprocess, sys, os

script = r"D:\BRANPY-AI\from_scratch\train_final_v3.py"
log_out = r"D:\BRANPY-AI\from_scratch\train_final_output.log"
log_err = r"D:\BRANPY-AI\from_scratch\train_final_error.log"

env = os.environ.copy()
env["PYTHONUNBUFFERED"] = "1"

proc = subprocess.Popen(
    [sys.executable, script],
    stdout=open(log_out, "w", encoding="utf-8"),
    stderr=open(log_err, "w", encoding="utf-8"),
    env=env,
    creationflags=0x00000008 | 0x00000200,
)

print(f"PID: {proc.pid}")
print("Treino V3 rodando!")
