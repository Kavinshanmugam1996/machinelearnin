import requests
import json

BASE_URL = "http://localhost:3000"

def test_enterprise_flow():
    print("\n--- Testing Enterprise API Flow ---")
    
    # 1. Login
    print("Step 1: Logging in...")
    login_data = {"email": "kavin@bizcomgrp.com", "password": "Bizcom@123"}
    res = requests.post(f"{BASE_URL}/api/login", json=login_data)
    if res.status_code != 200:
        print(f"FAILED: Login returned {res.status_code}")
        print(res.text)
        return
    
    token_data = res.json()
    token = token_data.get("access_token")
    print(f"SUCCESS: Received token: {token[:20]}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Test Get Clients (Protected)
    print("\nStep 2: Fetching clients (Protected)...")
    res = requests.get(f"{BASE_URL}/api/clients", headers=headers)
    if res.status_code == 200:
        print(f"SUCCESS: Fetched {len(res.json())} clients")
    else:
        print(f"FAILED: Get clients returned {res.status_code}")
        
    # 3. Test Unauthorized Access
    print("\nStep 3: Testing unauthorized access...")
    res = requests.get(f"{BASE_URL}/api/clients")
    if res.status_code == 401:
        print("SUCCESS: Rejected unauthorized request as expected")
    else:
        print(f"FAILED: Unauthorized request returned {res.status_code}")
        
    # 4. Test Health Check (Public)
    print("\nStep 4: Testing health check (Public)...")
    res = requests.get(f"{BASE_URL}/api/health")
    if res.status_code == 200:
        print(f"SUCCESS: Health check healthy: {res.json()}")
    else:
        print(f"FAILED: Health check failed with {res.status_code}")

    # 5. Test Get Questions (Protected)
    print("\nStep 5: Fetching questions (Protected)...")
    profile = {"industry": "Finance", "inventory": []}
    res = requests.post(f"{BASE_URL}/api/get-questions", json=profile, headers=headers)
    if res.status_code == 200:
        print(f"SUCCESS: Fetched {len(res.json())} questions")
    else:
        print(f"FAILED: Get questions returned {res.status_code}")

if __name__ == "__main__":
    try:
        test_enterprise_flow()
    except Exception as e:
        print(f"ERROR: {e}")
