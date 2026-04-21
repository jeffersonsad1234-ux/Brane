#!/usr/bin/env python3
"""
Edge case testing for payment methods
"""

import requests
import json

BASE_URL = "https://brane-dual-system.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@brane.com"
ADMIN_PASSWORD = "Admin123!"

def test_edge_cases():
    """Test edge cases and error conditions"""
    session = requests.Session()
    
    # Login as admin
    login_response = session.post(f"{BASE_URL}/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    
    admin_token = login_response.json().get("token")
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    print("=== Testing Edge Cases ===")
    
    # Test 1: Disable all payment methods and check public endpoint
    print("\n1. Testing disabled payment methods...")
    
    disabled_settings = {
        "paypal_email": "",
        "paypal_enabled": False,
        "bank_name": "",
        "bank_branch": "",
        "bank_account_name": "",
        "bank_account_number": "",
        "ted_enabled": False,
        "pix_key": "",
        "pix_key_type": "cpf",
        "pix_enabled": False
    }
    
    # Update settings to disable all
    session.put(f"{BASE_URL}/admin/financial-settings", headers=headers, json=disabled_settings)
    
    # Check public endpoint
    methods_response = session.get(f"{BASE_URL}/payment-methods")
    if methods_response.status_code == 200:
        methods = methods_response.json().get("methods", [])
        if len(methods) == 0:
            print("✅ No payment methods returned when all disabled")
        else:
            print(f"❌ Expected 0 methods, got {len(methods)}")
            return False
    else:
        print("❌ Failed to get payment methods")
        return False
    
    # Test 2: Enable only PIX with missing data
    print("\n2. Testing PIX enabled but missing data...")
    
    partial_pix_settings = {
        "paypal_email": "",
        "paypal_enabled": False,
        "bank_name": "",
        "bank_branch": "",
        "bank_account_name": "",
        "bank_account_number": "",
        "ted_enabled": False,
        "pix_key": "",  # Missing PIX key
        "pix_key_type": "cpf",
        "pix_enabled": True  # Enabled but no key
    }
    
    session.put(f"{BASE_URL}/admin/financial-settings", headers=headers, json=partial_pix_settings)
    
    methods_response = session.get(f"{BASE_URL}/payment-methods")
    if methods_response.status_code == 200:
        methods = methods_response.json().get("methods", [])
        pix_methods = [m for m in methods if m["id"] == "pix"]
        if len(pix_methods) == 0:
            print("✅ PIX not returned when enabled but missing key")
        else:
            print(f"❌ PIX returned despite missing key: {pix_methods}")
            return False
    
    # Test 3: Enable TED with partial data
    print("\n3. Testing TED with partial data...")
    
    partial_ted_settings = {
        "paypal_email": "",
        "paypal_enabled": False,
        "bank_name": "Test Bank",
        "bank_branch": "",  # Missing branch
        "bank_account_name": "",  # Missing account name
        "bank_account_number": "123456",
        "ted_enabled": True,
        "pix_key": "",
        "pix_key_type": "cpf",
        "pix_enabled": False
    }
    
    session.put(f"{BASE_URL}/admin/financial-settings", headers=headers, json=partial_ted_settings)
    
    methods_response = session.get(f"{BASE_URL}/payment-methods")
    if methods_response.status_code == 200:
        methods = methods_response.json().get("methods", [])
        ted_methods = [m for m in methods if m["id"] == "ted"]
        if len(ted_methods) == 0:
            print("✅ TED not returned when missing required fields")
        else:
            print(f"❌ TED returned despite missing fields: {ted_methods}")
            return False
    
    # Test 4: Restore working settings
    print("\n4. Restoring working settings...")
    
    working_settings = {
        "paypal_email": "admin@brane.com",
        "paypal_enabled": True,
        "bank_name": "Banco do Brasil",
        "bank_branch": "1234-5",
        "bank_account_name": "BRANE Marketplace LTDA",
        "bank_account_number": "12345-6",
        "ted_enabled": True,
        "pix_key": "admin@brane.com",
        "pix_key_type": "email",
        "pix_enabled": True
    }
    
    session.put(f"{BASE_URL}/admin/financial-settings", headers=headers, json=working_settings)
    
    methods_response = session.get(f"{BASE_URL}/payment-methods")
    if methods_response.status_code == 200:
        methods = methods_response.json().get("methods", [])
        if len(methods) == 3:
            print("✅ All payment methods restored")
        else:
            print(f"❌ Expected 3 methods, got {len(methods)}")
            return False
    
    print("\n✅ All edge cases passed!")
    return True

if __name__ == "__main__":
    success = test_edge_cases()
    exit(0 if success else 1)