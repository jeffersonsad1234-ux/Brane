# BRANE - PRD (Product Requirements Document)

## Problema Original
Adicionar à plataforma BRANE existente (marketplace, carteira, afiliados, vendedores, ADM já funcionais) uma **camada adicional** com:
- Rede social completa (BRANE Social)
- Sistema de personalização global via ADM
- Ajustes visuais do marketplace (layout)
- Tela de entrada unificada (Social vs Market)
- Sistema de anúncios leve e centralizado

**Restrição crítica**: NÃO recriar ou modificar marketplace, vendas, carteira, afiliados, estrutura financeira, sistema de produtos existentes.

## Arquitetura
- **Backend**: FastAPI + MongoDB (extensão do `/app/backend/server.py` existente)
- **Frontend**: React 19 + Tailwind + CRACO (extensão do app existente)
- **Layouts separados**: `SocialLayout` (rotas `/social/*` e `/entry`) e `MarketLayout` (todas as outras)
- **CSS vars globais** aplicadas via `CustomizationContext` para sincronizar design entre usuários

## Personas
- **Comprador/Buyer**: usa marketplace + social
- **Vendedor/Seller**: gerencia loja + posta no social
- **Afiliado**: promove produtos + posta
- **Admin**: controla tudo, inclusive personalização global

## Core Requirements (implementados)
### BRANE Social
- Feed de posts (fotos/vídeos)
- Curtidas, comentários, compartilhamentos
- Stories (24h expiração)
- Perfil (capa + avatar + bio editáveis)
- Sistema de seguidores/seguindo
- Mensagens privadas (DM) com polling
- Notificações sociais
- Grupos e comunidades (público/privado)

### Personalização Global (Admin)
- Cores: primária, acento, fundo, surface, textos, botões, nomes de usuários, títulos, menu
- Modo: escuro (premium) / claro
- Contraste: baixo / normal / alto
- Layout de perfil: moderno / clássico / minimal
- Aplicação instantânea via CSS variables em `:root`

### Marketplace Visual (Admin)
- Tamanho dos cards: pequeno / médio / grande / personalizado (slider 160-400px)
- Produtos por linha: 2 / 3 / 4
- Aplicado via `.marketplace-grid` CSS

### Entrada Unificada (/entry)
- 2 cards elegantes: BRANE Social / BRANE Market
- Animações, partículas, gradiente premium

### Anúncios Sociais
- CRUD completo no admin (título, body, imagem, link, CTA)
- Aparecem a cada N posts no feed (configurável via slider 3-15)
- Toggle global "anúncios habilitados"
- Tracking de views/clicks

## Implementado (21/Abr/2026)
- ✅ 28 endpoints novos no backend (`/api/social/*`, `/api/customization`, `/api/admin/social/ads`, `/api/admin/customization`)
- ✅ 10 páginas React novas: Entry, SocialFeed, SocialProfile, SocialMessages, SocialGroups (list+detail), SocialNotifications
- ✅ 2 contextos novos: `CustomizationContext` (aplica vars CSS), integrado junto ao `ThemeContext`
- ✅ 1 aba nova no `/admin`: "Global/Social" com 4 sub-abas
- ✅ Link "BRANE Social" adicionado à Navbar do market
- ✅ Separação de layouts: `/social/*` e `/entry` usam social navbar; restante mantém navbar/footer market original
- ✅ Marketplace existente 100% preservado e funcional
- ✅ 45/45 testes pytest passaram (100% backend)
- ✅ Fluxos frontend críticos validados via Playwright

## Backlog / Melhorias Futuras
- **P1**: Modularizar `server.py` em routers separados (>2400 linhas)
- **P2**: Índice MongoDB em `notifications.type` para performance
- **P2**: WebSockets para mensagens em tempo real (atualmente polling 5s)
- **P2**: Upload direto para Cloudinary em vez de base64 no MongoDB
- **P2**: Compartilhamento persistido (tabela `post_shares`)
- **P3**: Reels / stories editáveis com stickers
- **P3**: Hashtags e busca avançada
- **P3**: Algoritmo de feed personalizado (seguir + interesses)

## Credenciais
- Admin: `admin@brane.com` / `Admin123!`
- User teste: `maria@test.com` / `test1234`

## URLs
- Preview: `https://brane-next-gen.preview.emergentagent.com`
- Entrada: `/entry` (escolher Social ou Market)
- Admin: `/admin` → aba "Global/Social"
