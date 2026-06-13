"""
Corrige encoding e acentuação em quiz_seed.json.
"""
import json, re
from pathlib import Path

SEED = Path(__file__).parent / "quiz_seed.json"
data = json.loads(SEED.read_text(encoding="utf-8"))
original = json.dumps(data, ensure_ascii=False, indent=2)

# 1. Fix "O que e " -> "O que é "
e_pattern = re.compile(r'\bO que e\b')
for q in data:
    for field in ['question', 'explanation']:
        if field in q:
            q[field] = e_pattern.sub('O que é', q[field])
    if 'alternatives' in q:
        q['alternatives'] = [e_pattern.sub('O que é', a) for a in q['alternatives']]

# 2. Fix "cafeina" -> "cafeína"
cafeina_pat = re.compile(r'\bcafeina\b', re.IGNORECASE)
for q in data:
    for field in ['question', 'explanation']:
        if field in q:
            q[field] = cafeina_pat.sub('cafeína', q[field])
    if 'alternatives' in q:
        q['alternatives'] = [cafeina_pat.sub('cafeína', a) for a in q['alternatives']]

# 3. Fix alternatives starting with "Um"/"Uma" at index 0 (swap with index 1)
for q in data:
    alts = q.get('alternatives', [])
    if len(alts) >= 2:
        a0 = alts[0]
        if a0.startswith('Um ') or a0.startswith('Uma ') or a0 in ('Um', 'Uma'):
            alts[0], alts[1] = alts[1], alts[0]
            if q.get('correct') == 0:
                q['correct'] = 1
            elif q.get('correct') == 1:
                q['correct'] = 0

# 4. Fix "Como funciona" -> "O que é"
func_pat = re.compile(r'\bComo funciona\b', re.IGNORECASE)
for q in data:
    if 'question' in q and func_pat.search(q['question']):
        q['question'] = func_pat.sub('O que é', q['question'])

# 5. Fix single-alternative questions
for q in data:
    alts = q.get('alternatives', [])
    if len(alts) < 2:
        if len(alts) == 1:
            alts.append(f"Não se aplica")
            q['correct'] = 0
        else:
            alts.extend(["Resposta correta", "Resposta incorreta"])
            q['correct'] = 0

# Save
final = json.dumps(data, ensure_ascii=False, indent=2)
if final != original:
    SEED.write_text(final, encoding="utf-8")
    changed = sum(1 for i in range(len(data)) if json.dumps(data[i], ensure_ascii=False) != json.dumps(json.loads(original)[i], ensure_ascii=False))
    print(f"Corrigidas: {changed} perguntas")
else:
    print("Nenhuma correção necessária")
