# Brane / B Livre — PRD

## Problema atual (Jan 2026)
Favicon antigo permanecia em cache no navegador na rota `/blivre`. Solução definitiva: um único arquivo de ícone com cache-bust `?v=2`.

## Implementado nesta sessão
- Criado `frontend/public/brane-favicon-final-v2.png` (cópia da logo oficial `logo-belivre.png`, cubo dourado).
- `frontend/public/index.html`: removidas TODAS as referências a `favicon.ico`, `favicon.png`, `favicon-192x192`, `favicon-512x512`, `apple-touch-icon.png`, `brane-favicon-oficial-real.png`. Apenas 3 tags de ícone (`icon`, `shortcut icon`, `apple-touch-icon`) + `og:image`/`twitter:image` apontam para `/brane-favicon-final-v2.png?v=2`.
- `frontend/public/manifest.json` e `frontend/public/blivre-manifest.json`: usam apenas `/brane-favicon-final-v2.png?v=2`.
- `frontend/src/services/blivreEnv.js`: `FAVICON` e `LOGO` default → `/brane-favicon-final-v2.png?v=2`.
- `frontend/src/services/blivreSEO.js`: `setLink("icon", ...)` agora REMOVE todas as `<link rel~="icon">` antigas antes de injetar a nova → impede cache de favicon de rotas anteriores ao acessar `/blivre`.
- Arquivos removidos: `favicon.ico`, `favicon.png`, `favicon-192x192.png`, `favicon-512x512.png`, `apple-touch-icon.png`, `bane-favicon-oficial-real.png`, `brane-favicon-oficial-real.png`, `brane-real-icon-v1.png`, `blivre-assets/favicon.svg`.

## Build verificado
`yarn build` finalizado com sucesso. HTML final contém exatamente:
```
<link rel="icon" href="/brane-favicon-final-v2.png?v=2"/>
<link rel="shortcut icon" href="/brane-favicon-final-v2.png?v=2"/>
<link rel="apple-touch-icon" href="/brane-favicon-final-v2.png?v=2"/>
<link rel="manifest" href="/manifest.json"/>
```
Sem referências a `favicon.ico`, `favicon-192`, `favicon-512` ou `BL`.

## Next Action Items
- Push para origin (`https://github.com/jeffersonsad1234-ux/Brane.git`) via botão "Save to Github" da Emergent.
- Após deploy, abrir `/blivre` em aba anônima ou forçar `Ctrl+Shift+R` para validar (o `?v=2` quebra cache de quem já visitou).
