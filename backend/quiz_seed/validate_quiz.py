import json

from pathlib import Path
with open(Path(__file__).parent / "quiz_seed.json", "r", encoding="utf-8") as f:
    data = json.load(f)

errors = []
seen_questions = set()

for i, q in enumerate(data):
    qid = i + 1
    if not q.get("question"):
        errors.append(f"#{qid}: missing question")
        continue
    question = q["question"]
    if question in seen_questions:
        errors.append(f'#{qid}: duplicate question: "{question[:50]}..."')
    seen_questions.add(question)
    alts = q.get("alternatives")
    if not isinstance(alts, list) or len(alts) < 2:
        errors.append(f"#{qid}: invalid/missing alternatives")
    else:
        corr = q.get("correct")
        if not isinstance(corr, int) or corr < 0 or corr >= len(alts):
            errors.append(f'#{qid}: correct index {corr} out of bounds for {len(alts)} alternatives: "{question[:50]}..."')
    if not q.get("explanation"):
        errors.append(f'#{qid}: missing explanation: "{question[:50]}..."')
    if not q.get("category"):
        errors.append(f'#{qid}: missing category: "{question[:50]}..."')

if errors:
    print(f"ERRORS FOUND: {len(errors)}")
    for e in errors[:50]:
        print(f"  {e}")
    if len(errors) > 50:
        print(f"  ... and {len(errors) - 50} more errors")
else:
    print(f"ALL {len(data)} QUESTIONS VALID")
