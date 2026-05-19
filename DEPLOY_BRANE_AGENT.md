# Deploy do Brane Agent

## Arquitetura

```
Frontend (React)                    Backend (Node.js/Express)
https://branded.page.br/agente  →  https://api.branded.page.br
         │                                  │
    build/static/                     agent-server/server.js
    enviado p/ servidor               Railway (Nixpacks)
    (Cloudflare Pages,                SQLite efêmero
     VPS, ou o que           (veja "⚠️ Persistência" abaixo)
     serve o domínio)
```

---

## Passo 1 — Deploy do backend no Railway

```bash
# 1. Instalar Railway CLI (se não tiver)
npm install -g @railway/cli

# 2. Entrar na pasta do servidor
cd agent-server

# 3. Login (abre navegador)
railway login

# 4. Iniciar projeto no Railway
railway init

# 5. Fazer deploy
railway up
```

**Na primeira vez**, o Railway pergunta:
- "Create new project?" → sim
- "Select project" → escolha ou crie um novo

Após deploy, o Railway exibe uma URL como:
```
https://brane-agent-production-xxxx.up.railway.app
```

---

## Passo 2 — Variáveis de ambiente no Railway

No Dashboard do Railway (ou via CLI):

```bash
railway variables

# Adicionar:
# OPENAI_API_KEY=sk-sua-chave-real-aqui
# AGENT_PASSWORD=sua-senha-segura
# PROJECT_ROOT=/app
# PORT=3200
```

Ou via Dashboard → projeto → Variables → adicionar:

| Variable | Value |
|---|---|
| `OPENAI_API_KEY` | `sk-...` (sua chave real) |
| `AGENT_PASSWORD` | `brane@admin2024` (ou outra) |
| `PROJECT_ROOT` | `/app` |
| `PORT` | `3200` |

---

## Passo 3 — DNS: api.branded.page.br → Railway

No seu provedor de DNS (Cloudflare, Registrar, etc.):

```
Tipo:   CNAME
Nome:   api
Valor:  brane-agent-production-xxxx.up.railway.app
```

Se usar Cloudflare:
- Desative o proxy (laranja → cinza) ou ative se quiser SSL gerenciado
- SSL/TLS → Full (strict)

Aguarde propagação (1–10 min).

---

## Passo 4 — Build do frontend com API de produção

```bash
cd frontend

# Windows PowerShell:
$env:REACT_APP_AGENT_API="https://api.branded.page.br"
npm run build

# Linux/Mac:
# REACT_APP_AGENT_API=https://api.branded.page.br npm run build
```

Isso gera `frontend/build/` com o React compilado apontando para a API real.

---

## Passo 5 — Publicar build/ no servidor

Depende de como `branded.page.br` é servido:

**Cloudflare Pages:**
```bash
npx wrangler pages deploy build --project-name=branded-page --branch=main
```

**VPS (Nginx):**
```bash
rsync -avz frontend/build/ user@vps:/var/www/branded.page.br/agente/
```

Ou se o build já estiver no repo e o servidor puxar de lá:
```bash
git push origin main
# servidor faz git pull automaticamente
```

---

## Passo 6 — Testar

```bash
# Health check (público, sem auth)
curl https://api.branded.page.br/health
# → {"ok":true,"uptime":123}

# Status (com auth)
curl -H "x-agent-password: sua-senha" https://api.branded.page.br/api/status
# → {"gitLog":"abc123...","gitStatus":"","projects":[...],...}

# Chat
curl -X POST https://api.branded.page.br/api/chat \
  -H "Content-Type: application/json" \
  -H "x-agent-password: sua-senha" \
  -d '{"messages":[{"role":"user","content":"Hello"}],"rules":""}'
# → {"content":"Olá! ..."}
```

Depois abrir no navegador:
```
https://branded.page.br/agente
```

---

## ⚠️ Persistência

O SQLite (`agent.db`) fica no disco do Railway, que é **efêmero** — dados somem se o serviço reiniciar.

Para dados persistentes:
1. **Railway Volumes** (beta): montar volume persistente no caminho `/app/agent-server`
2. Ou migrar para PostgreSQL (exige reescrita do `server.js`)

Para uso inicial sem persistência, o banco recria automaticamente com os 3 projetos padrão.

---

## ⚠️ Git + Push no Railway

O `git push` do `server.js` roda localmente e depende do repositório Git estar clonado. No Railway não há Git configurado por padrão. Para usar commit/push do Brane Agent em produção, configure:

```bash
railway variables set GIT_USER_NAME=seu-nome
railway variables set GIT_USER_EMAIL=seu-email
```

E no Railway Dashboard adicione uma chave SSH ou token para push.

---

## Resumo de arquivos alterados/deploy

| Arquivo | Função |
|---|---|
| `agent-server/railway.json` | Config Railway (JSON) |
| `agent-server/railway.toml` | Config Railway (TOML) |
| `agent-server/package.json` | Script `start` → `node server.js` |
| `agent-server/server.js` | CORS, `0.0.0.0`, `/health` |
| `agent-server/env.example.txt` | Template .env |
| `frontend/.env.agent.example` | Exemplo REACT_APP_AGENT_API |
| `frontend/src/App.js` | Rota `/agente` |
