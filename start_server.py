"""Launcher — BranPy AI Server v2."""
import subprocess
import sys
import os

script = os.path.join(os.path.dirname(__file__), "server", "server_v2.py")
log_file = os.path.join(os.path.dirname(__file__), "server_output.txt")

print("Iniciando BranPy AI Server v2...")

proc = subprocess.Popen(
    [sys.executable, "-u", script],
    stdout=open(log_file, "w", encoding="utf-8"),
    stderr=subprocess.STDOUT,
    cwd=os.path.dirname(__file__),
    creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0,
)

print(f"PID: {proc.pid}")
print("Server iniciado em http://127.0.0.1:11435")
print("Endpoints: /api/health, /api/chat, /api/models, /api/info")
