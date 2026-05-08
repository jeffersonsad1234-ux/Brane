# PRD — B-Livre · Painel ADM

## Problema original
A B-Livre é um sistema de **classificados gratuitos** (não é marketplace).
- Usuários anunciam grátis, compradores enviam mensagem ao anunciante, conversam pelo chat.
- Não existe carrinho, pedido, checkout, comissão ou venda.
- O ADM acompanha usuários, anúncios, mensagens, denúncias e suporte.

O painel ADM da B-Livre precisava ser **separado** do painel da Marketplace, sem dados de pedidos/comissão/vendas/saques. Métricas de marketplace foram removidas; somente B-Livre.

## Arquitetura
- Backend: FastAPI + Motor + MongoDB. JWT auth com role admin (bcrypt + PyJWT).
- Frontend: React 19 + react-router-dom + recharts + lucide-react + Tailwind.
- ADM URL: `/admin/blivre/login` e `/admin/blivre`.
- Polling 12s (notificações) + 15s (stats) + heartbeat 60s (online).
- PDF: ReportLab.

## Personas
- **ADM B-Livre**: gestor de moderação, suporte, denúncias.
- **Usuários da B-Livre**: anunciantes e interessados.

## Requisitos centrais (estáticos)
- Sem mock/fake/demo data. Tudo real do MongoDB.
- B-Livre ≠ Marketplace. Painéis separados.
- Métricas: usuários, anúncios, mensagens, denúncias, suporte, online (5min), views, interesses.

## Implementado nesta sessão (2026-05-08)
- ✅ Backend FastAPI com modelos: User, Listing, Message, Report, SupportTicket, ListingView, ListingInterest.
- ✅ Auth admin (JWT + bcrypt + seed admin).
- ✅ Endpoints públicos para fluxo de dados real (registro, login, criação de anúncio, mensagem, denúncia, suporte, view, interesse, heartbeat).
- ✅ Endpoints `/api/admin/blivre/*` protegidos por role admin: stats, notifications, users (CRUD), listings (delete), messages, reports (status), support (reply + status), export PDF.
- ✅ Frontend `/admin/blivre`: login, dashboard com 8 KPIs reais, gráfico de área 7 dias, donut de categorias, barras de mensagens, listas recentes (anúncios, mensagens, denúncias, suporte).
- ✅ Páginas: Usuários (busca, filtro, suspender/bloquear/remover/reativar), Anúncios (busca, filtro, remover), Mensagens (busca), Denúncias (filtro por aba, status), Suporte (drawer com replies, status, responder).
- ✅ Polling 12s no sidebar para badges de denúncias e suporte; sininho com contador de novidades em 5min.
- ✅ Exportar relatório PDF real via ReportLab (KPIs + tabelas).
- ✅ Heartbeat para definir "online" = `last_seen` nos últimos 5 minutos.
- ✅ Seed real `/app/scripts/seed_real_data.py` (idempotente) populando 8 users, 12 anúncios, mensagens, views, interesses, denúncias, suporte através de chamadas reais à API.
- ✅ Visual moderno escuro premium: paleta esmeralda, fonte Outfit, glass header, grid background, KPI cards com hover spotlight, tabelas premium.

## Tested
- Backend: 25/25 pytest cases (testing agent iteração 1).
- Frontend: 100% nos fluxos críticos (login, KPIs, navegação, suspender, denúncias, suporte com reply, PDF, logout, guard).

## Backlog / Próximos passos
- P1: Construir frontend público da B-Livre (registro, criação de anúncios, chat) — só backend está pronto.
- P1: Construir painel `/admin/marketplace` separado quando o módulo Marketplace for desenvolvido.
- P2: Brute force lockout em /api/auth/login (5 falhas / 15 min).
- P2: Restringir `CORS_ORIGINS` ao domínio específico.
- P2: Refatorar server.py em routers separados (auth.py, public.py, admin.py).
- P3: Notificações em tempo real via WebSocket no lugar de polling.
- P3: Filtros de período (hoje/7d/30d/custom) no dashboard.

## Credenciais
Ver `/app/memory/test_credentials.md`.

## Como rodar localmente
- Backend: já gerenciado por supervisor (porta 8001).
- Frontend: já gerenciado por supervisor (porta 3000).
- Repopular dados: `python3 /app/scripts/seed_real_data.py`.
