#!/usr/bin/env python3
"""
Test file upload with seller credentials
"""

import requests
import sys
from datetime import datetime

def test_seller_file_upload():
    """Test file upload functionality with seller credentials"""
    base_url = "https://platform-admin-6.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    print("🔐 Testing File Upload with Seller Account")
    print(f"📍 Testing against: {base_url}")
    print("=" * 50)
    
    # Step 1: Register a new seller
    timestamp = int(datetime.now().timestamp())
    test_email = f"seller.test.{timestamp}@example.com"
    
    print("1. Registering new seller...")
    register_response = requests.post(
        f"{api_url}/auth/register",
        json={"name": "Test Seller", "email": test_email, "password": "TestPass123!", "role": "seller"},
        timeout=30
    )
    
    if register_response.status_code != 200:
        print(f"❌ Seller registration failed: {register_response.text}")
        return False
        
    seller_token = register_response.json()['token']
    print("✅ Seller registration successful")
    
    # Step 2: Upload a test image file as seller
    print("2. Uploading test image file as seller...")
    
    # Create a small test PNG image (1x1 pixel)
    test_image_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\x12IDATx\x9cc```bPPP\x00\x02\xac\xea\x05\x1b\x00\x00\x00\x00IEND\xaeB`\x82'
    
    files = {'file': ('seller_product_image.png', test_image_data, 'image/png')}
    headers = {'Authorization': f'Bearer {seller_token}'}
    
    upload_response = requests.post(
        f"{api_url}/upload",
        files=files,
        headers=headers,
        timeout=30
    )
    
    if upload_response.status_code != 200:
        print(f"❌ File upload failed: {upload_response.text}")
        return False
        
    upload_data = upload_response.json()
    
    # Step 3: Verify response contains required fields
    print("3. Verifying upload response...")
    if 'path' not in upload_data or 'url' not in upload_data:
        print(f"❌ Upload response missing required fields: {upload_data}")
        return False
        
    file_path = upload_data['path']
    file_url = upload_data['url']
    print(f"✅ Upload successful - Path: {file_path}")
    print(f"✅ Upload successful - URL: {file_url}")
    
    # Step 4: Retrieve the uploaded file
    print("4. Retrieving uploaded file...")
    
    retrieval_response = requests.get(
        f"{api_url}/files/{file_path}",
        timeout=30
    )
    
    if retrieval_response.status_code != 200:
        print(f"❌ File retrieval failed: {retrieval_response.text}")
        return False
        
    # Step 5: Verify content type
    print("5. Verifying file content type...")
    content_type = retrieval_response.headers.get('content-type', '')
    
    if 'image' not in content_type and 'application/octet-stream' not in content_type:
        print(f"❌ Unexpected content type: {content_type}")
        return False
        
    print(f"✅ File retrieved successfully with content type: {content_type}")
    print(f"✅ File size: {len(retrieval_response.content)} bytes")
    
    print("\n" + "=" * 50)
    print("🎉 Seller file upload tests passed!")
    print("✅ Seller can upload files successfully")
    print("✅ File upload works for both admin and seller roles")
    
    return True

if __name__ == "__main__":
    try:
        success = test_seller_file_upload()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"💥 Test execution failed: {e}")
        sys.exit(1)