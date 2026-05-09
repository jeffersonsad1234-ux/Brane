# 🚀 GUIA COMPLETO: Railway + MongoDB + Cloudflare

## 📋 Visão Geral

Você vai configurar:
1. **MongoDB Atlas** (banco de dados grátis na nuvem)
2. **Railway** (backend FastAPI/Python)
3. **Cloudflare Pages** (frontend React - já tem)
4. **GitHub** (repositório - já tem)

---

## PARTE 1: Criar Banco MongoDB (15 min)

### Passo 1.1 - Criar Conta no MongoDB Atlas

1. Acesse: https://www.mongodb.com/cloud/atlas/register
2. Clique em **"Sign Up"**
3. Registre-se com:
   - Email
   - Senha forte
   - Aceite os termos

### Passo 1.2 - Criar Cluster Gratuito

1. Após login, clique em **"Build a Database"**
2. Escolha: **M0 FREE** (0 GB Storage)
3. Configurações:
   - Provider: **AWS** (recomendado)
   - Region: **São Paulo (sa-east-1)** ou mais próximo
   - Cluster Name: **brane-cluster** (ou qualquer nome)
4. Clique em **"Create"**

### Passo 1.3 - Configurar Segurança

**Criar Usuário do Banco:**
1. Em "Security Quickstart"
2. Username: `brane_admin`
3. Password: **Copie a senha gerada** ou crie uma forte
4. Clique em **"Create User"**

**Adicionar IP de Acesso:**
1. Em "Network Access"
2. Clique em **"Add IP Address"**
3. Clique em **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Confirm

⚠️ **IMPORTANTE:** Guarde o usuário e senha em local seguro!

### Passo 1.4 - Obter String de Conexão

1. Clique em **"Connect"** no cluster
2. Escolha: **"Connect your application"**
3. Driver: **Python**
4. Version: **3.12 or later**
5. Copie a string de conexão:

```
mongodb+srv://brane_admin:<password>@brane-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

6. **Substitua `<password>` pela senha criada**
7. **Adicione o nome do banco no final:**

```
mongodb+srv://brane_admin:SUA_SENHA@brane-cluster.xxxxx.mongodb.net/brane_marketplace?retryWrites=true&w=majority
```

✅ **Salve essa string completa! Vamos usar no Railway.**

---

## PARTE 2: Deploy Backend no Railway (20 min)

### Passo 2.1 - Criar Conta no Railway

1. Acesse: https://railway.app
2. Clique em **"Login"**
3. Escolha: **"Login with GitHub"**
4. Autorize o Railway a acessar seus repositórios

### Passo 2.2 - Criar Novo Projeto

1. No dashboard do Railway, clique em **"New Project"**
2. Escolha: **"Deploy from GitHub repo"**
3. Selecione seu repositório: **seu-usuario/seu-repo**
4. Railway vai detectar automaticamente que é Python

### Passo 2.3 - Configurar Variáveis de Ambiente

1. No projeto Railway, clique na aba **"Variables"**
2. Adicione as seguintes variáveis:

```bash
# Banco de Dados
MONGO_URL=mongodb+srv://brane_admin:SUA_SENHA@brane-cluster.xxxxx.mongodb.net/brane_marketplace?retryWrites=true&w=majority
DB_NAME=brane_marketplace

# Segurança
JWT_SECRET=brane-secret-key-production-2026-secure-token-xyz

# Python
PYTHONUNBUFFERED=1

# Porta (Railway define automaticamente)
PORT=8000
```

⚠️ **Importante:**
- Substitua `SUA_SENHA` pela senha do MongoDB
- Substitua `xxxxx` pelo cluster ID do MongoDB
- Use um JWT_SECRET único e forte

### Passo 2.4 - Configurar Root Directory (se backend está em subpasta)

Se seu backend está em `/backend`:

1. Settings → **Root Directory**
2. Digite: `/backend`
3. Save

### Passo 2.5 - Deploy Automático

1. Railway vai fazer deploy automaticamente
2. Aguarde o build (2-5 minutos)
3. Status: **Active** ✅

### Passo 2.6 - Obter URL Pública

1. Clique em **"Settings"**
2. Seção **"Networking"**
3. Clique em **"Generate Domain"**
4. Railway vai criar: `seu-app.up.railway.app`

✅ **Copie essa URL! É seu REACT_APP_BACKEND_URL**

Exemplo:
```
https://brane-backend.up.railway.app
```

### Passo 2.7 - Testar Backend

Abra no navegador:
```
https://seu-app.up.railway.app/health
```

Deve retornar:
```json
{"status": "ok", "debug": "v1"}
```

✅ Se aparecer isso, backend funcionando!

---

## PARTE 3: Popular Banco de Produção (10 min)

### Passo 3.1 - Instalar MongoDB Compass (Opcional mas Recomendado)

1. Download: https://www.mongodb.com/try/download/compass
2. Instale no seu computador
3. Abra o Compass
4. Cole a string de conexão:
```
mongodb+srv://brane_admin:SUA_SENHA@brane-cluster.xxxxx.mongodb.net/
```
5. Clique em **Connect**

### Passo 3.2 - Criar Dados via API

**Opção A: Via Script Python**

Salve este script como `seed_production.py`:

```python
import requests

# ALTERE AQUI para a URL do Railway
API = "https://seu-app.up.railway.app/api"

# 1. Registrar Admin
print("1. Criando admin...")
register = requests.post(f"{API}/auth/register", json={
    "name": "Admin BRANE",
    "email": "admin@brane.com",
    "password": "Admin123!@#",
    "role": "admin"
})
print(f"Admin: {register.status_code}")

# 2. Login
login = requests.post(f"{API}/auth/login", json={
    "email": "admin@brane.com",
    "password": "Admin123!@#"
})
token = login.json()["token"]
h = {"Authorization": f"Bearer {token}"}

# 3. Criar Produtos
produtos = [
    {
        "title": "Tênis Nike Air Max Preto",
        "description": "Tênis esportivo confortável. Disponível em breve.",
        "price": 299.90,
        "category": "calcados",
        "product_type": "store",
        "city": "São Paulo",
        "images": ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"]
    },
    # ... adicione os outros produtos aqui
]

print(f"\n2. Criando {len(produtos)} produtos...")
for p in produtos:
    r = requests.post(f"{API}/products", json=p, headers=h)
    print(f"{'✅' if r.status_code == 200 else '❌'} {p['title']}")

print("\n✅ CONCLUÍDO!")
```

Execute:
```bash
python seed_production.py
```

**Opção B: Copiar do Banco Local (Mais Rápido)**

Se você tem acesso ao MongoDB local do Emergent:

```bash
# Exportar do banco local
mongodump --db=test_database --out=/tmp/backup

# Importar para produção
mongorestore --uri="mongodb+srv://brane_admin:SENHA@cluster.mongodb.net/" --nsFrom="test_database.*" --nsTo="brane_marketplace.*" /tmp/backup/test_database
```

---

## PARTE 4: Configurar Frontend (10 min)

### Passo 4.1 - Atualizar .env no GitHub

No seu repositório GitHub:

**Arquivo: `/frontend/.env.production`** (criar se não existir)

```bash
REACT_APP_BACKEND_URL=https://seu-app.up.railway.app
```

⚠️ **SEM `/api` no final!** O código já adiciona.

### Passo 4.2 - Commit para GitHub

```bash
cd /app
git add frontend/.env.production
git add backend/
git add frontend/
git commit -m "feat: configuração para produção Railway"
git push origin main
```

### Passo 4.3 - Configurar Cloudflare Pages

1. Acesse: https://dash.cloudflare.com
2. Pages → Selecione seu projeto
3. Settings → **Environment Variables**
4. Adicione:

```
Production:
REACT_APP_BACKEND_URL = https://seu-app.up.railway.app
```

5. **Retry Deployment** para aplicar

---

## PARTE 5: Verificação Final (5 min)

### ✅ Checklist

1. **MongoDB Atlas**
   - [ ] Cluster criado e ativo
   - [ ] Usuário criado
   - [ ] IP liberado (0.0.0.0/0)
   - [ ] String de conexão copiada

2. **Railway**
   - [ ] Backend deployado
   - [ ] Status: Active
   - [ ] URL pública gerada
   - [ ] /health retorna {"status": "ok"}
   - [ ] Variáveis configuradas

3. **Banco Populado**
   - [ ] Admin criado
   - [ ] Produtos criados
   - [ ] Lojas criadas
   - [ ] Anúncios criados

4. **Frontend Cloudflare**
   - [ ] REACT_APP_BACKEND_URL configurada
   - [ ] Build redeployado
   - [ ] Site acessível

5. **Testes**
   - [ ] Site carrega: https://seu-site.pages.dev
   - [ ] Produtos aparecem
   - [ ] Login funciona
   - [ ] API responde

### 🧪 Teste Completo

Abra o navegador e teste:

1. **Homepage:** `https://seu-site.pages.dev/`
   - Deve mostrar produtos

2. **API Direta:** `https://seu-app.up.railway.app/api/products`
   - Deve retornar JSON com produtos

3. **Login:** Tente fazer login no site
   - Email: admin@brane.com
   - Senha: Admin123!@#

---

## 🐛 Troubleshooting

### Erro: CORS no frontend

**Solução:** Adicionar no backend (já deve estar):
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especifique seu domínio
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Erro: MongoDB connection failed

**Verificar:**
1. String de conexão está correta?
2. Senha contém caracteres especiais? Encode com URL encoding
3. IP está liberado no MongoDB Atlas?

### Frontend não conecta ao backend

**Verificar:**
1. REACT_APP_BACKEND_URL está correto no Cloudflare?
2. Railway está rodando? (veja logs)
3. Backend /health está respondendo?

---

## 📊 Arquitetura Final

```
GitHub (código)
   ↓
   ├─→ Railway (backend)
   │     ↓
   │   MongoDB Atlas (banco)
   │
   └─→ Cloudflare Pages (frontend)
         ↓
       Railway API (chamadas)
```

---

## 🎯 Próximos Passos

Depois de tudo configurado:

1. **Domínio Personalizado (Opcional)**
   - Cloudflare: adicionar domínio customizado
   - Railway: adicionar domínio customizado

2. **Monitoramento**
   - Railway: ver logs em tempo real
   - MongoDB: alertas de uso

3. **Backups**
   - MongoDB Atlas: backups automáticos (grátis)

---

## 💡 Dicas Importantes

1. **Nunca commite senhas no GitHub**
   - Use .env
   - Adicione .env ao .gitignore
   - Configure no Railway/Cloudflare

2. **Mantenha Railway ativo**
   - Railway free tier dorme após inatividade
   - Considere Railway Pro ($5/mês) para sempre ativo

3. **Monitore custos**
   - MongoDB Atlas: M0 é grátis para sempre
   - Railway: $5/mês crédito grátis
   - Cloudflare: free tier generoso

---

## 📞 Suporte

Se tiver problemas:

1. **Railway Logs:** Dashboard → Deployments → View Logs
2. **MongoDB:** Atlas → Metrics → Connection Issues
3. **Cloudflare:** Build Logs → Ver erros de build

---

**Tempo total estimado:** 60 minutos  
**Custo:** R$ 0 (tudo no free tier)

🎉 **Boa sorte com o deploy!**
