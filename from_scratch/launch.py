import subprocess, sys, os
os.chdir(r"D:\BRANPY-AI\from_scratch")
with open("train_lstm_output.log", "a", encoding="utf-8") as out, open("train_lstm_error.log", "a", encoding="utf-8") as err:
    subprocess.Popen([sys.executable, "train_lstm.py"], stdout=out, stderr=err, cwd=r"D:\BRANPY-AI\from_scratch")
print("Training started!")
