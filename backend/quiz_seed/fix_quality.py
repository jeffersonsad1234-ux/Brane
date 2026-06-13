#!/usr/bin/env python3
"""Fix quiz_seed.json quality issues: broken questions, grammar, English format."""
import json, re, sys
from pathlib import Path

SEED = Path(__file__).resolve().parent / "quiz_seed.json"
data = json.loads(SEED.read_text(encoding="utf-8"))
questions = data if isinstance(data, list) else data.get("questions", data.get("items", []))
original_count = len(questions)
removed = 0
fixed = 0

def fix_de_o(text):
    """Fix 'de o' -> 'do', 'de os' -> 'dos', etc."""
    text = re.sub(r'\bde o\b', 'do', text, flags=re.IGNORECASE)
    text = re.sub(r'\bde os\b', 'dos', text, flags=re.IGNORECASE)
    text = re.sub(r'\bde a\b', 'da', text, flags=re.IGNORECASE)
    text = re.sub(r'\bde as\b', 'das', text, flags=re.IGNORECASE)
    return text

def fix_tem(text):
    """Fix 'têm' (plural) -> 'tem' (singular) when subject is singular."""
    singular_subjects = [
        'o polvo', 'o olho', 'o corpo', 'o cerebro', 'o dna', 'o intestino',
        'a traqueia', 'um adulto', 'uma nuvem', 'o sangue', 'o figado',
        'o rim', 'o estomago', 'o coracao', 'o pulmao', 'o cerebelo',
    ]
    text_lower = text.lower()
    for subj in singular_subjects:
        if subj in text_lower:
            text = text.replace('têm', 'tem')
            break
    return text

def is_nonsensical_question(q):
    """Check if a question is nonsensical and should be removed."""
    question = q.get("question", "").strip()
    q_lower = question.lower()

    # Broken "Quem descobriu a..." with wrong article or nonsensical object
    broken_descobriu = [
        "quem descobriu a telescopio",
        "quem descobriu a gravidade",
        "quem descobriu a heliocentrismo",
        "quem descobriu a orbitas planetarias",
        "quem descobriu a divulgacao cientifica",
        "quem descobriu a buracos negros",
        "quem descobriu a primeiro",
        "quem descobriu a segundo",
        "quem descobriu a relatividade",
        "quem descobriu a penicilina",  # actually OK but keep removing for safety
    ]
    for pat in broken_descobriu:
        if pat in q_lower:
            return True

    # "Como usar o/a" applied to nonsensical things
    nonsense_usar = [
        "como usar o ciclismo",
        "como usar os filmes",
        "como usar o leao",
        "como usar o oceano",
        "como usar a cordilheira",
        "como usar a guerra fria",
        "como usar o himalaia",
        "como usar o beija-flor",
        "como usar o golfinho",
        "como usar a fossa",
        "como usar a muralha",
        "como usar o mar morto",
        "como usar a capivara",
        "como usar o pingüim",
        "como usar o deserto",
        "como usar o bonzai",
    ]
    for pat in nonsense_usar:
        if pat in q_lower:
            return True

    # "Quando foi criado" applied to natural phenomena
    criado_nonsense = [
        "quando foi criado a economia",
        "quando foi criado o deserto",
        "quando foi criado o mar morto",
        "quando foi criado a baleia",
        "quando foi criado a patagonia",
        "quando foi criado a tundra",
        "quando foi criado o rio amazonas",
        "quando foi criado a cordilheira",
        "quando foi criado a aurora boreal",
        "quando foi criado o camaleao",
        "quando foi criado o himalaia",
        "quando foi criado o dna",
        "quando foi criado a antartida",
        "quando foi criado a fotosintese",
        "quando foi criado a evolucao",
        "quando foi criado o universo",
    ]
    for pat in criado_nonsense:
        if pat in q_lower:
            return True

    # "Quem criou" applied to natural things
    criou_nonsense = [
        "quem criou o deserto",
        "quem criou a grande barreira",
        "quem criou o genero terror",
        "quem criou o golfinho",
        "quem criou a capivara",
        "quem criou a cultura geral",
        "quem criou o pinguim",
        "quem criou o dna",
        "quem criou a patagonia",
        "quem criou a fotosintese",
        "quem criou a bioluminescencia",
        "quem criou o oceano",
    ]
    for pat in criou_nonsense:
        if pat in q_lower:
            return True

    # "Onde encontrar" applied to abstract/non-physical things
    onde_nonsense = [
        "onde encontrar o boxe",
        "onde encontrar a urbanizacao",
        "onde encontrar a filosofia",
        "onde encontrar a criptografia",
        "onde encontrar a fotossintese",
        "onde encontrar os direitos humanos",
        "onde encontrar a revolucao",
        "onde encontrar o basquete",
        "onde encontrar a globalizacao",
        "onde encontrar a democracia",
        "onde encontrar a evolucao",
        "onde encontrar a logica",
    ]
    for pat in onde_nonsense:
        if pat in q_lower:
            return True

    # Questions with completely broken grammar
    if re.search(r"descobriu a primeiro", q_lower):
        return True
    if re.search(r"descobriu a segundo", q_lower):
        return True

    return False

def has_garbage_alternatives(q):
    """Check if alternatives contain obviously wrong units/concepts."""
    garbage_patterns = [
        "100 toneladas", "50.000 vezes", "300 musculos",
        "5 cm", "7 dias", "200 ossos", "10 bilhoes",
        "10 trilhoes", "1 milhao", "50%", "30 dias",
        "100.000 km", "10.000 km",
    ]
    alts = q.get("alternatives", [])
    garbage_count = sum(1 for alt in alts if any(g in alt for g in garbage_patterns))
    return garbage_count >= 2

def fix_question_text(q):
    """Fix grammar and formatting issues in question text."""
    text = q.get("question", "")
    original = text

    # Fix "de o" -> "do"
    text = fix_de_o(text)
    # Fix "têm" -> "tem" for singular subjects
    text = fix_tem(text)

    if text != original:
        q["question"] = text
        global fixed
        fixed += 1
    return q

def is_bad_english(q):
    """Check if English category question has wrong translations."""
    alts = q.get("alternatives", [])
    explanation = q.get("explanation", "").lower()

    # Wrong translation: bone != cap
    if "bone" in q.get("question", "").lower() and "cap" in explanation:
        return True
    if "bone" in q.get("question", "").lower() and "cap" in " ".join(alts).lower():
        return True

    return False

# Process all questions
cleaned = []
for q in questions:
    # Skip nonsensical questions
    if is_nonsensical_question(q):
        removed += 1
        continue

    # Skip questions with garbage alternatives
    if has_garbage_alternatives(q):
        removed += 1
        continue

    # Skip bad English translations
    if is_bad_english(q):
        removed += 1
        continue

    # Fix grammar in question text
    fix_question_text(q)

    cleaned.append(q)

# Write back
if isinstance(data, list):
    SEED.write_text(json.dumps(cleaned, ensure_ascii=False, indent=2), encoding="utf-8")
else:
    data["questions"] = cleaned
    SEED.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

print(f"Original: {original_count} questions")
print(f"Removed: {removed} questions")
print(f"Fixed: {fixed} questions (grammar)")
print(f"Final: {len(cleaned)} questions")
