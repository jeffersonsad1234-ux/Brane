#!/usr/bin/env python3
"""
Debug Admin Panel Issues
"""

import requests
import json
import time

BASE_URL = "https://social-links-config.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@brane.com"
ADMIN_PASSWORD = "Admin123!"

def make_request(method, endpoint, data=None, token=None):
    """Make HTTP request with detailed logging"""
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
        
    print(f"\n🔍 {method} {endpoint}")
    if data:
        print(f"   Data: {json.dumps(data, indent=2)}")
        
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers)
        elif method == "PUT":
            response = requests.put(url, json=data, headers=headers)
        else:
            raise ValueError(f"Unsupported method: {method}")
            
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 200:
            return response.json() if response.content else {}
        else:
            return None
            
    except Exception as e:
        print(f"   Error: {str(e)}")
        return None

def main():
    print("🔍 Debugging Admin Panel Issues...")
    
    # Login as admin
    print("\n1. Admin Login")
    login_data = {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    result = make_request("POST", "/auth/login", login_data)
    
    if not result or "token" not in result:
        print("❌ Admin login failed")
        return
    
    admin_token = result["token"]
    print(f"✅ Admin token: {admin_token[:20]}...")
    
    # Create test user
    print("\n2. Create Test User")
    user_data = {
        "name": "Test User Debug",
        "email": f"debug_{int(time.time())}@test.com",
        "password": "Test123!",
        "role": "seller"
    }
    
    user_result = make_request("POST", "/auth/register", user_data)
    if not user_result or "token" not in user_result:
        print("❌ Failed to create test user")
        return
    
    user_token = user_result["token"]
    
    # Get user info
    print("\n3. Get User Info")
    user_info = make_request("GET", "/auth/me", token=user_token)
    if not user_info:
        print("❌ Failed to get user info")
        return
    
    user_id = user_info.get("user_id")
    print(f"✅ User ID: {user_id}")
    
    # Test wallet add balance
    print("\n4. Test Add Balance")
    balance_data = {
        "user_id": user_id,
        "amount": 100.50,
        "balance_type": "available",
        "description": "Debug test balance"
    }
    
    balance_result = make_request("POST", "/admin/wallet/add-balance", balance_data, admin_token)
    
    # Check wallet
    print("\n5. Check Wallet")
    wallet_result = make_request("GET", "/wallet", token=user_token)
    
    # Test affiliate settings
    print("\n6. Test Affiliate Settings")
    affiliate_data = {"affiliate_earnings_enabled": False}
    affiliate_result = make_request("PUT", f"/admin/users/{user_id}/affiliate-settings", affiliate_data, admin_token)
    
    # Test customization
    print("\n7. Test Customization")
    custom_data = {
        "primary_color": "#FF6B35",
        "secondary_color": "#004E89"
    }
    custom_result = make_request("PUT", "/admin/customization", custom_data, admin_token)
    
    # Test sales dashboard
    print("\n8. Test Sales Dashboard")
    sales_result = make_request("GET", "/admin/sales/dashboard", token=admin_token)

if __name__ == "__main__":
    main()