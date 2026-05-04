# 🚀 CONFIGURAÇÃO DE PRODUÇÃO - EXECUTE AGORA

## ✅ ARQUIVOS PREPARADOS

Todos os arquivos de configuração foram criados:
- ✅ `/app/backend/.env.production` - Template de variáveis
- ✅ `/app/frontend/.env.production` - Template de variáveis
- ✅ `/app/backend/railway.json` - Configuração Railway
- ✅ `/app/backend/railway.toml` - Configuração alternativa
- ✅ `/app/backend/Procfile` - Comando de inicialização
- ✅ `/app/backend/runtime.txt` - Versão Python
- ✅ `/app/seed_production.py` - Script para popular banco
- ✅ `/app/.gitignore` - Arquivos a ignorar no Git

---

## 📋 EXECUTE AGORA - PASSO A PASSO

### PARTE 1: MongoDB Atlas (10 minutos)

#### 1.1 - Criar Conta
Abra: https://www.mongodb.com/cloud/atlas/register
- Registre-se com email
- Confirme o email

#### 1.2 - Criar Cluster FREE
1. Clique em "Build a Database"
2. Escolha: **M0 FREE**
3. Provider: **AWS**
4. Region: **São Paulo (sa-east-1)**
5. Cluster Name: **brane-cluster**
6. Clique em "Create"

#### 1.3 - Criar Usuário do Banco
Na tela "Security Quickstart":
1. Username: `brane_admin`
2. Password: **Clique em "Autogenerate Secure Password"**
3. **COPIE A SENHA E GUARDE**
4. Clique em "Create User"

#### 1.4 - Liberar Acesso IP
1. Em "Where would you like to connect from?"
2. Clique em "Add My Current IP Address"
3. Depois clique em "Add a Different IP Address"
4. Digite: `0.0.0.0/0`
5. Description: "Allow all"
6. Clique em "Add Entry"

#### 1.5 - Obter String de Conexão
1. Clique em "Finish and Close"
2. Clique em "Go to Database"
3. Clique em botão "Connect"
4. Escolha: "Drivers"
5. Driver: Python, Version: 3.11
6. **COPIE a string de conexão:**

```
mongodb+srv://brane_admin:<password>@brane-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

7. **Substitua `<password>` pela senha que copiou**
8. **Adicione `/brane_marketplace` antes do `?`:**

```
mongodb+srv://brane_admin:SUA_SENHA@brane-cluster.xxxxx.mongodb.net/brane_marketplace?retryWrites=true&w=majority
```

✅ **GUARDE ESSA STRING COMPLETA!**

---

### PARTE 2: Railway (15 minutos)

#### 2.1 - Criar Conta
Abra: https://railway.app
- Clique em "Login"
- Escolha "Login with GitHub"
- Autorize o Railway

#### 2.2 - Criar Projeto
1. No dashboard, clique em "New Project"
2. Escolha: "Deploy from GitHub repo"
3. Selecione: **seu repositório do GitHub**
4. Railway vai detectar Python automaticamente

#### 2.3 - Configurar Root Directory
Se seu backend está em `/backend`:
1. Clique no serviço deployado
2. Vá em "Settings"
3. Em "Root Directory", digite: `/backend`
4. Clique em "Save"

#### 2.4 - Adicionar Variáveis de Ambiente
1. Clique na aba "Variables"
2. Clique em "New Variable"
3. Adicione CADA variável abaixo:

```bash
MONGO_URL
mongodb+srv://brane_admin:SUA_SENHA@brane-cluster.xxxxx.mongodb.net/brane_marketplace?retryWrites=true&w=majority

DB_NAME
brane_marketplace

JWT_SECRET
brane-prod-2026-jwt-$(date +%s)-secure

PORT
8000

PYTHONUNBUFFERED
1
```

**⚠️ IMPORTANTE:** Use a string MongoDB completa com SUA senha!

#### 2.5 - Deploy Automático
1. Railway vai fazer deploy automaticamente
2. Aguarde 2-5 minutos
3. Veja os logs em tempo real
4. Status deve ficar: **Active ✅**

#### 2.6 - Gerar Domínio Público
1. Em "Settings"
2. Seção "Networking"
3. Clique em "Generate Domain"
4. Railway cria: `brane-backend-production.up.railway.app`

✅ **COPIE ESSA URL COMPLETA!**

#### 2.7 - Testar Backend
Abra no navegador:
```
https://sua-url.up.railway.app/health
```

Deve retornar:
```json
{"status": "ok", "debug": "v1"}
```

✅ **Se retornar isso, backend está funcionando!**

---

### PARTE 3: Popular Banco (5 minutos)

#### 3.1 - Executar Script de Seed
No terminal do Emergent:

```bash
cd /app
python3 seed_production.py
```

Quando pedir, digite a URL do Railway (sem /api no final):
```
https://sua-url.up.railway.app
```

O script vai criar:
- ✅ Admin (admin@brane.com / Admin123!@#)
- ✅ 6 produtos para lojas
- ✅ 6 produtos para desapega
- ✅ 1 loja aprovada
- ✅ 4 anúncios

---

### PARTE 4: Configurar Cloudflare (10 minutos)

#### 4.1 - Atualizar .env.production do Frontend
Edite o arquivo `/app/frontend/.env.production`:

```bash
REACT_APP_BACKEND_URL=https://sua-url-railway.up.railway.app
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

**⚠️ Use a URL do Railway que você copiou!**

#### 4.2 - Commit para GitHub
```bash
cd /app

# Adicionar novos arquivos
git add backend/.env.production
git add backend/railway.json
git add backend/railway.toml
git add backend/Procfile
git add backend/runtime.txt
git add frontend/.env.production
git add seed_production.py
git add .gitignore

# Commit
git commit -m "feat: configuração de produção Railway + MongoDB Atlas"

# Push para GitHub
git push origin main
```

#### 4.3 - Configurar Variáveis no Cloudflare
1. Acesse: https://dash.cloudflare.com
2. Pages → Selecione seu projeto
3. Settings → Environment Variables
4. Em "Production", adicione:

```
REACT_APP_BACKEND_URL = https://sua-url-railway.up.railway.app
```

5. Clique em "Save"

#### 4.4 - Forçar Novo Deploy
1. Deployments → Clique nos 3 pontos do último deploy
2. Clique em "Retry deployment"
3. Aguarde o build (2-3 minutos)

---

### PARTE 5: Testar Tudo (5 minutos)

#### 5.1 - Testar Site Cloudflare
Abra: `https://seu-site.pages.dev`

Verifique:
- ✅ Homepage carrega
- ✅ Produtos aparecem (devem mostrar os 12 novos)
- ✅ Animações 3D funcionam
- ✅ /stores mostra a loja
- ✅ /desapega mostra 6 produtos

#### 5.2 - Testar Login
1. Clique em "Entrar"
2. Email: `admin@brane.com`
3. Senha: `Admin123!@#`
4. Deve fazer login com sucesso

#### 5.3 - Testar API Direta
Abra: `https://sua-url-railway.up.railway.app/api/products`

Deve retornar JSON com os produtos.

---

## ✅ CHECKLIST FINAL

Marque conforme completa:

- [ ] MongoDB Atlas criado
- [ ] String de conexão copiada
- [ ] Railway projeto criado
- [ ] Variáveis configuradas no Railway
- [ ] Backend deployado (status Active)
- [ ] URL Railway copiada
- [ ] Backend /health responde
- [ ] Seed executado (produtos criados)
- [ ] Frontend .env.production atualizado
- [ ] Commit no GitHub
- [ ] Cloudflare variáveis configuradas
- [ ] Cloudflare redeploy feito
- [ ] Site funcionando
- [ ] Produtos aparecem
- [ ] Login funciona

---

## 🎉 PRONTO!

Após completar todos os passos, você terá:

✅ Backend rodando no Railway
✅ MongoDB Atlas com todos os dados
✅ Frontend no Cloudflare
✅ Zero dependência do preview.emergentagent.com
✅ Infraestrutura 100% própria

---

## 📞 Se Algo Der Errado

### Railway não inicia
- Ver logs: Dashboard → View Logs
- Verificar MONGO_URL está correto
- Verificar ROOT_DIRECTORY está em /backend

### Frontend não conecta
- Verificar REACT_APP_BACKEND_URL no Cloudflare
- Verificar Railway está Active
- Testar API diretamente no navegador

### Banco vazio
- Executar seed_production.py novamente
- Verificar no MongoDB Compass se conecta

---

**TEMPO TOTAL:** ~45 minutos
**CUSTO:** R$ 0 (tudo free tier)

🚀 **Comece agora pela PARTE 1!**
