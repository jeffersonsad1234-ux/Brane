"""
BranPy MoE Expert Dataset Generator — 100% próprio, zero dependência externa.
Gera dados especializados por domínio para Mixture of Experts.
NÃO usa modelo externo, NÃO copia conhecimento, NÃO requer licença.
"""

import random
import os
from typing import List, Tuple

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "data", "experts")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ==========================================
# BANCOS DE DADOS EXPANDIDOS
# ==========================================

NAMES = ["Ana", "João", "Maria", "Pedro", "Carlos", "Lucia", "Rafael", "Fernanda", 
         "Lucas", "Juliana", "Bruno", "Camila", "Diego", "Patricia", "Felipe", "Amanda",
         "Gabriel", "Isabela", "Mateus", "Larissa", "Rodrigo", "Beatriz", "Gustavo", "Mariana",
         "Thiago", "Vanessa", "Leonardo", "Julia", "André", "Natália", "Ricardo", "Carolina"]

def rand_name(): return random.choice(NAMES)

# ==========================================
# EXPERT 1: SEXO E SAÚDE SEXUAL (técnico, educativo, consentimento)
# ==========================================

SEX_ANATOMY = [
    ("clitóris", "órgão erétil feminino com 8000 terminações nervosas, função exclusiva de prazer"),
    ("pênis", "órgão reprodutor masculino, uretra e corpos cavernosos para ereção"),
    ("vagina", "canal muscular elástico, autolubrificante, conecta útero ao exterior"),
    ("útero", "órgão muscular onde o feto se desenvolve durante a gestação"),
    ("ovários", "gônadas femininas, produzem óvulos e hormônios estrogênio/progesterona"),
    ("testículos", "gônadas masculinas, produzem espermatozoides e testosterona"),
    ("próstata", "glândula masculina que produz fluido seminal, ponto de prazer (ponto P)"),
    ("ponto G", "área na parede vaginal anterior, sensível à pressão, não órgão distinto"),
    ("ânus", "esfíncter final do trato digestivo, rica inervação, prática sexual com preparo"),
    ("períneo", "região entre genitais e ânus, músculos do assoalho pélvico"),
]

SEX_HEALTH = [
    ("DST/IST", "infecções sexualmente transmissíveis: HIV, sífilis, gonorreia, clamídia, HPV, herpes"),
    ("preservativo", "barreira de látex/poliuretano, 98% eficaz contra IST e gravidez se usado corretamente"),
    ("PrEP", "profilaxia pré-exposição ao HIV, medicamento diário, 99% eficaz se aderente"),
    ("PEP", "profilaxia pós-exposição ao HIV, até 72h após risco, 28 dias de tratamento"),
    ("testagem", "exames regulares: HIV, sífilis, hepatites B/C, gonorreia, clamídia a cada 3-6 meses"),
    ("vacina HPV", "previne câncer de colo uterino, pênis, ânus, orofaringe; 2-3 doses conforme idade"),
    ("contracepção", "pílula, DIU, implante, injeção, anel, adesivo; escolha com ginecologista"),
    ("lubrificante", "à base de água ou silicone; evita microfissuras, aumenta prazer; não use óleo com látex"),
    ("consentimento", "livre, informado, entusiasta, revogável a qualquer momento; sem coação/álcool/drogas"),
    ("comunicação", "falar sobre desejos, limites, proteção, histórico sexual ANTES do ato"),
]

SEX_PRACTICES = [
    ("sexo oral", "cunnilingus/felatio; risco IST menor mas existe; use barreira dental/preservativo saborizado"),
    ("sexo anal", "penetração anal; exige preparo, lubrificante abundante, preservativo, ir devagar"),
    ("masturbação", "autoconhecimento saudável, sem riscos, alivia tensão, melhora sono"),
    ("sexo vaginal", "penetração pênis-vagina; use preservativo + outro contraceptivo se não quer gravidez"),
    ("fisting", "introdução mão/punho; exige treino, luva, lubrificante extremo, comunicação total"),
    ("BDSM leve", "bondage, disciplina, dominação, submissão, sadismo, masoquismo; SSC: seguro, são, consensual"),
    ("swing/menage", "sexo em grupo/troca de casais; regras claras, preservativos, testagem em dia"),
    ("tantra", "sexualidade consciente, respiração, conexão, não focado em orgasmo"),
]

def generate_sex_expert(count: int) -> List[Tuple[str, str]]:
    pairs = []
    all_topics = SEX_ANATOMY + SEX_HEALTH + SEX_PRACTICES
    for _ in range(count):
        topic, detail = random.choice(all_topics)
        q_type = random.choice([
            f"O que é {topic}?",
            f"Explique {topic} de forma técnica",
            f"Como funciona {topic}?",
            f"Quais os cuidados com {topic}?",
            f"Riscos e prevenção em {topic}",
        ])
        ans = f"{topic}: {detail}. Fonte: conhecimento médico consensual (OMS, CDC, sociedades de ginecologia/urologia)."
        pairs.append((f"Humor: {q_type}\nIA: {ans}", q_type))
    return pairs


# ==========================================
# EXPERT 2: HACKING ÉTICO E SEGURANÇA DA INFORMAÇÃO
# ==========================================

HACK_NETWORK = [
    ("TCP/IP", "protocolo base da internet: camadas aplicação, transporte, internet, enlace; portas 0-65535"),
    ("DNS", "traduz domínio para IP; cache, recursivo, autoritativo; vulnerabilidades: spoofing, cache poisoning"),
    ("HTTP/HTTPS", "protocolo web; TLS 1.2/1.3 criptografa; headers: CSP, HSTS, X-Frame-Options"),
    ("VPN", "túnel criptografado; OpenVPN, WireGuard, IPSec; mascara IP, criptografa tráfego"),
    ("Tor", "roteamento onion; 3 saltos; anonimato; lento; não use para login pessoal"),
    ("firewall", "filtra pacotes: stateful, next-gen, WAF; regras: default deny, allow list"),
    ("IDS/IPS", "detecção/prevenção intrusão: Snort, Suricata; assinaturas + anomalia"),
]

HACK_WEB = [
    ("XSS", "Cross-Site Scripting: injeção JS no navegador vítima; tipos: refletido, armazenado, DOM; defesa: sanitização, CSP"),
    ("SQLi", "SQL Injection: injeção SQL via input não sanitizado; union, blind, time-based; defesa: prepared statements"),
    ("CSRF", "Cross-Site Request Forgery: ação não intencional autenticada; defesa: token CSRF, SameSite cookie"),
    ("SSRF", "Server-Side Request Forgery: servidor faz requisição interna; defesa: allowlist URLs, bloquear metadata"),
    ("RCE", "Remote Code Execution: execução código no servidor; via deserialização, upload, template injection"),
    ("IDOR", "Insecure Direct Object Reference: acesso não autorizado a objeto; defesa: autorização por objeto"),
    ("XXE", "XML External Entity: parsing XML malicioso; lê arquivos internos, SSRF; defesa: desabilitar DTD"),
    ("SSTI", "Server-Side Template Injection: injeção em template Jinja2, Twig, Freemarker; RCE via template"),
]

HACK_TOOLS = [
    ("Nmap", "scanner portas/serviços: -sS -sV -O -A -p-; scripts NSE para vulns"),
    ("Burp Suite", "proxy interceptador: repeater, intruder, scanner, sequencer; extensões"),
    ("Metasploit", "framework exploits: search, use, set RHOSTS, exploit; meterpreter payload"),
    ("Gobuster/Dirb", "fuzzing diretórios/arquivos: -w wordlist -x php,html,js,txt"),
    ("SQLMap", "automatiza SQLi: -u URL --dbs --tables --dump --batch --random-agent"),
    ("Hashcat/John", "quebra hash: -m modo -a ataque -w wordlist hash.txt; regras, máscaras"),
    ("Wireshark", "análise pacotes: follow TCP stream, filtros display, export objects"),
    ("LinPEAS/WinPEAS", "enumeração pós-exploit: sudo, SUID, cron, credenciais, kernel exploits"),
]

HACK_ETHICS = [
    ("escopo", "definir alvos, regras, horários, relatórios; contrato assinado; NDA"),
    ("reconhecimento", "passivo: OSINT, WHOIS, Shodan, certificate transparency; ativo: varredura controlada"),
    ("relatório", "resumo executivo + técnico: risco, evidência, impacto, recomendação, CVSS"),
    ("responsible disclosure", "reportar à empresa; prazo 90 dias; coordenar patch; não divulgar antes"),
    ("legal", "Lei 12.737/2012 (Brasil): acesso não autorizado = crime; apenas com autorização escrita"),
]

def generate_hacker_expert(count: int) -> List[Tuple[str, str]]:
    pairs = []
    all_topics = HACK_NETWORK + HACK_WEB + HACK_TOOLS + HACK_ETHICS
    for _ in range(count):
        topic, detail = random.choice(all_topics)
        q_type = random.choice([
            f"O que é {topic} em segurança?",
            f"Como funciona {topic}?",
            f"Como se proteger contra {topic}?",
            f"Ferramentas para {topic}:",
            f"Explique {topic} para iniciantes",
        ])
        ans = f"{topic}: {detail}. Uso apenas em ambientes autorizados (CTF, laboratório, pentest contratado). Ilegal acessar sistemas sem autorização escrita (Lei 12.737/2012)."
        pairs.append((f"Humor: {q_type}\nIA: {ans}", q_type))
    return pairs


# ==========================================
# EXPERT 3: PROGRAMAÇÃO E DESENVOLVIMENTO
# ==========================================

CODE_PYTHON = [
    ("async/await", "asyncio: event loop, tasks, gather, semaphores; não bloqueia I/O; use aiohttp, asyncpg"),
    ("decorators", "@função: wrapper que modifica comportamento; @property, @classmethod, @staticmethod, custom"),
    ("generators", "yield: lazy evaluation, memória constante; yield from; itertools; streams grandes"),
    ("context managers", "with: __enter__/__exit__; recursos: arquivos, locks, conexões; contextlib"),
    ("type hints", "typing: List, Dict, Optional, Union, Generic, Protocol; mypy, pyright; PEP 484+"),
    ("dataclasses", "@dataclass: __init__, __repr__, __eq__ automáticos; field, default_factory, slots=True"),
    ("async context", "async with: __aenter__/__aexit__; conexões DB, sessões HTTP, locks assíncronos"),
]

CODE_JS = [
    ("event loop", "single-threaded: call stack, microtask queue (promises), macrotask queue (setTimeout); não bloqueie"),
    ("promises", "Promise: pending/fulfilled/rejected; .then/.catch/.finally; Promise.all/allSettled/race"),
    ("async/await", "syntactic sugar sobre promises; try/catch; for await...of; top-level await em modules"),
    ("closures", "função lembra escopo onde foi criada; factory functions, módulos, callbacks"),
    ("prototype", "herança prototípica: __proto__, Object.create, class syntax (ES6+ syntactic sugar)"),
    ("modules", "ESM: import/export, tree-shaking, dynamic import(); CommonJS: require/module.exports"),
]

CODE_SYSTEMS = [
    ("Docker", "containerização: Dockerfile, layers, multi-stage, .dockerignore; compose: services, networks, volumes"),
    ("Kubernetes", "orquestração: pods, deployments, services, ingress, configmaps, secrets, HPA, operators"),
    ("CI/CD", "GitHub Actions/GitLab CI: lint, test, build, deploy; cache, matrix, environments, approvals"),
    ("PostgreSQL", "ACID, MVCC, indexes (B-tree, GIN, BRIN), partitioning, replication, vacuum, explain analyze"),
    ("Redis", "chave-valor em memória: strings, hashes, lists, sets, sorted sets; pub/sub, streams, Lua scripts"),
    ("microservices", "comunicação: sync (REST/gRPC) vs async (message queue); saga, circuit breaker, observability"),
    ("observability", "logs (structured JSON), metrics (Prometheus), traces (OpenTelemetry/Jaeger), alertas"),
]

CODE_PATTERNS = [
    ("SOLID", "S: responsabilidade única; O: aberto/fechado; L: Liskov; I: segregação interface; D: inversão dependência"),
    ("design patterns", "factory, builder, singleton, strategy, observer, decorator, adapter, repository, CQRS"),
    ("clean architecture", "camadas: entities, use cases, interface adapters, frameworks; dependência para dentro"),
    ("TDD", "red-green-refactor: teste falha, passa, refatora; cobertura >80%; testes unitários/integração/e2e"),
    ("code review", "checklist: segurança, performance, legibilidade, testes, breaking changes, documentação"),
]

def generate_code_expert(count: int) -> List[Tuple[str, str]]:
    pairs = []
    all_topics = CODE_PYTHON + CODE_JS + CODE_SYSTEMS + CODE_PATTERNS
    for _ in range(count):
        topic, detail = random.choice(all_topics)
        q_type = random.choice([
            f"Como usar {topic}?",
            f"Explique {topic} com exemplo",
            f"Boas práticas em {topic}",
            f"Erros comuns em {topic}",
            f"Quando usar {topic}?",
        ])
        ans = f"{topic}: {detail}. Pratique em projetos reais; leia documentação oficial; contribua open source."
        pairs.append((f"Humor: {q_type}\nIA: {ans}", q_type))
    return pairs


# ==========================================
# EXPERT 4: CONHECIMENTO GERAL E RACIOCÍNIO
# ==========================================

GENERAL_FACTS = [
    ("Brasil", "maior país América do Sul, 8.5M km², 215M hab, capital Brasília, 26 estados + DF"),
    ("Amazônia", "maior floresta tropical, 5.5M km², 20% água doce, 10% biodiversidade, pulmão do mundo"),
    ("história", "descobrimento 1500, independência 1822, república 1889, ditadura 1964-85, constituição 1988"),
    ("economia", "9ª PIB mundial, agro/indústria/serviços, real (BRL), inflação meta, Bolsa B3"),
    ("ciência", "INPE, Fiocruz, Butantan, CNPq, CAPES; satélites CBERS, vacinas, biodiversidade"),
    ("cultura", "Tupi-Guarani, africana, europeia; carnaval, samba, forró, MPB, literatura, cinema"),
    ("geografia", "biomas: Amazônia, Cerrado, Mata Atlântica, Caatinga, Pampa, Pantanal; clima tropical"),
]

GENERAL_REASONING = [
    ("lógica", "silogismo: todos A são B; C é A; logo C é B. Falácias: ad hominem, strawman, falso dilema"),
    ("matemática", "aritmética, álgebra, geometria, estatística, probabilidade; resolver problemas passo a passo"),
    ("causalidade", "correlação ≠ causalidade; variáveis confusas; experimentos controlados; contrafactual"),
    ("probabilidade", "Bayes: P(A|B) = P(B|A)P(A)/P(B); base rate neglect; monty hall; falácia do jogador"),
    ("estatística", "média/mediana/moda; desvio padrão; intervalo confiança; p-valor; significância; viés amostral"),
]

GENERAL_UNKNOWN = [
    ("não sei", "reconhecer limites: 'Não tenho informação suficiente', 'Preciso verificar', 'Não posso afirmar'"),
    ("verificação", "fontes primárias; revisão por pares; data; autor; viés; triangulação; fact-checking"),
    ("falácias", "autoridade falsa; generalização apressada; pós-hoc; escorregadeira; falso equilíbrio"),
]

def generate_general_expert(count: int) -> List[Tuple[str, str]]:
    pairs = []
    all_topics = GENERAL_FACTS + GENERAL_REASONING + GENERAL_UNKNOWN
    for _ in range(count):
        topic, detail = random.choice(all_topics)
        q_type = random.choice([
            f"O que é {topic}?",
            f"Explique {topic}",
            f"Como funciona {topic}?",
            f"O que você sabe sobre {topic}?",
        ])
        if "não sei" in topic or "verificação" in topic or "falácias" in topic:
            ans = detail + " Se não tenho certeza, digo: 'Não tenho informação suficiente para responder com confiança.'"
        else:
            ans = f"{topic}: {detail}."
        pairs.append((f"Humor: {q_type}\nIA: {ans}", q_type))
    return pairs


# ==========================================
# ROUTER DATA (dados mistos com labels de domínio)
# ==========================================

DOMAIN_LABELS = {
    "sexo": "SEXO",
    "hacker": "HACKER", 
    "codigo": "CODIGO",
    "geral": "GERAL"
}

def generate_router_data(count: int) -> List[Tuple[str, str]]:
    pairs = []
    all_experts = [
        (generate_sex_expert, "SEXO"),
        (generate_hacker_expert, "HACKER"),
        (generate_code_expert, "CODIGO"),
        (generate_general_expert, "GERAL"),
    ]
    for _ in range(count):
        gen_fn, domain = random.choice(all_experts)
        q, ans = gen_fn(1)[0]
        # Remove prefixo "Humor: " e "IA: " para criar exemplo de roteamento
        q_clean = q.replace("Humor: ", "").replace("\nIA: ", "? ")
        pairs.append((f"Domínio: {domain}\nPergunta: {q_clean}", f"[{domain}] {ans.split('IA: ')[1] if 'IA: ' in ans else ans}"))
    return pairs


def save_expert_corpus(pairs: List[Tuple[str, str]], domain: str):
    path = os.path.join(OUTPUT_DIR, f"corpus_{domain}.txt")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n\n".join([p[0] for p in pairs]))
    print(f"  {domain}: {len(pairs):,} exemplos -> {path}")


def generate_all(target_per_expert: int = 500000, router_count: int = 200000):
    print("=" * 60)
    print("BRANPY MOE EXPERT DATASET GENERATOR")
    print("100% próprio — Zero dependência externa")
    print("=" * 60)
    
    # Gera cada expert
    print(f"\nGerando EXPERT SEXO ({target_per_expert:,})...")
    sex_pairs = generate_sex_expert(target_per_expert)
    save_expert_corpus(sex_pairs, "sexo")
    
    print(f"\nGerando EXPERT HACKER ({target_per_expert:,})...")
    hacker_pairs = generate_hacker_expert(target_per_expert)
    save_expert_corpus(hacker_pairs, "hacker")
    
    print(f"\nGerando EXPERT CODIGO ({target_per_expert:,})...")
    code_pairs = generate_code_expert(target_per_expert)
    save_expert_corpus(code_pairs, "codigo")
    
    print(f"\nGerando EXPERT GERAL ({target_per_expert:,})...")
    general_pairs = generate_general_expert(target_per_expert)
    save_expert_corpus(general_pairs, "geral")
    
    # Router
    print(f"\nGerando ROUTER ({router_count:,})...")
    router_pairs = generate_router_data(router_count)
    save_expert_corpus(router_pairs, "router")
    
    # Combined para treino joint
    all_pairs = []
    for fn, _ in [(generate_sex_expert, "sexo"), (generate_hacker_expert, "hacker"), 
                  (generate_code_expert, "codigo"), (generate_general_expert, "geral")]:
        all_pairs.extend(fn(target_per_expert))
    all_pairs.extend(generate_router_data(router_count))
    
    random.shuffle(all_pairs)
    
    combined_path = os.path.join(OUTPUT_DIR, "corpus_moe_combined.txt")
    with open(combined_path, "w", encoding="utf-8") as f:
        f.write("\n\n".join([p[0] for p in all_pairs]))
    print(f"\nCOMBINED: {len(all_pairs):,} exemplos -> {combined_path}")
    
    print("\n" + "=" * 60)
    print("PRONTO PARA TREINO MOE!")
    print("=" * 60)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="BranPy MoE Expert Dataset Generator")
    parser.add_argument("--per-expert", type=int, default=500000, help="Exemplos por expert")
    parser.add_argument("--router", type=int, default=200000, help="Exemplos router")
    args = parser.parse_args()
    
    generate_all(args.per_expert, args.router)