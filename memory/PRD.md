# BRANE Marketplace - PRD

## Problem Statement
Complete marketplace platform called BRANE, Amazon/Shopee style, with buyers, sellers, affiliates, admin (CEO), digital wallet, order system and commissions.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI + MongoDB (Motor async)
- **Auth**: JWT (email/password) + Emergent Google OAuth
- **Storage**: Emergent Object Storage for product images
- **Language**: Portuguese (BR)

## User Personas
1. **Comprador (Buyer)** - Browse products, add to cart, checkout, track orders
2. **Vendedor (Seller)** - Add/manage products, track sales, manage wallet
3. **Afiliado (Affiliate)** - Generate affiliate links, earn commissions (6.5%)
4. **Admin (CEO)** - Full platform management, approve/reject orders/withdrawals

## Core Requirements
- Dark theme with carbon fiber texture, gold accents (#B38B36)
- BRANE branding: half-white/half-gold text with 3D effect
- 3D animated background (CSS floating cubes/orbs)
- Profile avatar with initials/photo upload
- 9 product categories including real estate and automobiles
- Commission system: 9% platform, 6.5% affiliate
- Wallet: available/held balance, Pix/TED withdrawals
- Admin panel with 8 tabs

## What's Been Implemented (Apr 12, 2026)
- Full backend with 30+ API endpoints (auth, products, cart, orders, wallet, admin, notifications, support, pages)
- Home page with hero section, Lojas/Venda Rapida tabs, categories
- Auth: JWT + Google OAuth login/registration
- Product CRUD with image upload via Object Storage
- Shopping cart and checkout
- Order management with commission calculation
- Wallet system with withdrawal requests
- Affiliate link generation and tracking
- Admin panel (Dashboard, Orders, Users, Withdrawals, Commissions, Support, Pages, Financial Settings)
- Profile page with avatar upload, bank details, security info
- Notifications system
- 3D animated background
- Dark theme throughout

## Prioritized Backlog
### P0 (Done)
- Auth, Products, Cart, Orders, Wallet, Admin Panel, Profile

### P1 (Next)
- Product image gallery (multiple images slideshow)
- Order tracking/status updates with timeline
- Seller store pages
- Advanced search with price range filter

### P2 (Future)
- Real payment integration (Stripe/PayPal)
- Chat between buyer/seller
- Product reviews and ratings
- Multi-language support (admin configurable)
- Email notifications (Resend/SendGrid)
- Mobile app optimization

## Admin Credentials
- Email: admin@brane.com
- Password: Admin123!
