#!/usr/bin/env python3
"""
BRANE Marketplace Backend Testing
Tests the new financial settings and payment method features
"""

import requests
import json
import uuid
from datetime import datetime

# Configuration
BASE_URL = "https://product-upload-issue.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@brane.com"
ADMIN_PASSWORD = "Admin123!"

class BRANEBackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.seller_token = None
        self.buyer_token = None
        self.test_product_id = None
        self.test_order_id = None
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def test_admin_login(self):
        """Test admin login and get token"""
        self.log("Testing admin login...")
        
        response = self.session.post(f"{BASE_URL}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        if response.status_code == 200:
            data = response.json()
            self.admin_token = data.get("token")
            self.log("✅ Admin login successful")
            return True
        else:
            self.log(f"❌ Admin login failed: {response.status_code} - {response.text}")
            return False
    
    def test_financial_settings_get(self):
        """Test GET /api/admin/financial-settings"""
        self.log("Testing GET financial settings...")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = self.session.get(f"{BASE_URL}/admin/financial-settings", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            self.log("✅ Financial settings retrieved successfully")
            self.log(f"   Current settings: {json.dumps(data, indent=2)}")
            
            # Check for new fields
            required_fields = ["bank_branch", "pix_key_type"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log(f"⚠️  Missing new fields: {missing_fields}")
                return False
            else:
                self.log("✅ All required new fields present")
                return True
        else:
            self.log(f"❌ Failed to get financial settings: {response.status_code} - {response.text}")
            return False
    
    def test_financial_settings_update(self):
        """Test PUT /api/admin/financial-settings with new fields"""
        self.log("Testing PUT financial settings with new fields...")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test data with all payment methods
        test_settings = {
            "paypal_email": "admin@brane.com",
            "paypal_enabled": True,
            "bank_name": "Banco do Brasil",
            "bank_branch": "1234-5",  # NEW FIELD
            "bank_account_name": "BRANE Marketplace LTDA",
            "bank_account_number": "12345-6",
            "ted_enabled": True,
            "pix_key": "admin@brane.com",
            "pix_key_type": "email",  # NEW FIELD
            "pix_enabled": True
        }
        
        response = self.session.put(f"{BASE_URL}/admin/financial-settings", 
                                  headers=headers, json=test_settings)
        
        if response.status_code == 200:
            self.log("✅ Financial settings updated successfully")
            
            # Verify the update by getting settings again
            get_response = self.session.get(f"{BASE_URL}/admin/financial-settings", headers=headers)
            if get_response.status_code == 200:
                updated_data = get_response.json()
                
                # Check if new fields were saved
                if (updated_data.get("bank_branch") == "1234-5" and 
                    updated_data.get("pix_key_type") == "email"):
                    self.log("✅ New fields saved correctly")
                    return True
                else:
                    self.log(f"❌ New fields not saved correctly: {updated_data}")
                    return False
            else:
                self.log("❌ Failed to verify settings update")
                return False
        else:
            self.log(f"❌ Failed to update financial settings: {response.status_code} - {response.text}")
            return False
    
    def test_payment_methods_public(self):
        """Test GET /api/payment-methods (public endpoint)"""
        self.log("Testing GET payment methods (public endpoint)...")
        
        # No authentication needed for this endpoint
        response = self.session.get(f"{BASE_URL}/payment-methods")
        
        if response.status_code == 200:
            data = response.json()
            methods = data.get("methods", [])
            
            self.log(f"✅ Payment methods retrieved: {len(methods)} methods")
            
            # Check that only enabled methods with data are returned
            expected_methods = ["pix", "ted", "paypal"]
            found_methods = [method["id"] for method in methods]
            
            self.log(f"   Found methods: {found_methods}")
            
            # Verify each method has required details
            for method in methods:
                method_id = method.get("id")
                details = method.get("details", {})
                
                if method_id == "pix":
                    if details.get("pix_key") and details.get("pix_key_type"):
                        self.log(f"✅ PIX method has required details")
                    else:
                        self.log(f"❌ PIX method missing details: {details}")
                        return False
                        
                elif method_id == "ted":
                    required = ["bank_name", "bank_branch", "account_name", "account_number"]
                    if all(details.get(field) for field in required):
                        self.log(f"✅ TED method has required details")
                    else:
                        self.log(f"❌ TED method missing details: {details}")
                        return False
                        
                elif method_id == "paypal":
                    if details.get("paypal_email"):
                        self.log(f"✅ PayPal method has required details")
                    else:
                        self.log(f"❌ PayPal method missing details: {details}")
                        return False
            
            return True
        else:
            self.log(f"❌ Failed to get payment methods: {response.status_code} - {response.text}")
            return False
    
    def test_create_seller_and_product(self):
        """Create a test seller and product for order testing"""
        self.log("Creating test seller and product...")
        
        # Register seller
        seller_email = f"seller_{uuid.uuid4().hex[:8]}@test.com"
        seller_response = self.session.post(f"{BASE_URL}/auth/register", json={
            "name": "Test Seller",
            "email": seller_email,
            "password": "TestPass123!",
            "role": "seller"
        })
        
        if seller_response.status_code == 200:
            seller_data = seller_response.json()
            self.seller_token = seller_data.get("token")
            self.log("✅ Test seller created")
        else:
            self.log(f"❌ Failed to create seller: {seller_response.status_code}")
            return False
        
        # Create product
        headers = {"Authorization": f"Bearer {self.seller_token}"}
        product_response = self.session.post(f"{BASE_URL}/products", headers=headers, json={
            "title": "Test Product for Payment",
            "description": "Test product for payment method testing",
            "price": 99.90,
            "category": "eletronicos",
            "images": []
        })
        
        if product_response.status_code == 200:
            product_data = product_response.json()
            self.test_product_id = product_data.get("product_id")
            self.log(f"✅ Test product created: {self.test_product_id}")
            return True
        else:
            self.log(f"❌ Failed to create product: {product_response.status_code}")
            return False
    
    def test_create_buyer_and_cart(self):
        """Create test buyer and add product to cart"""
        self.log("Creating test buyer and adding to cart...")
        
        # Register buyer
        buyer_email = f"buyer_{uuid.uuid4().hex[:8]}@test.com"
        buyer_response = self.session.post(f"{BASE_URL}/auth/register", json={
            "name": "Test Buyer",
            "email": buyer_email,
            "password": "TestPass123!",
            "role": "buyer"
        })
        
        if buyer_response.status_code == 200:
            buyer_data = buyer_response.json()
            self.buyer_token = buyer_data.get("token")
            self.log("✅ Test buyer created")
        else:
            self.log(f"❌ Failed to create buyer: {buyer_response.status_code}")
            return False
        
        # Add product to cart
        headers = {"Authorization": f"Bearer {self.buyer_token}"}
        cart_response = self.session.post(f"{BASE_URL}/cart", headers=headers, json={
            "product_id": self.test_product_id,
            "quantity": 1
        })
        
        if cart_response.status_code == 200:
            self.log("✅ Product added to cart")
            return True
        else:
            self.log(f"❌ Failed to add to cart: {cart_response.status_code}")
            return False
    
    def test_order_creation_with_payment_method(self):
        """Test POST /api/orders with payment_method field"""
        self.log("Testing order creation with payment method...")
        
        headers = {"Authorization": f"Bearer {self.buyer_token}"}
        
        # Create order with PIX payment method
        order_data = {
            "payment_method": "pix",
            "shipping_address": {
                "name": "Test Buyer",
                "cpf": "123.456.789-00",
                "phone": "(11) 99999-9999",
                "street": "Rua Teste",
                "number": "123",
                "complement": "Apto 45",
                "neighborhood": "Centro",
                "city": "São Paulo",
                "state": "SP",
                "zip_code": "01234-567"
            },
            "shipping_option": "standard"
        }
        
        response = self.session.post(f"{BASE_URL}/orders", headers=headers, json=order_data)
        
        if response.status_code == 200:
            order = response.json()
            self.test_order_id = order.get("order_id")
            
            self.log(f"✅ Order created successfully: {self.test_order_id}")
            
            # Verify order has correct status
            if order.get("status") == "awaiting_payment":
                self.log("✅ Order status is 'awaiting_payment'")
            else:
                self.log(f"❌ Wrong order status: {order.get('status')}")
                return False
            
            # Verify payment_method is included
            if order.get("payment_method") == "pix":
                self.log("✅ Payment method included in order")
            else:
                self.log(f"❌ Payment method missing or wrong: {order.get('payment_method')}")
                return False
            
            # Verify payment_info is included
            payment_info = order.get("payment_info", {})
            if payment_info and payment_info.get("method") == "PIX":
                self.log("✅ Payment info included in order")
                self.log(f"   Payment info: {payment_info}")
            else:
                self.log(f"❌ Payment info missing or incomplete: {payment_info}")
                return False
            
            return True
        else:
            self.log(f"❌ Failed to create order: {response.status_code} - {response.text}")
            return False
    
    def test_admin_order_approval(self):
        """Test PUT /api/admin/orders/{id}/approve"""
        self.log("Testing admin order approval...")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response = self.session.put(f"{BASE_URL}/admin/orders/{self.test_order_id}/approve", 
                                  headers=headers)
        
        if response.status_code == 200:
            self.log("✅ Order approval successful")
            
            # Verify order status changed
            order_response = self.session.get(f"{BASE_URL}/orders/{self.test_order_id}", 
                                            headers=headers)
            
            if order_response.status_code == 200:
                order = order_response.json()
                if order.get("status") == "approved":
                    self.log("✅ Order status changed to 'approved'")
                    return True
                else:
                    self.log(f"❌ Order status not updated: {order.get('status')}")
                    return False
            else:
                self.log("❌ Failed to verify order status")
                return False
        else:
            self.log(f"❌ Failed to approve order: {response.status_code} - {response.text}")
            return False
    
    def test_admin_order_listing(self):
        """Test that admin can see payment_method in order listing"""
        self.log("Testing admin order listing shows payment method...")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        response = self.session.get(f"{BASE_URL}/admin/orders", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            orders = data.get("orders", [])
            
            # Find our test order
            test_order = None
            for order in orders:
                if order.get("order_id") == self.test_order_id:
                    test_order = order
                    break
            
            if test_order:
                if test_order.get("payment_method"):
                    self.log(f"✅ Payment method visible in admin listing: {test_order.get('payment_method')}")
                    return True
                else:
                    self.log("❌ Payment method not visible in admin listing")
                    return False
            else:
                self.log("❌ Test order not found in admin listing")
                return False
        else:
            self.log(f"❌ Failed to get admin orders: {response.status_code} - {response.text}")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        self.log("=== BRANE Marketplace Backend Testing ===")
        self.log(f"Testing against: {BASE_URL}")
        
        tests = [
            ("Admin Login", self.test_admin_login),
            ("Financial Settings GET", self.test_financial_settings_get),
            ("Financial Settings UPDATE", self.test_financial_settings_update),
            ("Payment Methods Public", self.test_payment_methods_public),
            ("Create Seller & Product", self.test_create_seller_and_product),
            ("Create Buyer & Cart", self.test_create_buyer_and_cart),
            ("Order Creation with Payment", self.test_order_creation_with_payment_method),
            ("Admin Order Approval", self.test_admin_order_approval),
            ("Admin Order Listing", self.test_admin_order_listing),
        ]
        
        results = {}
        
        for test_name, test_func in tests:
            self.log(f"\n--- {test_name} ---")
            try:
                results[test_name] = test_func()
            except Exception as e:
                self.log(f"❌ {test_name} failed with exception: {str(e)}")
                results[test_name] = False
        
        # Summary
        self.log("\n=== TEST SUMMARY ===")
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{status} - {test_name}")
        
        self.log(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 All tests passed!")
            return True
        else:
            self.log("⚠️  Some tests failed")
            return False

if __name__ == "__main__":
    tester = BRANEBackendTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)