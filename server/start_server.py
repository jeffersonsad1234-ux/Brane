import subprocess, time
proc = subprocess.Popen(
    [r"C:\Users\jeffe\AppData\Local\Python\pythoncore-3.14-64\python.exe", r"D:\BRANPY-AI\server\server_v2.py"],
    cwd=r"D:\BRANPY-AI\server"
)
with open(r"D:\BRANPY-AI\server\server_pid.txt", "w") as f:
    f.write(str(proc.pid))
proc.wait()
