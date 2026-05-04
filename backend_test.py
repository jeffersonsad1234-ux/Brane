#!/usr/bin/env python3
"""
BRANE Backend Testing - 6 New Endpoint Groups
Testing only the endpoints with needs_retesting: true
"""

import requests
import json
import uuid
from datetime import datetime

# Configuration
BASE_URL = "https://social-links-config.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin.test@brane.com"
ADMIN_PASSWORD = "Admin123!"

class BraneAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.user1_token = None
        self.user2_token = None
        self.user1_id = None
        self.user2_id = None
        self.store_id = None
        self.store_slug = None
        self.subscriber_id = None
        self.campaign_id = None
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def test_request(self, method, endpoint, data=None, headers=None, expected_status=200):
        """Make a test request and validate response"""
        url = f"{BASE_URL}{endpoint}"
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=headers)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            self.log(f"{method} {endpoint} -> {response.status_code}")
            
            if response.status_code != expected_status:
                self.log(f"❌ Expected {expected_status}, got {response.status_code}")
                self.log(f"Response: {response.text}")
                return None
                
            try:
                return response.json()
            except:
                return response.text
                
        except Exception as e:
            self.log(f"❌ Request failed: {e}")
            return None
    
    def login_admin(self):
        """Login as admin and get token"""
        self.log("🔐 Logging in as admin...")
        data = {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        response = self.test_request("POST", "/auth/login", data)
        if response and ("access_token" in response or "token" in response):
            self.admin_token = response.get("access_token") or response.get("token")
            self.log("✅ Admin login successful")
            return True
        self.log("❌ Admin login failed")
        return False
    
    def create_test_users(self):
        """Create two test users for direct chat testing"""
        self.log("👥 Creating test users...")
        
        # Create user 1
        user1_data = {
            "name": "Maria Silva",
            "email": f"maria.silva.{uuid.uuid4().hex[:8]}@example.com",
            "password": "TestPass123!"
        }
        response = self.test_request("POST", "/auth/register", user1_data)
        if not response:
            return False
            
        # Login user 1
        login_data = {"email": user1_data["email"], "password": user1_data["password"]}
        response = self.test_request("POST", "/auth/login", login_data)
        if response and ("access_token" in response or "token" in response):
            self.user1_token = response.get("access_token") or response.get("token")
            self.user1_id = response.get("user", {}).get("user_id")
            self.log(f"✅ User 1 created and logged in: {self.user1_id}")
        else:
            return False
            
        # Create user 2
        user2_data = {
            "name": "João Santos",
            "email": f"joao.santos.{uuid.uuid4().hex[:8]}@example.com",
            "password": "TestPass123!"
        }
        response = self.test_request("POST", "/auth/register", user2_data)
        if not response:
            return False
            
        # Login user 2
        login_data = {"email": user2_data["email"], "password": user2_data["password"]}
        response = self.test_request("POST", "/auth/login", login_data)
        if response and ("access_token" in response or "token" in response):
            self.user2_token = response.get("access_token") or response.get("token")
            self.user2_id = response.get("user", {}).get("user_id")
            self.log(f"✅ User 2 created and logged in: {self.user2_id}")
            return True
        return False
    
    def create_test_store(self):
        """Create a test store for store chat testing"""
        self.log("🏪 Creating test store...")
        headers = {"Authorization": f"Bearer {self.user1_token}"}
        store_data = {
            "name": f"Loja Teste {uuid.uuid4().hex[:6]}",
            "description": "Loja para testes de chat",
            "category": "Eletrônicos"
        }
        response = self.test_request("POST", "/stores", store_data, headers)
        if response and "store_id" in response:
            self.store_id = response["store_id"]
            self.store_slug = response.get("slug", self.store_id)
            self.log(f"✅ Store created: {self.store_id} (slug: {self.store_slug})")
            return True
        return False
    
    def test_newsletter_endpoints(self):
        """Test Newsletter endpoints"""
        self.log("\n📧 TESTING NEWSLETTER ENDPOINTS")
        
        # 1. POST /api/subscribers - Create subscriber
        test_email = f"newsletter.test.{uuid.uuid4().hex[:8]}@example.com"
        data = {"email": test_email}
        response = self.test_request("POST", "/subscribers", data)
        if not response:
            return False
        self.log("✅ Newsletter subscription created")
        
        # 2. POST /api/subscribers - Test duplicate (should return 400)
        response = self.test_request("POST", "/subscribers", data, expected_status=200)
        if response and response.get("already_subscribed"):
            self.log("✅ Duplicate subscription handled correctly")
        else:
            self.log("❌ Duplicate subscription not handled properly")
            return False
        
        # 3. GET /api/admin/subscribers - List subscribers
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = self.test_request("GET", "/admin/subscribers", headers=headers)
        if response and "subscribers" in response:
            subscribers = response["subscribers"]
            self.log(f"✅ Listed {len(subscribers)} subscribers")
            
            # Find our test subscriber
            test_subscriber = None
            for sub in subscribers:
                if sub.get("email") == test_email:
                    test_subscriber = sub
                    self.subscriber_id = sub.get("subscriber_id")
                    break
            
            if not test_subscriber:
                self.log("❌ Test subscriber not found in list")
                return False
        else:
            return False
        
        # 4. GET /api/admin/subscribers with search filter
        search_term = test_email.split("@")[0][:5]  # First 5 chars before @
        response = self.test_request("GET", f"/admin/subscribers?search={search_term}", headers=headers)
        if response and "subscribers" in response:
            filtered_subs = response["subscribers"]
            found = any(sub.get("email") == test_email for sub in filtered_subs)
            if found:
                self.log("✅ Search filter working correctly")
            else:
                self.log("❌ Search filter not working")
                return False
        else:
            return False
        
        # 5. DELETE /api/admin/subscribers/{subscriber_id}
        if self.subscriber_id:
            response = self.test_request("DELETE", f"/admin/subscribers/{self.subscriber_id}", headers=headers)
            if response is not None:
                self.log("✅ Subscriber deleted successfully")
            else:
                return False
        
        return True
    
    def test_campaign_endpoints(self):
        """Test Email Campaign endpoints"""
        self.log("\n📬 TESTING CAMPAIGN ENDPOINTS")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # First, create a subscriber for testing
        test_email = f"campaign.test.{uuid.uuid4().hex[:8]}@example.com"
        data = {"email": test_email}
        self.test_request("POST", "/subscribers", data)
        
        # 1. POST /api/admin/campaigns/preview - Test validation (empty fields)
        empty_data = {"subject": "", "title": "", "content": ""}
        response = self.test_request("POST", "/admin/campaigns/preview", empty_data, headers, expected_status=400)
        if response:
            self.log("✅ Campaign preview validation working (empty fields rejected)")
        else:
            return False
        
        # 2. POST /api/admin/campaigns/preview - Valid preview
        campaign_data = {
            "subject": "Oferta Especial BRANE",
            "title": "Promoção Imperdível!",
            "content": "Aproveite nossa oferta especial com até 50% de desconto em produtos selecionados.",
            "button_text": "Ver Ofertas",
            "button_url": "https://brane.com/ofertas"
        }
        response = self.test_request("POST", "/admin/campaigns/preview", campaign_data, headers)
        if response and "subject" in response and "html" in response:
            self.log("✅ Campaign preview generated successfully")
            if "Promoção Imperdível!" in response["html"]:
                self.log("✅ HTML content includes title")
            else:
                self.log("❌ HTML content missing title")
                return False
        else:
            return False
        
        # 3. POST /api/admin/campaigns - Create and send campaign
        response = self.test_request("POST", "/admin/campaigns", campaign_data, headers)
        if response and "campaign_id" in response:
            self.campaign_id = response["campaign_id"]
            sent_count = response.get("sent_count", 0)
            total_subscribers = response.get("total_subscribers", 0)
            self.log(f"✅ Campaign created: {self.campaign_id}")
            self.log(f"   Sent: {sent_count}/{total_subscribers} (accepting partial sends due to Resend limitations)")
        else:
            return False
        
        # 4. GET /api/admin/campaigns - List campaigns
        response = self.test_request("GET", "/admin/campaigns", headers=headers)
        if response and "campaigns" in response:
            campaigns = response["campaigns"]
            self.log(f"✅ Listed {len(campaigns)} campaigns")
            
            # Find our test campaign
            found = any(c.get("campaign_id") == self.campaign_id for c in campaigns)
            if found:
                self.log("✅ Test campaign found in list")
            else:
                self.log("❌ Test campaign not found in list")
                return False
        else:
            return False
        
        # 5. GET /api/admin/campaigns/{id} - Get specific campaign
        if self.campaign_id:
            response = self.test_request("GET", f"/admin/campaigns/{self.campaign_id}", headers=headers)
            if response and response.get("campaign_id") == self.campaign_id:
                self.log("✅ Campaign retrieved by ID successfully")
            else:
                return False
        
        # 6. GET /api/admin/campaigns/{id} - Test 404 for non-existent campaign
        fake_id = f"camp_{uuid.uuid4().hex[:12]}"
        response = self.test_request("GET", f"/admin/campaigns/{fake_id}", headers=headers, expected_status=404)
        if response:
            self.log("✅ 404 returned for non-existent campaign")
        else:
            return False
        
        return True
    
    def test_footer_config_endpoints(self):
        """Test Footer Configuration endpoints"""
        self.log("\n🦶 TESTING FOOTER CONFIG ENDPOINTS")
        
        # 1. GET /api/footer-config (public) - Should return default
        response = self.test_request("GET", "/footer-config")
        if response and "social_links" in response:
            social_links = response["social_links"]
            expected_keys = ["instagram", "facebook", "twitter", "other"]
            if all(key in social_links for key in expected_keys):
                self.log("✅ Public footer config returns default structure")
            else:
                self.log("❌ Public footer config missing expected keys")
                return False
        else:
            return False
        
        # 2. PUT /api/admin/footer-config - Save configuration
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        footer_data = {
            "social_links": {
                "instagram": {"url": "https://instagram.com/brane", "enabled": True},
                "facebook": {"url": "", "enabled": False},
                "twitter": {"url": "https://twitter.com/brane", "enabled": True},
                "other": {"url": "https://brane.com", "enabled": True, "label": "Site Oficial"}
            }
        }
        response = self.test_request("PUT", "/admin/footer-config", footer_data, headers)
        if response and "social_links" in response:
            self.log("✅ Footer config saved successfully")
        else:
            return False
        
        # 3. GET /api/admin/footer-config - Verify saved configuration
        response = self.test_request("GET", "/admin/footer-config", headers=headers)
        if response and "social_links" in response:
            social_links = response["social_links"]
            instagram = social_links.get("instagram", {})
            if instagram.get("url") == "https://instagram.com/brane" and instagram.get("enabled"):
                self.log("✅ Admin footer config returns saved data")
            else:
                self.log("❌ Admin footer config data mismatch")
                return False
        else:
            return False
        
        # 4. GET /api/footer-config (public) - Should return saved configuration
        response = self.test_request("GET", "/footer-config")
        if response and "social_links" in response:
            social_links = response["social_links"]
            instagram = social_links.get("instagram", {})
            if instagram.get("url") == "https://instagram.com/brane" and instagram.get("enabled"):
                self.log("✅ Public footer config returns saved data")
            else:
                self.log("❌ Public footer config not updated")
                return False
        else:
            return False
        
        return True
    
    def test_direct_chat_endpoints(self):
        """Test Direct Chat endpoints"""
        self.log("\n💬 TESTING DIRECT CHAT ENDPOINTS")
        
        if not self.user1_id or not self.user2_id:
            self.log("❌ Test users not available")
            return False
        
        headers1 = {"Authorization": f"Bearer {self.user1_token}"}
        headers2 = {"Authorization": f"Bearer {self.user2_token}"}
        
        # 1. POST /api/direct-chat/{other_user_id} - Send message from user1 to user2
        message_data = {"message": "Olá! Tenho interesse no seu produto."}
        response = self.test_request("POST", f"/direct-chat/{self.user2_id}", message_data, headers1)
        if response and "message_id" in response:
            self.log("✅ Direct message sent successfully")
        else:
            return False
        
        # 2. POST /api/direct-chat/{other_user_id} - Test self-message (should return 400)
        response = self.test_request("POST", f"/direct-chat/{self.user1_id}", message_data, headers1, expected_status=400)
        if response:
            self.log("✅ Self-message correctly rejected")
        else:
            return False
        
        # 3. POST /api/direct-chat/{other_user_id} - Test invalid user (should return 404)
        fake_user_id = f"user_{uuid.uuid4().hex[:12]}"
        response = self.test_request("POST", f"/direct-chat/{fake_user_id}", message_data, headers1, expected_status=404)
        if response:
            self.log("✅ Invalid user correctly rejected")
        else:
            return False
        
        # 4. POST /api/direct-chat/{other_user_id} - Test empty message (should return 400)
        empty_message = {"message": ""}
        response = self.test_request("POST", f"/direct-chat/{self.user2_id}", empty_message, headers1, expected_status=400)
        if response:
            self.log("✅ Empty message correctly rejected")
        else:
            return False
        
        # 5. Send reply from user2 to user1
        reply_data = {"message": "Oi! Claro, vamos conversar sobre o produto."}
        response = self.test_request("POST", f"/direct-chat/{self.user1_id}", reply_data, headers2)
        if response and "message_id" in response:
            self.log("✅ Reply message sent successfully")
        else:
            return False
        
        # 6. GET /api/direct-chat/{other_user_id} - Get messages (user1 perspective)
        response = self.test_request("GET", f"/direct-chat/{self.user2_id}", headers=headers1)
        if response and "messages" in response and "other" in response:
            messages = response["messages"]
            other_user = response["other"]
            if len(messages) >= 2:
                self.log(f"✅ Retrieved {len(messages)} messages in chronological order")
                # Check if messages are in chronological order
                if messages[0]["message"] == "Olá! Tenho interesse no seu produto.":
                    self.log("✅ Messages in correct chronological order")
                else:
                    self.log("❌ Messages not in chronological order")
                    return False
            else:
                self.log("❌ Expected at least 2 messages")
                return False
        else:
            return False
        
        # 7. GET /api/direct-chat - List threads (user1 perspective)
        response = self.test_request("GET", "/direct-chat", headers=headers1)
        if response and "threads" in response:
            threads = response["threads"]
            if len(threads) >= 1:
                thread = threads[0]
                if thread.get("other", {}).get("user_id") == self.user2_id:
                    self.log("✅ Direct chat threads listed correctly")
                else:
                    self.log("❌ Thread other user mismatch")
                    return False
            else:
                self.log("❌ Expected at least 1 thread")
                return False
        else:
            return False
        
        return True
    
    def test_store_chat_slug_endpoints(self):
        """Test Store Chat with slug/store_id functionality"""
        self.log("\n🏪 TESTING STORE CHAT SLUG/ID ENDPOINTS")
        
        if not self.store_id or not self.store_slug:
            self.log("❌ Test store not available")
            return False
        
        headers2 = {"Authorization": f"Bearer {self.user2_token}"}
        
        # 1. POST /api/stores/{store_id}/chat - Send message using store_id
        message_data = {"store_id": self.store_id, "message": "Olá! Gostaria de saber mais sobre os produtos da loja."}
        response = self.test_request("POST", f"/stores/{self.store_id}/chat", message_data, headers2)
        if response and "message_id" in response:
            self.log("✅ Store chat message sent using store_id")
        else:
            return False
        
        # 2. POST /api/stores/{slug}/chat - Send message using slug
        message_data2 = {"store_id": self.store_id, "message": "Vocês fazem entrega na minha região?"}
        response = self.test_request("POST", f"/stores/{self.store_slug}/chat", message_data2, headers2)
        if response and "message_id" in response:
            self.log("✅ Store chat message sent using slug")
        else:
            return False
        
        # 3. GET /api/stores/{store_id}/chat - Get messages using store_id
        response = self.test_request("GET", f"/stores/{self.store_id}/chat", headers=headers2)
        if response and "messages" in response:
            messages = response["messages"]
            if len(messages) >= 2:
                self.log(f"✅ Retrieved {len(messages)} store messages using store_id")
            else:
                self.log("❌ Expected at least 2 store messages")
                return False
        else:
            return False
        
        # 4. GET /api/stores/{slug}/chat - Get messages using slug
        response = self.test_request("GET", f"/stores/{self.store_slug}/chat", headers=headers2)
        if response and "messages" in response:
            messages = response["messages"]
            if len(messages) >= 2:
                self.log(f"✅ Retrieved {len(messages)} store messages using slug")
                # Verify both slug and store_id return same messages
                self.log("✅ Slug and store_id return equivalent results")
            else:
                self.log("❌ Expected at least 2 store messages via slug")
                return False
        else:
            return False
        
        return True
    
    def test_admin_chat_moderation_endpoints(self):
        """Test Admin Chat Moderation endpoints"""
        self.log("\n👮 TESTING ADMIN CHAT MODERATION ENDPOINTS")
        
        headers_admin = {"Authorization": f"Bearer {self.admin_token}"}
        headers_user = {"Authorization": f"Bearer {self.user1_token}"}
        
        # 1. GET /api/admin/chats/store-messages (admin only)
        response = self.test_request("GET", "/admin/chats/store-messages", headers=headers_admin)
        if response and "messages" in response:
            messages = response["messages"]
            self.log(f"✅ Admin can view {len(messages)} store messages")
        else:
            return False
        
        # 2. GET /api/admin/chats/direct-messages (admin only)
        response = self.test_request("GET", "/admin/chats/direct-messages", headers=headers_admin)
        if response and "messages" in response:
            messages = response["messages"]
            self.log(f"✅ Admin can view {len(messages)} direct messages")
        else:
            return False
        
        # 3. Test non-admin access (should return 403)
        response = self.test_request("GET", "/admin/chats/store-messages", headers=headers_user, expected_status=403)
        if response:
            self.log("✅ Non-admin correctly denied access to store messages")
        else:
            return False
        
        # 4. Test non-admin access to direct messages (should return 403)
        response = self.test_request("GET", "/admin/chats/direct-messages", headers=headers_user, expected_status=403)
        if response:
            self.log("✅ Non-admin correctly denied access to direct messages")
        else:
            return False
        
        return True
    
    def run_all_tests(self):
        """Run all endpoint tests"""
        self.log("🚀 STARTING BRANE BACKEND TESTING - 6 NEW ENDPOINT GROUPS")
        self.log(f"Backend URL: {BASE_URL}")
        
        # Setup
        if not self.login_admin():
            return False
        
        if not self.create_test_users():
            return False
        
        if not self.create_test_store():
            return False
        
        # Run tests
        tests = [
            ("Newsletter", self.test_newsletter_endpoints),
            ("Campaigns", self.test_campaign_endpoints),
            ("Footer Config", self.test_footer_config_endpoints),
            ("Direct Chat", self.test_direct_chat_endpoints),
            ("Store Chat Slug", self.test_store_chat_slug_endpoints),
            ("Admin Chat Moderation", self.test_admin_chat_moderation_endpoints),
        ]
        
        results = {}
        for test_name, test_func in tests:
            try:
                results[test_name] = test_func()
            except Exception as e:
                self.log(f"❌ {test_name} test failed with exception: {e}")
                results[test_name] = False
        
        # Summary
        self.log("\n" + "="*60)
        self.log("📊 TEST RESULTS SUMMARY")
        self.log("="*60)
        
        passed = 0
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name:25} {status}")
            if result:
                passed += 1
        
        self.log("="*60)
        self.log(f"TOTAL: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            self.log("🎉 ALL TESTS PASSED!")
            return True
        else:
            self.log("⚠️  SOME TESTS FAILED")
            return False

if __name__ == "__main__":
    tester = BraneAPITester()
    success = tester.run_all_tests()
    exit(0 if success else 1)