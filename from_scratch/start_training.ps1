$pythonw = "C:\Users\jeffe\AppData\Local\Python\pythoncore-3.14-64\pythonw.exe"
Start-Process -FilePath $pythonw -ArgumentList "D:\BRANPY-AI\from_scratch\train_vqvae.py" -WorkingDirectory "D:\BRANPY-AI\from_scratch"
Start-Process -FilePath $pythonw -ArgumentList "D:\BRANPY-AI\from_scratch\train_fast.py" -WorkingDirectory "D:\BRANPY-AI\from_scratch"
