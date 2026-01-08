import requests
import json

BASE_URL = "http://localhost:8000"

def verify():
    try:
        r = requests.get(f"{BASE_URL}/users/")
        if r.status_code != 200:
            print(f"❌ API Error: {r.status_code}")
            print(r.text)
            return
        
        users = r.json()
        print(f"✅ Users Found: {len(users)}")
        for u in users:
            print(f" - {u['email']} ({u['role']})")
            
    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    verify()
