#!/usr/bin/env python3
"""Check and fix wrong English translations."""
import json, re
from pathlib import Path

SEED = Path(__file__).resolve().parent / "quiz_seed.json"
data = json.loads(SEED.read_text(encoding="utf-8"))
questions = data if isinstance(data, list) else data.get("questions", [])

ingles = [q for q in questions if "ngl" in q.get("category", "")]
print(f"Total English questions: {len(ingles)}")

# Check for wrong translations
wrong = []
for q in ingles:
    q_lower = q.get("question", "").lower()
    alts = q.get("alternatives", [])
    correct = q.get("correct", 0)
    if correct >= len(alts):
        continue
    correct_alt = alts[correct].lower()

    # Extract the word being asked about
    m = re.search(r'["\u201c\'](.*?)["\u201d\']', q.get("question", ""))
    if not m:
        continue
    word = m.group(1).lower().strip()

    # Common wrong translation patterns
    wrong_words = {
        "azul": ["brother", "sister", "mother", "father", "green", "red"],
        "vermelho": ["brother", "green", "blue", "yellow"],
        "amarelo": ["brother", "green", "blue", "red"],
        "verde": ["brother", "red", "blue", "yellow"],
        "livro": ["table", "chair", "window", "key"],
        "mesa": ["book", "key", "door", "window"],
        "janela": ["book", "table", "key", "door"],
        "chave": ["book", "table", "window", "door"],
        "celular": ["book", "table", "key", "door"],
        "bone": ["cap", "hat", "shoe"],
        "water": ["fire", "earth", "wind"],
        "fire": ["water", "earth", "wind"],
    }

    if word in wrong_words:
        for bad in wrong_words[word]:
            if bad in correct_alt:
                wrong.append(q)
                break

print(f"Wrong translations found: {len(wrong)}")
for w in wrong:
    print(f"  Q: {w['question'][:70]}")
    print(f"  Correct: {w['alternatives'][w['correct']]}")
    print()

# Remove wrong translations
if wrong:
    wrong_ids = {id(w) for w in wrong}
    cleaned = [q for q in questions if id(q) not in wrong_ids]
    print(f"Removing {len(wrong)} wrong translations")
    print(f"Before: {len(questions)}, After: {len(cleaned)}")

    if isinstance(data, list):
        SEED.write_text(json.dumps(cleaned, ensure_ascii=False, indent=2), encoding="utf-8")
    else:
        data["questions"] = cleaned
        SEED.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
else:
    print("No wrong translations to remove")
