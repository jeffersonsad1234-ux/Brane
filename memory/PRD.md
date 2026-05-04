# BRANE Marketplace - PRD

## Visão Geral
Marketplace brasileiro full-stack (React + FastAPI + MongoDB) com produtos novos (Lojas), produtos únicos e seção de itens usados (Desapega).

## Infraestrutura de Produção
- **Backend**: Railway → https://brane-production-3c87.up.railway.app
- **Frontend**: Cloudflare Pages
- **Database**: MongoDB Atlas (cluster0.f2m0c4y.mongodb.net / brane_db)
- **Repo**: GitHub (origem do deploy Railway/Cloudflare)

## Funcionalidades Implementadas (Feb 2026)
- Cards de produto com animação 3D (`Product3DCard.js`, `product3d.css`)
- Seção "Lojas" estilo Instagram (`StoreCard.js`, `StoresPage.js`)
- Seção "Desapega" com 0% de comissão da plataforma
- Cadastro de loja (com horário de funcionamento)
- Chat por loja (`/api/stores/{store_id}/messages`)
- Código de rastreio em pedidos (`/api/orders/{order_id}/tracking`)
- Anúncios admin nas posições top, sidebar, between_products, bottom
- Admin role correto no registro

## Funcionalidades Implementadas (Apr 2026)
- **Newsletter** completa: footer com captura + admin (lista, busca, exporta CSV, copia emails, exclui)
- **Resend Email Campaigns**: admin envia campanhas para todos inscritos com preview HTML, histórico (RESEND_API_KEY no backend/Railway)
- **Footer Config dinâmico**: admin cadastra Instagram/Facebook/Twitter/Outro, ativa/desativa cada um. Frontend lê de `/api/footer-config`.
- **Links públicos & compartilhar**: produtos e lojas têm botões "Copiar link" e "Compartilhar" (Web Share API + fallback)
- **Chat dentro da plataforma**: rota `/stores/:slug/chat` (StoreChatPage) e `/chat/:userId` (DirectChatPage para Desapega/seller). Endpoints aceitam slug ou store_id.
- **Admin Chat Moderation**: GET `/api/admin/chats/store-messages` e `/api/admin/chats/direct-messages`
- **Perfil Comprador**: carteira/saldo/saque ocultos para role buyer no Profile, Wallet e Navbar dropdown

## Status Produção (atualizado 2026-04-25)
| Item | Status |
|------|--------|
| Backend Railway → MongoDB Atlas | OK |
| Atlas Network Access | Liberado |
| DB Seed | OK (12 produtos, 1 loja, 4 ads) |
| Frontend Cloudflare | Aguarda confirmação do usuário (REACT_APP_BACKEND_URL) |
| Mobile responsivo (2 cols) | OK (commit 07c8463 local) |
| Admin Personalização aplica nos produtos | OK (commit 07c8463 local) |

### Dados em produção
- 6 produtos Loja + 6 produtos Desapega (12 total)
- 1 loja aprovada (Tech Store Premium)
- 4 anúncios ativos (top, sidebar, 2x between_products)
- 1 admin (admin@brane.com)

## Backlog (P1/P2)
- **P1** Verificar `REACT_APP_BACKEND_URL` no Cloudflare e fazer redeploy
- **P1** Bug: criar loja com admin troca role para `seller` (reset manual no DB necessário)
- **P1** Implementar Favoritos (backend novo `/api/favorites` GET/POST/DELETE + hook frontend + filtro `?favorites=1` em ProductsPage). Adiado por orçamento.
- **P2** Refatorar `backend/server.py` (3000+ linhas) em `routes/` e `models/`
- **P2** Criar testes em `/app/backend/tests` (regressão)
- **P2** Página de gestão de tracking_code para vendedores
- **P2** Endpoint para admin enviar notificação manual a usuários (broadcast/individual)

## Histórico recente (Feb 2026)
- **25/02** Removida feature `Store Experience` (loja 3D) — arquivo `StoreExperiencePage.js`, import e rota `/store-experience` em `App.js` deletados.
- **25/02** Permissão Anunciar Produto restrita a `seller`/`admin`:
  - Frontend: `ProtectedRoute` ganhou prop `sellerOnly`. Rotas `/add-product`, `/add-product/store`, `/add-product/desapega` agora redirecionam buyer/affiliate para `/dashboard`.
  - Frontend: Navbar esconde botão "Anunciar produto" e item "Adicionar Produto" do dropdown para não-sellers.
  - Backend: já protegia via `require_seller` (sem mudança).
- **25/02** Notificações — sino corrigido:
  - Bug: Navbar lia `(r.data || []).filter(...)` mas backend retorna `{notifications, unread}`. Badge ficava sempre em 0.
  - Fix: agora lê `r.data?.unread || 0` corretamente.
  - Adicionado polling de 45s para o sino atualizar sem refresh.

## Arquitetura
- `/app/backend/server.py` - FastAPI monolítico
- `/app/frontend/src/pages/` - HomePage, StoresPage, AdminPage, CreateStorePage
- `/app/frontend/src/components/` - Product3DCard, StoreCard, AdSlot
- `/app/seed_production.py` - Script de seed via API Railway
