import requests
import json
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BASE_URL = "http://localhost:8000"

def verify():
    try:
        r = requests.get(f"{BASE_URL}/users/")
        if r.status_code != 200:
            logger.error(f"❌ API Error: {r.status_code}")
            logger.error(r.text)
            return
        
        users = r.json()
        logger.info(f"✅ Users Found: {len(users)}")
        for u in users:
            logger.info(f" - {u['email']} ({u['role']})")
            
    except Exception as e:
        logger.error(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    verify()
