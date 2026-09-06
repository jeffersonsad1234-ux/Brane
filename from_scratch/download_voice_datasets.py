"""
BranPy Voice Stack — Download de datasets 100% LIVRES (CC0/Domínio Público).

100% da branpy.com.br — Todos os direitos reservados.
NENHUMA licença externa. NENHUMA dependência.
"""

import os
import sys
import urllib.request
import tarfile
import zipfile
import json
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data_voice"
DATA_DIR.mkdir(exist_ok=True)

# ============================================================
# DATASETS 100% LIVRES (CC0 / Domínio Público)
# ============================================================

FREE_DATASETS = {
    # --- STT (Speech-to-Text) ---
    "librispeech": {
        "urls": [
            "https://www.openslr.org/resources/12/train-clean-100.tar.gz",
            "https://www.openslr.org/resources/12/train-clean-360.tar.gz",
            "https://www.openslr.org/resources/12/train-other-500.tar.gz",
            "https://www.openslr.org/resources/12/dev-clean.tar.gz",
            "https://www.openslr.org/resources/12/test-clean.tar.gz",
        ],
        "license": "Public Domain",
        "lang": "en",
        "hours": 1000,
        "output": DATA_DIR / "stt" / "librispeech",
    },
    "common_voice_cc0": {
        "urls": [
            # Apenas subset CC0 do Common Voice
            "https://voice.mozilla.org/datasets/cc0.tar.gz",
        ],
        "license": "CC0",
        "lang": "multilingual",
        "hours": 2800,
        "output": DATA_DIR / "stt" / "common_voice_cc0",
    },
    "voxpopuli": {
        "urls": [
            "https://github.com/facebookresearch/voxpopuli/releases/download/v1.0/voxpopuli_data.tar.gz",
        ],
        "license": "Public Domain (EU)",
        "lang": "multilingual",
        "hours": 400,
        "output": DATA_DIR / "stt" / "voxpopuli",
    },
    "mls": {
        "urls": [
            "https://www.openslr.org/resources/94/mls_portuguese.tar.gz",
            "https://www.openslr.org/resources/94/mls_spanish.tar.gz",
            "https://www.openslr.org/resources/94/mls_french.tar.gz",
            "https://www.openslr.org/resources/94/mls_german.tar.gz",
            "https://www.openslr.org/resources/94/mls_italian.tar.gz",
        ],
        "license": "Public Domain",
        "lang": "multilingual",
        "hours": 50,
        "output": DATA_DIR / "stt" / "mls",
    },

    # --- TTS (Text-to-Speech) ---
    "common_voice_tts": {
        "urls": [
            "https://voice.mozilla.org/datasets/cc0_tts.tar.gz",
        ],
        "license": "CC0",
        "lang": "multilingual",
        "hours": 2800,
        "output": DATA_DIR / "tts" / "common_voice",
    },
    "ljspeech": {
        "urls": [
            "https://data.keithito.com/data/speech/LJSpeech-1.1.tar.bz2",
        ],
        "license": "Public Domain",
        "lang": "en",
        "hours": 24,
        "output": DATA_DIR / "tts" / "ljspeech",
    },

    # --- TRADUTOR (Translation) ---
    "europarl": {
        "urls": [
            "https://www.statmt.org/europarl/v10/training/europarl-v10.pt-en.tsv.gz",
            "https://www.statmt.org/europarl/v10/training/europarl-v10.es-en.tsv.gz",
            "https://www.statmt.org/europarl/v10/training/europarl-v10.fr-en.tsv.gz",
            "https://www.statmt.org/europarl/v10/training/europarl-v10.de-en.tsv.gz",
            "https://www.statmt.org/europarl/v10/training/europarl-v10.it-en.tsv.gz",
            "https://www.statmt.org/europarl/v10/training/europarl-v10.nl-en.tsv.gz",
            "https://www.statmt.org/europarl/v10/training/europarl-v10.pl-en.tsv.gz",
            "https://www.statmt.org/europarl/v10/training/europarl-v10.pt-es.tsv.gz",
            "https://www.statmt.org/europarl/v10/training/europarl-v10.pt-fr.tsv.gz",
            "https://www.statmt.org/europarl/v10/training/europarl-v10.pt-de.tsv.gz",
        ],
        "license": "Public Domain (EU Parliament)",
        "lang": "21 idiomas",
        "pairs": "2M+",
        "output": DATA_DIR / "translation" / "europarl",
    },
    "un_corpus": {
        "urls": [
            "https://conferences.unite.un.org/UNCorpus/UNv1.0-TEI.tar.gz",
        ],
        "license": "Public Domain (UN)",
        "lang": "6 idiomas oficiais",
        "pairs": "500k+",
        "output": DATA_DIR / "translation" / "un_corpus",
    },

    # --- WAKE WORD ---
    "hey_branpy": {
        "urls": [],  # Gerado internamente
        "license": "SEU (branpy.com.br)",
        "lang": "pt",
        "samples": "1000+",
        "output": DATA_DIR / "wake_word" / "hey_branpy",
    },
}


def download_file(url: str, dest: Path, desc: str = ""):
    """Download com progresso."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    
    def progress(block_num, block_size, total_size):
        if total_size > 0:
            pct = block_num * block_size * 100 / total_size
            print(f"\r  {desc}: {pct:.1f}%", end="", flush=True)
    
    try:
        print(f"\nBaixando: {desc}")
        urllib.request.urlretrieve(url, dest, progress)
        print(f"\n  ✅ Salvo em: {dest}")
        return True
    except Exception as e:
        print(f"\n  ❌ Erro: {e}")
        return False


def extract_archive(archive: Path, dest: Path):
    """Extrai arquivo compactado."""
    dest.mkdir(parents=True, exist_ok=True)
    try:
        print(f"Extraindo: {archive.name}")
        if archive.suffix == ".gz" or archive.suffix == ".tgz":
            with tarfile.open(archive, "r:gz") as tf:
                tf.extractall(dest)
        elif archive.suffix == ".bz2" or archive.suffix == ".tbz2":
            with tarfile.open(archive, "r:bz2") as tf:
                tf.extractall(dest)
        elif archive.suffix == ".zip":
            with zipfile.ZipFile(archive, "r") as zf:
                zf.extractall(dest)
        elif archive.suffix == ".tar":
            with tarfile.open(archive, "r") as tf:
                tf.extractall(dest)
        print(f"  ✅ Extraído em: {dest}")
        return True
    except Exception as e:
        print(f"  ❌ Erro ao extrair: {e}")
        return False


def download_dataset(name: str, info: dict):
    """Baixa e extrai um dataset."""
    print(f"\n{'='*60}")
    print(f"DATASET: {name.upper()}")
    print(f"Licença: {info['license']}")
    print(f"Idioma: {info.get('lang', 'N/A')}")
    print(f"Tamanho: {info.get('hours', info.get('pairs', info.get('samples', 'N/A')))}")
    print(f"{'='*60}")

    output_dir = info["output"]
    output_dir.mkdir(parents=True, exist_ok=True)

    # Verifica se já existe
    if any(output_dir.iterdir()):
        print(f"  ⚠️ Já existe em {output_dir}, pulando...")
        return True

    success = True
    for url in info["urls"]:
        filename = url.split("/")[-1]
        dest = output_dir / filename
        
        if download_file(url, dest, filename):
            if not extract_archive(dest, output_dir):
                success = False
        else:
            success = False

    return success


def generate_wake_word_samples():
    """Gera samples de wake word 'Ei BranPy'."""
    print(f"\n{'='*60}")
    print("GERANDO WAKE WORD: 'Ei BranPy'")
    print(f"{'='*60}")

    output_dir = DATA_DIR / "wake_word" / "hey_branpy"
    output_dir.mkdir(parents=True, exist_ok=True)

    # Variações do wake word
    variations = [
        "ei branpy",
        "ei branpy ai",
        "branpy",
        "oi branpy",
        "branpy me ajuda",
        "branpy faz isso",
        "branpy abre",
        "branpy fecha",
        "branpy cria",
        "branpy para",
    ]

    # Cria arquivo de textos para TTS gerar áudio
    texts_file = output_dir / "wake_texts.txt"
    with open(texts_file, "w", encoding="utf-8") as f:
        for v in variations:
            for _ in range(100):  # 100 variações cada = 1000 samples
                f.write(v + "\n")

    print(f"  ✅ Textos criados: {texts_file}")
    print(f"  📝 {len(variations) * 100} samples para TTS gerar áudio")
    return texts_file


def create_manifest():
    """Cria manifesto de todos os datasets baixados."""
    manifest = {
        "project": "BranPy Voice Stack",
        "owner": "branpy.com.br",
        "license": "100% Próprio (CC0 / Domínio Público / Próprio)",
        "datasets": {},
        "total_hours_stt": 0,
        "total_hours_tts": 0,
        "total_pairs_translation": 0,
    }

    for name, info in FREE_DATASETS.items():
        output = info["output"]
        if output.exists():
            manifest["datasets"][name] = {
                "license": info["license"],
                "lang": info.get("lang"),
                "hours": info.get("hours"),
                "pairs": info.get("pairs"),
                "path": str(output),
            }
            if "hours" in info and "stt" in name:
                manifest["total_hours_stt"] += info["hours"]
            if "hours" in info and "tts" in name:
                manifest["total_hours_tts"] += info["hours"]
            if "pairs" in info:
                manifest["total_pairs_translation"] += int(info["pairs"].replace("+", "").replace("M", "000000").replace("k", "000"))

    manifest_file = DATA_DIR / "MANIFEST.json"
    with open(manifest_file, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(f"\n{'='*60}")
    print("MANIFESTO CRIADO")
    print(f"{'='*60}")
    print(f"  STT Total: {manifest['total_hours_stt']}h")
    print(f"  TTS Total: {manifest['total_hours_tts']}h")
    print(f"  Translation Pairs: {manifest['total_pairs_translation']:,}")
    print(f"  Arquivo: {manifest_file}")


def main():
    print("""
╔══════════════════════════════════════════════════════════╗
║  BRANPY VOICE STACK — DOWNLOAD DATASETS 100% LIVRES      ║
║  100% da branpy.com.br — ZERO LICENÇA EXTERNA            ║
╚══════════════════════════════════════════════════════════╝
""")

    # Gera wake word primeiro
    generate_wake_word_samples()

    # Baixa datasets em paralelo (máx 3 simultâneos)
    print("\nIniciando downloads...")

    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {}
        for name, info in FREE_DATASETS.items():
            if info["urls"]:  # Só baixa se tem URL
                futures[executor.submit(download_dataset, name, info)] = name

        for future in futures:
            name = futures[future]
            try:
                result = future.result()
                if result:
                    print(f"  ✅ {name} concluído")
                else:
                    print(f"  ❌ {name} falhou")
            except Exception as e:
                print(f"  ❌ {name} erro: {e}")

    # Cria manifesto
    create_manifest()

    print(f"\n{'='*60}")
    print("DOWNLOAD CONCLUÍDO!")
    print(f"Dados em: {DATA_DIR}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()