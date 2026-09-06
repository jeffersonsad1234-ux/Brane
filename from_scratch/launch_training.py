import subprocess, sys, os

os.chdir(r"D:\BRANPY-AI\from_scratch")
log = open(r"D:\BRANPY-AI\from_scratch\train_output.log", "w", encoding="utf-8")
err = open(r"D:\BRANPY-AI\from_scratch\train_err.log", "w", encoding="utf-8")

proc = subprocess.Popen(
    [sys.executable, "-u", r"D:\BRANPY-AI\from_scratch\train_50m.py"],
    stdout=log, stderr=err,
    cwd=r"D:\BRANPY-AI\from_scratch",
    creationflags=0x00000008,
    env={**os.environ, "PYTHONUNBUFFERED": "1"}
)

print(f"Treino 50M rodando! PID: {proc.pid}")
