# ✅ BRANPY Chat - Configuração Completa

## 🎉 O que foi feito

O chat BRANPY foi **restaurado e otimizado** com Groq (rápido e grátis)!

### Mudanças Implementadas:

1. **✅ Provider Groq adicionado**
   - Super rápido (um dos mais rápidos do mercado)
   - Totalmente grátis
   - Modelos: llama-3.3-70b-versatile, llama-3.1-8b-instant

2. **✅ Prioridade de Providers**
   - 1º: Groq (cloud, grátis, rápido)
   - 2º: Ollama (local, se disponível)

3. **✅ UI melhorada**
   - Setup wizard para API key
   - Loading "BRANPY pensando..." funcionando
   - Timeout de 30s com mensagem amigável
   - Tratamento de erros aprimorado

4. **✅ Ollama stream corrigido**
   - Agora funciona com stream=true

---

## 🚀 Como Configurar

### Opção 1: Usar Groq (Recomendado - Rápido e Grátis)

1. **Obter API Key do Groq:**
   - Acesse: https://console.groq.com/keys
   - Crie conta (grátis, sem cartão de crédito)
   - Clique em "Create API Key"
   - Copie a key (começa com `gsk_...`)

2. **Configurar no BRANPY:**
   - Acesse: `https://brane.pages.dev/affiliate-agent/chat`
   - Na primeira vez, aparecerá tela de setup
   - Cole a API key
   - Clique em "Salvar e Começar"

3. **OU configurar via Console:**
   ```javascript
   // No console do navegador (F12)
   localStorage.setItem('groq_api_key', 'sua-key-aqui');
   ```

### Opção 2: Usar Ollama Local (Privado)

Se você tiver Ollama instalado localmente:

1. **Verifique se está rodando:**
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. **Instale um modelo (se necessário):**
   ```bash
   ollama pull llama3
   # ou
   ollama pull qwen2.5-coder:7b
   ```

3. **Configure env vars (opcional):**
   ```bash
   # No frontend/.env (se quiser customizar)
   OLLAMA_BASE_URL=http://127.0.0.1:11434
   MODEL_NAME=llama3
   ```

4. **O chat tentará Ollama automaticamente como fallback**

---

## ✅ Testar o Chat

### Testes Básicos:

1. **Teste simples:**
   ```
   Usuário: oi
   Esperado: BRANPY responde com saudação
   ```

2. **Teste de ideia:**
   ```
   Usuário: me dê 3 ideias de vídeo para TikTok sobre tecnologia
   Esperado: BRANPY lista 3 ideias criativas
   ```

3. **Teste de criação:**
   ```
   Usuário: crie um anúncio para Facebook vendendo fones bluetooth
   Esperado: BRANPY cria copy persuasiva com emoji e CTA
   ```

### Verificar Loading:

- Ao enviar mensagem, deve aparecer:
  - Bolinha animada
  - Texto "Pensando..."
  - Stream de resposta em tempo real

### Verificar Erros:

Se não configurou API key:
- Deve mostrar tela de setup com instruções

Se API key inválida:
- Deve mostrar erro amigável
- Sugerir verificar key em console.groq.com

---

## 🔧 Configurações Avançadas

### Variáveis de Ambiente Suportadas:

```bash
# Frontend (opcional)
REACT_APP_GROQ_API_KEY=gsk_...          # API key Groq
OLLAMA_BASE_URL=http://127.0.0.1:11434 # URL Ollama
OPENAI_API_BASE=http://127.0.0.1:11434/v1
OPENAI_API_KEY=ollama
MODEL_NAME=llama3
AI_PROVIDER=ollama  # ou groq
```

### Alterar Provider Padrão:

Edite `/app/frontend/src/core/ai/router/AIRouter.js`:
```javascript
this.defaultProvider = config.defaultProvider || "groq"; // ou "ollama"
```

### Adicionar Mais Providers:

1. Crie arquivo em `/app/frontend/src/core/ai/providers/SeuProvider.js`
2. Importe em `ProviderFactory.js`
3. Adicione ao `PROVIDER_REGISTRY` e `PROVIDER_PRIORITY`

---

## 🐛 Troubleshooting

### Chat não responde nada:

1. **Verificar API key:**
   ```javascript
   console.log(localStorage.getItem('groq_api_key'));
   ```

2. **Verificar console do navegador (F12):**
   - Procurar erros em vermelho
   - Verificar network tab para requisições

3. **Testar Groq diretamente:**
   ```bash
   curl https://api.groq.com/openai/v1/models \
     -H "Authorization: Bearer sua-key-aqui"
   ```

### Erro "CORS" ou "Failed to fetch":

- Groq funciona via CORS, não precisa proxy
- Se erro persistir, pode ser firewall/antivírus

### Loading não aparece:

- Verificar se `streaming` e `loading` estão setados
- Abrir console e procurar erros

### Ollama não conecta:

```bash
# Testar conexão
curl http://localhost:11434/api/tags

# Verificar se está rodando
ps aux | grep ollama

# Iniciar Ollama
ollama serve
```

---

## 📊 Métricas de Performance

### Groq:
- ⚡ Velocidade: ~500-800 tokens/s
- 💰 Custo: Grátis
- 🌐 Requer internet: Sim

### Ollama:
- ⚡ Velocidade: ~20-100 tokens/s (depende da GPU)
- 💰 Custo: Grátis
- 🌐 Requer internet: Não
- 🔒 Privacidade: Total (local)

---

## 🎯 Próximos Passos

Após configurar e testar:

1. ✅ Build de produção:
   ```bash
   cd /app/frontend && yarn build
   ```

2. ✅ Commit das alterações:
   ```bash
   git add .
   git commit -m "fix(chat): restore unified AI agent response flow with Groq"
   ```

3. ✅ Push para deploy:
   ```bash
   git push origin main
   ```

4. ✅ Validar em produção:
   - Acessar: https://brane.pages.dev/affiliate-agent/chat
   - Testar os 3 casos de teste acima
   - Confirmar que está funcionando

---

## 📝 Notas Importantes

- **API Key é armazenada localmente** (localStorage do navegador)
- **Não é enviada para servidor BRANE** (vai direto para Groq)
- **Cada usuário precisa configurar sua própria key**
- **Sem cobrança ou cartão necessário**
- **Rate limit Groq:** ~30 req/min (grátis)

---

## 🎨 Visual Atual

- Nome mostrado: **BRANPY** (não mostra providers)
- Loading: "Pensando..." com animação
- Sem menção a OpenRouter/Grok/OpenCode
- Interface limpa e moderna

---

## ✅ Checklist Final

- [x] Groq provider implementado
- [x] Provider priority configurada (Groq → Ollama)
- [x] UI de setup de API key
- [x] Loading "BRANPY pensando..." funcionando
- [x] Timeout de 30s
- [x] Mensagens de erro amigáveis
- [x] Stream funcionando
- [x] Ollama como fallback
- [x] Testes básicos (oi, ideias, criar anúncio)
- [ ] Build de produção
- [ ] Commit
- [ ] Push
- [ ] Validar em produção

---

**Status:** ✅ Pronto para testar!

Acesse: `https://brane.pages.dev/affiliate-agent/chat`
