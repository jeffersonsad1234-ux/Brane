# ✅ CHECKLIST RÁPIDO - Railway Setup

## Antes de Começar
- [ ] Conta GitHub criada
- [ ] Repositório no GitHub
- [ ] Conta Cloudflare criada

---

## PASSO 1: MongoDB Atlas (15min)
- [ ] Criar conta: https://www.mongodb.com/cloud/atlas/register
- [ ] Criar cluster M0 FREE (São Paulo)
- [ ] Criar usuário: `brane_admin` + senha forte
- [ ] Adicionar IP: 0.0.0.0/0 (permitir tudo)
- [ ] Copiar string de conexão
- [ ] Substituir `<password>` pela senha
- [ ] Adicionar `/brane_marketplace` no final da URL

**String final:**
```
mongodb+srv://brane_admin:SENHA@cluster.xxxxx.mongodb.net/brane_marketplace?retryWrites=true&w=majority
```

---

## PASSO 2: Railway (20min)
- [ ] Criar conta: https://railway.app (login com GitHub)
- [ ] New Project → Deploy from GitHub repo
- [ ] Selecionar seu repositório
- [ ] Settings → Root Directory: `/backend` (se backend em subpasta)
- [ ] Variables → Adicionar:
  - `MONGO_URL` = string do MongoDB Atlas
  - `DB_NAME` = brane_marketplace
  - `JWT_SECRET` = qualquer-string-forte-aqui
  - `PORT` = 8000
  - `PYTHONUNBUFFERED` = 1
- [ ] Aguardar deploy (2-5 min)
- [ ] Settings → Networking → Generate Domain
- [ ] Copiar URL: `https://seu-app.up.railway.app`
- [ ] Testar: `https://seu-app.up.railway.app/health`

---

## PASSO 3: Popular Banco (10min)
- [ ] Editar `/seed_production.py`
- [ ] Alterar `API_URL` para URL do Railway
- [ ] Executar: `python seed_production.py`
- [ ] Verificar: 12 produtos + 1 loja + 4 anúncios criados

---

## PASSO 4: Frontend Cloudflare (10min)
- [ ] Criar arquivo `/frontend/.env.production`:
```bash
REACT_APP_BACKEND_URL=https://seu-app.up.railway.app
WDS_SOCKET_PORT=443
```
- [ ] Commit no GitHub:
```bash
git add .
git commit -m "feat: configuração produção Railway"
git push origin main
```
- [ ] Cloudflare → Pages → Seu projeto
- [ ] Settings → Environment Variables
- [ ] Adicionar: `REACT_APP_BACKEND_URL` = URL do Railway
- [ ] Retry Deployment

---

## PASSO 5: Testar (5min)
- [ ] Site Cloudflare carrega
- [ ] Produtos aparecem na homepage
- [ ] /products mostra 12 produtos
- [ ] /stores mostra 1 loja
- [ ] /desapega mostra 6 produtos
- [ ] Login funciona (admin@brane.com / Admin123!@#)

---

## 🐛 Se algo der errado:

**Backend não inicia no Railway:**
- Ver: Deployments → View Logs
- Verificar MONGO_URL está correto

**Frontend não conecta:**
- Verificar REACT_APP_BACKEND_URL no Cloudflare
- Testar API diretamente: `https://seu-app.up.railway.app/api/products`

**Produtos não aparecem:**
- Executar seed_production.py novamente
- Verificar no MongoDB Compass se dados foram criados

---

## 📞 Links Úteis
- MongoDB Atlas: https://cloud.mongodb.com
- Railway Dashboard: https://railway.app/dashboard
- Cloudflare Pages: https://dash.cloudflare.com/pages

---

## ⏱️ Tempo Total: ~60 minutos
## 💰 Custo: R$ 0 (tudo free tier)

🎉 **Boa sorte!**
