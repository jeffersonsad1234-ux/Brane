import os
import json
import re
from collections import Counter, defaultdict
from typing import List, Dict, Tuple
import pickle

class BPETokenizer:
    """Tokenizer BPE 100% proprio — zero dependencia externa."""

    def __init__(self, vocab_size: int = 8000):
        self.vocab_size = vocab_size
        self.merges: List[Tuple[str, str]] = []
        self.vocab: Dict[str, int] = {}
        self.inverse_vocab: Dict[int, str] = {}
        self.special_tokens = {
            '<pad>': 0,
            '<bos>': 1,
            '<eos>': 2,
            '<unk>': 3,
            '<sep>': 4,
            '<mask>': 5,
        }

    def _get_stats(self, words: Dict[str, int]) -> Dict[Tuple[str, str], int]:
        pairs = Counter()
        for word, freq in words.items():
            symbols = word.split()
            for i in range(len(symbols) - 1):
                pairs[(symbols[i], symbols[i + 1])] += freq
        return pairs

    def _merge_pair(self, pair: Tuple[str, str], words: Dict[str, int]) -> Dict[str, int]:
        new_words = {}
        bigram = ' '.join(pair)
        replacement = ''.join(pair)
        for word, freq in words.items():
            new_word = word.replace(bigram, replacement)
            new_words[new_word] = freq
        return new_words

    def _split_to_words(self, text: str) -> List[str]:
        text = text.lower()
        text = re.sub(r'([.,!?;:\-\"\'()\[\]{}])', r' \1 ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text.split(' ') if text else []

    def _build_word_freqs(self, corpus: List[str]) -> Dict[str, int]:
        word_freq = Counter()
        for text in corpus:
            words = self._split_to_words(text)
            for w in words:
                word_freq[w] += 1
        return word_freq

    def train(self, corpus: List[str]):
        print(f"[Tokenizer] Treinando BPE com vocab_size={self.vocab_size}")
        print(f"[Tokenizer] Corpus: {len(corpus)} textos")

        word_freq = self._build_word_freqs(corpus)
        words = {}
        for word, freq in word_freq.items():
            chars = ' '.join(list(word)) + ' </w>'
            words[chars] = freq

        num_merges = self.vocab_size - len(self.special_tokens) - 256
        num_merges = max(0, min(num_merges, len(word_freq) * 2))

        self.merges = []
        for i in range(num_merges):
            pairs = self._get_stats(words)
            if not pairs:
                break
            best = max(pairs, key=pairs.get)
            self.merges.append(best)
            words = self._merge_pair(best, words)
            if (i + 1) % 1000 == 0:
                print(f"  Merges: {i + 1}/{num_merges}")

        self.vocab = dict(self.special_tokens)
        idx = len(self.special_tokens)
        for i in range(256):
            self.vocab[f'<0x{i:02X}>'] = idx
            idx += 1

        base_vocab = set()
        for word in words:
            for token in word.split():
                base_vocab.add(token)
        for token in sorted(base_vocab):
            if token not in self.vocab:
                self.vocab[token] = idx
                idx += 1

        self.inverse_vocab = {v: k for k, v in self.vocab.items()}
        print(f"[Tokenizer] Vocab final: {len(self.vocab)} tokens")

    def encode(self, text: str, add_special: bool = True) -> List[int]:
        words = self._split_to_words(text)
        tokens = []
        if add_special:
            tokens.append(self.special_tokens['<bos>'])

        for word in words:
            word_tokens = list(word) + ['</w>']
            for pair in self.merges:
                i = 0
                while i < len(word_tokens) - 1:
                    if word_tokens[i] == pair[0] and word_tokens[i + 1] == pair[1]:
                        word_tokens = word_tokens[:i] + [''.join(pair)] + word_tokens[i + 2:]
                    else:
                        i += 1

            for t in word_tokens:
                tokens.append(self.vocab.get(t, self.special_tokens['<unk>']))

        if add_special:
            tokens.append(self.special_tokens['<eos>'])
        return tokens

    def decode(self, ids: List[int]) -> str:
        tokens = []
        for idx in ids:
            tok = self.inverse_vocab.get(idx, '<unk>')
            if tok in ('<pad>', '<bos>', '<eos>', '<sep>', '<mask>', '<unk>'):
                continue
            tokens.append(tok)
        text = ''.join(tokens)
        text = text.replace('</w>', ' ')
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def save(self, path: str):
        os.makedirs(os.path.dirname(path) or '.', exist_ok=True)
        data = {
            'vocab_size': self.vocab_size,
            'merges': [list(m) for m in self.merges],
            'vocab': self.vocab,
            'special_tokens': self.special_tokens,
        }
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"[Tokenizer] Salvo em {path}")

    def load(self, path: str):
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        self.vocab_size = data['vocab_size']
        self.merges = [tuple(m) for m in data['merges']]
        self.vocab = data['vocab']
        self.special_tokens = data['special_tokens']
        self.inverse_vocab = {int(v): k for k, v in self.vocab.items() if k not in self.special_tokens}
        print(f"[Tokenizer] Carregado de {path} — {len(self.vocab)} tokens")

    @property
    def pad_id(self): return self.special_tokens['<pad>']
    @property
    def bos_id(self): return self.special_tokens['<bos>']
    @property
    def eos_id(self): return self.special_tokens['<eos>']


def build_tokenizer_from_corpus(corpus_path: str, vocab_size: int = 8000, save_path: str = 'tokenizer.json'):
    """Le corpus e treina tokenizer."""
    print(f"[Tokenizer] Lendo corpus de {corpus_path}")
    with open(corpus_path, 'r', encoding='utf-8') as f:
        lines = [l.strip() for l in f if l.strip()]
    print(f"[Tokenizer] {len(lines)} linhas")

    tokenizer = BPETokenizer(vocab_size=vocab_size)
    tokenizer.train(lines)
    tokenizer.save(save_path)
    return tokenizer


if __name__ == '__main__':
    import sys
    corpus = sys.argv[1] if len(sys.argv) > 1 else 'data/corpus_br.txt'
    vocab = int(sys.argv[2]) if len(sys.argv) > 2 else 8000
    build_tokenizer_from_corpus(corpus, vocab)
