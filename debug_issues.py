#!/usr/bin/env python3
"""
Debug remaining issues
"""

import requests
import json
import time

BASE_URL = "https://brane-dual-system.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@brane.com"
ADMIN_PASSWORD = "Admin123!"

def make_request(method, endpoint, data=None, token=None, expected_status=200):
    """Make HTTP request with detailed logging"""
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
        
    print(f"\n🔍 {method} {endpoint} (expecting {expected_status})")
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
        
        if response.status_code == expected_status:
            return response.json() if response.content else {}
        else:
            return None
            
    except Exception as e:
        print(f"   Error: {str(e)}")
        return None

def main():
    print("🔍 Debugging Remaining Issues...")
    
    # Login as admin
    login_data = {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    result = make_request("POST", "/auth/login", login_data)
    admin_token = result["token"]
    
    # 1. Test non-admin access
    print("\n=== 1. NON-ADMIN ACCESS TEST ===")
    user_data = {
        "name": "Regular User",
        "email": f"regular_{int(time.time())}@test.com",
        "password": "User123!",
        "role": "buyer"
    }
    
    user_result = make_request("POST", "/auth/register", user_data)
    user_token = user_result["token"]
    
    # Try admin endpoint with regular user - should get 403
    admin_access = make_request("GET", "/admin/sales/dashboard", token=user_token, expected_status=403)
    print(f"Non-admin access result: {admin_access}")
    
    # 2. Test notification marking
    print("\n=== 2. NOTIFICATION MARKING TEST ===")
    notifications = make_request("GET", "/admin/notifications", token=admin_token)
    if notifications and notifications.get("notifications"):
        notif_id = notifications["notifications"][0].get("notification_id")
        print(f"Found notification ID: {notif_id}")
        
        mark_result = make_request("PUT", f"/admin/notifications/{notif_id}/read", {}, admin_token)
        print(f"Mark as read result: {mark_result}")
    
    # 3. Test error handling
    print("\n=== 3. ERROR HANDLING TEST ===")
    
    # Invalid user ID
    invalid_data = {
        "user_id": "invalid_user_id",
        "amount": 100.00,
        "balance_type": "available"
    }
    invalid_result = make_request("POST", "/admin/wallet/add-balance", invalid_data, admin_token, expected_status=404)
    print(f"Invalid user ID result: {invalid_result}")
    
    # Insufficient balance
    # First create a user with some held balance
    test_user_data = {
        "name": "Test User",
        "email": f"test_{int(time.time())}@test.com",
        "password": "Test123!",
        "role": "seller"
    }
    test_user_result = make_request("POST", "/auth/register", test_user_data)
    test_user_token = test_user_result["token"]
    test_user_info = make_request("GET", "/auth/me", token=test_user_token)
    test_user_id = test_user_info["user_id"]
    
    # Add small held balance
    add_held = {
        "user_id": test_user_id,
        "amount": 10.00,
        "balance_type": "held"
    }
    make_request("POST", "/admin/wallet/add-balance", add_held, admin_token)
    
    # Try to release more than available
    release_too_much = {
        "user_id": test_user_id,
        "amount": 999.00
    }
    insufficient_result = make_request("POST", "/admin/wallet/release-held", release_too_much, admin_token, expected_status=400)
    print(f"Insufficient balance result: {insufficient_result}")

if __name__ == "__main__":
    main()