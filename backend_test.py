#!/usr/bin/env python3
"""
BRANE Marketplace Backend Testing
Testing NEW features as requested:
1. Support Chat
2. Brane Coins
3. Desapega
4. Order Tracking
5. Admin Notification Counts
6. Buyer Wallet
7. Payment Methods
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://product-upload-issue.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@brane.com"
ADMIN_PASSWORD = "Admin123!"

class BraneMarketplaceTest:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.seller_token = None
        self.buyer_token = None
        self.test_product_id = None
        self.test_order_id = None
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append(f"{status} {test_name}: {details}")
        print(f"{status} {test_name}: {details}")
        
    def make_request(self, method, endpoint, data=None, token=None, expected_status=200):
        """Make HTTP request with error handling"""
        url = f"{BASE_URL}{endpoint}"
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
            
        try:
            if method == "GET":
                response = self.session.get(url, headers=headers)
            elif method == "POST":
                response = self.session.post(url, json=data, headers=headers)
            elif method == "PUT":
                response = self.session.put(url, json=data, headers=headers)
            elif method == "DELETE":
                response = self.session.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            if response.status_code != expected_status:
                print(f"❌ Request failed: {method} {endpoint}")
                print(f"   Status: {response.status_code}")
                print(f"   Response: {response.text[:500]}")
                return None
                
            return response.json() if response.content else {}
            
        except Exception as e:
            print(f"❌ Request error: {method} {endpoint} - {str(e)}")
            return None
    
    def test_admin_login(self):
        """Test admin login"""
        print("\n🔐 Testing Admin Login...")
        data = {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        result = self.make_request("POST", "/auth/login", data)
        
        if result and "token" in result:
            self.admin_token = result["token"]
            self.log_test("Admin Login", True, f"Token received: {self.admin_token[:20]}...")
            return True
        else:
            self.log_test("Admin Login", False, "Failed to get admin token")
            return False
    
    def test_financial_settings(self):
        """Test financial settings configuration"""
        print("\n💰 Testing Financial Settings...")
        
        # Get current settings
        result = self.make_request("GET", "/admin/financial-settings", token=self.admin_token)
        if not result:
            self.log_test("Get Financial Settings", False, "Failed to get settings")
            return False
            
        self.log_test("Get Financial Settings", True, f"Current settings retrieved")
        
        # Update financial settings
        settings = {
            "pix_enabled": True,
            "pix_key": "admin@brane.com",
            "pix_key_type": "email",
            "ted_enabled": True,
            "bank_name": "Banco do Brasil",
            "bank_branch": "1234-5",
            "bank_account_name": "BRANE Marketplace",
            "bank_account_number": "12345-6",
            "paypal_enabled": True,
            "paypal_email": "admin@brane.com"
        }
        
        result = self.make_request("PUT", "/admin/financial-settings", settings, self.admin_token)
        if result:
            self.log_test("Update Financial Settings", True, "All payment methods configured")
            return True
        else:
            self.log_test("Update Financial Settings", False, "Failed to update settings")
            return False
    
    def test_register_seller(self):
        """Register a test seller"""
        print("\n👤 Testing Seller Registration...")
        
        seller_data = {
            "name": "Maria Silva",
            "email": f"seller_{int(time.time())}@test.com",
            "password": "Seller123!",
            "role": "seller"
        }
        
        result = self.make_request("POST", "/auth/register", seller_data)
        if result and "token" in result:
            self.seller_token = result["token"]
            self.log_test("Seller Registration", True, f"Seller registered: {seller_data['email']}")
            return True
        else:
            self.log_test("Seller Registration", False, "Failed to register seller")
            return False
    
    def test_register_buyer(self):
        """Register a test buyer"""
        print("\n👤 Testing Buyer Registration...")
        
        buyer_data = {
            "name": "João Santos",
            "email": f"buyer_{int(time.time())}@test.com",
            "password": "Buyer123!",
            "role": "buyer"
        }
        
        result = self.make_request("POST", "/auth/register", buyer_data)
        if result and "token" in result:
            self.buyer_token = result["token"]
            self.log_test("Buyer Registration", True, f"Buyer registered: {buyer_data['email']}")
            return True
        else:
            self.log_test("Buyer Registration", False, "Failed to register buyer")
            return False
    
    def test_create_products(self):
        """Create test products including desapega"""
        print("\n📦 Testing Product Creation...")
        
        # Create normal product
        normal_product = {
            "title": "Smartphone Samsung Galaxy",
            "description": "Smartphone novo na caixa",
            "price": 899.99,
            "category": "eletronicos",
            "product_type": "store",
            "condition": "new",
            "images": ["https://example.com/phone.jpg"]
        }
        
        result = self.make_request("POST", "/products", normal_product, self.seller_token)
        if result and "product_id" in result:
            self.test_product_id = result["product_id"]
            self.log_test("Create Normal Product", True, f"Product ID: {self.test_product_id}")
        else:
            self.log_test("Create Normal Product", False, "Failed to create normal product")
            return False
        
        # Create desapega product
        desapega_product = {
            "title": "Bolsa Louis Vuitton Usada",
            "description": "Bolsa original em bom estado",
            "price": 450.00,
            "category": "acessorios",
            "product_type": "secondhand",
            "condition": "good",
            "images": ["https://example.com/bag.jpg"]
        }
        
        result = self.make_request("POST", "/products", desapega_product, self.seller_token)
        if result and "product_id" in result:
            self.log_test("Create Desapega Product", True, f"Secondhand product created")
            return True
        else:
            self.log_test("Create Desapega Product", False, "Failed to create desapega product")
            return False
    
    def test_desapega_listing(self):
        """Test desapega product listing"""
        print("\n🛍️ Testing Desapega Listing...")
        
        result = self.make_request("GET", "/desapega")
        if result and "products" in result:
            products = result["products"]
            secondhand_found = any(p.get("product_type") in ["secondhand", "unique"] for p in products)
            self.log_test("Desapega Listing", secondhand_found, f"Found {len(products)} desapega products")
            return secondhand_found
        else:
            self.log_test("Desapega Listing", False, "Failed to get desapega products")
            return False
    
    def test_add_to_cart_and_order(self):
        """Test adding to cart and creating order"""
        print("\n🛒 Testing Cart and Order Creation...")
        
        # Add to cart
        cart_data = {"product_id": self.test_product_id, "quantity": 1}
        result = self.make_request("POST", "/cart", cart_data, self.buyer_token)
        if not result:
            self.log_test("Add to Cart", False, "Failed to add to cart")
            return False
        
        self.log_test("Add to Cart", True, "Product added to cart")
        
        # Create order with shipping address and payment method
        order_data = {
            "shipping_address": {
                "name": "João Santos",
                "cpf": "123.456.789-00",
                "phone": "(11) 99999-9999",
                "street": "Rua das Flores",
                "number": "123",
                "complement": "Apto 45",
                "neighborhood": "Centro",
                "city": "São Paulo",
                "state": "SP",
                "zip_code": "01234-567"
            },
            "shipping_option": "normal",
            "payment_method": "pix"
        }
        
        result = self.make_request("POST", "/orders", order_data, self.buyer_token)
        if result and "order_id" in result:
            self.test_order_id = result["order_id"]
            payment_method = result.get("payment_method")
            status = result.get("status")
            self.log_test("Create Order", True, f"Order {self.test_order_id}, Payment: {payment_method}, Status: {status}")
            return True
        else:
            self.log_test("Create Order", False, "Failed to create order")
            return False
    
    def test_payment_methods(self):
        """Test payment methods endpoint"""
        print("\n💳 Testing Payment Methods...")
        
        result = self.make_request("GET", "/payment-methods")
        if result and "methods" in result:
            methods = result["methods"]
            method_names = [m["name"] for m in methods]
            
            # Check if PIX and TED are always available
            has_pix = any("PIX" in name for name in method_names)
            has_ted = any("Transferencia" in name or "TED" in name for name in method_names)
            
            self.log_test("Payment Methods", True, f"Available methods: {', '.join(method_names)}")
            self.log_test("PIX Available", has_pix, "PIX should be available by default")
            self.log_test("TED Available", has_ted, "TED should be available by default")
            return True
        else:
            self.log_test("Payment Methods", False, "Failed to get payment methods")
            return False
    
    def test_admin_approve_order(self):
        """Test admin order approval and Brane Coins award"""
        print("\n✅ Testing Admin Order Approval...")
        
        if not self.test_order_id:
            self.log_test("Admin Approve Order", False, "No test order available")
            return False
        
        result = self.make_request("PUT", f"/admin/orders/{self.test_order_id}/approve", {}, self.admin_token)
        if result:
            self.log_test("Admin Approve Order", True, "Order approved successfully")
            
            # Check if buyer received Brane Coin
            time.sleep(1)  # Wait for coin award
            coin_result = self.make_request("GET", "/brane-coins", token=self.buyer_token)
            if coin_result and coin_result.get("coins", 0) >= 1:
                self.log_test("Brane Coins Award", True, f"Buyer has {coin_result['coins']} coins")
            else:
                self.log_test("Brane Coins Award", False, "Buyer didn't receive Brane Coin")
            
            return True
        else:
            self.log_test("Admin Approve Order", False, "Failed to approve order")
            return False
    
    def test_order_tracking(self):
        """Test order tracking functionality"""
        print("\n📦 Testing Order Tracking...")
        
        if not self.test_order_id:
            self.log_test("Order Tracking", False, "No test order available")
            return False
        
        # Test ship order
        result = self.make_request("PUT", f"/admin/orders/{self.test_order_id}/ship", {}, self.admin_token)
        if result:
            self.log_test("Ship Order", True, "Order marked as shipped")
        else:
            self.log_test("Ship Order", False, "Failed to ship order")
            return False
        
        # Test deliver order
        result = self.make_request("PUT", f"/admin/orders/{self.test_order_id}/deliver", {}, self.admin_token)
        if result:
            self.log_test("Deliver Order", True, "Order marked as delivered")
        else:
            self.log_test("Deliver Order", False, "Failed to deliver order")
            return False
        
        # Check tracking array
        order_result = self.make_request("GET", f"/orders/{self.test_order_id}", token=self.buyer_token)
        if order_result and "tracking" in order_result:
            tracking = order_result["tracking"]
            statuses = [t["status"] for t in tracking]
            has_shipped = "shipped" in statuses
            has_delivered = "delivered" in statuses
            
            self.log_test("Order Tracking Array", True, f"Tracking statuses: {', '.join(statuses)}")
            self.log_test("Shipped Status", has_shipped, "Shipped status in tracking")
            self.log_test("Delivered Status", has_delivered, "Delivered status in tracking")
            return True
        else:
            self.log_test("Order Tracking Array", False, "No tracking information found")
            return False
    
    def test_support_chat(self):
        """Test support chat functionality"""
        print("\n💬 Testing Support Chat...")
        
        # Send support message as buyer
        message_data = {"message": "Preciso de ajuda com meu pedido"}
        result = self.make_request("POST", "/support/message", message_data, self.buyer_token)
        if result and "message_id" in result:
            message_id = result["message_id"]
            self.log_test("Send Support Message", True, f"Message sent: {message_id}")
        else:
            self.log_test("Send Support Message", False, "Failed to send support message")
            return False
        
        # Get user's support messages
        result = self.make_request("GET", "/support/messages", token=self.buyer_token)
        if result and "messages" in result:
            messages = result["messages"]
            self.log_test("Get User Support Messages", True, f"Found {len(messages)} messages")
        else:
            self.log_test("Get User Support Messages", False, "Failed to get user messages")
            return False
        
        # Admin get all support messages
        result = self.make_request("GET", "/admin/support/messages", token=self.admin_token)
        if result and "messages" in result:
            admin_messages = result["messages"]
            self.log_test("Admin Get Support Messages", True, f"Admin sees {len(admin_messages)} messages")
        else:
            self.log_test("Admin Get Support Messages", False, "Failed to get admin messages")
            return False
        
        # Admin reply to support
        if admin_messages:
            user_id = admin_messages[0].get("user_id")
            reply_data = {"user_id": user_id, "message": "Olá! Como posso ajudar?"}
            result = self.make_request("POST", "/admin/support/reply", reply_data, self.admin_token)
            if result:
                self.log_test("Admin Support Reply", True, "Admin replied successfully")
                return True
            else:
                self.log_test("Admin Support Reply", False, "Failed to send admin reply")
                return False
        
        return True
    
    def test_brane_coins_system(self):
        """Test Brane Coins system"""
        print("\n🪙 Testing Brane Coins System...")
        
        # Get current coins and rewards
        result = self.make_request("GET", "/brane-coins", token=self.buyer_token)
        if result:
            coins = result.get("coins", 0)
            is_vip = result.get("is_vip", False)
            rewards = result.get("available_rewards", [])
            
            self.log_test("Get Brane Coins", True, f"Coins: {coins}, VIP: {is_vip}, Rewards: {len(rewards)}")
            
            # Try to redeem a reward if enough coins
            if coins >= 5 and rewards:
                reward_id = rewards[0]["id"]
                redeem_data = {"reward_id": reward_id}
                redeem_result = self.make_request("POST", "/brane-coins/redeem", redeem_data, self.buyer_token)
                if redeem_result:
                    self.log_test("Redeem Brane Coins", True, f"Redeemed reward: {reward_id}")
                else:
                    self.log_test("Redeem Brane Coins", False, "Failed to redeem reward")
            else:
                self.log_test("Redeem Brane Coins", True, "Not enough coins or no rewards available")
            
            return True
        else:
            self.log_test("Get Brane Coins", False, "Failed to get Brane Coins")
            return False
    
    def test_buyer_wallet(self):
        """Test buyer wallet endpoint"""
        print("\n👛 Testing Buyer Wallet...")
        
        result = self.make_request("GET", "/buyer-wallet", token=self.buyer_token)
        if result:
            coins = result.get("coins", 0)
            is_vip = result.get("is_vip", False)
            orders_count = result.get("orders_count", 0)
            coupons = result.get("active_coupons", [])
            
            self.log_test("Buyer Wallet", True, f"Coins: {coins}, VIP: {is_vip}, Orders: {orders_count}, Coupons: {len(coupons)}")
            return True
        else:
            self.log_test("Buyer Wallet", False, "Failed to get buyer wallet")
            return False
    
    def test_admin_notification_counts(self):
        """Test admin notification counts"""
        print("\n🔔 Testing Admin Notification Counts...")
        
        result = self.make_request("GET", "/admin/notification-counts", token=self.admin_token)
        if result:
            orders = result.get("orders", 0)
            withdrawals = result.get("withdrawals", 0)
            support = result.get("support", 0)
            stores = result.get("stores", 0)
            users = result.get("users", 0)
            
            self.log_test("Admin Notification Counts", True, 
                         f"Orders: {orders}, Withdrawals: {withdrawals}, Support: {support}, Stores: {stores}, Users: {users}")
            return True
        else:
            self.log_test("Admin Notification Counts", False, "Failed to get notification counts")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting BRANE Marketplace Backend Tests...")
        print("=" * 60)
        
        # Authentication tests
        if not self.test_admin_login():
            print("❌ Admin login failed - stopping tests")
            return
        
        # Setup tests
        self.test_financial_settings()
        self.test_register_seller()
        self.test_register_buyer()
        
        # Product and order tests
        if self.test_create_products():
            self.test_desapega_listing()
            
        self.test_payment_methods()
        
        if self.test_add_to_cart_and_order():
            self.test_admin_approve_order()
            self.test_order_tracking()
        
        # Feature tests
        self.test_support_chat()
        self.test_brane_coins_system()
        self.test_buyer_wallet()
        self.test_admin_notification_counts()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if "✅ PASS" in result)
        failed = sum(1 for result in self.test_results if "❌ FAIL" in result)
        
        for result in self.test_results:
            print(result)
        
        print(f"\n📈 RESULTS: {passed} passed, {failed} failed")
        
        if failed == 0:
            print("🎉 ALL TESTS PASSED!")
        else:
            print(f"⚠️  {failed} tests failed - check details above")

if __name__ == "__main__":
    tester = BraneMarketplaceTest()
    tester.run_all_tests()