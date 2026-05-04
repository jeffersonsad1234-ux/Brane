#!/usr/bin/env python3
"""
Script para popular o banco de produção MongoDB via API Railway
Execute: python seed_production.py
"""

import requests
import json
import sys

# ==================== CONFIGURAÇÃO ====================
# ALTERE AQUI para a URL do seu backend no Railway
API_URL = input("Digite a URL do backend Railway (ex: https://seu-app.up.railway.app): ").strip().rstrip('/')
if not API_URL:
    print("❌ URL não fornecida. Saindo...")
    sys.exit(1)

API_URL = f"{API_URL}/api"
# ======================================================

print("🚀 SEED - Populando Banco de Produção")
print(f"API: {API_URL}\n")

# ==================== 1. CRIAR ADMIN ====================
print("1️⃣ Criando usuário admin...")
admin_data = {
    "name": "Admin BRANE",
    "email": "admin@brane.com",
    "password": "Admin123!@#",
    "role": "admin"
}

try:
    register_response = requests.post(f"{API_URL}/auth/register", json=admin_data, timeout=10)
    if register_response.status_code == 200:
        print("   ✅ Admin criado com sucesso!")
    elif register_response.status_code == 400 and "ja cadastrado" in register_response.text.lower():
        print("   ℹ️ Admin já existe, continuando...")
    else:
        print(f"   ⚠️ Status: {register_response.status_code}")
except Exception as e:
    print(f"   ❌ Erro: {e}")
    exit(1)

# ==================== 2. LOGIN ====================
print("\n2️⃣ Fazendo login...")
login_data = {
    "email": "admin@brane.com",
    "password": "Admin123!@#"
}

try:
    login_response = requests.post(f"{API_URL}/auth/login", json=login_data, timeout=10)
    if login_response.status_code == 200:
        token = login_response.json()["token"]
        user_id = login_response.json()["user"]["user_id"]
        print("   ✅ Login bem-sucedido!")
    else:
        print(f"   ❌ Erro no login: {login_response.status_code}")
        print(f"   {login_response.text}")
        exit(1)
except Exception as e:
    print(f"   ❌ Erro: {e}")
    exit(1)

headers = {"Authorization": f"Bearer {token}"}

# ==================== 3. PRODUTOS PARA LOJAS ====================
print("\n3️⃣ Criando produtos para LOJAS...")
loja_produtos = [
    {
        "title": "Tênis Nike Air Max Preto",
        "description": "Tênis esportivo confortável, ideal para corrida. Disponível em breve.",
        "price": 299.90,
        "category": "calcados",
        "product_type": "store",
        "city": "São Paulo",
        "images": ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"]
    },
    {
        "title": "Camisa Polo Básica",
        "description": "Camisa polo 100% algodão, várias cores. Disponível em breve.",
        "price": 89.90,
        "category": "roupas",
        "product_type": "store",
        "city": "Rio de Janeiro",
        "images": ["https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800"]
    },
    {
        "title": "Mochila Executiva Preta",
        "description": "Mochila para notebook até 15.6 polegadas. Disponível em breve.",
        "price": 149.90,
        "category": "acessorios",
        "product_type": "store",
        "city": "Curitiba",
        "images": ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800"]
    },
    {
        "title": "Relógio Digital Esportivo",
        "description": "Relógio à prova d'água, cronômetro, alarme. Disponível em breve.",
        "price": 129.00,
        "category": "acessorios",
        "product_type": "store",
        "city": "Brasília",
        "images": ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"]
    },
    {
        "title": "Fone de Ouvido Bluetooth",
        "description": "Fone sem fio, bateria de 20h, cancelamento de ruído. Disponível em breve.",
        "price": 179.90,
        "category": "eletronicos",
        "product_type": "store",
        "city": "Belo Horizonte",
        "images": ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"]
    },
    {
        "title": "Caderno Universitário 10 Matérias",
        "description": "Caderno espiral, capa dura, 200 folhas. Disponível em breve.",
        "price": 29.90,
        "category": "papelaria",
        "product_type": "store",
        "city": "Porto Alegre",
        "images": ["https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800"]
    }
]

for produto in loja_produtos:
    try:
        response = requests.post(f"{API_URL}/products", json=produto, headers=headers, timeout=10)
        if response.status_code == 200:
            print(f"   ✅ {produto['title']}")
        else:
            print(f"   ⚠️ {produto['title']} - Status: {response.status_code}")
    except Exception as e:
        print(f"   ❌ {produto['title']} - Erro: {e}")

# ==================== 4. PRODUTOS PARA DESAPEGA ====================
print("\n4️⃣ Criando produtos para DESAPEGA...")
desapega_produtos = [
    {
        "title": "Tênis Adidas Stan Smith Usado",
        "description": "Tênis branco clássico, estado bom, pouco uso. Disponível em breve.",
        "price": 99.90,
        "category": "calcados",
        "product_type": "secondhand",
        "condition": "good",
        "city": "São Paulo",
        "images": ["https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800"]
    },
    {
        "title": "Livro Harry Potter Coleção Completa",
        "description": "7 livros em ótimo estado, capas originais. Disponível em breve.",
        "price": 149.00,
        "category": "livros",
        "product_type": "secondhand",
        "condition": "like_new",
        "city": "Rio de Janeiro",
        "images": ["https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=800"]
    },
    {
        "title": "Jaqueta Jeans Vintage",
        "description": "Jaqueta jeans anos 90, tamanho M, conservada. Disponível em breve.",
        "price": 79.90,
        "category": "roupas",
        "product_type": "secondhand",
        "condition": "good",
        "city": "Curitiba",
        "images": ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800"]
    },
    {
        "title": "Console PlayStation 3 + 5 Jogos",
        "description": "PS3 funcionando perfeitamente, com controle e jogos. Disponível em breve.",
        "price": 499.00,
        "category": "eletronicos",
        "product_type": "secondhand",
        "condition": "good",
        "city": "Brasília",
        "images": ["https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=800"]
    },
    {
        "title": "Bicicleta Caloi Mountain Bike",
        "description": "Bike aro 26, 21 marchas, pneus novos. Disponível em breve.",
        "price": 399.00,
        "category": "esportes",
        "product_type": "secondhand",
        "condition": "good",
        "city": "Belo Horizonte",
        "images": ["https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800"]
    },
    {
        "title": "Violão Yamaha Acústico",
        "description": "Violão em ótimo estado, com capa e afinador. Disponível em breve.",
        "price": 299.00,
        "category": "instrumentos",
        "product_type": "secondhand",
        "condition": "like_new",
        "city": "Porto Alegre",
        "images": ["https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?w=800"]
    }
]

for produto in desapega_produtos:
    try:
        response = requests.post(f"{API_URL}/products", json=produto, headers=headers, timeout=10)
        if response.status_code == 200:
            print(f"   ✅ {produto['title']} (Comissão 0%)")
        else:
            print(f"   ⚠️ {produto['title']} - Status: {response.status_code}")
    except Exception as e:
        print(f"   ❌ {produto['title']} - Erro: {e}")

# ==================== 5. CRIAR LOJA ====================
print("\n5️⃣ Criando loja de teste...")
store_data = {
    "name": "Tech Store Premium",
    "description": "Loja especializada em produtos de tecnologia e eletrônicos",
    "logo": "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400",
    "banner": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=400&fit=crop",
    "category": "Eletrônicos",
    "business_hours": "Seg-Sex: 9h-18h, Sáb: 9h-13h"
}

try:
    response = requests.post(f"{API_URL}/stores", json=store_data, headers=headers, timeout=10)
    if response.status_code == 200:
        store_id = response.json()["store_id"]
        print(f"   ✅ Loja criada: {store_id}")
        
        # Aprovar loja
        print("   📝 Aprovando loja...")
        approve_response = requests.put(f"{API_URL}/admin/stores/{store_id}/approve", headers=headers, timeout=10)
        if approve_response.status_code == 200:
            print("   ✅ Loja aprovada!")
        else:
            print(f"   ⚠️ Erro ao aprovar: {approve_response.status_code}")
    else:
        print(f"   ⚠️ Status: {response.status_code}")
        print(f"   {response.text[:200]}")
except Exception as e:
    print(f"   ❌ Erro: {e}")

# ==================== 6. CRIAR ANÚNCIOS ====================
print("\n6️⃣ Criando anúncios...")
ads = [
    {
        "title": "🔥 Super Oferta de Tecnologia - Até 50% OFF!",
        "image": "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200",
        "link": "/products?sort=offers",
        "position": "top"
    },
    {
        "title": "✨ Novidades em Eletrônicos - Lançamentos 2026",
        "image": "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200",
        "link": "/products?category=eletronicos",
        "position": "between_products"
    },
    {
        "title": "🚚 Frete Grátis em Compras Acima de R$ 299!",
        "image": "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1200",
        "link": "/products",
        "position": "between_products"
    },
    {
        "title": "🎁 Descontos Especiais para Você!",
        "image": "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400",
        "link": "/products?sort=new",
        "position": "sidebar"
    }
]

for ad in ads:
    try:
        response = requests.post(f"{API_URL}/ads", json=ad, headers=headers, timeout=10)
        if response.status_code == 200:
            print(f"   ✅ {ad['title'][:40]}...")
        else:
            print(f"   ⚠️ {ad['title'][:40]}... - Status: {response.status_code}")
    except Exception as e:
        print(f"   ❌ {ad['title'][:40]}... - Erro: {e}")

# ==================== RESUMO ====================
print("\n" + "="*60)
print("✅ SEED CONCLUÍDO!")
print("="*60)
print("\n📊 Resumo:")
print(f"   • Produtos Lojas: {len(loja_produtos)}")
print(f"   • Produtos Desapega: {len(desapega_produtos)} (comissão 0%)")
print(f"   • Lojas: 1 (aprovada)")
print(f"   • Anúncios: {len(ads)}")
print("\n🔑 Credenciais Admin:")
print("   Email: admin@brane.com")
print("   Senha: Admin123!@#")
print("\n🌐 Teste no navegador:")
print(f"   {API_URL.replace('/api', '')}/")
print(f"   {API_URL}/products")
print(f"   {API_URL}/stores")
print("\n🎉 Pronto para usar!")
