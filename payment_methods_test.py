#!/usr/bin/env python3
"""
Additional tests for TED and PayPal payment methods
"""

import requests
import json
import uuid
from datetime import datetime

BASE_URL = "https://product-upload-issue.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@brane.com"
ADMIN_PASSWORD = "Admin123!"

def test_payment_methods():
    """Test TED and PayPal payment methods"""
    session = requests.Session()
    
    # Login as admin
    login_response = session.post(f"{BASE_URL}/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    
    if login_response.status_code != 200:
        print("❌ Admin login failed")
        return False
    
    admin_token = login_response.json().get("token")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create test buyer
    buyer_email = f"buyer_payment_{uuid.uuid4().hex[:8]}@test.com"
    buyer_response = session.post(f"{BASE_URL}/auth/register", json={
        "name": "Payment Test Buyer",
        "email": buyer_email,
        "password": "TestPass123!",
        "role": "buyer"
    })
    
    if buyer_response.status_code != 200:
        print("❌ Failed to create buyer")
        return False
    
    buyer_token = buyer_response.json().get("token")
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}
    
    # Create test seller and product
    seller_email = f"seller_payment_{uuid.uuid4().hex[:8]}@test.com"
    seller_response = session.post(f"{BASE_URL}/auth/register", json={
        "name": "Payment Test Seller",
        "email": seller_email,
        "password": "TestPass123!",
        "role": "seller"
    })
    
    if seller_response.status_code != 200:
        print("❌ Failed to create seller")
        return False
    
    seller_token = seller_response.json().get("token")
    seller_headers = {"Authorization": f"Bearer {seller_token}"}
    
    # Create product
    product_response = session.post(f"{BASE_URL}/products", headers=seller_headers, json={
        "title": "Payment Method Test Product",
        "description": "Testing different payment methods",
        "price": 150.00,
        "category": "eletronicos",
        "images": []
    })
    
    if product_response.status_code != 200:
        print("❌ Failed to create product")
        return False
    
    product_id = product_response.json().get("product_id")
    
    # Add to cart
    cart_response = session.post(f"{BASE_URL}/cart", headers=buyer_headers, json={
        "product_id": product_id,
        "quantity": 1
    })
    
    if cart_response.status_code != 200:
        print("❌ Failed to add to cart")
        return False
    
    # Test TED payment method
    print("Testing TED payment method...")
    
    order_data_ted = {
        "payment_method": "ted",
        "shipping_address": {
            "name": "TED Test Buyer",
            "cpf": "987.654.321-00",
            "phone": "(11) 88888-8888",
            "street": "Rua TED",
            "number": "456",
            "complement": "",
            "neighborhood": "Vila TED",
            "city": "Rio de Janeiro",
            "state": "RJ",
            "zip_code": "20000-000"
        },
        "shipping_option": "standard"
    }
    
    ted_response = session.post(f"{BASE_URL}/orders", headers=buyer_headers, json=order_data_ted)
    
    if ted_response.status_code == 200:
        ted_order = ted_response.json()
        payment_info = ted_order.get("payment_info", {})
        
        if (payment_info.get("method") == "Transferencia Bancaria" and 
            payment_info.get("bank_name") and 
            payment_info.get("bank_branch")):
            print("✅ TED payment method working correctly")
            print(f"   TED payment info: {payment_info}")
        else:
            print(f"❌ TED payment info incomplete: {payment_info}")
            return False
    else:
        print(f"❌ TED order creation failed: {ted_response.status_code}")
        return False
    
    # Clear cart and add product again for PayPal test
    session.delete(f"{BASE_URL}/cart/{product_id}", headers=buyer_headers)
    session.post(f"{BASE_URL}/cart", headers=buyer_headers, json={
        "product_id": product_id,
        "quantity": 1
    })
    
    # Test PayPal payment method
    print("Testing PayPal payment method...")
    
    order_data_paypal = {
        "payment_method": "paypal",
        "shipping_address": {
            "name": "PayPal Test Buyer",
            "cpf": "111.222.333-44",
            "phone": "(11) 77777-7777",
            "street": "Rua PayPal",
            "number": "789",
            "complement": "Casa",
            "neighborhood": "Vila PayPal",
            "city": "Brasília",
            "state": "DF",
            "zip_code": "70000-000"
        },
        "shipping_option": "standard"
    }
    
    paypal_response = session.post(f"{BASE_URL}/orders", headers=buyer_headers, json=order_data_paypal)
    
    if paypal_response.status_code == 200:
        paypal_order = paypal_response.json()
        payment_info = paypal_order.get("payment_info", {})
        
        if (payment_info.get("method") == "PayPal" and 
            payment_info.get("paypal_email")):
            print("✅ PayPal payment method working correctly")
            print(f"   PayPal payment info: {payment_info}")
        else:
            print(f"❌ PayPal payment info incomplete: {payment_info}")
            return False
    else:
        print(f"❌ PayPal order creation failed: {paypal_response.status_code}")
        return False
    
    print("✅ All payment methods tested successfully!")
    return True

if __name__ == "__main__":
    success = test_payment_methods()
    exit(0 if success else 1)