import subprocess, sys, os, time
os.chdir(r"D:\BRANPY-AI\from_scratch")
print("Starting training...", flush=True)
p = subprocess.Popen(
    [sys.executable, "-u", "train_lstm.py"],
    stdout=open("train_lstm_output.log", "a", encoding="utf-8", errors="replace"),
    stderr=open("train_lstm_error.log", "a", encoding="utf-8", errors="replace"),
    cwd=r"D:\BRANPY-AI\from_scratch"
)
print(f"PID: {p.pid}", flush=True)
