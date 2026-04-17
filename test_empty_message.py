#!/usr/bin/env python3
"""
Test empty message validation specifically
"""

import requests
import json
import time

BASE_URL = "https://platform-admin-6.preview.emergentagent.com/api"

def test_empty_message_validation():
    """Test empty message validation specifically"""
    print("Testing empty message validation...")
    
    # Register a test user
    user_data = {
        "name": "Empty Test User",
        "email": f"empty_test_{int(time.time())}@test.com",
        "password": "Test123!",
        "role": "buyer"
    }
    
    response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
    if response.status_code != 200:
        print(f"❌ Failed to register user: {response.status_code}")
        return
    
    user_token = response.json()["token"]
    headers = {"Authorization": f"Bearer {user_token}", "Content-Type": "application/json"}
    
    # Test completely empty message
    print("Testing completely empty message...")
    response = requests.post(f"{BASE_URL}/support/message", 
                           json={"message": ""}, 
                           headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    # Test whitespace-only message
    print("\nTesting whitespace-only message...")
    response = requests.post(f"{BASE_URL}/support/message", 
                           json={"message": "   "}, 
                           headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    # Test missing message field
    print("\nTesting missing message field...")
    response = requests.post(f"{BASE_URL}/support/message", 
                           json={}, 
                           headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")

if __name__ == "__main__":
    test_empty_message_validation()