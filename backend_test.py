#!/usr/bin/env python3
"""
BRANE Backend API Testing - Simplified Auth & Social Theme Fields
Testing the critical endpoints after simplification as requested.
"""

import requests
import json
import uuid
import time
from datetime import datetime

# Backend URL from frontend/.env
BASE_URL = "https://brane-dual-system.preview.emergentagent.com/api"

# Test credentials
ADMIN_EMAIL = "admin@brane.com"
ADMIN_PASSWORD = "Admin123!"

class BraneAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.test_user_token = None
        self.test_user_email = None
        self.test_post_id = None
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def test_cors_options(self):
        """Test CORS configuration with OPTIONS request"""
        self.log("🔍 Testing CORS configuration...")
        try:
            response = self.session.options(
                f"{BASE_URL}/auth/register",
                headers={
                    "Origin": "https://emergentagent.com",
                    "Access-Control-Request-Method": "POST",
                    "Access-Control-Request-Headers": "Content-Type"
                }
            )
            
            if response.status_code in [200, 204]:  # 204 is correct for OPTIONS
                cors_headers = {
                    "access-control-allow-origin": response.headers.get("access-control-allow-origin"),
                    "access-control-allow-methods": response.headers.get("access-control-allow-methods"),
                    "access-control-allow-headers": response.headers.get("access-control-allow-headers"),
                    "access-control-allow-credentials": response.headers.get("access-control-allow-credentials")
                }
                self.log(f"✅ CORS OPTIONS successful (status {response.status_code}): {cors_headers}")
                return True
            else:
                self.log(f"❌ CORS OPTIONS failed: {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ CORS test error: {e}")
            return False
    
    def test_simplified_registration(self):
        """Test simplified registration without role requirement and auto-verification"""
        self.log("🔍 Testing simplified registration...")
        
        # Generate unique email for testing
        unique_id = uuid.uuid4().hex[:8]
        self.test_user_email = f"test_user_{unique_id}@gmail.com"
        
        # Test 1: Simple registration without role
        payload = {
            "name": "Test User",
            "email": self.test_user_email,
            "password": "Senha123!"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/register", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                if "token" in data and "user" in data:
                    user = data["user"]
                    
                    # Verify auto-verification (email_verified should be true)
                    if user.get("email_verified") == True:
                        self.log("✅ Registration successful with auto-verification")
                        
                        # Verify no verification_code or verification_required in response
                        if "verification_code" not in data and "verification_required" not in data:
                            self.log("✅ No verification_code returned (as expected)")
                            self.test_user_token = data["token"]
                            return True
                        else:
                            self.log("❌ Unexpected verification fields in response")
                            return False
                    else:
                        self.log(f"❌ Email not auto-verified: email_verified = {user.get('email_verified')}")
                        return False
                else:
                    self.log(f"❌ Missing token or user in response: {data}")
                    return False
            else:
                self.log(f"❌ Registration failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Registration test error: {e}")
            return False
    
    def test_registration_with_explicit_role(self):
        """Test registration with explicit role"""
        self.log("🔍 Testing registration with explicit role...")
        
        unique_id = uuid.uuid4().hex[:8]
        seller_email = f"seller_{unique_id}@gmail.com"
        
        payload = {
            "name": "Seller X",
            "email": seller_email,
            "password": "Senha123!",
            "role": "seller"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/register", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                user = data["user"]
                
                if user.get("role") == "seller" and user.get("email_verified") == True:
                    self.log("✅ Registration with explicit role successful")
                    return True
                else:
                    self.log(f"❌ Role or verification issue: role={user.get('role')}, verified={user.get('email_verified')}")
                    return False
            else:
                self.log(f"❌ Registration with role failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Registration with role test error: {e}")
            return False
    
    def test_disposable_email_validation(self):
        """Test that disposable emails are still blocked"""
        self.log("🔍 Testing disposable email validation...")
        
        payload = {
            "name": "X",
            "email": "fake@mailinator.com",
            "password": "Test123!"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/register", json=payload)
            
            if response.status_code == 400:
                self.log("✅ Disposable email correctly rejected")
                return True
            else:
                self.log(f"❌ Disposable email not rejected: {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ Disposable email test error: {e}")
            return False
    
    def test_login(self):
        """Test login with created user"""
        self.log("🔍 Testing login...")
        
        if not self.test_user_email:
            self.log("❌ No test user email available")
            return False
            
        payload = {
            "email": self.test_user_email,
            "password": "Senha123!"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if "token" in data:
                    self.log("✅ Login successful")
                    self.test_user_token = data["token"]
                    return True
                else:
                    self.log(f"❌ No token in login response: {data}")
                    return False
            else:
                self.log(f"❌ Login failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Login test error: {e}")
            return False
    
    def test_auth_me(self):
        """Test GET /auth/me with token"""
        self.log("🔍 Testing GET /auth/me...")
        
        if not self.test_user_token:
            self.log("❌ No test user token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.test_user_token}"}
        
        try:
            response = self.session.get(f"{BASE_URL}/auth/me", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("email") == self.test_user_email:
                    self.log("✅ GET /auth/me successful")
                    return True
                else:
                    self.log(f"❌ Wrong user data: {data}")
                    return False
            else:
                self.log(f"❌ GET /auth/me failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ GET /auth/me test error: {e}")
            return False
    
    def test_admin_login(self):
        """Login as admin for theme testing"""
        self.log("🔍 Testing admin login...")
        
        payload = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if "token" in data:
                    self.admin_token = data["token"]
                    self.log("✅ Admin login successful")
                    return True
                else:
                    self.log(f"❌ No token in admin login response: {data}")
                    return False
            else:
                self.log(f"❌ Admin login failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Admin login test error: {e}")
            return False
    
    def test_social_posts_create(self):
        """Test creating social posts"""
        self.log("🔍 Testing POST /social/posts...")
        
        if not self.test_user_token:
            self.log("❌ No test user token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.test_user_token}"}
        payload = {
            "content": "This is a test post for BRANE social network! 🚀"
        }
        
        try:
            response = self.session.post(f"{BASE_URL}/social/posts", json=payload, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "post_id" in data:
                    self.test_post_id = data["post_id"]
                    self.log("✅ Social post created successfully")
                    return True
                else:
                    self.log(f"❌ No post_id in response: {data}")
                    return False
            else:
                self.log(f"❌ Social post creation failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Social post creation test error: {e}")
            return False
    
    def test_social_posts_list(self):
        """Test listing social posts"""
        self.log("🔍 Testing GET /social/posts...")
        
        try:
            response = self.session.get(f"{BASE_URL}/social/posts")
            
            if response.status_code == 200:
                data = response.json()
                if "posts" in data and isinstance(data["posts"], list):
                    self.log(f"✅ Social posts listed successfully ({len(data['posts'])} posts)")
                    return True
                else:
                    self.log(f"❌ Invalid posts response structure: {data}")
                    return False
            else:
                self.log(f"❌ Social posts listing failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Social posts listing test error: {e}")
            return False
    
    def test_public_theme(self):
        """Test GET /theme with new social fields"""
        self.log("🔍 Testing GET /theme (public)...")
        
        try:
            response = self.session.get(f"{BASE_URL}/theme")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for new social fields
                social_fields = [
                    "social_bg_color", "social_accent_color", "social_card_bg",
                    "social_card_border", "social_text_color", "social_muted_color",
                    "social_feed_width", "social_card_radius"
                ]
                
                missing_fields = [field for field in social_fields if field not in data]
                
                if not missing_fields:
                    self.log("✅ Public theme includes all new social fields")
                    self.log(f"   social_accent_color: {data.get('social_accent_color')}")
                    return True
                else:
                    self.log(f"❌ Missing social fields: {missing_fields}")
                    return False
            else:
                self.log(f"❌ Public theme failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Public theme test error: {e}")
            return False
    
    def test_admin_theme(self):
        """Test GET /admin/theme with new social fields"""
        self.log("🔍 Testing GET /admin/theme...")
        
        if not self.admin_token:
            self.log("❌ No admin token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        try:
            response = self.session.get(f"{BASE_URL}/admin/theme", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for new social fields
                social_fields = [
                    "social_bg_color", "social_accent_color", "social_card_bg",
                    "social_card_border", "social_text_color", "social_muted_color",
                    "social_feed_width", "social_card_radius"
                ]
                
                missing_fields = [field for field in social_fields if field not in data]
                
                if not missing_fields:
                    self.log("✅ Admin theme includes all new social fields")
                    return True
                else:
                    self.log(f"❌ Missing social fields in admin theme: {missing_fields}")
                    return False
            else:
                self.log(f"❌ Admin theme failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Admin theme test error: {e}")
            return False
    
    def test_admin_theme_update(self):
        """Test PUT /admin/theme to update social_accent_color"""
        self.log("🔍 Testing PUT /admin/theme...")
        
        if not self.admin_token:
            self.log("❌ No admin token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # First get current theme
        try:
            get_response = self.session.get(f"{BASE_URL}/admin/theme", headers=headers)
            if get_response.status_code != 200:
                self.log(f"❌ Failed to get current theme: {get_response.status_code}")
                return False
                
            current_theme = get_response.json()
            
            # Update social_accent_color
            updated_theme = current_theme.copy()
            updated_theme["social_accent_color"] = "#ff0066"
            
            put_response = self.session.put(f"{BASE_URL}/admin/theme", json=updated_theme, headers=headers)
            
            if put_response.status_code == 200:
                self.log("✅ Theme update successful")
                
                # Verify the change by getting public theme
                verify_response = self.session.get(f"{BASE_URL}/theme")
                if verify_response.status_code == 200:
                    verify_data = verify_response.json()
                    if verify_data.get("social_accent_color") == "#ff0066":
                        self.log("✅ Theme update verified - social_accent_color changed to #ff0066")
                        return True
                    else:
                        self.log(f"❌ Theme update not reflected: {verify_data.get('social_accent_color')}")
                        return False
                else:
                    self.log(f"❌ Failed to verify theme update: {verify_response.status_code}")
                    return False
            else:
                self.log(f"❌ Theme update failed: {put_response.status_code} - {put_response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Theme update test error: {e}")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        self.log("🚀 Starting BRANE Backend API Tests...")
        self.log("=" * 60)
        
        tests = [
            ("CORS Configuration", self.test_cors_options),
            ("Simplified Registration", self.test_simplified_registration),
            ("Registration with Role", self.test_registration_with_explicit_role),
            ("Disposable Email Validation", self.test_disposable_email_validation),
            ("User Login", self.test_login),
            ("Auth Me", self.test_auth_me),
            ("Admin Login", self.test_admin_login),
            ("Social Posts Create", self.test_social_posts_create),
            ("Social Posts List", self.test_social_posts_list),
            ("Public Theme", self.test_public_theme),
            ("Admin Theme", self.test_admin_theme),
            ("Admin Theme Update", self.test_admin_theme_update),
        ]
        
        results = {}
        
        for test_name, test_func in tests:
            self.log(f"\n--- {test_name} ---")
            try:
                results[test_name] = test_func()
            except Exception as e:
                self.log(f"❌ {test_name} crashed: {e}")
                results[test_name] = False
            
            time.sleep(0.5)  # Small delay between tests
        
        # Summary
        self.log("\n" + "=" * 60)
        self.log("📊 TEST RESULTS SUMMARY")
        self.log("=" * 60)
        
        passed = 0
        failed = 0
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{status} - {test_name}")
            if result:
                passed += 1
            else:
                failed += 1
        
        self.log(f"\n🎯 Total: {passed + failed} tests")
        self.log(f"✅ Passed: {passed}")
        self.log(f"❌ Failed: {failed}")
        self.log(f"📈 Success Rate: {(passed / (passed + failed) * 100):.1f}%")
        
        return results

if __name__ == "__main__":
    tester = BraneAPITester()
    results = tester.run_all_tests()