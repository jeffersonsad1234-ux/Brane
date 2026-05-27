# 🚀 Como Fazer Push para Produção

## ⚠️ Autenticação Necessária

O Git está configurado mas precisa de autenticação para push.

## Opção 1: Push via Emergent UI (RECOMENDADO)

1. Use o botão **"Save to GitHub"** no Emergent
2. Isso fará push automaticamente com autenticação

## Opção 2: Push Manual (se tiver acesso ao terminal)

```bash
cd /app

# Configurar credenciais
git config user.name "Seu Nome"
git config user.email "seu@email.com"

# Push
git push origin main
```

## Opção 3: Via GitHub CLI

```bash
gh auth login
git push origin main
```

## 📦 Commits Prontos Para Push

```
fba8dfd - Auto-generated changes
d4681f8 - fix(tools): expose Image Generator and Voice Studio in production UI
b62e5a9 - feat(brandpy): implement Voice Studio with edge-tts
da59122 - feat(brandpy): implement Image Generator with HuggingFace API
```

## ✅ Após Push

1. Aguardar Cloudflare Pages build (~2-5 min)
2. Validar em: https://brane.pages.dev/affiliate-agent
3. Verificar Image Generator e Voice Studio funcionando

## 🔧 Status

- ✅ Remote origin configurado
- ✅ Commits prontos
- ⏳ Aguardando push com autenticação
