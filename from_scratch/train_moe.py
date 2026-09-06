"""
BranPy MoE Training — Treina experts separados + router + joint fine-tune.
100% próprio, CPU only, zero licença.
"""

import os
import sys
import time
import random
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

sys.path.insert(0, os.path.dirname(__file__))
from model import BranPyModel, BranPyConfig, create_model
from tokenizer import BPETokenizer


class MoEDataset(Dataset):
    def __init__(self, data: list, tokenizer: BPETokenizer, max_len: int = 512):
        self.data = data
        self.tokenizer = tokenizer
        self.max_len = max_len

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        text = self.data[idx]
        ids = self.tokenizer.encode(text, add_special=True)
        if len(ids) > self.max_len:
            ids = ids[:self.max_len]
        # Clamp token IDs to valid vocab range
        vocab_size = len(self.tokenizer.vocab)
        ids = [min(id, vocab_size - 1) for id in ids]
        pad_id = self.tokenizer.pad_id
        padded = ids + [pad_id] * (self.max_len - len(ids))
        x = torch.tensor(padded[:-1], dtype=torch.long)
        y = torch.tensor(padded[1:], dtype=torch.long)
        mask = (x != pad_id).float()
        y = y.masked_fill(y == pad_id, -100)
        return x, y, mask


def load_corpus(path: str):
    with open(path, 'r', encoding='utf-8') as f:
        return [l.strip() for l in f.read().split('\n\n') if l.strip()]


def train_expert(domain: str, corpus_path: str, save_dir: str, vocab_size: int = 8000,
                 epochs: int = 3, batch_size: int = 4, grad_accum: int = 8,
                 lr: float = 3e-4, max_len: int = 512, model_size: str = 'practical'):
    
    os.makedirs(save_dir, exist_ok=True)
    log_path = os.path.join(save_dir, f'train_{domain}.log')
    
    def log(msg):
        print(f"[{domain}] {msg}")
        with open(log_path, 'a', encoding='utf-8') as f:
            f.write(msg + '\n')
    
    log(f"=== TREINO EXPERT {domain.upper()} ===")
    
    # Carrega corpus
    lines = load_corpus(corpus_path)
    random.shuffle(lines)
    val_size = int(len(lines) * 0.05)
    val_lines = lines[:val_size]
    train_lines = lines[val_size:]
    log(f"  Treino: {len(train_lines):,} | Val: {len(val_lines):,}")
    
    # Tokenizer
    tokenizer = BPETokenizer(vocab_size=vocab_size)
    tokenizer.train(train_lines)
    tok_path = os.path.join(save_dir, f'tokenizer_{domain}.json')
    tokenizer.save(tok_path)
    actual_vocab = len(tokenizer.vocab)
    log(f"  Vocab: {actual_vocab:,}")
    
    # Modelo
    model = create_model(vocab_size=actual_vocab, size=model_size)
    n_params = sum(p.numel() for p in model.parameters())
    log(f"  Params: {n_params:,} ({n_params/1e6:.1f}M)")
    
    device = torch.device('cpu')
    model = model.to(device)
    
    # Datasets
    train_dataset = MoEDataset(train_lines, tokenizer, max_len)
    val_dataset = MoEDataset(val_lines, tokenizer, max_len)
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    
    # Otimizador
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=0.01, betas=(0.9, 0.95))
    total_steps = epochs * len(train_loader)
    warmup_steps = min(200, total_steps // 10)
    
    def lr_lambda(step):
        if step < warmup_steps:
            return step / warmup_steps
        progress = (step - warmup_steps) / max(1, total_steps - warmup_steps)
        return 0.5 * (1 + torch.cos(torch.tensor(progress * 3.14159))).item()
    scheduler = torch.optim.lr_scheduler.LambdaLR(optimizer, lr_lambda)
    
    # Treino
    step = 0
    best_val = float('inf')
    patience = 3
    no_improve = 0
    start = time.time()
    
    for epoch in range(epochs):
        model.train()
        optimizer.zero_grad()
        
        for batch_idx, (x, y, mask) in enumerate(train_loader):
            step += 1
            x, y, mask = x.to(device), y.to(device), mask.to(device)
            
            _, loss = model(x, y)
            loss = loss / grad_accum
            loss.backward()
            
            if step % grad_accum == 0:
                nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                optimizer.step()
                scheduler.step()
                optimizer.zero_grad()
            
            if step % 50 == 0:
                log(f"  Step {step} | Loss: {loss.item()*grad_accum:.4f} | LR: {optimizer.param_groups[0]['lr']:.2e}")
            
            # Eval
            if step % 200 == 0:
                model.eval()
                val_loss = 0
                total_tokens = 0
                with torch.no_grad():
                    for vx, vy, vmask in val_loader:
                        vx, vy, vmask = vx.to(device), vy.to(device), vmask.to(device)
                        _, vl = model(vx, vy)
                        val_loss += vl.item() * vmask.sum().item()
                        total_tokens += vmask.sum().item()
                val_loss /= max(total_tokens, 1)
                log(f"  >> EVAL step {step} | Val Loss: {val_loss:.4f}")
                
                if val_loss < best_val:
                    best_val = val_loss
                    no_improve = 0
                    torch.save({
                        'model_state_dict': model.state_dict(),
                        'tokenizer_path': tok_path,
                        'config': {'vocab_size': actual_vocab, 'model_size': model_size}
                    }, os.path.join(save_dir, f'expert_{domain}_best.pt'))
                    log(f"  >> BEST saved (val={val_loss:.4f})")
                else:
                    no_improve += 1
                    if no_improve >= patience:
                        log(f"  >> EARLY STOP at step {step}")
                        break
                model.train()
        
        if no_improve >= patience:
            break
    
    log(f"=== {domain.upper()} CONCLUÍDO em {(time.time()-start)/60:.1f}min ===")
    return os.path.join(save_dir, f'expert_{domain}_best.pt'), tok_path


def train_router(expert_domains, corpus_path, save_dir, vocab_size=8000,
                 epochs=2, batch_size=4, grad_accum=8, lr=3e-4, max_len=512, model_size='practical'):
    
    os.makedirs(save_dir, exist_ok=True)
    log_path = os.path.join(save_dir, 'train_router.log')
    
    def log(msg):
        print(f"[ROUTER] {msg}")
        with open(log_path, 'a', encoding='utf-8') as f:
            f.write(msg + '\n')
    
    log("=== TREINO ROUTER ===")
    
    lines = load_corpus(corpus_path)
    random.shuffle(lines)
    val_size = int(len(lines) * 0.05)
    val_lines = lines[:val_size]
    train_lines = lines[val_size:]
    log(f"  Treino: {len(train_lines):,} | Val: {len(val_lines):,}")
    
    tokenizer = BPETokenizer(vocab_size=vocab_size)
    tokenizer.train(train_lines)
    tok_path = os.path.join(save_dir, 'tokenizer_router.json')
    tokenizer.save(tok_path)
    actual_vocab = len(tokenizer.vocab)
    log(f"  Vocab: {actual_vocab:,}")
    
    model = create_model(vocab_size=actual_vocab, size=model_size)
    n_params = sum(p.numel() for p in model.parameters())
    log(f"  Params: {n_params:,} ({n_params/1e6:.1f}M)")
    
    device = torch.device('cpu')
    model = model.to(device)
    
    train_dataset = MoEDataset(train_lines, tokenizer, max_len)
    val_dataset = MoEDataset(val_lines, tokenizer, max_len)
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=0.01, betas=(0.9, 0.95))
    total_steps = epochs * len(train_loader)
    warmup_steps = min(200, total_steps // 10)
    
    def lr_lambda(step):
        if step < warmup_steps:
            return step / warmup_steps
        progress = (step - warmup_steps) / max(1, total_steps - warmup_steps)
        return 0.5 * (1 + torch.cos(torch.tensor(progress * 3.14159))).item()
    scheduler = torch.optim.lr_scheduler.LambdaLR(optimizer, lr_lambda)
    
    step = 0
    best_val = float('inf')
    patience = 3
    no_improve = 0
    
    for epoch in range(epochs):
        model.train()
        optimizer.zero_grad()
        
        for x, y, mask in train_loader:
            x, y, mask = x.to(device), y.to(device), mask.to(device)
            _, loss = model(x, y)
            loss = loss / grad_accum
            loss.backward()
            
            if step % grad_accum == 0:
                nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                optimizer.step()
                scheduler.step()
                optimizer.zero_grad()
            
            step += 1
            
            if step % 50 == 0:
                log(f"  Step {step} | Loss: {loss.item()*grad_accum:.4f}")
            
            if step % 200 == 0:
                model.eval()
                val_loss = 0
                total_tokens = 0
                with torch.no_grad():
                    for vx, vy, vmask in val_loader:
                        vx, vy, vmask = vx.to(device), vy.to(device), vmask.to(device)
                        _, vl = model(vx, vy)
                        val_loss += vl.item() * vmask.sum().item()
                        total_tokens += vmask.sum().item()
                val_loss /= max(total_tokens, 1)
                log(f"  >> EVAL step {step} | Val Loss: {val_loss:.4f}")
                
                if val_loss < best_val:
                    best_val = val_loss
                    no_improve = 0
                    torch.save({
                        'model_state_dict': model.state_dict(),
                        'tokenizer_path': tok_path,
                        'config': {'vocab_size': actual_vocab, 'model_size': model_size}
                    }, os.path.join(save_dir, 'router_best.pt'))
                else:
                    no_improve += 1
                    if no_improve >= patience:
                        log("EARLY STOP")
                        break
                model.train()
    
    log("=== ROUTER CONCLUÍDO ===")
    return os.path.join(save_dir, 'router_best.pt'), tok_path


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='BranPy MoE Training')
    parser.add_argument('--domain', choices=['sexo', 'hacker', 'codigo', 'geral', 'router', 'all'], default='all')
    parser.add_argument('--per-expert', type=int, default=250000)
    parser.add_argument('--router', type=int, default=100000)
    parser.add_argument('--epochs', type=int, default=3)
    parser.add_argument('--batch', type=int, default=4)
    parser.add_argument('--grad-accum', type=int, default=8)
    parser.add_argument('--lr', type=float, default=3e-4)
    parser.add_argument('--max-len', type=int, default=512)
    parser.add_argument('--vocab', type=int, default=8000)
    parser.add_argument('--size', default='practical')
    args = parser.parse_args()
    
    EXPERTS_DIR = os.path.join(os.path.dirname(__file__), 'data', 'experts')
    WEIGHTS_DIR = os.path.join(os.path.dirname(__file__), 'weights', 'moe_experts')
    
    # Gera corpus se não existe
    corpus_files = {
        'sexo': os.path.join(os.path.dirname(__file__), 'data', 'experts', 'corpus_sexo.txt'),
        'hacker': os.path.join(os.path.dirname(__file__), 'data', 'experts', 'corpus_hacker.txt'),
        'codigo': os.path.join(os.path.dirname(__file__), 'data', 'experts', 'corpus_codigo.txt'),
        'geral': os.path.join(os.path.dirname(__file__), 'data', 'experts', 'corpus_geral.txt'),
        'router': os.path.join(os.path.dirname(__file__), 'data', 'experts', 'corpus_router.txt'),
    }
    
    if not all(os.path.exists(f) for f in corpus_files.values()):
        print("Corpus não encontrado. Gerando...")
        from generate_experts import generate_all
        generate_all(args.per_expert, args.router)
    
    if args.domain in ['all', 'sexo']:
        train_expert('sexo', corpus_files['sexo'], os.path.join(WEIGHTS_DIR, 'sexo'), 
                     vocab_size=args.vocab, epochs=args.epochs, batch_size=args.batch,
                     grad_accum=args.grad_accum, lr=args.lr, max_len=args.max_len, model_size=args.size)
    
    if args.domain in ['all', 'hacker']:
        train_expert('hacker', corpus_files['hacker'], os.path.join(WEIGHTS_DIR, 'hacker'),
                     vocab_size=args.vocab, epochs=args.epochs, batch_size=args.batch,
                     grad_accum=args.grad_accum, lr=args.lr, max_len=args.max_len, model_size=args.size)
    
    if args.domain in ['all', 'codigo']:
        train_expert('codigo', corpus_files['codigo'], os.path.join(WEIGHTS_DIR, 'codigo'),
                     vocab_size=args.vocab, epochs=args.epochs, batch_size=args.batch,
                     grad_accum=args.grad_accum, lr=args.lr, max_len=args.max_len, model_size=args.size)
    
    if args.domain in ['all', 'geral']:
        train_expert('geral', corpus_files['geral'], os.path.join(WEIGHTS_DIR, 'geral'),
                     vocab_size=args.vocab, epochs=args.epochs, batch_size=args.batch,
                     grad_accum=args.grad_accum, lr=args.lr, max_len=args.max_len, model_size=args.size)
    
    if args.domain in ['all', 'router']:
        train_router(['sexo', 'hacker', 'codigo', 'geral'], corpus_files['router'],
                     os.path.join(WEIGHTS_DIR, 'router'),
                     vocab_size=args.vocab, epochs=2, batch_size=args.batch,
                     grad_accum=args.grad_accum, lr=args.lr, max_len=args.max_len, model_size=args.size)
    
    print("\n=== TREINO MOE CONCLUÍDO ===")
    print("Próximo passo: python merge_moe.py")