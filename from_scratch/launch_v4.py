import subprocess, sys, os
env = os.environ.copy()
env["PYTHONUNBUFFERED"] = "1"
proc = subprocess.Popen(
    [sys.executable, r"D:\BRANPY-AI\from_scratch\train_v4.py"],
    stdout=open(r"D:\BRANPY-AI\from_scratch\train_v4_output.log", "w", encoding="utf-8"),
    stderr=open(r"D:\BRANPY-AI\from_scratch\train_v4_error.log", "w", encoding="utf-8"),
    env=env,
    creationflags=0x00000008 | 0x00000200,
)
print(f"PID: {proc.pid}")
