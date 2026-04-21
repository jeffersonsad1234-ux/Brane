"""
Backend tests for BRANE Social layer + Customization + Social Ads
Also asserts that existing marketplace endpoints still work intact.
"""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://brane-next-gen.preview.emergentagent.com").rstrip("/")


# ============ EXISTING MARKETPLACE UNCHANGED ============
class TestMarketplaceIntact:
    def test_products_list(self, api):
        r = api.get(f"{BASE_URL}/api/products")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, (list, dict))

    def test_categories(self, api):
        r = api.get(f"{BASE_URL}/api/categories")
        assert r.status_code in (200, 404)  # allow 404 if no implementation, but must not 500

    def test_admin_dashboard(self, api, admin_headers):
        r = api.get(f"{BASE_URL}/api/admin/dashboard", headers=admin_headers)
        assert r.status_code == 200

    def test_admin_theme(self, api, admin_headers):
        r = api.get(f"{BASE_URL}/api/admin/theme", headers=admin_headers)
        assert r.status_code in (200, 404)


# ============ AUTH SMOKE ============
class TestAuth:
    def test_login_admin(self, api):
        r = api.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@brane.com", "password": "Admin123!"})
        assert r.status_code == 200
        d = r.json()
        assert "token" in d and d["user"]["role"] == "admin"

    def test_me(self, api, admin_headers):
        r = api.get(f"{BASE_URL}/api/auth/me", headers=admin_headers)
        assert r.status_code == 200


# ============ CUSTOMIZATION ============
class TestCustomization:
    def test_public_customization(self, api):
        r = api.get(f"{BASE_URL}/api/customization")
        assert r.status_code == 200
        d = r.json()
        # Must contain all defaults
        for k in ("social_primary", "social_bg", "card_size", "products_per_row", "social_ad_every"):
            assert k in d

    def test_admin_read(self, api, admin_headers):
        r = api.get(f"{BASE_URL}/api/admin/customization", headers=admin_headers)
        assert r.status_code == 200

    def test_admin_update_primary_color(self, api, admin_headers):
        payload = {"social_primary": "#FF5722", "card_size": "large"}
        r = api.put(f"{BASE_URL}/api/admin/customization", headers=admin_headers, json=payload)
        assert r.status_code == 200
        # Verify persistence via public endpoint
        r2 = api.get(f"{BASE_URL}/api/customization")
        d2 = r2.json()
        assert d2["social_primary"] == "#FF5722"
        assert d2["card_size"] == "large"
        # Restore default
        api.put(f"{BASE_URL}/api/admin/customization", headers=admin_headers,
                json={"social_primary": "#7C3AED", "card_size": "medium"})

    def test_admin_unauth(self, api, user_headers):
        r = api.put(f"{BASE_URL}/api/admin/customization", headers=user_headers, json={"foo": "bar"})
        assert r.status_code in (401, 403)


# ============ POSTS / FEED ============
created_post_id = {"val": None}
second_post_id = {"val": None}


class TestPosts:
    def test_create_post_admin(self, api, admin_headers):
        r = api.post(f"{BASE_URL}/api/social/posts", headers=admin_headers,
                     json={"content": "TEST_post from admin"})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["content"] == "TEST_post from admin"
        assert d["author"]["user_id"]
        created_post_id["val"] = d["post_id"]

    def test_create_post_user(self, api, user_headers):
        r = api.post(f"{BASE_URL}/api/social/posts", headers=user_headers,
                     json={"content": "TEST_post from maria"})
        assert r.status_code == 200
        second_post_id["val"] = r.json()["post_id"]

    def test_create_post_empty_rejected(self, api, admin_headers):
        r = api.post(f"{BASE_URL}/api/social/posts", headers=admin_headers,
                     json={"content": "", "media": []})
        assert r.status_code == 400

    def test_create_post_requires_auth(self, api):
        r = api.post(f"{BASE_URL}/api/social/posts", json={"content": "hi"})
        assert r.status_code in (401, 403)

    def test_feed(self, api, admin_headers):
        r = api.get(f"{BASE_URL}/api/social/feed", headers=admin_headers)
        assert r.status_code == 200
        d = r.json()
        assert "posts" in d and isinstance(d["posts"], list)
        # Our created post should be in feed
        ids = [p.get("post_id") for p in d["posts"]]
        assert created_post_id["val"] in ids

    def test_feed_anonymous(self, api):
        r = api.get(f"{BASE_URL}/api/social/feed")
        assert r.status_code == 200

    def test_like_toggle(self, api, user_headers):
        pid = created_post_id["val"]
        r = api.post(f"{BASE_URL}/api/social/posts/{pid}/like", headers=user_headers)
        assert r.status_code == 200
        assert r.json()["liked"] in (True, False)
        # Toggle again
        r2 = api.post(f"{BASE_URL}/api/social/posts/{pid}/like", headers=user_headers)
        assert r2.status_code == 200

    def test_comment(self, api, user_headers):
        pid = created_post_id["val"]
        r = api.post(f"{BASE_URL}/api/social/posts/{pid}/comments", headers=user_headers,
                     json={"content": "TEST_comment"})
        assert r.status_code == 200
        d = r.json()
        assert d["content"] == "TEST_comment"

    def test_list_comments(self, api):
        pid = created_post_id["val"]
        r = api.get(f"{BASE_URL}/api/social/posts/{pid}/comments")
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d["comments"], list)
        assert any(c["content"] == "TEST_comment" for c in d["comments"])

    def test_share(self, api, user_headers):
        pid = created_post_id["val"]
        r = api.post(f"{BASE_URL}/api/social/posts/{pid}/share", headers=user_headers)
        assert r.status_code == 200


# ============ STORIES ============
class TestStories:
    def test_create_story(self, api, admin_headers):
        r = api.post(f"{BASE_URL}/api/social/stories", headers=admin_headers,
                     json={"media": "/files/test.jpg", "caption": "TEST_story"})
        assert r.status_code == 200
        d = r.json()
        assert d["story_id"]

    def test_create_story_empty_rejected(self, api, admin_headers):
        r = api.post(f"{BASE_URL}/api/social/stories", headers=admin_headers,
                     json={"media": ""})
        assert r.status_code == 400

    def test_list_stories_grouped(self, api):
        r = api.get(f"{BASE_URL}/api/social/stories")
        assert r.status_code == 200
        d = r.json()
        assert "groups" in d and isinstance(d["groups"], list)


# ============ FOLLOW / PROFILE ============
class TestFollowProfile:
    def test_follow_admin(self, api, user_headers, admin_user):
        r = api.post(f"{BASE_URL}/api/social/follow/{admin_user['user_id']}", headers=user_headers)
        assert r.status_code == 200
        assert r.json()["following"] in (True, False)

    def test_profile_admin(self, api, admin_user, user_headers):
        r = api.get(f"{BASE_URL}/api/social/profile/{admin_user['user_id']}", headers=user_headers)
        assert r.status_code == 200
        d = r.json()
        assert d["user_id"] == admin_user["user_id"]
        assert "followers_count" in d and "posts_count" in d and "posts" in d

    def test_self_follow_rejected(self, api, user_headers, user_user):
        r = api.post(f"{BASE_URL}/api/social/follow/{user_user['user_id']}", headers=user_headers)
        assert r.status_code == 400

    def test_update_profile(self, api, user_headers):
        r = api.put(f"{BASE_URL}/api/social/profile", headers=user_headers,
                    json={"bio": "TEST_bio", "display_name": "Maria T"})
        assert r.status_code == 200
        d = r.json()
        assert d["bio"] == "TEST_bio"

    def test_suggestions(self, api, user_headers):
        r = api.get(f"{BASE_URL}/api/social/suggestions", headers=user_headers)
        assert r.status_code == 200
        assert "suggestions" in r.json()


# ============ MESSAGES ============
class TestMessages:
    def test_send_message(self, api, user_headers, admin_user):
        r = api.post(f"{BASE_URL}/api/social/messages", headers=user_headers,
                     json={"to_user_id": admin_user["user_id"], "content": "TEST_hello"})
        assert r.status_code == 200
        d = r.json()
        assert d["content"] == "TEST_hello"

    def test_threads(self, api, admin_headers):
        r = api.get(f"{BASE_URL}/api/social/messages/threads", headers=admin_headers)
        assert r.status_code == 200
        d = r.json()
        assert "threads" in d and len(d["threads"]) >= 1

    def test_get_thread_messages(self, api, admin_headers, user_user):
        r = api.get(f"{BASE_URL}/api/social/messages/{user_user['user_id']}", headers=admin_headers)
        assert r.status_code == 200
        d = r.json()
        assert "messages" in d
        assert any(m.get("content") == "TEST_hello" for m in d["messages"])


# ============ GROUPS ============
created_group_id = {"val": None}


class TestGroups:
    def test_create_group(self, api, admin_headers):
        r = api.post(f"{BASE_URL}/api/social/groups", headers=admin_headers,
                     json={"name": "TEST_group", "description": "desc"})
        assert r.status_code == 200
        d = r.json()
        created_group_id["val"] = d["group_id"]

    def test_list_groups(self, api):
        r = api.get(f"{BASE_URL}/api/social/groups")
        assert r.status_code == 200
        d = r.json()
        assert "groups" in d

    def test_join_group(self, api, user_headers):
        gid = created_group_id["val"]
        r = api.post(f"{BASE_URL}/api/social/groups/{gid}/join", headers=user_headers)
        assert r.status_code == 200

    def test_group_detail(self, api, admin_headers):
        gid = created_group_id["val"]
        r = api.get(f"{BASE_URL}/api/social/groups/{gid}", headers=admin_headers)
        assert r.status_code == 200
        d = r.json()
        assert d["is_member"] is True

    def test_create_group_post_member(self, api, user_headers):
        gid = created_group_id["val"]
        r = api.post(f"{BASE_URL}/api/social/groups/posts", headers=user_headers,
                     json={"group_id": gid, "content": "TEST_group_post"})
        assert r.status_code == 200

    def test_group_post_non_member_forbidden(self, api, user_headers):
        # create a fresh group owned by admin, try to post as user (leave first)
        gid = created_group_id["val"]
        # leave
        api.post(f"{BASE_URL}/api/social/groups/{gid}/join", headers=user_headers)
        r = api.post(f"{BASE_URL}/api/social/groups/posts", headers=user_headers,
                     json={"group_id": gid, "content": "no"})
        assert r.status_code == 403


# ============ NOTIFICATIONS ============
class TestNotifications:
    def test_notifications(self, api, admin_headers):
        r = api.get(f"{BASE_URL}/api/social/notifications", headers=admin_headers)
        assert r.status_code == 200
        d = r.json()
        assert "notifications" in d and "unread" in d


# ============ SOCIAL ADS ============
created_ad_id = {"val": None}


class TestSocialAds:
    def test_admin_create_ad(self, api, admin_headers):
        r = api.post(f"{BASE_URL}/api/admin/social/ads", headers=admin_headers,
                     json={"title": "TEST_ad", "image": "/files/a.jpg", "link": "https://x.com", "active": True})
        assert r.status_code == 200
        d = r.json()
        created_ad_id["val"] = d["ad_id"]

    def test_admin_list_ads(self, api, admin_headers):
        r = api.get(f"{BASE_URL}/api/admin/social/ads", headers=admin_headers)
        assert r.status_code == 200

    def test_user_cannot_create_ad(self, api, user_headers):
        r = api.post(f"{BASE_URL}/api/admin/social/ads", headers=user_headers,
                     json={"title": "x", "image": "/", "link": "/"})
        assert r.status_code in (401, 403)

    def test_update_ad(self, api, admin_headers):
        aid = created_ad_id["val"]
        r = api.put(f"{BASE_URL}/api/admin/social/ads/{aid}", headers=admin_headers,
                    json={"title": "TEST_ad_updated"})
        assert r.status_code == 200
        assert r.json()["title"] == "TEST_ad_updated"

    def test_click_tracking(self, api):
        aid = created_ad_id["val"]
        r = api.post(f"{BASE_URL}/api/social/ads/{aid}/click")
        assert r.status_code == 200

    def test_delete_ad(self, api, admin_headers):
        aid = created_ad_id["val"]
        r = api.delete(f"{BASE_URL}/api/admin/social/ads/{aid}", headers=admin_headers)
        assert r.status_code == 200


# ============ CLEANUP ============
class TestCleanup:
    def test_delete_created_posts(self, api, admin_headers, user_headers):
        if created_post_id["val"]:
            api.delete(f"{BASE_URL}/api/social/posts/{created_post_id['val']}", headers=admin_headers)
        if second_post_id["val"]:
            api.delete(f"{BASE_URL}/api/social/posts/{second_post_id['val']}", headers=user_headers)
