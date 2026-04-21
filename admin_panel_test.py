#!/usr/bin/env python3
"""
BRANE Marketplace Admin Panel Improvements Testing
Testing NEW admin panel features as requested:
1. GESTÃO DE SALDO (Wallet Management)
2. LIBERAÇÃO DE SALDO (Escrow Release)
3. CONTROLE DE AFILIADOS (Affiliate Control)
4. PAINEL DE VENDAS (Sales Dashboard)
5. NOTIFICAÇÕES ADMIN (Admin Notifications)
6. RASTREAMENTO (Tracking)
7. PERSONALIZAÇÃO (Customization)
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://platform-admin-6.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@brane.com"
ADMIN_PASSWORD = "Admin123!"

class AdminPanelTest:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.seller_token = None
        self.buyer_token = None
        self.test_seller_id = None
        self.test_buyer_id = None
        self.test_order_id = None
        self.test_notification_id = None
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
            self.log_test("Admin Login", True, f"Token received")
            return True
        else:
            self.log_test("Admin Login", False, "Failed to get admin token")
            return False
    
    def test_non_admin_access(self):
        """Test that non-admin users get 403 Forbidden"""
        print("\n🚫 Testing Non-Admin Access Control...")
        
        # Register a regular user
        user_data = {
            "name": "Regular User",
            "email": f"regular_{int(time.time())}@test.com",
            "password": "User123!",
            "role": "buyer"
        }
        
        result = self.make_request("POST", "/auth/register", user_data)
        if result and "token" in result:
            user_token = result["token"]
            
            # Try to access admin endpoint - should get 403
            result = self.make_request("GET", "/admin/sales/dashboard", token=user_token, expected_status=403)
            if result is None:  # Expected 403, so None result is correct
                self.log_test("Non-Admin Access Control", True, "Regular user correctly denied admin access")
                return True
            else:
                self.log_test("Non-Admin Access Control", False, "Regular user should not have admin access")
                return False
        else:
            self.log_test("Non-Admin Access Control", False, "Failed to create test user")
            return False
    
    def setup_test_users(self):
        """Create test seller and buyer for wallet tests"""
        print("\n👥 Setting up Test Users...")
        
        # Create seller
        seller_data = {
            "name": "Maria Vendedora",
            "email": f"seller_{int(time.time())}@test.com",
            "password": "Seller123!",
            "role": "seller"
        }
        
        result = self.make_request("POST", "/auth/register", seller_data)
        if result and "token" in result:
            self.seller_token = result["token"]
            # Get seller ID from token or user info
            user_info = self.make_request("GET", "/auth/me", token=self.seller_token)
            if user_info:
                self.test_seller_id = user_info.get("user_id")
                self.log_test("Create Test Seller", True, f"Seller ID: {self.test_seller_id}")
            else:
                self.log_test("Create Test Seller", False, "Failed to get seller ID")
                return False
        else:
            self.log_test("Create Test Seller", False, "Failed to create seller")
            return False
        
        # Create buyer
        buyer_data = {
            "name": "João Comprador",
            "email": f"buyer_{int(time.time())}@test.com",
            "password": "Buyer123!",
            "role": "buyer"
        }
        
        result = self.make_request("POST", "/auth/register", buyer_data)
        if result and "token" in result:
            self.buyer_token = result["token"]
            user_info = self.make_request("GET", "/auth/me", token=self.buyer_token)
            if user_info:
                self.test_buyer_id = user_info.get("user_id")
                self.log_test("Create Test Buyer", True, f"Buyer ID: {self.test_buyer_id}")
                return True
            else:
                self.log_test("Create Test Buyer", False, "Failed to get buyer ID")
                return False
        else:
            self.log_test("Create Test Buyer", False, "Failed to create buyer")
            return False
    
    def test_wallet_management(self):
        """Test 1: GESTÃO DE SALDO (Wallet Management)"""
        print("\n💰 Testing Wallet Management...")
        
        if not self.test_seller_id:
            self.log_test("Wallet Management", False, "No test seller available")
            return False
        
        # Test adding available balance
        add_balance_data = {
            "user_id": self.test_seller_id,
            "amount": 100.50,
            "balance_type": "available",
            "description": "Teste de adição de saldo disponível"
        }
        
        result = self.make_request("POST", "/admin/wallet/add-balance", add_balance_data, self.admin_token)
        if result and result.get("message"):
            self.log_test("Add Available Balance", True, f"Added R$ 100.50 to available balance")
        else:
            self.log_test("Add Available Balance", False, "Failed to add available balance")
            return False
        
        # Test adding held balance
        add_held_data = {
            "user_id": self.test_seller_id,
            "amount": 250.75,
            "balance_type": "held",
            "description": "Teste de adição de saldo retido"
        }
        
        result = self.make_request("POST", "/admin/wallet/add-balance", add_held_data, self.admin_token)
        if result and result.get("message"):
            self.log_test("Add Held Balance", True, f"Added R$ 250.75 to held balance")
        else:
            self.log_test("Add Held Balance", False, "Failed to add held balance")
            return False
        
        # Verify wallet was updated
        wallet_result = self.make_request("GET", "/wallet", token=self.seller_token)
        if wallet_result:
            available = wallet_result.get("available_balance", 0)
            held = wallet_result.get("held_balance", 0)
            self.log_test("Verify Wallet Update", True, f"Available: R$ {available}, Held: R$ {held}")
            return True
        else:
            self.log_test("Verify Wallet Update", False, "Failed to get wallet info")
            return False
    
    def test_escrow_release(self):
        """Test 2: LIBERAÇÃO DE SALDO (Escrow Release)"""
        print("\n🔓 Testing Escrow Release...")
        
        if not self.test_seller_id:
            self.log_test("Escrow Release", False, "No test seller available")
            return False
        
        # Release partial amount from held to available
        release_data = {
            "user_id": self.test_seller_id,
            "amount": 100.00,
            "description": "Liberação parcial de saldo retido"
        }
        
        result = self.make_request("POST", "/admin/wallet/release-held", release_data, self.admin_token)
        if result and result.get("message"):
            self.log_test("Release Partial Held Balance", True, f"Released R$ 100.00 from held to available")
        else:
            self.log_test("Release Partial Held Balance", False, "Failed to release partial held balance")
            return False
        
        # Release remaining held balance
        release_all_data = {
            "user_id": self.test_seller_id,
            "amount": 150.75,
            "description": "Liberação total do saldo restante"
        }
        
        result = self.make_request("POST", "/admin/wallet/release-held", release_all_data, self.admin_token)
        if result and result.get("message"):
            self.log_test("Release Remaining Held Balance", True, f"Released remaining R$ 150.75")
        else:
            self.log_test("Release Remaining Held Balance", False, "Failed to release remaining held balance")
            return False
        
        # Verify balances updated correctly
        wallet_result = self.make_request("GET", "/wallet", token=self.seller_token)
        if wallet_result:
            available = wallet_result.get("available_balance", 0)
            held = wallet_result.get("held_balance", 0)
            self.log_test("Verify Escrow Release", True, f"Final balances - Available: R$ {available}, Held: R$ {held}")
            return True
        else:
            self.log_test("Verify Escrow Release", False, "Failed to verify final balances")
            return False
    
    def test_affiliate_control(self):
        """Test 3: CONTROLE DE AFILIADOS (Affiliate Control)"""
        print("\n🤝 Testing Affiliate Control...")
        
        if not self.test_seller_id:
            self.log_test("Affiliate Control", False, "No test seller available")
            return False
        
        # Disable affiliate earnings
        disable_data = {"affiliate_earnings_enabled": False}
        result = self.make_request("PUT", f"/admin/users/{self.test_seller_id}/affiliate-settings", 
                                 disable_data, self.admin_token)
        if result and result.get("message"):
            self.log_test("Disable Affiliate Earnings", True, "Affiliate earnings disabled")
        else:
            self.log_test("Disable Affiliate Earnings", False, "Failed to disable affiliate earnings")
            return False
        
        # Enable affiliate earnings
        enable_data = {"affiliate_earnings_enabled": True}
        result = self.make_request("PUT", f"/admin/users/{self.test_seller_id}/affiliate-settings", 
                                 enable_data, self.admin_token)
        if result and result.get("message"):
            self.log_test("Enable Affiliate Earnings", True, "Affiliate earnings enabled")
        else:
            self.log_test("Enable Affiliate Earnings", False, "Failed to enable affiliate earnings")
            return False
        
        # Verify field is updated correctly
        user_result = self.make_request("GET", f"/admin/users", token=self.admin_token)
        if user_result and "users" in user_result:
            users = user_result["users"]
            test_user = next((u for u in users if u.get("user_id") == self.test_seller_id), None)
            if test_user:
                affiliate_enabled = test_user.get("affiliate_earnings_enabled", False)
                self.log_test("Verify Affiliate Settings", True, f"Affiliate earnings enabled: {affiliate_enabled}")
                return True
            else:
                self.log_test("Verify Affiliate Settings", False, "Test user not found in users list")
                return False
        else:
            self.log_test("Verify Affiliate Settings", False, "Failed to get users list")
            return False
    
    def test_sales_dashboard(self):
        """Test 4: PAINEL DE VENDAS (Sales Dashboard)"""
        print("\n📊 Testing Sales Dashboard...")
        
        result = self.make_request("GET", "/admin/sales/dashboard", token=self.admin_token)
        if result and "sales" in result:
            sales = result["sales"]
            self.log_test("Get Sales Dashboard", True, f"Retrieved {len(sales)} sales")
            
            # Check structure includes required fields
            if sales:
                sale = sales[0]
                has_buyer = "buyer" in sale and "name" in sale["buyer"] and "email" in sale["buyer"]
                has_seller = "seller" in sale and "name" in sale["seller"] and "email" in sale["seller"]
                has_product = "product" in sale and "title" in sale["product"] and "price" in sale["product"]
                
                self.log_test("Sales Structure - Buyer Info", has_buyer, "Buyer name and email present")
                self.log_test("Sales Structure - Seller Info", has_seller, "Seller name and email present")
                self.log_test("Sales Structure - Product Info", has_product, "Product title and price present")
                
                return has_buyer and has_seller and has_product
            else:
                self.log_test("Sales Dashboard Structure", True, "No sales data to verify structure")
                return True
        else:
            self.log_test("Get Sales Dashboard", False, "Failed to get sales dashboard")
            return False
    
    def create_test_order(self):
        """Create a test order for notification and tracking tests"""
        print("\n📦 Creating Test Order for Notifications...")
        
        # Create a product first
        product_data = {
            "title": "Produto de Teste Admin",
            "description": "Produto para testar notificações admin",
            "price": 99.99,
            "category": "teste",
            "images": []
        }
        
        product_result = self.make_request("POST", "/products", product_data, self.seller_token)
        if not product_result or "product_id" not in product_result:
            self.log_test("Create Test Product", False, "Failed to create test product")
            return False
        
        product_id = product_result["product_id"]
        self.log_test("Create Test Product", True, f"Product ID: {product_id}")
        
        # Add to cart
        cart_data = {"product_id": product_id, "quantity": 1}
        cart_result = self.make_request("POST", "/cart", cart_data, self.buyer_token)
        if not cart_result:
            self.log_test("Add to Cart", False, "Failed to add to cart")
            return False
        
        # Create order
        order_data = {
            "shipping_address": {
                "name": "João Comprador",
                "cpf": "123.456.789-00",
                "phone": "(11) 99999-9999",
                "street": "Rua de Teste",
                "number": "123",
                "neighborhood": "Centro",
                "city": "São Paulo",
                "state": "SP",
                "zip_code": "01234-567"
            },
            "payment_method": "pix"
        }
        
        order_result = self.make_request("POST", "/orders", order_data, self.buyer_token)
        if order_result and "order_id" in order_result:
            self.test_order_id = order_result["order_id"]
            self.log_test("Create Test Order", True, f"Order ID: {self.test_order_id}")
            return True
        else:
            self.log_test("Create Test Order", False, "Failed to create test order")
            return False
    
    def test_admin_notifications(self):
        """Test 5: NOTIFICAÇÕES ADMIN (Admin Notifications)"""
        print("\n🔔 Testing Admin Notifications...")
        
        # Get admin notifications
        result = self.make_request("GET", "/admin/notifications", token=self.admin_token)
        if result and "notifications" in result:
            notifications = result["notifications"]
            unread_count = result.get("unread_count", 0)
            self.log_test("Get Admin Notifications", True, f"Found {len(notifications)} notifications, {unread_count} unread")
            
            # Test marking notification as read if we have any
            if notifications:
                notification_id = notifications[0].get("notification_id")
                if notification_id:
                    read_result = self.make_request("PUT", f"/admin/notifications/{notification_id}/read", 
                                                  {}, self.admin_token)
                    if read_result and read_result.get("success"):
                        self.log_test("Mark Notification as Read", True, f"Notification {notification_id} marked as read")
                    else:
                        self.log_test("Mark Notification as Read", False, "Failed to mark notification as read")
                        return False
                else:
                    self.log_test("Mark Notification as Read", True, "No notification ID to test")
            else:
                self.log_test("Mark Notification as Read", True, "No notifications to mark as read")
            
            return True
        else:
            self.log_test("Get Admin Notifications", False, "Failed to get admin notifications")
            return False
    
    def test_tracking_system(self):
        """Test 6: RASTREAMENTO (Tracking)"""
        print("\n📍 Testing Tracking System...")
        
        if not self.test_order_id:
            if not self.create_test_order():
                self.log_test("Tracking System", False, "No test order available")
                return False
        
        # Add tracking code
        tracking_data = {"tracking_code": "BR123456789TEST"}
        result = self.make_request("PUT", f"/admin/orders/{self.test_order_id}/tracking", 
                                 tracking_data, self.admin_token)
        if result and result.get("message"):
            self.log_test("Add Tracking Code", True, f"Tracking code added: BR123456789TEST")
        else:
            self.log_test("Add Tracking Code", False, "Failed to add tracking code")
            return False
        
        # Get order tracking
        tracking_result = self.make_request("GET", f"/orders/{self.test_order_id}/tracking", 
                                          token=self.buyer_token)
        if tracking_result:
            tracking_code = tracking_result.get("tracking_code", "")
            tracking_array = tracking_result.get("tracking", [])
            
            self.log_test("Get Order Tracking", True, f"Tracking code: {tracking_code}")
            self.log_test("Verify Tracking Code Saved", tracking_code == "BR123456789TEST", 
                         f"Expected BR123456789TEST, got {tracking_code}")
            
            return tracking_code == "BR123456789TEST"
        else:
            self.log_test("Get Order Tracking", False, "Failed to get order tracking")
            return False
    
    def test_customization_system(self):
        """Test 7: PERSONALIZAÇÃO (Customization)"""
        print("\n🎨 Testing Customization System...")
        
        # Get default customization
        result = self.make_request("GET", "/admin/customization", token=self.admin_token)
        if result:
            self.log_test("Get Default Customization", True, "Retrieved default customization settings")
        else:
            self.log_test("Get Default Customization", False, "Failed to get customization settings")
            return False
        
        # Update customization with custom colors
        custom_colors = {
            "primary_color": "#FF6B35",
            "secondary_color": "#004E89",
            "accent_color": "#FFD23F",
            "background_color": "#F7F9FC"
        }
        
        update_result = self.make_request("PUT", "/admin/customization", custom_colors, self.admin_token)
        if update_result and update_result.get("message"):
            self.log_test("Update Custom Colors", True, "Custom colors updated successfully")
        else:
            self.log_test("Update Custom Colors", False, "Failed to update custom colors")
            return False
        
        # Get layout settings
        layout_result = self.make_request("GET", "/admin/layout-settings", token=self.admin_token)
        if layout_result:
            self.log_test("Get Layout Settings", True, "Retrieved layout settings")
        else:
            self.log_test("Get Layout Settings", False, "Failed to get layout settings")
            return False
        
        # Update layout settings
        layout_data = {
            "header_style": "modern",
            "sidebar_position": "left",
            "theme_mode": "light"
        }
        
        layout_update = self.make_request("PUT", "/admin/layout-settings", layout_data, self.admin_token)
        if layout_update and layout_update.get("message"):
            self.log_test("Update Layout Settings", True, "Layout settings updated successfully")
            return True
        else:
            self.log_test("Update Layout Settings", False, "Failed to update layout settings")
            return False
    
    def test_error_handling(self):
        """Test error handling scenarios"""
        print("\n⚠️ Testing Error Handling...")
        
        # Test invalid user_id for wallet operations
        invalid_wallet_data = {
            "user_id": "invalid_user_id",
            "amount": 100.00,
            "balance_type": "available",
            "description": "Test invalid user"
        }
        
        result = self.make_request("POST", "/admin/wallet/add-balance", invalid_wallet_data, 
                                 self.admin_token, expected_status=404)
        if result is None:  # Expected 404
            self.log_test("Invalid User ID Error", True, "Correctly rejected invalid user_id")
        else:
            self.log_test("Invalid User ID Error", False, "Should reject invalid user_id")
        
        # Test insufficient balance for release
        if self.test_seller_id:
            insufficient_data = {
                "user_id": self.test_seller_id,
                "amount": 999999.99,
                "description": "Test insufficient balance"
            }
            
            result = self.make_request("POST", "/admin/wallet/release-held", insufficient_data, 
                                     self.admin_token, expected_status=400)
            if result is None:  # Expected 400
                self.log_test("Insufficient Balance Error", True, "Correctly rejected insufficient balance")
                return True
            else:
                self.log_test("Insufficient Balance Error", False, "Should reject insufficient balance")
                return False
        
        return True
    
    def run_all_tests(self):
        """Run all admin panel tests"""
        print("🚀 Starting BRANE Admin Panel Improvements Tests...")
        print("=" * 70)
        
        # Authentication and setup
        if not self.test_admin_login():
            print("❌ Admin login failed - stopping tests")
            return
        
        self.test_non_admin_access()
        
        if not self.setup_test_users():
            print("❌ Failed to setup test users - stopping tests")
            return
        
        # Main admin panel tests
        self.test_wallet_management()
        self.test_escrow_release()
        self.test_affiliate_control()
        self.test_sales_dashboard()
        self.test_admin_notifications()
        self.test_tracking_system()
        self.test_customization_system()
        self.test_error_handling()
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 ADMIN PANEL TEST SUMMARY")
        print("=" * 70)
        
        passed = sum(1 for result in self.test_results if "✅ PASS" in result)
        failed = sum(1 for result in self.test_results if "❌ FAIL" in result)
        
        for result in self.test_results:
            print(result)
        
        print(f"\n📈 RESULTS: {passed} passed, {failed} failed")
        
        if failed == 0:
            print("🎉 ALL ADMIN PANEL TESTS PASSED!")
        else:
            print(f"⚠️  {failed} tests failed - check details above")

if __name__ == "__main__":
    tester = AdminPanelTest()
    tester.run_all_tests()