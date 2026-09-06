"""
BranPy Voice Stack — Treino Paralelo Completo (STT + TTS + Translator + Wake Word).

100% da branpy.com.br — Todos os direitos reservados.
RODA EM PARALELO COM TREINO PRINCIPAL (não afeta).
"""

import os
import sys
import subprocess
import time
import threading
from pathlib import Path

BASE_DIR = Path(__file__).parent

# Scripts de treino
TRAIN_SCRIPTS = {
    "stt": "train_stt.py",
    "tts": "train_tts.py", 
    "translator": "train_translator.py",
    "wake_word": "train_wake_word.py",
}

def run_training(name: str, script: str, log_file: str):
    """Executa um treino em background."""
    print(f"\n{'='*60}")
    print(f"INICIANDO: {name.upper()}")
    print(f"{'='*60}")
    
    cmd = [sys.executable, str(BASE_DIR / script)]
    
    with open(log_file, 'w', encoding='utf-8') as f:
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1,
        )
        
        # Loga em tempo real
        for line in proc.stdout:
            print(f"[{name}] {line.rstrip()}")
            f.write(line)
            f.flush()
        
        proc.wait()
        print(f"\n[{name}] Finalizado com código: {proc.returncode}")
    
    return proc.returncode


def check_dependencies():
    """Verifica dependências necessárias."""
    required = [
        ("torch", "torch"),
        ("torchaudio", "torchaudio"),
        ("tokenizer", "tokenizer.py"),
    ]
    
    missing = []
    for pkg, check in required:
        try:
            __import__(pkg)
        except ImportError:
            missing.append(pkg)
    
    if missing:
        print(f"❌ Dependências faltando: {missing}")
        print("Instale: pip install torchaudio")
        return False
    
    print("✅ Dependências OK")
    return True


def check_data():
    """Verifica se dados de voz existem."""
    data_dir = BASE_DIR / "data_voice"
    manifest = data_dir / "MANIFEST.json"
    
    if not manifest.exists():
        print("❌ Dados de voz não encontrados!")
        print("Execute primeiro: python download_voice_datasets.py")
        return False
    
    import json
    with open(manifest) as f:
        manifest_data = json.load(f)
    
    print("✅ Dados de voz encontrados:")
    for name, info in manifest_data.get("datasets", {}).items():
        print(f"  • {name}: {info.get('license', 'N/A')}")
    
    return True


def main():
    print("""
╔═══════════════════════════════════════════════════════════════╗
║  BRANPY VOICE STACK — TREINO PARALELO COMPLETO               ║
║  100% branpy.com.br — ZERO LICENÇA EXTERNA                   ║
║  RODA EM PARALELO COM TREINO PRINCIPAL (não afeta)           ║
╚═══════════════════════════════════════════════════════════════╝
""")

    if not check_dependencies():
        return

    if not check_data():
        print("\n🔄 Baixando datasets...")
        subprocess.run([sys.executable, str(BASE_DIR / "download_voice_datasets.py")])
        if not check_data():
            return

    # Cria diretórios de pesos
    for name in ["stt_branpy", "tts_branpy", "translator_branpy", "wake_word_branpy"]:
        (BASE_DIR / "weights" / name).mkdir(parents=True, exist_ok=True)

    # Logs
    log_dir = BASE_DIR / "logs_voice"
    log_dir.mkdir(exist_ok=True)

    print(f"\n{'='*60}")
    print("INICIANDO TREINOS PARALELOS...")
    print(f"{'='*60}")

    # Executa em threads paralelas
    threads = {}
    for name, script in TRAIN_SCRIPTS.items():
        log_file = BASE_DIR / "logs_voice" / f"{name}.log"
        t = threading.Thread(
            target=run_training,
            args=(name, script, str(log_file)),
            daemon=True
        )
        threads[name] = t
        t.start()
        time.sleep(2)  # Espaça inícios

    # Monitora
    print(f"\n{'='*60}")
    print("MONITORANDO TREINOS...")
    print(f"{'='*60}")
    print("Pressione Ctrl+C para parar todos\n")

    try:
        while any(t.is_alive() for t in threads.values()):
            alive = [name for name, t in threads.items() if t.is_alive()]
            done = [name for name, t in threads.items() if not t.is_alive()]
            
            print(f"\rRodando: {alive} | Concluídos: {done}          ", end="", flush=True)
            time.sleep(10)
    
    except KeyboardInterrupt:
        print("\n\n⚠️ Interrompido pelo usuário")

    print(f"\n{'='*60}")
    print("TREINOS FINALIZADOS!")
    print(f"{'='*60}")
    
    # Verifica resultados
    weights_dir = BASE_DIR / "weights"
    for name in ["stt_branpy", "tts_branpy", "translator_branpy", "wake_word_branpy"]:
        model_files = list((weights_dir / name).glob("*.pt"))
        if model_files:
            print(f"  ✅ {name}: {len(model_files)} modelos salvos")
        else:
            print(f"  ❌ {name}: nenhum modelo")


if __name__ == "__main__":
    main()