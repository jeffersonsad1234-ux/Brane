"""
BrampAI Memory Store — Memória Permanente Estruturada
=====================================================
Substitui/estende o knowledge.py existente com campos estruturados:
- informação, contexto, fonte, data, confiança, evidências, relacionamentos
- Suporte a memória privada (usuário) vs global (BrampAI)
- Deteção de conflitos e atualização controlada
"""

import json
import os
import time
import uuid
import threading
import hashlib
from typing import Optional, List, Dict, Any
from collections import defaultdict


def _norm(text: str) -> str:
    import unicodedata
    text = text.lower().strip()
    text = unicodedata.normalize('NFD', text)
    text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
    import re
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def _tokens(norm_text: str) -> List[str]:
    stopwords = {
        'de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'para',
        'com', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'dos',
        'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'seu', 'sua',
        'ou', 'ser', 'quando', 'muito', 'ha', 'nos', 'ja', 'estava',
        'eu', 'tambem', 'so', 'pelo', 'pela', 'ate', 'isso', 'ela',
        'entre', 'era', 'depois', 'sem', 'mesmo', 'aos', 'ter', 'seus',
        'quem', 'nan', 'me', 'e', 'este', 'foi', 'para', 'nos', 'la',
        'estao', 'voce', 'tinha', 'foram', 'essa', 'num', 'nem', 'suas',
        'meu', 'como', 'me', 'numa', 'pelos', 'elas', 'havia', 'se',
        'qual', 'sera', 'nos', 'num', 'esta', 'eu', 'ja', 'estava',
        'delas', 'essa', 'eles', 'estao', 'voce', 'tinha', 'foram',
        'essa', 'num', 'nem', 'suas', 'meu', 'como', 'me', 'numa',
        'pelos', 'elas', 'havia', 'se', 'qual', 'sera', 'nos', 'num',
        'esta', 'eu', 'ja', 'estava'
    }
    return [t for t in norm_text.split() if len(t) > 1 and t not in stopwords]


class KnowledgeEntry:
    """Entrada estruturada de conhecimento na memória da BrampAI."""

    def __init__(self, data: Optional[Dict] = None):
        if data:
            self._data = data
        else:
            self._data = {
                'id': str(uuid.uuid4())[:12],
                'content': '',           # Informação principal
                'answer': '',            # Resposta associada
                'question': '',          # Pergunta que gerou este conhecimento
                'context': '',           # Contexto adicional
                'category': 'geral',     # Categoria (ciencia, tech, pessoal, etc.)
                'source': 'model',       # Origem: model, user, search, audio, manual
                'source_detail': '',     # Detalhe da fonte (URL, nome, etc.)
                'confidence': 0.5,       # Nível de confiança: 0.0 a 1.0
                'confidence_level': 'incerto',  # incerto, parcial, confirmado, alto
                'status': 'ativa',       # ativa, desatualizada, conflitante, corrigida
                'keywords': [],          # Palavras-chave para busca
                'evidences': [],         # Lista de evidências que suportam
                'contradictions': [],    # Lista de contradições conhecidas
                'related_ids': [],       # IDs de conhecimentos relacionados
                'user_id': None,         # ID do usuário (None = global/BrampAI)
                'session_id': None,      # ID da sessão
                'is_private': False,     # Se é memória privada do usuário
                'created_at': time.time(),
                'updated_at': time.time(),
                'last_verified': None,   # Data da última verificação
                'expires_at': None,      # Data de expiração (None = permanente)
                'usage_count': 0,        # Quantas vezes foi usado
                'upvotes': 0,
                'downvotes': 0,
                'tokens': [],            # Tokens normalizados para busca
                'version': 1,            # Versão do conhecimento (incrementa em updates)
                'previous_versions': [], # IDs de versões anteriores
            }
            self._data['tokens'] = _tokens(_norm(
                f"{self._data['content']} {self._data['answer']} "
                f"{self._data['question']} {self._data['context']} "
                f"{' '.join(self._data['keywords'])}"
            ))

    @property
    def id(self) -> str:
        return self._data['id']

    @property
    def data(self) -> Dict:
        return self._data

    def update_confidence(self, new_evidence: float, evidence_source: str = 'unknown'):
        """Atualiza confiança baseado em nova evidência (0.0 a 1.0)."""
        old_conf = self._data['confidence']
        # Média ponderada: 70% antigo + 30% nova evidência
        self._data['confidence'] = old_conf * 0.7 + new_evidence * 0.3
        self._data['evidences'].append({
            'value': new_evidence,
            'source': evidence_source,
            'timestamp': time.time()
        })
        self._data['last_verified'] = time.time()
        self._data['updated_at'] = time.time()
        self._update_confidence_level()

    def _update_confidence_level(self):
        c = self._data['confidence']
        if c >= 0.8:
            self._data['confidence_level'] = 'alto'
        elif c >= 0.6:
            self._data['confidence_level'] = 'confirmado'
        elif c >= 0.4:
            self._data['confidence_level'] = 'parcial'
        else:
            self._data['confidence_level'] = 'incerto'

    def add_contradiction(self, conflicting_id: str, detail: str = ''):
        self._data['contradictions'].append({
            'id': conflicting_id,
            'detail': detail,
            'timestamp': time.time()
        })
        self._data['status'] = 'conflitante'
        self._data['confidence'] *= 0.5  # Reduz confiança drasticamente

    def update_content(self, new_content: str, new_answer: str = None):
        """Atualiza conteúdo, preservando versão anterior."""
        self._data['previous_versions'].append({
            'content': self._data['content'],
            'answer': self._data['answer'],
            'version': self._data['version'],
            'timestamp': time.time()
        })
        self._data['content'] = new_content
        if new_answer:
            self._data['answer'] = new_answer
        self._data['version'] += 1
        self._data['updated_at'] = time.time()
        self._data['tokens'] = _tokens(_norm(
            f"{self._data['content']} {self._data['answer']} "
            f"{self._data['question']} {self._data['context']} "
            f"{' '.join(self._data['keywords'])}"
        ))

    def is_expired(self) -> bool:
        if self._data['expires_at'] is None:
            return False
        return time.time() > self._data['expires_at']

    def is_stale(self, max_age_seconds: float = 86400 * 30) -> bool:
        """Verifica se conhecimento está desatualizado (>30 dias sem verificação)."""
        if self._data['last_verified'] is None:
            return (time.time() - self._data['created_at']) > max_age_seconds
        return (time.time() - self._data['last_verified']) > max_age_seconds

    def to_dict(self) -> Dict:
        return self._data.copy()

    @classmethod
    def from_dict(cls, data: Dict) -> 'KnowledgeEntry':
        entry = cls(data)
        return entry


class MemoryStore:
    """
    Memória permanente estruturada da BrampAI.
    Suporta memória privada (por usuário) e global (BrampAI).
    Thread-safe para uso em servidor web.
    """

    def __init__(self, data_dir: str = None):
        if data_dir is None:
            data_dir = os.path.join(os.path.dirname(__file__), 'data', 'memory')
        self._data_dir = data_dir
        self._global_path = os.path.join(data_dir, 'global_memory.json')
        self._private_dir = os.path.join(data_dir, 'private')
        self._interactions_path = os.path.join(data_dir, 'interactions.jsonl')
        self._lock = threading.Lock()

        os.makedirs(data_dir, exist_ok=True)
        os.makedirs(self._private_dir, exist_ok=True)

        # Carrega memória global
        self._entries: Dict[str, KnowledgeEntry] = {}
        self._load_global()

        # Índice invertido para busca eficiente
        self._index: Dict[str, set] = defaultdict(set)
        self._rebuild_index()

    def _load_global(self):
        if os.path.exists(self._global_path):
            try:
                with open(self._global_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                for ed in data.get('entries', []):
                    entry = KnowledgeEntry.from_dict(ed)
                    self._entries[entry.id] = entry
            except Exception:
                pass

    def _save_global(self):
        data = {
            'version': 1,
            'updated_at': time.time(),
            'total_entries': len(self._entries),
            'entries': [e.to_dict() for e in self._entries.values()]
        }
        tmp = self._global_path + '.tmp'
        with open(tmp, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp, self._global_path)

    def _rebuild_index(self):
        self._index.clear()
        for entry_id, entry in self._entries.items():
            for token in entry.data.get('tokens', []):
                self._index[token].add(entry_id)

    def _index_entry(self, entry: KnowledgeEntry):
        for token in entry.data.get('tokens', []):
            self._index[token].add(entry.id)

    def _deindex_entry(self, entry: KnowledgeEntry):
        for token in entry.data.get('tokens', []):
            if token in self._index:
                self._index[token].discard(entry.id)

    def add(
        self,
        content: str,
        answer: str = '',
        question: str = '',
        context: str = '',
        category: str = 'geral',
        source: str = 'model',
        source_detail: str = '',
        confidence: float = 0.5,
        keywords: List[str] = None,
        user_id: str = None,
        session_id: str = None,
        is_private: bool = False,
        related_ids: List[str] = None,
        expires_at: float = None,
    ) -> KnowledgeEntry:
        """Adiciona novo conhecimento à memória."""
        with self._lock:
            # Auto-detecta conflitos com conhecimento existente
            if question:
                existing = self.search(question, max_results=3, min_score=0.2,
                                      min_confidence=0.0)
                for ex in existing:
                    ex_entry = self._entries.get(ex['entry']['id'])
                    if ex_entry and ex_entry.id:
                        # Verifica se o conteúdo é diferente (conflito)
                        ex_answer_norm = _norm(ex_entry.data.get('answer', ''))
                        new_answer_norm = _norm(answer)
                        if (ex_answer_norm and new_answer_norm and
                            ex_answer_norm != new_answer_norm and
                            len(ex_answer_norm) > 5 and len(new_answer_norm) > 5):
                            # Conflito detectado
                            self._lock.release()
                            new_entry = KnowledgeEntry()
                            self._lock.acquire()
                            new_entry._data['content'] = content
                            new_entry._data['answer'] = answer
                            new_entry._data['question'] = question
                            new_entry._data['context'] = context
                            new_entry._data['category'] = category
                            new_entry._data['source'] = source
                            new_entry._data['source_detail'] = source_detail
                            new_entry._data['confidence'] = confidence
                            new_entry._data['keywords'] = keywords or []
                            new_entry._data['user_id'] = user_id
                            new_entry._data['session_id'] = session_id
                            new_entry._data['is_private'] = is_private
                            new_entry._data['related_ids'] = related_ids or []
                            new_entry._data['expires_at'] = expires_at
                            new_entry._data['status'] = 'conflitante'
                            new_entry._data['tokens'] = _tokens(_norm(
                                f"{content} {answer} {question} {context} "
                                f"{' '.join(keywords or [])}"
                            ))
                            new_entry._update_confidence_level()
                            new_entry.add_contradiction(ex_entry.id,
                                f"Conflito com informação existente (fonte: {ex_entry.data.get('source', 'unknown')})")
                            self._entries[new_entry.id] = new_entry
                            self._index_entry(new_entry)
                            self._save_global()
                            return new_entry

            entry = KnowledgeEntry()
            entry._data['content'] = content
            entry._data['answer'] = answer
            entry._data['question'] = question
            entry._data['context'] = context
            entry._data['category'] = category
            entry._data['source'] = source
            entry._data['source_detail'] = source_detail
            entry._data['confidence'] = confidence
            entry._data['keywords'] = keywords or []
            entry._data['user_id'] = user_id
            entry._data['session_id'] = session_id
            entry._data['is_private'] = is_private
            entry._data['related_ids'] = related_ids or []
            entry._data['expires_at'] = expires_at
            entry._data['tokens'] = _tokens(_norm(
                f"{content} {answer} {question} {context} "
                f"{' '.join(keywords or [])}"
            ))
            entry._update_confidence_level()

            self._entries[entry.id] = entry
            self._index_entry(entry)
            self._save_global()
            return entry

    def search(
        self,
        query: str,
        max_results: int = 5,
        min_score: float = 0.3,
        user_id: str = None,
        include_private: bool = True,
        min_confidence: float = 0.0,
        categories: List[str] = None,
    ) -> List[Dict]:
        """Busca inteligente na memória com scoring multi-fator."""
        query_tokens = _tokens(_norm(query))
        if not query_tokens:
            return []

        # Coleta candidatos
        candidates: Dict[str, float] = defaultdict(float)
        for token in query_tokens:
            if token in self._index:
                for entry_id in self._index[token]:
                    candidates[entry_id] += 1.0

        if not candidates:
            return []

        # Scoring
        results = []
        for entry_id, token_hits in candidates.items():
            entry = self._entries.get(entry_id)
            if entry is None:
                continue
            if entry.is_expired():
                continue
            if not include_private and entry.data.get('is_private', False):
                continue
            if user_id and entry.data.get('user_id') and entry.data['user_id'] != user_id:
                continue
            if entry.data.get('confidence', 0) < min_confidence:
                continue
            if categories and entry.data.get('category') not in categories:
                continue

            # Score: cobertura de tokens
            coverage = token_hits / len(query_tokens) if query_tokens else 0

            # Score: raridade do token
            rarity_bonus = 0
            for token in query_tokens:
                if token in self._index:
                    doc_freq = len(self._index[token])
                    total = len(self._entries)
                    if total > 0 and doc_freq > 0:
                        idf = max(0, 1.0 - doc_freq / total)
                        if token in entry.data.get('tokens', []):
                            rarity_bonus += idf * 0.3

            # Score: confiança
            conf = entry.data.get('confidence', 0.5)

            # Score: uso recente
            usage = min(entry.data.get('usage_count', 0) / 10.0, 0.2)

            # Score: frescor (conhecimento novo/verificado recentemente)
            freshness = 0
            if entry.data.get('last_verified'):
                age = time.time() - entry.data['last_verified']
                freshness = max(0, 0.2 - (age / (86400 * 365)) * 0.2)

            total_score = (coverage * 0.4 + rarity_bonus + conf * 0.25 +
                          usage + freshness)

            if total_score >= min_score:
                results.append({
                    'entry': entry.to_dict(),
                    'score': round(total_score, 4),
                    'coverage': round(coverage, 4),
                    'confidence': conf,
                    'confidence_level': entry.data.get('confidence_level', 'incerto'),
                    'is_stale': entry.is_stale(),
                    'token_hits': int(token_hits),
                })

        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:max_results]

    def get(self, entry_id: str) -> Optional[KnowledgeEntry]:
        return self._entries.get(entry_id)

    def update(self, entry_id: str, **kwargs) -> Optional[KnowledgeEntry]:
        with self._lock:
            entry = self._entries.get(entry_id)
            if entry is None:
                return None
            self._deindex_entry(entry)
            for key, value in kwargs.items():
                if key in entry._data and key not in ('id', 'created_at', 'version'):
                    entry._data[key] = value
            entry._data['updated_at'] = time.time()
            entry._data['tokens'] = _tokens(_norm(
                f"{entry._data['content']} {entry._data['answer']} "
                f"{entry._data['question']} {entry._data['context']} "
                f"{' '.join(entry._data.get('keywords', []))}"
            ))
            self._index_entry(entry)
            self._save_global()
            return entry

    def delete(self, entry_id: str) -> bool:
        with self._lock:
            entry = self._entries.pop(entry_id, None)
            if entry:
                self._deindex_entry(entry)
                self._save_global()
                return True
            return False

    def detect_conflict(self, content: str, question: str = '') -> Optional[KnowledgeEntry]:
        """Detecta se já existe conhecimento conflitante sobre o mesmo tópico."""
        results = self.search(question or content, max_results=3, min_score=0.2)
        for r in results:
            entry = KnowledgeEntry(r['entry'])
            # Verifica se o conteúdo contradiz
            if (entry.data.get('question') and
                self._questions_similar(entry.data['question'], question)):
                return entry
        return None

    def _questions_similar(self, q1: str, q2: str) -> bool:
        t1 = set(_tokens(_norm(q1)))
        t2 = set(_tokens(_norm(q2)))
        if not t1 or not t2:
            return False
        overlap = len(t1 & t2) / min(len(t1), len(t2))
        return overlap > 0.6

    def register_interaction(self, prompt: str, answer: str, source: str = 'model',
                            user_id: str = None, session_id: str = None):
        """Registra interação para aprendizado futuro."""
        record = {
            'prompt': prompt,
            'answer': answer,
            'source': source,
            'user_id': user_id,
            'session_id': session_id,
            'timestamp': time.time(),
        }
        with self._lock:
            with open(self._interactions_path, 'a', encoding='utf-8') as f:
                f.write(json.dumps(record, ensure_ascii=False) + '\n')

    def learn_from_interactions(self, min_occurrences: int = 3) -> List[KnowledgeEntry]:
        """Promove interações repetidas a conhecimento permanente."""
        if not os.path.exists(self._interactions_path):
            return []

        counts: Dict[str, Dict] = {}
        with open(self._interactions_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    record = json.loads(line)
                    prompt = record.get('prompt', '').strip()
                    if not prompt:
                        continue
                    norm_p = _norm(prompt)
                    if norm_p not in counts:
                        counts[norm_p] = {
                            'prompt': prompt,
                            'answer': record.get('answer', ''),
                            'count': 0,
                            'source': record.get('source', 'model'),
                            'user_id': record.get('user_id'),
                        }
                    counts[norm_p]['count'] += 1
                except json.JSONDecodeError:
                    continue

        new_entries = []
        for norm_p, data in counts.items():
            if data['count'] >= min_occurrences:
                # Verifica se já existe na memória
                existing = self.search(data['prompt'], max_results=1, min_score=0.4)
                if existing:
                    continue
                entry = self.add(
                    content=data['prompt'],
                    answer=data['answer'],
                    question=data['prompt'],
                    category='aprendido',
                    source='learned',
                    confidence=0.6,
                    user_id=data.get('user_id'),
                )
                new_entries.append(entry)

        return new_entries

    def get_stats(self) -> Dict:
        """Retorna estatísticas da memória."""
        total = len(self._entries)
        by_category = defaultdict(int)
        by_source = defaultdict(int)
        by_confidence = defaultdict(int)
        by_status = defaultdict(int)
        private_count = 0
        stale_count = 0

        for entry in self._entries.values():
            by_category[entry.data.get('category', 'geral')] += 1
            by_source[entry.data.get('source', 'unknown')] += 1
            by_confidence[entry.data.get('confidence_level', 'incerto')] += 1
            by_status[entry.data.get('status', 'ativa')] += 1
            if entry.data.get('is_private'):
                private_count += 1
            if entry.is_stale():
                stale_count += 1

        return {
            'total': total,
            'private': private_count,
            'global': total - private_count,
            'stale': stale_count,
            'by_category': dict(by_category),
            'by_source': dict(by_source),
            'by_confidence': dict(by_confidence),
            'by_status': dict(by_status),
            'index_size': len(self._index),
        }

    def get_all(self, user_id: str = None, include_private: bool = True) -> List[Dict]:
        """Retorna todas as entradas."""
        results = []
        for entry in self._entries.values():
            if not include_private and entry.data.get('is_private'):
                continue
            if user_id and entry.data.get('user_id') and entry.data['user_id'] != user_id:
                continue
            results.append(entry.to_dict())
        results.sort(key=lambda x: x.get('usage_count', 0), reverse=True)
        return results


# Instância global
_store: Optional[MemoryStore] = None


def get_store(data_dir: str = None) -> MemoryStore:
    global _store
    if _store is None:
        _store = MemoryStore(data_dir)
    return _store
