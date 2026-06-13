#!/usr/bin/env python3
"""Fix alternatives starting with 'Um '/'Uma ' at index 0 in quiz_seed.json."""
import json
from pathlib import Path

SEED = Path(__file__).resolve().parent / "quiz_seed.json"
data = json.loads(SEED.read_text(encoding="utf-8"))
questions = data if isinstance(data, list) else data.get("questions", data.get("items", []))

article_pat = ("Um ", "Uma ", "Um\b", "Uma\b")
fixed = 0
for q in questions:
    alts = q.get("alternatives", [])
    if len(alts) < 2:
        continue
    first = alts[0].strip()
    if first.startswith("Um ") or first.startswith("Uma ") or first == "Um" or first == "Uma":
        # Find first alternative without article prefix
        for swap in range(1, len(alts)):
            s = alts[swap].strip()
            if not (s.startswith("Um ") or s.startswith("Uma ") or s == "Um" or s == "Uma"):
                alts[0], alts[swap] = alts[swap], alts[0]
                # Fix correct index
                if q.get("correct") == 0:
                    q["correct"] = swap
                elif q.get("correct") == swap:
                    q["correct"] = 0
                fixed += 1
                break

if isinstance(data, list):
    SEED.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
else:
    data["questions"] = questions
    SEED.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

print(f"Fixed {fixed} questions with 'Um/Uma' at index 0")
