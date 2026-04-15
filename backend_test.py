#!/usr/bin/env python3
"""
BRANE Marketplace Backend API Testing
Tests all major API endpoints with proper authentication flows
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class BRANEAPITester:
    def __init__(self, base_url: str = "https://product-upload-issue.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.user_token = None
        self.test_user_id = None
        self.test_product_id = None
        self.test_order_id = None
        self.uploaded_file_path = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append(f"{name}: {details}")

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    token: Optional[str] = None, expected_status: int = 200) -> tuple[bool, Dict]:
        """Make API request with error handling"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text[:200]}
            
            return success, response_data
            
        except Exception as e:
            return False, {"error": str(e)}

    def test_admin_login(self):
        """Test admin login with correct credentials"""
        success, data = self.make_request(
            'POST', 'auth/login',
            {"email": "admin@brane.com", "password": "Admin123!"}
        )
        
        if success and 'token' in data:
            self.admin_token = data['token']
            self.log_test("Admin Login", True)
            return True
        else:
            self.log_test("Admin Login", False, f"Response: {data}")
            return False

    def test_user_registration(self):
        """Test user registration"""
        timestamp = int(datetime.now().timestamp())
        test_email = f"test.user.{timestamp}@example.com"
        
        success, data = self.make_request(
            'POST', 'auth/register',
            {"name": "Test User", "email": test_email, "password": "TestPass123!"}
        )
        
        if success and 'token' in data:
            self.user_token = data['token']
            self.test_user_id = data['user']['user_id']
            self.log_test("User Registration", True)
            return True
        else:
            self.log_test("User Registration", False, f"Response: {data}")
            return False

    def test_user_login(self):
        """Test user login after registration"""
        if not self.test_user_id:
            self.log_test("User Login", False, "No test user created")
            return False
            
        # We'll use the token from registration for subsequent tests
        success, data = self.make_request('GET', 'auth/me', token=self.user_token)
        
        if success and 'user_id' in data:
            self.log_test("User Login/Auth Check", True)
            return True
        else:
            self.log_test("User Login/Auth Check", False, f"Response: {data}")
            return False

    def test_role_switching(self):
        """Test switching user role from buyer to seller"""
        if not self.user_token:
            self.log_test("Role Switching", False, "No user token")
            return False
            
        success, data = self.make_request(
            'PUT', 'users/role',
            {"role": "seller"},
            token=self.user_token
        )
        
        if success and 'token' in data:
            self.user_token = data['token']  # Update token
            self.log_test("Role Switching (Buyer to Seller)", True)
            return True
        else:
            self.log_test("Role Switching", False, f"Response: {data}")
            return False

    def test_categories_endpoint(self):
        """Test categories endpoint"""
        success, data = self.make_request('GET', 'categories')
        
        if success and 'categories' in data and len(data['categories']) > 0:
            self.log_test("Categories Endpoint", True)
            return True
        else:
            self.log_test("Categories Endpoint", False, f"Response: {data}")
            return False

    def test_product_creation(self):
        """Test product creation as seller"""
        if not self.user_token:
            self.log_test("Product Creation", False, "No seller token")
            return False
            
        product_data = {
            "title": "Test Product",
            "description": "This is a test product for API testing",
            "price": 99.99,
            "category": "eletronicos",
            "images": []
        }
        
        success, data = self.make_request(
            'POST', 'products',
            product_data,
            token=self.user_token,
            expected_status=200
        )
        
        if success and 'product_id' in data:
            self.test_product_id = data['product_id']
            self.log_test("Product Creation", True)
            return True
        else:
            self.log_test("Product Creation", False, f"Response: {data}")
            return False

    def test_products_listing(self):
        """Test products listing endpoint"""
        success, data = self.make_request('GET', 'products')
        
        if success and 'products' in data:
            self.log_test("Products Listing", True)
            return True
        else:
            self.log_test("Products Listing", False, f"Response: {data}")
            return False

    def test_product_detail(self):
        """Test product detail endpoint"""
        if not self.test_product_id:
            self.log_test("Product Detail", False, "No test product created")
            return False
            
        success, data = self.make_request('GET', f'products/{self.test_product_id}')
        
        if success and 'product_id' in data:
            self.log_test("Product Detail", True)
            return True
        else:
            self.log_test("Product Detail", False, f"Response: {data}")
            return False

    def test_cart_operations(self):
        """Test cart add, view, update operations"""
        if not self.user_token or not self.test_product_id:
            self.log_test("Cart Operations", False, "Missing prerequisites")
            return False
            
        # Add to cart
        success, data = self.make_request(
            'POST', 'cart',
            {"product_id": self.test_product_id, "quantity": 2},
            token=self.user_token
        )
        
        if not success:
            self.log_test("Cart Add", False, f"Response: {data}")
            return False
            
        # View cart
        success, data = self.make_request('GET', 'cart', token=self.user_token)
        
        if success and 'items' in data and len(data['items']) > 0:
            self.log_test("Cart Operations", True)
            return True
        else:
            self.log_test("Cart Operations", False, f"Response: {data}")
            return False

    def test_order_creation(self):
        """Test order creation from cart"""
        if not self.user_token:
            self.log_test("Order Creation", False, "No user token")
            return False
            
        success, data = self.make_request(
            'POST', 'orders',
            {"affiliate_code": None},
            token=self.user_token
        )
        
        if success and 'order_id' in data:
            self.test_order_id = data['order_id']
            self.log_test("Order Creation", True)
            return True
        else:
            self.log_test("Order Creation", False, f"Response: {data}")
            return False

    def test_wallet_endpoint(self):
        """Test wallet endpoint"""
        if not self.user_token:
            self.log_test("Wallet Endpoint", False, "No user token")
            return False
            
        success, data = self.make_request('GET', 'wallet', token=self.user_token)
        
        if success and 'user_id' in data:
            self.log_test("Wallet Endpoint", True)
            return True
        else:
            self.log_test("Wallet Endpoint", False, f"Response: {data}")
            return False

    def test_admin_dashboard(self):
        """Test admin dashboard endpoint"""
        if not self.admin_token:
            self.log_test("Admin Dashboard", False, "No admin token")
            return False
            
        success, data = self.make_request('GET', 'admin/dashboard', token=self.admin_token)
        
        if success and 'total_users' in data:
            self.log_test("Admin Dashboard", True)
            return True
        else:
            self.log_test("Admin Dashboard", False, f"Response: {data}")
            return False

    def test_admin_orders(self):
        """Test admin orders management"""
        if not self.admin_token:
            self.log_test("Admin Orders", False, "No admin token")
            return False
            
        success, data = self.make_request('GET', 'admin/orders', token=self.admin_token)
        
        if success and 'orders' in data:
            self.log_test("Admin Orders", True)
            return True
        else:
            self.log_test("Admin Orders", False, f"Response: {data}")
            return False

    def test_admin_users(self):
        """Test admin users management"""
        if not self.admin_token:
            self.log_test("Admin Users", False, "No admin token")
            return False
            
        success, data = self.make_request('GET', 'admin/users', token=self.admin_token)
        
        if success and 'users' in data:
            self.log_test("Admin Users", True)
            return True
        else:
            self.log_test("Admin Users", False, f"Response: {data}")
            return False

    def test_file_upload(self):
        """Test file upload functionality"""
        if not self.admin_token:
            self.log_test("File Upload", False, "No admin token")
            return False
            
        # Create a test image file (small PNG)
        test_image_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\x12IDATx\x9cc```bPPP\x00\x02\xac\xea\x05\x1b\x00\x00\x00\x00IEND\xaeB`\x82'
        
        try:
            # Prepare multipart form data
            files = {'file': ('test_image.png', test_image_data, 'image/png')}
            headers = {'Authorization': f'Bearer {self.admin_token}'}
            
            # Make upload request
            url = f"{self.api_url}/upload"
            response = requests.post(url, files=files, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if 'path' in data and 'url' in data:
                    self.uploaded_file_path = data['path']
                    self.log_test("File Upload", True)
                    return True
                else:
                    self.log_test("File Upload", False, f"Missing path/url in response: {data}")
                    return False
            else:
                try:
                    error_data = response.json()
                except:
                    error_data = {"status_code": response.status_code, "text": response.text[:200]}
                self.log_test("File Upload", False, f"Status {response.status_code}: {error_data}")
                return False
                
        except Exception as e:
            self.log_test("File Upload", False, f"Exception: {str(e)}")
            return False

    def test_file_retrieval(self):
        """Test file retrieval functionality"""
        if not hasattr(self, 'uploaded_file_path') or not self.uploaded_file_path:
            self.log_test("File Retrieval", False, "No uploaded file path")
            return False
            
        try:
            # Make file retrieval request
            url = f"{self.api_url}/files/{self.uploaded_file_path}"
            response = requests.get(url, timeout=30)
            
            if response.status_code == 200:
                # Check if content type is appropriate for an image
                content_type = response.headers.get('content-type', '')
                if 'image' in content_type or 'application/octet-stream' in content_type:
                    self.log_test("File Retrieval", True)
                    return True
                else:
                    self.log_test("File Retrieval", False, f"Unexpected content type: {content_type}")
                    return False
            else:
                self.log_test("File Retrieval", False, f"Status {response.status_code}: {response.text[:200]}")
                return False
                
        except Exception as e:
            self.log_test("File Retrieval", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run comprehensive API test suite"""
        print("🚀 Starting BRANE Marketplace API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Authentication Tests
        print("\n🔐 Authentication Tests")
        self.test_admin_login()
        self.test_user_registration()
        self.test_user_login()
        self.test_role_switching()
        
        # Core API Tests
        print("\n📦 Core API Tests")
        self.test_categories_endpoint()
        self.test_product_creation()
        self.test_products_listing()
        self.test_product_detail()
        
        # E-commerce Flow Tests
        print("\n🛒 E-commerce Flow Tests")
        self.test_cart_operations()
        self.test_order_creation()
        self.test_wallet_endpoint()
        
        # Admin Tests
        print("\n👑 Admin Panel Tests")
        self.test_admin_dashboard()
        self.test_admin_orders()
        self.test_admin_users()
        
        # File Upload Tests
        print("\n📁 File Upload Tests")
        self.test_file_upload()
        self.test_file_retrieval()
        
        # Results Summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"  • {failure}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\n✨ Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = BRANEAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Test execution failed: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())