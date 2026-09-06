"""BranPy Knowledge Ecosystem — memoria persistente que aprende e cresce sozinha.

100% proprio (BranPy). Nenhuma dependencia externa. Sem API de big tech.

Como funciona:
  1. Cada "conhecimento" e um par (perguntas-alvo -> resposta) com pesos por token.
  2. A busca usa relevancia por tokens comuns (nao substring crua), o que resolve
     colisoes do tipo "salario" contem "rio" / "melhor" contem "mel".
  3. Toda resposta do LSTM ou do usuario pode ser registrada como "candidata".
  4. Feedback (bom/ruim) promove ou rebaixa conhecimentos na ordenacao.
  5. Tudo persiste em JSON; cresce sem precisar editar codigo.
"""

import json
import os
import re
import threading
import time
import unicodedata
import uuid
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data" / "knowledge"
os.makedirs(DATA_DIR, exist_ok=True)

KB_FILE = DATA_DIR / "knowledge_base.json"
LOG_FILE = DATA_DIR / "interactions.jsonl"

_LOCK = threading.RLock()

# Palavras que nao carregam significado de busca (nao indexadas, mas tambem
# nao usadas para penalizar). Reduzem ruido de substring curta.
_STOPWORDS = {
    "o", "a", "os", "as", "um", "uma", "uns", "umas", "de", "da", "do", "das",
    "dos", "em", "no", "na", "nos", "nas", "e", "é", "ou", "que", "quê", "por",
    "pra", "pro", "para", "com", "sem", "como", "qual", "quais", "me", "te",
    "se", "tu", "voce", "você", "eu", "ele", "ela", "o que", "quando", "onde",
    "tipo", "sobre", "explicar", "explica", "fala", "fale", "me fala",
    "me explica", "quero saber", "preciso saber", "entender", "entenda",
}

# Mapa de caracteres acentuados -> base, para comparacao sem acento.
_ACCENT_RE = None


def _norm(text: str) -> str:
    """Normaliza: minusculas, sem acentos, sem pontuacao, espacos simples."""
    global _ACCENT_RE
    if _ACCENT_RE is None:
        _ACCENT_RE = re.compile(r"[\u0300-\u036f]")
    if not text:
        return ""
    s = unicodedata.normalize("NFD", text.lower())
    s = _ACCENT_RE.sub("", s)
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def _tokens(norm_text: str):
    return [t for t in norm_text.split() if t and t not in _STOPWORDS and len(t) > 1]


class KnowledgeBase:
    """Base de conhecimento persistente com busca por relevancia."""

    def __init__(self, kb_file: str = None):
        self.kb_file = Path(kb_file) if kb_file else KB_FILE
        self.entries = {}          # id -> entry
        self._index = {}           # token -> set(ids)
        self._load()

    # ── persistencia ──────────────────────────────────────────────
    def _load(self):
        if self.kb_file.exists():
            try:
                with open(self.kb_file, "r", encoding="utf-8") as f:
                    raw = json.load(f)
                for e in raw:
                    self._index_entry(e)
            except Exception:
                raw = []
        self._save()

    def _save(self):
        with _LOCK:
            with open(self.kb_file, "w", encoding="utf-8") as f:
                json.dump(list(self.entries.values()), f, ensure_ascii=False, indent=2)

    def _index_entry(self, e):
        self.entries[e["id"]] = e
        for t in e["tokens"]:
            self._index.setdefault(t, set()).add(e["id"])

    # ── adicionar ─────────────────────────────────────────────────
    def add(self, question, answer, category="geral", source="manual", keywords=None):
        """Adiciona um conhecimento. `keywords` = frases/perguntas alvo alternativas."""
        q_norm = _norm(question)
        toks = _tokens(q_norm)
        if not toks or not answer or not answer.strip():
            return None
        eid = str(uuid.uuid4())[:12]
        entry = {
            "id": eid,
            "question": question,
            "question_norm": q_norm,
            "tokens": toks,
            "keywords": [k.lower() for k in (keywords or [])],
            "answer": answer.strip(),
            "category": category,
            "source": source,
            "uses": 0,
            "up": 0,
            "down": 0,
            "created": time.time(),
            "updated": time.time(),
        }
        with _LOCK:
            self._index_entry(entry)
            self._save()
        return entry

    def ingest_audio(self, transcript, source="ouvido", min_chars=40):
        """Transforma audio transcrito em conhecimento.

        Recebe o texto falado (de videos, conversas, etc), divide em sentencas,
        filtra ruido/frases curtas demais e adiciona como conhecimento que a
        BranPy pode reusar quando o assunto for perguntado depois.
        Retorna o numero de sentencas aprendidas.
        """
        if not transcript or not transcript.strip():
            return 0
        # Divide em sentencas ANTES de normalizar (normalizacao remove pontuacao)
        raw_sentences = re.split(r"[.!?;]+", transcript)
        learned = 0
        for raw in raw_sentences:
            s = _norm(raw)
            if not s:
                continue
            # remove chamadas de canal / ruido de youtube
            s = re.sub(r"\b(e aí pessoal|oi pessoal|olá pessoal|inscreva se|se inscreve|curte e compartilha|até a próxima|tchau|deixa o like|ativa o sino)\b", " ", s).strip()
            s = re.sub(r"\s+", " ", s).strip()
            toks = _tokens(s)
            if len(toks) < 4:
                continue  # muito curto, e ruido
            if len(s) < min_chars:
                continue
            # evita duplicar frases quase iguais ja aprendidas
            existing = self.search(s, top=1, min_score=1.2)
            if existing and existing[0][0] >= 1.2:
                continue
            entry = self.add(s, s, category="ouvido", source=source, keywords=[s[:60]])
            if entry:
                learned += 1
        return learned

    def heard(self, limit=50):
        """Lista o que a BranPy aprendeu ouvindo (mais recentes primeiro)."""
        items = [e for e in self.entries.values() if e.get("source") == "ouvido" or e.get("category") == "ouvido"]
        items.sort(key=lambda e: -e.get("created", 0))
        return items[:limit]

    def delete(self, eid):
        with _LOCK:
            e = self.entries.pop(eid, None)
            if e:
                for t in e["tokens"]:
                    self._index.get(t, set()).discard(eid)
            self._save()
        return e

    def update_answer(self, eid, answer):
        with _LOCK:
            e = self.entries.get(eid)
            if e:
                e["answer"] = answer.strip()
                e["updated"] = time.time()
                self._save()
        return e

    def feedback(self, eid, good: bool):
        with _LOCK:
            e = self.entries.get(eid)
            if e:
                if good:
                    e["up"] += 1
                else:
                    e["down"] += 1
                e["updated"] = time.time()
                self._save()
        return e

    # ── busca ─────────────────────────────────────────────────────
    def search(self, prompt, top=5, min_score=1.0):
        """Retorna os conhecimentos mais relevantes para o prompt.

        Pontua por: tokens comuns (com peso de raridade) + bonus de keyword
        exata + bonus de ordem. Nao usa substring crua, entao evita colisoes.
        """
        q_norm = _norm(prompt)
        q_toks = _tokens(q_norm)
        if not q_toks:
            return []

        # Conta frequencia de tokens no indice (raridade = mais peso).
        counts = {}
        for t in q_toks:
            counts[t] = counts.get(t, 0) + 1

        n_terms = len(q_toks)
        scored = {}   # id -> score

        for t, cnt in counts.items():
            ids = self._index.get(t)
            if not ids:
                continue
            rarity = 1.0 / (1.0 + len(ids) * 0.2)
            for eid in ids:
                e = self.entries.get(eid)
                if not e:
                    continue
                scored[eid] = scored.get(eid, 0.0) + rarity * min(cnt, 1)

        results = []
        for eid, base in scored.items():
            e = self.entries[eid]
            # bonus por keyword exata (frase alvo) no prompt normalizado
            bonus = 0.0
            if e["keywords"]:
                for kw in e["keywords"]:
                    kw_n = _norm(kw)
                    if kw_n and kw_n in q_norm:
                        bonus += 1.5
            # cobertura de tokens do conhecimento presentes no prompt
            cov = sum(1 for t in e["tokens"] if t in q_toks) / max(1, len(e["tokens"]))
            # fator de confianca por feedback
            trust = 1.0
            if e["up"] + e["down"] > 0:
                trust = (e["up"] + 1) / (e["up"] + e["down"] + 2)
            score = (base / max(1, n_terms)) * 2.0 + bonus + cov * 0.5
            score *= trust
            results.append((score, e))

        results.sort(key=lambda x: x[0], reverse=True)
        return [(s, e) for s, e in results if s >= min_score][:top]

    # ── aprendizado / crescimento ─────────────────────────────────
    def register_interaction(self, prompt, answer, source="lstm"):
        """Registra uma interacao no log para crescimento futuro."""
        try:
            with open(LOG_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps({
                    "ts": time.time(),
                    "prompt": prompt,
                    "answer": answer,
                    "source": source,
                }, ensure_ascii=False) + "\n")
        except Exception:
            pass

    def learn_from_log(self, threshold=3, min_tokens=3, dedup_score=0.8):
        """Promove interacoes repetidas do log para conhecimentos.

        Uma pergunta que aparece varias vezes vira conhecimento fixo, com a
        resposta mais frequente. `dedup_score` evita duplicar o que ja existe.
        """
        if not LOG_FILE.exists():
            return 0
        freq = {}
        best_answer = {}
        with open(LOG_FILE, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    rec = json.loads(line)
                except Exception:
                    continue
                pn = _norm(rec.get("prompt", ""))
                toks = _tokens(pn)
                if len(toks) < min_tokens:
                    continue
                key = " ".join(toks)
                freq[key] = freq.get(key, 0) + 1
                a = rec.get("answer", "").strip()
                if not a:
                    continue
                cur = best_answer.get(key)
                if cur is None or len(a) > len(cur):
                    best_answer[key] = a

        added = 0
        for key, count in freq.items():
            if count < threshold:
                continue
            answer = best_answer.get(key, "")
            if not answer:
                continue
            # dedup contra o que ja existe
            existing = self.search(key, top=1, min_score=dedup_score)
            if existing and existing[0][1]["answer"] == answer:
                continue
            self.add(key, answer, category="aprendido", source="learned",
                     keywords=[key])
            added += 1
        return added

    def stats(self):
        return {
            "total": len(self.entries),
            "sources": {},
        }

    def all(self):
        return sorted(self.entries.values(), key=lambda e: -e.get("uses", 0))


# Instancia global da base
kb = KnowledgeBase()