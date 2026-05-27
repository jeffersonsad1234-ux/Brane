# BRANPY Chat - Configuração

## 🚀 Chat Restaurado

O chat BRANPY foi configurado com suporte a Groq (rápido e gratuito).

## 📋 Configuração

### 1. Obter API Key

**Groq (Recomendado - Grátis):**
1. Acesse: https://console.groq.com/keys
2. Crie conta gratuita
3. Crie API key
4. Copie a key

### 2. Configurar

**Via Variável de Ambiente (.env.local):**
```bash
REACT_APP_GROQ_API_KEY=your_key_here
AI_PROVIDER=groq
```

**Via Interface (localStorage):**
- Acesse `/affiliate-agent/chat`
- Setup wizard na primeira vez
- Cole sua API key
- Salva no navegador

**Cloudflare Pages (Produção):**
- Dashboard → Settings → Environment Variables
- Nome: `REACT_APP_GROQ_API_KEY`
- Valor: sua key

## ✅ Funcionalidades

- ✅ Groq Provider (llama-3.3-70b-versatile)
- ✅ Loading "BRANPY pensando..."
- ✅ Setup wizard
- ✅ Timeout 30s
- ✅ Error handling
- ✅ Streaming
- ✅ Fallback Ollama local

## 🔒 Segurança

**IMPORTANTE:** NUNCA comite API keys no repositório!

- Use variáveis de ambiente
- .env protegido por .gitignore
- localStorage para usuários
- Setup wizard automático

## 📝 Providers

**Groq:**
- Velocidade: Rápido (~500-800 tokens/s)
- Custo: Gratuito
- Modelo: llama-3.3-70b-versatile

**Ollama (Local):**
- Privacidade: Total
- Custo: Gratuito
- Requer instalação local

## 🐛 Troubleshooting

**Erro: "Configure API key"**
- Adicione `REACT_APP_GROQ_API_KEY` ao .env.local
- Ou configure via setup wizard

**Chat não responde:**
- Verifique console (F12)
- Confirme key válida
- Teste conexão

## 📦 Variáveis

```bash
# .env.local
REACT_APP_GROQ_API_KEY=your_key_here
AI_PROVIDER=groq

# Ollama (opcional)
OLLAMA_BASE_URL=http://127.0.0.1:11434
MODEL_NAME=llama3
```
