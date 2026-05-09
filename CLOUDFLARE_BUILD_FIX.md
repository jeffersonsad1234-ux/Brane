# 🚨 FIX CLOUDFLARE BUILD CACHE

## Problema Identificado:
Cloudflare Pages está usando build cacheado antigo.

## Solução Aplicada:

1. ✅ Adicionado `.cloudflare-rebuild-trigger` com timestamp único
2. ✅ Adicionado `.nvmrc` para garantir Node 18
3. ✅ Build local testado e funcionando (main.874898c4.js)
4. ✅ Alterações confirmadas no GitHub (commit e532cd6)

## Próximos Passos:

### OPÇÃO 1 - Force Rebuild no Cloudflare Dashboard:
1. Acesse: https://dash.cloudflare.com
2. Vá em: Pages → brane
3. Deployments → último deploy
4. Clique em: "Retry deployment" com "Clear cache"

### OPÇÃO 2 - Trigger via Commit:
1. Faça "Save to Github" agora
2. Cloudflare detectará mudança em `.cloudflare-rebuild-trigger`
3. Fará rebuild completo sem cache

### OPÇÃO 3 - Configurar Build Command:
No Cloudflare Pages, configure:

**Root directory:** `/` (raiz)
**Build command:** `npm run build`
**Build output directory:** `frontend/build`
**Environment variables:**
- `NODE_VERSION`: `18`
- `NPM_FLAGS`: `--legacy-peer-deps`

## Verificação:

Após o deploy, verifique:
```bash
curl https://brane.pages.dev/static/js/main.*.js | grep "bl-new-message-btn"
```

Se retornar "bl-new-message-btn" = ✅ Build novo deployado
Se não retornar nada = ❌ Ainda está com build antigo

---

**Última atualização:** $(date)
**Build local:** main.874898c4.js ✅
**GitHub:** e532cd6 ✅
**Cloudflare:** Aguardando rebuild
