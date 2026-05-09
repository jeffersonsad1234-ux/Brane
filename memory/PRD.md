# BRANE / B Livre — PRD (Final Bug Fixes Pré-Lançamento)

## Visão Geral
Marketplace brasileiro full-stack (React + FastAPI + MongoDB). A B Livre é a área social da plataforma (`/blivre`), com IA, anúncios, mensagens, favoritos e ADM próprio. O Marketplace é separado e NÃO foi alterado.

## Última Iteração — Bug Fixes Finais (May 2026)

### 1. Favoritos B Livre — CORRIGIDO
- **Bug raiz**: `<button>` aninhado dentro de `<button>` no card de produto da B Livre causava hydration error e o clique no coração era capturado pelo botão pai (abrindo o produto em vez de favoritar).
- **Fix**: Card externo virou `<div role="button">` com `onClick`/`onKeyDown` mantendo acessibilidade. Botão coração interno agora isolado com `data-testid="blivre-favorite-{id}"`.
- **Backend**: Endpoints adicionados (não existiam):
  - `GET /api/social/favorites` — lista favoritos do usuário (collection `social_favorites`).
  - `POST /api/social/favorites/{post_id}` — toggle favorito.

### 2. Notificações B Livre — CORRIGIDO
- **Bug raiz**: clique em notificação (mensagem/suporte/anúncio) navegava para rotas do **Marketplace** (`/chat/{id}`, `/stores/{slug}/chat`, `/notifications`).
- **Fix**: `handleClick` em `SocialPage.js` agora trata cada tipo internamente:
  - `direct_chat` / `store_chat` / `message` → abre `selectedChat` interno via `openChat`, com `activeFilter="messages"`.
  - `support` / `support_reply` → abre `showSupportModal` da B Livre.
  - `report_response` → toast com a resposta da denúncia.
  - Anúncio relacionado → `openPost` (abre o post da B Livre).
  - Marca a notificação como lida no estado local após click.

### 3. PWA / Instalar App — CORRIGIDO
- **Bug raiz**: modal de instrução do PWA tinha `z-[300]` e ficava atrás de cards/conteúdo.
- **Fix**: `z-index: 2147483600` (max int seguro) inline + Tailwind. Backdrop mais opaco (`bg-black/85`), `aria-modal="true"`. Captura `beforeinstallprompt` continua existindo → quando disponível, o clique aciona o **prompt nativo** do navegador. Quando não disponível (iOS Safari/desktop sem evento), abre o modal manual com instruções por plataforma.

### 4. Mensagens B Livre — CORRIGIDO
- **Backend**: Endpoints adicionados:
  - `GET /api/social/messages` — lista de conversas/mensagens do usuário.
  - `POST /api/social/messages` — envia mensagem da B Livre, cria notificação `direct_chat` para o destinatário.
- **Frontend**: lista, abre conversa, permite responder, persiste via `db.messages`.

### 5. Stats B Livre — CORRIGIDO
- `GET /api/social/stats` adicionado (visualizações, interesses, meus anúncios).

### 6. ADM B Livre — Denúncias e Suporte
- **Já existiam** endpoints completos no backend:
  - `PUT /api/admin/reports/{id}/resolve|ignore|block_ad|block_user`
  - `POST /api/admin/reports/{id}/respond` (envia email + notificação ao denunciante).
  - `POST /api/admin/support/{id}/reply`.
- **Frontend ADM** (`Reports.jsx`, `Support.jsx`) já implementado com drawer de detalhes, histórico de respostas, botão "Resolver / Ignorar / Bloquear / Enviar resposta".

## Mobile "Anunciar produto"
- Validado em mobile (390px): clique no FAB `+` da B Livre abre composer corretamente; clique em "Anunciar produto" do navbar do marketplace navega para `/add-product` e abre as 3 opções (Feed/Desapega/Loja). **Sem erros.**

## Escopo respeitado
NÃO alterado:
- Marketplace (HomePage, ProductsPage, OrdersPage, CartPage, WalletPage, ProfilePage, NotificationsPage, CheckoutPage)
- Layout aprovado da B Livre
- IA (AIAssistantPanelSocial, ProductFormWithAI, BraneAIAvatar)
- Otimizações de performance mobile (gold-button simplificado mobile, skeleton, etc.)
- Dourado premium 3D
- ADM visual

## Test Credentials
- **Admin BRANE**: `admin@brane.com` / `Admin123!@#`
- **Admin B-Livre alt**: `admin@branelivre.com` / `123456`
- Local DB: `mongodb://localhost:27017` / `test_database`

## Backlog (P1/P2)
- **P2** Refatorar `backend/server.py` (5000+ linhas) em módulos
- **P2** Carregar histórico completo da conversa ao abrir chat (atualmente mostra última mensagem + permite responder)
- **P2** Página de gestão de tracking_code para vendedores

## Arquitetura
- `/app/backend/server.py` - FastAPI monolítico (5000+ linhas)
- `/app/frontend/src/pages/SocialPage.js` - B Livre (2870+ linhas)
- `/app/frontend/src/blivre-admin/` - Painel ADM exclusivo da B Livre
- `/app/frontend/src/components/PWAInstallButton.jsx` - PWA install com prompt nativo + fallback manual
