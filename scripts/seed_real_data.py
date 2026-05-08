"""
Seed real B-Livre data via the public API endpoints.
This is NOT mock data in the frontend - data is created in MongoDB through real API calls.
"""
import requests
import random
import os
import sys

API = "http://localhost:8001/api"

USERS = [
    ("Maria Silva", "maria@blivre.com", "senha123"),
    ("João Pereira", "joao@blivre.com", "senha123"),
    ("Ana Souza", "ana@blivre.com", "senha123"),
    ("Carlos Lima", "carlos@blivre.com", "senha123"),
    ("Paula Rocha", "paula@blivre.com", "senha123"),
    ("Bruno Oliveira", "bruno@blivre.com", "senha123"),
    ("Lucas Martins", "lucas@blivre.com", "senha123"),
    ("Fernanda Costa", "fernanda@blivre.com", "senha123"),
]

LISTINGS = [
    ("Bicicleta aro 29 seminova", "Bicicleta aro 29 com 21 marchas, ótimo estado, freios novos.", "esportes", 850.0, "São Paulo - SP"),
    ("Notebook Dell i5", "Dell Inspiron i5 8GB RAM 256SSD, bateria boa.", "informatica", 2200.0, "Curitiba - PR"),
    ("Sofá 3 lugares", "Sofá retrátil de couro, sem rasgos.", "moveis", 600.0, "Rio de Janeiro - RJ"),
    ("Curso de inglês doação", "Doo livros e CDs do meu antigo curso de inglês.", "educacao", 0.0, "Belo Horizonte - MG"),
    ("Filhote labrador", "Filhote macho, 2 meses, vacinado.", "animais", 0.0, "São Paulo - SP"),
    ("Geladeira Brastemp Frost Free", "420L, funcionando 100%.", "eletrodomesticos", 950.0, "Salvador - BA"),
    ("Guitarra Tagima TG-510", "Acompanha capa e cabo, ótima para iniciantes.", "musica", 480.0, "Porto Alegre - RS"),
    ("Carrinho de bebê Galzerano", "Pouco usado, dobrável.", "bebes", 220.0, "Recife - PE"),
    ("PlayStation 4 Slim 1TB", "2 controles + 5 jogos.", "games", 1300.0, "São Paulo - SP"),
    ("Bicicleta infantil aro 16", "Para crianças de 5-7 anos.", "esportes", 180.0, "Brasília - DF"),
    ("Mesa de jantar 6 lugares", "Madeira maciça, com cadeiras.", "moveis", 800.0, "Fortaleza - CE"),
    ("Livros de programação", "Lote com 8 livros: Python, JS, SQL.", "livros", 120.0, "Curitiba - PR"),
]

REPORT_REASONS = [
    "Anúncio com conteúdo enganoso",
    "Suspeita de golpe",
    "Produto proibido",
    "Imagens ofensivas",
    "Comportamento inadequado em mensagem",
]

SUPPORT_TICKETS = [
    ("Não consigo publicar anúncio", "Toda vez que tento publicar dá erro de imagem muito grande.", "tecnico"),
    ("Dúvida sobre como contatar anunciante", "Como faço para falar com quem anunciou a bicicleta?", "duvida"),
    ("Conta sumiu da listagem", "Meu anúncio não aparece mais na busca.", "tecnico"),
    ("Sugestão de categoria", "Faltam categorias para ferramentas industriais.", "sugestao"),
    ("Problema com login", "Esqueci a senha e não recebo o e-mail.", "tecnico"),
]

MESSAGES = [
    "Olá, ainda está disponível?",
    "Aceita oferta de R$ 700?",
    "Posso ver pessoalmente?",
    "Qual o estado de conservação?",
    "Tem nota fiscal?",
    "Faz entrega na zona sul?",
    "Tenho interesse, pode me chamar no WhatsApp?",
    "Aceita troca por celular?",
]


def post(path, data, token=None):
    h = {"Authorization": f"Bearer {token}"} if token else {}
    r = requests.post(f"{API}{path}", json=data, headers=h, timeout=20)
    if r.status_code >= 400:
        print(f"  ! {path} -> {r.status_code} {r.text[:120]}")
        return None
    return r.json()


def main():
    print("Seeding B-Livre real data via API...")
    tokens = {}

    # Register users
    for name, email, pw in USERS:
        d = post("/auth/register", {"name": name, "email": email, "password": pw})
        if d:
            tokens[email] = d["token"]
            print(f"  + user {name}")
        else:
            # try login (already exists)
            d = post("/auth/login", {"email": email, "password": pw})
            if d:
                tokens[email] = d["token"]

    if not tokens:
        print("No users; aborting.")
        sys.exit(1)

    user_emails = list(tokens.keys())

    # Create listings (idempotent: skip if same title+owner already exists)
    existing_titles = set()
    try:
        existing = requests.get(f"{API}/listings?limit=500", timeout=10).json()
        existing_titles = {l.get("title") for l in existing}
    except Exception:
        pass

    listing_ids = []
    listing_owners = {}
    for i, (title, desc, cat, price, loc) in enumerate(LISTINGS):
        owner_email = user_emails[i % len(user_emails)]
        if title in existing_titles:
            # find existing
            for l in existing:
                if l.get("title") == title:
                    listing_ids.append(l["id"])
                    listing_owners[l["id"]] = (owner_email, l["owner_id"])
                    print(f"  = listing {title} (existente)")
                    break
            continue
        d = post("/listings", {
            "title": title, "description": desc, "category": cat,
            "price": price, "location": loc,
        }, token=tokens[owner_email])
        if d:
            listing_ids.append(d["id"])
            listing_owners[d["id"]] = (owner_email, d["owner_id"])
            print(f"  + listing {title}")

    # Views (random per listing)
    for lid in listing_ids:
        n = random.randint(3, 25)
        for _ in range(n):
            requests.post(f"{API}/listings/{lid}/view", timeout=10)

    # Interests
    for lid in listing_ids:
        for email in random.sample(user_emails, k=random.randint(1, 4)):
            post(f"/listings/{lid}/interest", {}, token=tokens[email])

    # Messages
    for _ in range(18):
        lid = random.choice(listing_ids)
        owner_email, owner_id = listing_owners[lid]
        sender = random.choice([e for e in user_emails if e != owner_email])
        post("/messages", {
            "listing_id": lid,
            "to_user_id": owner_id,
            "content": random.choice(MESSAGES),
        }, token=tokens[sender])

    # Reports
    for _ in range(5):
        lid = random.choice(listing_ids)
        reporter = random.choice(user_emails)
        post("/reports", {
            "target_type": "listing",
            "target_id": lid,
            "reason": random.choice(REPORT_REASONS),
            "description": "Detalhes adicionais reportados pelo usuário.",
        }, token=tokens[reporter])

    # Support tickets
    for subject, msg, cat in SUPPORT_TICKETS:
        email = random.choice(user_emails)
        post("/support", {"subject": subject, "message": msg, "category": cat}, token=tokens[email])

    print(f"\nDone. Users={len(tokens)} Listings={len(listing_ids)}")


if __name__ == "__main__":
    main()
