#!/usr/bin/env python3
"""
BRANE Backend API Testing Suite
Tests the new endpoints added in this session:
1. POST /api/auth/register - strict email validation
2. POST /api/auth/verify-email - email verification with code
3. POST /api/auth/send-verification - resend verification code
4. BRANE Social Posts endpoints
5. GET /api/users/public/{user_id} - public profile
6. GET /api/theme and GET /api/admin/theme - theme endpoints
"""

import requests
import json
import sys
import time
from datetime import datetime

# Configuration
BASE_URL = "https://brane-dual-system.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@brane.com"
ADMIN_PASSWORD = "Admin123!"

class BRANEAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.test_user_token = None
        self.test_user_id = None
        self.test_post_id = None
        self.results = []
        
    def log_result(self, test_name, success, details=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        print()

    def admin_login(self):
        """Login as admin to get admin token"""
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("token")
                self.log_result("Admin Login", True, f"Token obtained: {self.admin_token[:20]}...")
                return True
            else:
                self.log_result("Admin Login", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_result("Admin Login", False, f"Exception: {str(e)}")
            return False

    def test_auth_register_email_validation(self):
        """Test POST /api/auth/register with strict email validation"""
        print("=== Testing Auth Registration Email Validation ===")
        
        # Test 1: Invalid email format (missing domain)
        try:
            response = self.session.post(f"{BASE_URL}/auth/register", json={
                "name": "Test User",
                "email": "teste@",
                "password": "SenhaForte123!",
                "role": "buyer"
            })
            
            success = response.status_code == 400
            details = f"Status: {response.status_code}, Response: {response.text}"
            self.log_result("Register with invalid email (teste@)", success, details)
        except Exception as e:
            self.log_result("Register with invalid email (teste@)", False, f"Exception: {str(e)}")

        # Test 2: Invalid email format (no @ symbol)
        try:
            response = self.session.post(f"{BASE_URL}/auth/register", json={
                "name": "Test User",
                "email": "semarroba",
                "password": "SenhaForte123!",
                "role": "buyer"
            })
            
            success = response.status_code == 400
            details = f"Status: {response.status_code}, Response: {response.text}"
            self.log_result("Register with invalid email (semarroba)", success, details)
        except Exception as e:
            self.log_result("Register with invalid email (semarroba)", False, f"Exception: {str(e)}")

        # Test 3: Disposable email (should fail)
        try:
            response = self.session.post(f"{BASE_URL}/auth/register", json={
                "name": "Test User",
                "email": "teste@mailinator.com",
                "password": "SenhaForte123!",
                "role": "buyer"
            })
            
            success = response.status_code == 400
            details = f"Status: {response.status_code}, Response: {response.text}"
            self.log_result("Register with disposable email (mailinator)", success, details)
        except Exception as e:
            self.log_result("Register with disposable email (mailinator)", False, f"Exception: {str(e)}")

        # Test 4: Valid email registration (should succeed)
        test_email = f"novouser_bt1@gmail.com"
        try:
            response = self.session.post(f"{BASE_URL}/auth/register", json={
                "name": "Novo User BT1",
                "email": test_email,
                "password": "SenhaForte123!",
                "role": "buyer"
            })
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["token", "user", "verification_required", "verification_code"]
                has_all_fields = all(field in data for field in required_fields)
                
                user = data.get("user", {})
                email_verified = user.get("email_verified", True)  # Should be False
                verification_code = data.get("verification_code")
                
                success = (has_all_fields and 
                          data.get("verification_required") == True and 
                          email_verified == False and 
                          verification_code and len(str(verification_code)) == 6)
                
                if success:
                    self.test_user_token = data.get("token")
                    self.test_user_id = user.get("user_id")
                    self.verification_code = verification_code
                    
                details = f"Status: {response.status_code}, verification_required: {data.get('verification_required')}, email_verified: {email_verified}, code: {verification_code}"
                self.log_result("Register with valid email", success, details)
            else:
                self.log_result("Register with valid email", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Register with valid email", False, f"Exception: {str(e)}")

        # Test 5: Try to register same email again (should fail)
        try:
            response = self.session.post(f"{BASE_URL}/auth/register", json={
                "name": "Another User",
                "email": test_email,
                "password": "SenhaForte123!",
                "role": "buyer"
            })
            
            success = response.status_code == 400 and "ja cadastrado" in response.text.lower()
            details = f"Status: {response.status_code}, Response: {response.text}"
            self.log_result("Register duplicate email", success, details)
        except Exception as e:
            self.log_result("Register duplicate email", False, f"Exception: {str(e)}")

    def test_email_verification(self):
        """Test POST /api/auth/verify-email"""
        print("=== Testing Email Verification ===")
        
        if not hasattr(self, 'verification_code'):
            self.log_result("Email verification setup", False, "No verification code from registration")
            return

        # Test 1: Verify with correct code
        try:
            response = self.session.post(f"{BASE_URL}/auth/verify-email", json={
                "email": "novouser_bt1@gmail.com",
                "code": str(self.verification_code)
            })
            
            if response.status_code == 200:
                data = response.json()
                user = data.get("user", {})
                email_verified = user.get("email_verified", False)
                
                success = email_verified == True
                details = f"Status: {response.status_code}, email_verified: {email_verified}"
                self.log_result("Verify email with correct code", success, details)
            else:
                self.log_result("Verify email with correct code", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Verify email with correct code", False, f"Exception: {str(e)}")

        # Test 2: Verify with invalid code
        try:
            response = self.session.post(f"{BASE_URL}/auth/verify-email", json={
                "email": "novouser_bt1@gmail.com",
                "code": "999999"
            })
            
            success = response.status_code == 400
            details = f"Status: {response.status_code}, Response: {response.text}"
            self.log_result("Verify email with invalid code", success, details)
        except Exception as e:
            self.log_result("Verify email with invalid code", False, f"Exception: {str(e)}")

    def test_send_verification(self):
        """Test POST /api/auth/send-verification"""
        print("=== Testing Send Verification ===")
        
        # Create a new user for testing resend
        test_email = f"testresend_{int(time.time())}@gmail.com"
        try:
            response = self.session.post(f"{BASE_URL}/auth/register", json={
                "name": "Test Resend User",
                "email": test_email,
                "password": "SenhaForte123!",
                "role": "buyer"
            })
            
            if response.status_code != 200:
                self.log_result("Setup user for resend test", False, f"Failed to create user: {response.text}")
                return
        except Exception as e:
            self.log_result("Setup user for resend test", False, f"Exception: {str(e)}")
            return

        # Test 1: Resend verification for valid email
        try:
            response = self.session.post(f"{BASE_URL}/auth/send-verification", json={
                "email": test_email
            })
            
            if response.status_code == 200:
                data = response.json()
                verification_code = data.get("verification_code")
                success = verification_code and len(str(verification_code)) == 6
                details = f"Status: {response.status_code}, new_code: {verification_code}"
                self.log_result("Resend verification for valid email", success, details)
            else:
                self.log_result("Resend verification for valid email", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Resend verification for valid email", False, f"Exception: {str(e)}")

        # Test 2: Resend verification for non-existent email
        try:
            response = self.session.post(f"{BASE_URL}/auth/send-verification", json={
                "email": "nonexistent@gmail.com"
            })
            
            success = response.status_code == 404
            details = f"Status: {response.status_code}, Response: {response.text}"
            self.log_result("Resend verification for non-existent email", success, details)
        except Exception as e:
            self.log_result("Resend verification for non-existent email", False, f"Exception: {str(e)}")

    def test_social_posts(self):
        """Test BRANE Social Posts endpoints"""
        print("=== Testing BRANE Social Posts ===")
        
        if not self.test_user_token:
            self.log_result("Social posts setup", False, "No test user token available")
            return

        headers = {"Authorization": f"Bearer {self.test_user_token}"}

        # Test 1: Create post with content
        try:
            response = self.session.post(f"{BASE_URL}/social/posts", 
                json={"content": "Meu primeiro post!"}, 
                headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["post_id", "user_id", "content", "likes_count", "comments_count"]
                has_all_fields = all(field in data for field in required_fields)
                
                success = has_all_fields and data.get("content") == "Meu primeiro post!"
                if success:
                    self.test_post_id = data.get("post_id")
                
                details = f"Status: {response.status_code}, post_id: {data.get('post_id')}, content: {data.get('content')}"
                self.log_result("Create social post with content", success, details)
            else:
                self.log_result("Create social post with content", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Create social post with content", False, f"Exception: {str(e)}")

        # Test 2: Create post without content (should fail)
        try:
            response = self.session.post(f"{BASE_URL}/social/posts", 
                json={"content": ""}, 
                headers=headers)
            
            success = response.status_code == 400
            details = f"Status: {response.status_code}, Response: {response.text}"
            self.log_result("Create post without content", success, details)
        except Exception as e:
            self.log_result("Create post without content", False, f"Exception: {str(e)}")

        # Test 3: List posts (no auth required)
        try:
            response = self.session.get(f"{BASE_URL}/social/posts")
            
            if response.status_code == 200:
                data = response.json()
                has_posts = "posts" in data and "total" in data and "page" in data
                success = has_posts
                details = f"Status: {response.status_code}, posts_count: {len(data.get('posts', []))}, total: {data.get('total')}"
                self.log_result("List social posts", success, details)
            else:
                self.log_result("List social posts", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("List social posts", False, f"Exception: {str(e)}")

        if not self.test_post_id:
            self.log_result("Social posts like/comment tests", False, "No post_id available for testing")
            return

        # Test 4: Like post
        try:
            response = self.session.post(f"{BASE_URL}/social/posts/{self.test_post_id}/like", 
                headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                success = data.get("liked") == True and data.get("likes_count") == 1
                details = f"Status: {response.status_code}, liked: {data.get('liked')}, likes_count: {data.get('likes_count')}"
                self.log_result("Like social post", success, details)
            else:
                self.log_result("Like social post", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Like social post", False, f"Exception: {str(e)}")

        # Test 5: Unlike post (like again)
        try:
            response = self.session.post(f"{BASE_URL}/social/posts/{self.test_post_id}/like", 
                headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                success = data.get("liked") == False and data.get("likes_count") == 0
                details = f"Status: {response.status_code}, liked: {data.get('liked')}, likes_count: {data.get('likes_count')}"
                self.log_result("Unlike social post", success, details)
            else:
                self.log_result("Unlike social post", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Unlike social post", False, f"Exception: {str(e)}")

        # Test 6: Add comment
        try:
            response = self.session.post(f"{BASE_URL}/social/posts/{self.test_post_id}/comments", 
                json={"content": "Primeiro comentário"}, 
                headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["comment_id", "post_id", "user_id", "content"]
                has_all_fields = all(field in data for field in required_fields)
                success = has_all_fields and data.get("content") == "Primeiro comentário"
                details = f"Status: {response.status_code}, comment_id: {data.get('comment_id')}, content: {data.get('content')}"
                self.log_result("Add comment to post", success, details)
            else:
                self.log_result("Add comment to post", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Add comment to post", False, f"Exception: {str(e)}")

        # Test 7: List comments
        try:
            response = self.session.get(f"{BASE_URL}/social/posts/{self.test_post_id}/comments")
            
            if response.status_code == 200:
                data = response.json()
                has_comments = "comments" in data and len(data.get("comments", [])) > 0
                success = has_comments
                details = f"Status: {response.status_code}, comments_count: {len(data.get('comments', []))}"
                self.log_result("List post comments", success, details)
            else:
                self.log_result("List post comments", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("List post comments", False, f"Exception: {str(e)}")

        # Test 8: Delete post (as owner)
        try:
            response = self.session.delete(f"{BASE_URL}/social/posts/{self.test_post_id}", 
                headers=headers)
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}, Response: {response.text}"
            self.log_result("Delete own post", success, details)
        except Exception as e:
            self.log_result("Delete own post", False, f"Exception: {str(e)}")

    def test_public_user_profile(self):
        """Test GET /api/users/public/{user_id}"""
        print("=== Testing Public User Profile ===")
        
        if not self.test_user_id:
            self.log_result("Public profile test", False, "No test user_id available")
            return

        try:
            response = self.session.get(f"{BASE_URL}/users/public/{self.test_user_id}")
            
            if response.status_code == 200:
                data = response.json()
                public_fields = ["user_id", "name", "picture", "bio", "cover_photo", "role", "created_at"]
                private_fields = ["password_hash", "bank_details", "email"]
                
                has_public_fields = all(field in data for field in public_fields)
                has_no_private_fields = not any(field in data for field in private_fields)
                
                success = has_public_fields and has_no_private_fields
                details = f"Status: {response.status_code}, fields: {list(data.keys())}"
                self.log_result("Get public user profile", success, details)
            else:
                self.log_result("Get public user profile", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Get public user profile", False, f"Exception: {str(e)}")

    def test_theme_endpoints(self):
        """Test GET /api/theme and GET /api/admin/theme"""
        print("=== Testing Theme Endpoints ===")
        
        # Test 1: Public theme endpoint
        try:
            response = self.session.get(f"{BASE_URL}/theme")
            
            if response.status_code == 200:
                data = response.json()
                new_fields = ["category_text_color", "category_bg_color", "menu_text_color", 
                             "nav_link_color", "nav_link_hover_color", "title_color", "product_card_size"]
                has_new_fields = all(field in data for field in new_fields)
                
                success = has_new_fields
                details = f"Status: {response.status_code}, new_fields_present: {has_new_fields}, sample_fields: {[f for f in new_fields[:3] if f in data]}"
                self.log_result("Get public theme", success, details)
            else:
                self.log_result("Get public theme", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Get public theme", False, f"Exception: {str(e)}")

        # Test 2: Admin theme endpoint
        if not self.admin_token:
            self.log_result("Get admin theme", False, "No admin token available")
            return

        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = self.session.get(f"{BASE_URL}/admin/theme", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                new_fields = ["category_text_color", "category_bg_color", "menu_text_color", 
                             "nav_link_color", "nav_link_hover_color", "title_color", "product_card_size"]
                has_new_fields = all(field in data for field in new_fields)
                
                success = has_new_fields
                details = f"Status: {response.status_code}, new_fields_present: {has_new_fields}, sample_fields: {[f for f in new_fields[:3] if f in data]}"
                self.log_result("Get admin theme", success, details)
            else:
                self.log_result("Get admin theme", False, f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Get admin theme", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting BRANE Backend API Tests")
        print("=" * 50)
        
        # Setup
        if not self.admin_login():
            print("❌ Failed to login as admin, some tests may fail")
        
        # Run all tests
        self.test_auth_register_email_validation()
        self.test_email_verification()
        self.test_send_verification()
        self.test_social_posts()
        self.test_public_user_profile()
        self.test_theme_endpoints()
        
        # Summary
        print("=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        print("\n🎉 Testing completed!")
        return failed_tests == 0

if __name__ == "__main__":
    tester = BRANEAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)