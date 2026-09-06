import subprocess, sys
subprocess.Popen(
    [sys.executable, "-u", r"D:\BRANPY-AI\from_scratch\train_progressive.py"],
    stdout=open(r"D:\BRANPY-AI\from_scratch\train_progressive_output.txt", "w", encoding="utf-8"),
    stderr=subprocess.STDOUT,
    creationflags=0x00000008,
    cwd=r"D:\BRANPY-AI\from_scratch",
)
