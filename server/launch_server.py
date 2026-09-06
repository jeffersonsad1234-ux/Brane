import subprocess, sys, os
os.chdir(r"D:\BRANPY-AI\server")
p = subprocess.Popen(
    [sys.executable, "-u", "server_v2.py"],
    stdout=open("server_out.log", "w", encoding="utf-8", errors="replace"),
    stderr=open("server_err.log", "w", encoding="utf-8", errors="replace"),
    cwd=r"D:\BRANPY-AI\server"
)
print(f"Server PID: {p.pid}")
