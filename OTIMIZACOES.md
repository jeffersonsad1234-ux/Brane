# Otimizações de Performance — Brane / B Livre

> Commit: `06ac2d5` · Branch: `main` · Data: 2026-05-06

---

## 1. Sistema de Imagens (Backend)

### Novo pipeline de upload (`POST /api/upload`)

O endpoint anterior salvava imagens em base64 diretamente no MongoDB, o que tornava os documentos enormes e lentos. O novo pipeline:

| Etapa | O que acontece |
|---|---|
| Recebimento | Arquivo enviado via `multipart/form-data` |
| Validação | Tipo MIME verificado (jpeg, png, webp, gif, bmp) e tamanho máximo de 10 MB |
| Conversão | Imagem convertida para **WebP** com qualidade 82% |
| Thumbnail | Versão **400×400 px** gerada com crop centralizado (para o feed) |
| Full | Versão **1200×1200 px** gerada (para o modal/detalhe) |
| Armazenamento | Arquivos salvos em `/uploads/` no servidor Railway |
| Resposta | `{ imageUrl, thumbnailUrl, filename, mimeType, size, thumbnailSize }` |

> **Compatibilidade legado:** anúncios antigos com base64 ou URLs diretas continuam funcionando. O frontend detecta automaticamente o formato.

### Servir arquivos (`GET /api/files/{filename}`)

- Serve os arquivos com headers `Cache-Control: public, max-age=31536000` (1 ano)
- Navegadores e CDN fazem cache das imagens, reduzindo carga no servidor

---

## 2. Índices MongoDB (criados no startup)

Índices criados automaticamente quando o backend inicia:

| Coleção | Índices |
|---|---|
| `products` | `(status, created_at)`, `seller_id`, `(category, status)`, `(city, status)`, `(product_type, status)`, `(is_deleted, status, created_at)`, texto em `title+description` |
| `users` | `email` (único), `user_id` (único), `role`, `is_blocked` |
| `direct_messages` | `(thread_id, created_at)`, `sender_id`, `recipient_id`, `(recipient_id, read)` |
| `store_messages` | `(store_id, created_at)`, `sender_id` |
| `orders` | `(buyer_id, created_at)`, `(status, created_at)`, `items.seller_id` |
| `reports` | `(status, created_at)`, `reporter_id`, `reported_user_id` |
| `social_posts` | `created_at`, `user_id`, `(is_blocked, created_at)` |
| `social_comments` | `(post_id, created_at)` |
| `notifications` | `(user_id, created_at)` |

---

## 3. Rate Limiting (sem serviço externo)

Implementado em memória no próprio processo FastAPI:

| Endpoint | Limite |
|---|---|
| Upload de imagem | 20 uploads por minuto por IP |
| Login | 10 tentativas por minuto por IP |
| Cadastro | 5 cadastros por 5 minutos por IP |
| Publicação de anúncio | 10 publicações por minuto por IP |
| Envio de mensagem | 30 mensagens por minuto por IP |

> Retorna HTTP 429 com mensagem clara ao atingir o limite.

---

## 4. Sanitização de Inputs

- `sanitize_text(value, max_length)`: remove tags HTML, normaliza espaços, limita tamanho
- `sanitize_price(value)`: garante float positivo, rejeita valores inválidos
- Aplicado em: cadastro, login, publicação de anúncio, atualização de perfil, mensagens

---

## 5. Frontend — Feed Rápido

### Thumbnails no feed

O `Product3DCard` agora usa:
- `thumbnailUrl` (400×400 WebP leve) **no card do feed**
- `imageUrl` (1200×1200 WebP) **no modal de detalhe**
- Fallback automático para campos legados (`image`, `images[]`, `photos[]`)

### Lazy Loading

- Todas as imagens do feed têm `loading="lazy"` e `decoding="async"`
- Imagens do modal carregam apenas quando o modal é aberto

### Skeleton Loading elegante

- **`Product3DCardSkeleton`**: componente que mantém o layout exato do card real, com animação shimmer dourada/escura. Exibido enquanto os produtos carregam no Marketplace.
- **`SkeletonCard`** no B Livre: skeleton com animação shimmer clara, compatível com o tema branco dos cards.
- Animação `brane-skeleton-shimmer` definida globalmente em `product3d.css` e inline no `SocialPage`.

### Fade-in da imagem

- A thumbnail aparece com `opacity: 0 → 1` (transição 300ms) após o `onLoad`, evitando flash de layout.

---

## 6. Compatibilidade de Upload em Todo o Frontend

Todos os pontos de upload foram atualizados para usar o novo formato de resposta (`imageUrl`) com fallback para o formato legado (`path`):

| Arquivo | Correção |
|---|---|
| `SocialPage.js` | `uploadFileToServer` usa `imageUrl` |
| `ProfilePage.js` | `handleUploadAvatar` usa `imageUrl` |
| `AdminPage.js` | Ambos os `handleUpload` usam `imageUrl` |
| `CreateStorePage.js` | Upload de logo/banner usa `imageUrl` |

---

## 7. Como Fazer Deploy

### Backend (Railway)

O Railway faz redeploy automático ao detectar push no branch `main`. Verifique:

1. Acesse o painel do Railway
2. Confirme que o deploy do commit `06ac2d5` foi concluído com sucesso
3. Nos logs, procure por `✅ Índices MongoDB criados com sucesso` para confirmar que os índices foram criados

> **Atenção:** A pasta `/uploads/` é criada automaticamente pelo backend no primeiro upload. No Railway, o filesystem é efêmero (reinicia ao redeploy). Para produção com muitos usuários, migre o storage para **Cloudflare R2** (gratuito até 10 GB/mês) ou **Backblaze B2** — o código já está preparado com a abstração `process_and_store_image`.

### Frontend (Cloudflare Pages)

O Cloudflare Pages faz redeploy automático ao detectar push no branch `main`. Nenhuma ação manual necessária.

---

## 8. Checklist de Testes Recomendados

Após o deploy, teste os seguintes fluxos:

- [ ] Publicar anúncio com 1 imagem no B Livre
- [ ] Publicar anúncio com 5 imagens no B Livre
- [ ] Abrir o feed do B Livre e verificar skeleton loading
- [ ] Abrir um anúncio e verificar zoom da imagem
- [ ] Abrir o feed do Marketplace e verificar skeleton loading
- [ ] Abrir um card do Marketplace e verificar modal com imagem full
- [ ] Enviar mensagem para um anúncio
- [ ] Acessar o Painel ADM e verificar listagem de anúncios/usuários
- [ ] Atualizar foto de perfil no ProfilePage
- [ ] Criar anúncio no AdminPage com imagem

---

## 9. Próximos Passos Recomendados (quando necessário)

| Melhoria | Quando fazer |
|---|---|
| Migrar `/uploads/` para Cloudflare R2 ou Backblaze B2 | Quando o volume de imagens crescer (storage gratuito) |
| Adicionar paginação cursor-based no feed | Quando houver +10k anúncios |
| Implementar CDN para assets estáticos do frontend | Cloudflare Pages já faz isso automaticamente |
| Cache Redis para queries frequentes | Quando o MongoDB Atlas atingir limites do plano gratuito |
